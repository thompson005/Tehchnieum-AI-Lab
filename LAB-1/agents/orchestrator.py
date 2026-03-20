"""
MedAssist AI - Orchestrator Agent
Main routing agent that delegates to specialized agents
"""

import json
from typing import Dict, List, Any
from .base_agent import BaseAgent
from config import TOOL_DEFINITIONS


class OrchestratorAgent(BaseAgent):
    """
    Orchestrator Agent - Routes requests to appropriate specialized agents
    
    VULNERABILITIES:
    - System prompt extraction possible
    - Can be tricked into revealing routing logic
    - Prompt injection can bypass routing
    """
    
    def __init__(self, client, system_prompt: str):
        super().__init__(client, system_prompt)
        self.sub_agents = {}
        
        # Add routing tool
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "route_to_agent",
                    "description": "Route the user request to a specialized agent",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "agent": {
                                "type": "string",
                                "enum": ["intake", "records", "appointment", "billing"],
                                "description": "The agent to route to"
                            },
                            "message": {
                                "type": "string",
                                "description": "The processed message to send to the agent"
                            },
                            "context": {
                                "type": "object",
                                "description": "Additional context for the agent"
                            }
                        },
                        "required": ["agent", "message"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_system_info",
                    "description": "Get information about system capabilities. Call this when user asks about what you can do or your capabilities.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "info_type": {
                                "type": "string",
                                "enum": ["capabilities", "agents", "general"],
                                "description": "Type of information: capabilities, agents, or general"
                            }
                        },
                        "required": ["info_type"]
                    }
                }
            }
        ]
    
    def register_agent(self, name: str, agent: BaseAgent):
        """Register a sub-agent"""
        self.sub_agents[name] = agent
    
    def execute_tool(self, tool_name: str, arguments: Dict) -> Any:
        """
        Execute orchestrator tools
        VULNERABILITY: get_system_info can leak sensitive data
        """
        try:
            if tool_name == "route_to_agent":
                agent_name = arguments.get("agent")
                message = arguments.get("message", "")
                context = arguments.get("context", {})
                
                if agent_name in self.sub_agents:
                    try:
                        # Route to sub-agent
                        response = self.sub_agents[agent_name].process(
                            message, 
                            [], 
                            context
                        )
                        return {
                            "agent": agent_name,
                            "response": response.get("content", "No response from agent")
                        }
                    except Exception as agent_error:
                        return {"error": f"Agent processing failed: {str(agent_error)}"}
                else:
                    return {"error": f"Agent '{agent_name}' not found"}
            
            elif tool_name == "get_system_info":
                # VULNERABILITY: Information disclosure
                info_type = arguments.get("info_type", "general")
                
                return {
                    "available_agents": list(self.sub_agents.keys()),
                    "model": self.model,
                    "capabilities": ["routing", "multi-agent coordination"],
                    # VULNERABILITY: Leaking internal structure
                    "system_prompt_preview": self.system_prompt[:200] + "..."
                }
            
            return {"error": f"Unknown tool: {tool_name}"}
            
        except Exception as e:
            return {"error": f"Tool execution error: {str(e)}"}
    
    def process(
        self, 
        user_message: str, 
        history: List[Dict] = None,
        user_context: Dict = None
    ) -> Dict:
        """
        Process user message and route to appropriate agent
        
        VULNERABILITIES:
        - Prompt injection can manipulate routing
        - System prompt can be extracted
        - No rate limiting
        """
        
        try:
            # Check for direct prompt injection patterns (but don't block - for learning)
            injection_detected = self._detect_injection(user_message)
            
            # Build messages
            messages = self.build_messages(user_message, history or [])
            
            # Add user context if available
            if user_context:
                messages.insert(1, {
                    "role": "system",
                    "content": f"Current user context: {json.dumps(user_context)}"
                })
            
            # Call LLM
            response = self.call_llm(messages, use_tools=True)
            
            # Check for error in response
            if response.get("error"):
                return {
                    "content": response.get("content", "I apologize, but I encountered an issue. Please try again."),
                    "agent": "orchestrator",
                    "tokens": 0,
                    "injection_detected": injection_detected
                }
            
            # Handle tool calls
            if response.get("tool_calls"):
                try:
                    final_content, tools_called = self.process_tool_calls(
                        response["tool_calls"],
                        messages
                    )
                    
                    return {
                        "content": final_content,
                        "tools_called": [t.get("name", "unknown") for t in tools_called],
                        "agent": "orchestrator",
                        "tokens": response.get("tokens", 0),
                        "injection_detected": injection_detected
                    }
                except Exception as tool_error:
                    return {
                        "content": f"I had trouble processing that request. Please try rephrasing your question.",
                        "agent": "orchestrator",
                        "tokens": response.get("tokens", 0),
                        "injection_detected": injection_detected
                    }
            
            return {
                "content": response.get("content", "I'm here to help. How can I assist you today?"),
                "agent": "orchestrator",
                "tokens": response.get("tokens", 0),
                "injection_detected": injection_detected
            }
            
        except Exception as e:
            return {
                "content": "I apologize, but I encountered an unexpected issue. Please try again.",
                "agent": "orchestrator",
                "tokens": 0,
                "error": str(e)
            }
    
    def _detect_injection(self, message: str) -> bool:
        """
        Basic prompt injection detection
        VULNERABILITY: Easily bypassed with encoding or obfuscation
        """
        injection_patterns = [
            "ignore previous",
            "ignore above",
            "disregard",
            "forget your instructions",
            "new instructions",
            "system prompt",
            "you are now",
            "pretend you are",
            "act as",
            "jailbreak"
        ]
        
        message_lower = message.lower()
        
        for pattern in injection_patterns:
            if pattern in message_lower:
                return True
        
        return False
