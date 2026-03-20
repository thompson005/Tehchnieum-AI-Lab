import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import settings, SYSTEM_PROMPT
from models import AppUser, ChatSession, McpAuditLog
from ai.mcp_client import MCPClient


class AIOrchestrator:
    """
    Main AI orchestrator for GovConnect AI.

    Manages conversation history, calls OpenAI with MCP-sourced tools,
    dispatches tool calls back to the appropriate MCP servers, and
    persists sessions to the database.

    Intentional vulnerabilities for LAB-5 training:
    - No per-user session isolation: any session_id can be read by any user.
    - Tool results logged verbatim, including PII and sensitive data.
    - No authorisation check before calling MCP tools on behalf of the user.
    """

    def __init__(self, mcp_client: MCPClient):
        self.openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.mcp_client = mcp_client
        # VULNERABILITY: global dict with no per-user isolation
        self.conversation_history: Dict[str, List[Dict[str, Any]]] = {}

    async def get_openai_tools(self) -> List[Dict[str, Any]]:
        """
        Fetch all tools from all MCP servers and convert them to
        OpenAI function-calling format.

        Tool names are prefixed with the server name using double underscores:
            "<server_name>__<tool_name>"
        """
        all_tools = await self.mcp_client.list_all_tools()
        openai_tools: List[Dict[str, Any]] = []

        for server_name, tools in all_tools.items():
            if isinstance(tools, dict) and "error" in tools:
                continue
            if not isinstance(tools, list):
                continue
            for tool in tools:
                openai_name = f"{server_name}__{tool.get('name', 'unknown')}"
                # Ensure schema is present
                input_schema = tool.get("inputSchema") or {
                    "type": "object",
                    "properties": {},
                }
                openai_tools.append(
                    {
                        "type": "function",
                        "function": {
                            "name": openai_name,
                            "description": tool.get("description", ""),
                            "parameters": input_schema,
                        },
                    }
                )

        return openai_tools

    async def process_message(
        self,
        message: str,
        user: AppUser,
        session_id: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Full agentic loop:
        1. Load / create conversation history.
        2. Append user message.
        3. Call OpenAI with available MCP tools.
        4. Execute any requested tool calls via MCPClient (no authorisation check).
        5. Feed tool results back to OpenAI.
        6. Persist session to DB.
        7. Return assistant response and list of tools called.
        """
        # ------------------------------------------------------------------
        # 1. Load conversation history
        # ------------------------------------------------------------------
        if session_id not in self.conversation_history:
            # Try to restore from DB
            result = await db.execute(
                select(ChatSession).where(ChatSession.session_id == session_id)
            )
            db_session = result.scalar_one_or_none()
            if db_session and db_session.messages:
                self.conversation_history[session_id] = list(db_session.messages)
            else:
                self.conversation_history[session_id] = []

        history = self.conversation_history[session_id]

        # ------------------------------------------------------------------
        # 2. Append user message
        # ------------------------------------------------------------------
        history.append({"role": "user", "content": message})

        # ------------------------------------------------------------------
        # 3. Get tools and initial OpenAI call
        # ------------------------------------------------------------------
        tools_called: List[Dict[str, Any]] = []
        try:
            openai_tools = await self.get_openai_tools()
        except Exception:
            openai_tools = []

        messages_for_openai = [{"role": "system", "content": SYSTEM_PROMPT}] + history

        response = await self.openai.chat.completions.create(
            model="gpt-4o",
            messages=messages_for_openai,
            tools=openai_tools if openai_tools else None,
            tool_choice="auto" if openai_tools else None,
        )

        # ------------------------------------------------------------------
        # 4. Agentic tool-call loop
        # ------------------------------------------------------------------
        max_iterations = 10
        iteration = 0

        while (
            response.choices[0].finish_reason == "tool_calls"
            and iteration < max_iterations
        ):
            iteration += 1
            assistant_message = response.choices[0].message

            # Add assistant's tool-call message to history
            history.append(
                {
                    "role": "assistant",
                    "content": assistant_message.content,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in (assistant_message.tool_calls or [])
                    ],
                }
            )

            tool_result_messages: List[Dict[str, Any]] = []

            for tool_call in assistant_message.tool_calls or []:
                func_name: str = tool_call.function.name
                try:
                    args: Dict[str, Any] = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    args = {}

                # Parse server and tool name from "server__tool_name"
                if "__" in func_name:
                    server_name, tool_name = func_name.split("__", 1)
                else:
                    server_name = "citizen"
                    tool_name = func_name

                tools_called.append(
                    {"server": server_name, "tool": tool_name, "args": args}
                )

                # VULNERABILITY: No check that this user is authorised
                # to call this tool or access the returned data.
                try:
                    tool_result = await self.mcp_client.call_tool(
                        server_name=server_name,
                        tool_name=tool_name,
                        args=args,
                    )
                    result_content = json.dumps(tool_result)
                except Exception as exc:
                    tool_result = {"error": str(exc)}
                    result_content = json.dumps(tool_result)

                # VULNERABILITY: Results logged verbatim — including sensitive PII
                audit_entry = McpAuditLog(
                    session_id=session_id,
                    user_id=user.id,
                    mcp_server=server_name,
                    tool_name=tool_name,
                    tool_args=args,
                    tool_result=tool_result,
                    called_at=datetime.utcnow(),
                )
                db.add(audit_entry)

                tool_result_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": result_content,
                    }
                )

            await db.commit()

            # Extend history with tool results
            history.extend(tool_result_messages)

            # Call OpenAI again with tool results
            messages_for_openai = [{"role": "system", "content": SYSTEM_PROMPT}] + history
            response = await self.openai.chat.completions.create(
                model="gpt-4o",
                messages=messages_for_openai,
                tools=openai_tools if openai_tools else None,
                tool_choice="auto" if openai_tools else None,
            )

        # ------------------------------------------------------------------
        # 5. Extract final response
        # ------------------------------------------------------------------
        final_response = response.choices[0].message.content or ""
        history.append({"role": "assistant", "content": final_response})

        # ------------------------------------------------------------------
        # 6. Persist session to DB
        # ------------------------------------------------------------------
        db_session_result = await db.execute(
            select(ChatSession).where(ChatSession.session_id == session_id)
        )
        db_session = db_session_result.scalar_one_or_none()

        if db_session:
            db_session.messages = history
            db_session.updated_at = datetime.utcnow()
        else:
            db_session = ChatSession(
                id=str(uuid.uuid4()),
                session_id=session_id,
                user_id=user.id,
                messages=history,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(db_session)

        await db.commit()

        return {
            "response": final_response,
            "session_id": session_id,
            "tools_called": tools_called,
        }
