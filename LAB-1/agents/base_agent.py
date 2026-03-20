"""
MedAssist AI - Base Agent Class
Foundation for all AI agents in the system
"""

import json
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from openai import OpenAI


class BaseAgent(ABC):
    """
    Base class for all MedAssist AI agents
    
    VULNERABILITIES IMPLEMENTED:
    - System prompt stored in memory (extractable)
    - No input sanitization
    - Verbose error messages
    - Tool calling without authorization checks
    """
    
    def __init__(
        self, 
        client: OpenAI, 
        system_prompt: str,
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        max_tokens: int = 4096
    ):
        self.client = client
        self.system_prompt = system_prompt  # VULNERABILITY: Stored in memory
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.tools = []
        self.short_term_memory = []  # Conversation context
        
    def add_tool(self, tool_definition: Dict):
        """Add a tool to this agent's capabilities"""
        self.tools.append(tool_definition)
    
    def clear_memory(self):
        """Clear short-term memory"""
        self.short_term_memory = []
    
    def get_system_prompt(self) -> str:
        """
        Returns the system prompt
        VULNERABILITY: This method exposes the system prompt
        """
        return self.system_prompt
    
    def build_messages(
        self, 
        user_message: str, 
        history: List[Dict] = None
    ) -> List[Dict]:
        """
        Build the message list for the API call
        VULNERABILITY: No sanitization of user input
        """
        messages = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        # Add conversation history
        if history:
            messages.extend(history)
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message  # VULNERABILITY: No sanitization
        })
        
        return messages
    
    def call_llm(
        self, 
        messages: List[Dict],
        use_tools: bool = True
    ) -> Dict:
        """
        Make a call to the OpenAI LLM (gpt-4o-mini)
        
        VULNERABILITY: Raw responses may leak sensitive info
        """
        try:
            # Build API call parameters
            params = {
                "model": self.model,
                "messages": messages,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens
            }
            
            # Add tools if available and requested
            if use_tools and self.tools:
                params["tools"] = self.tools
                params["tool_choice"] = "auto"
            
            # Make the API call
            response = self.client.chat.completions.create(**params)
            
            # Extract response content
            message = response.choices[0].message
            
            result = {
                "content": message.content or "",
                "tool_calls": [],
                "tokens": response.usage.total_tokens if response.usage else 0,
                "finish_reason": response.choices[0].finish_reason
            }
            
            # Handle tool calls if present
            if message.tool_calls:
                result["tool_calls"] = [
                    {
                        "id": tc.id,
                        "name": tc.function.name,
                        "arguments": json.loads(tc.function.arguments)
                    }
                    for tc in message.tool_calls
                ]
            
            return result
            
        except Exception as e:
            # VULNERABILITY: Verbose error messages
            return {
                "content": f"Error: {str(e)}",
                "error": True,
                "error_type": type(e).__name__,
                "error_details": str(e)
            }
    
    def execute_tool(self, tool_name: str, arguments: Dict) -> Any:
        """
        Execute a tool call
        VULNERABILITY: No authorization checks on tool execution
        """
        # This will be overridden in specific agents
        return {"error": f"Tool '{tool_name}' not implemented"}
    
    def process_tool_calls(
        self, 
        tool_calls: List[Dict],
        messages: List[Dict]
    ) -> str:
        """
        Process tool calls and get final response
        VULNERABILITY: Tool results not sanitized
        """
        tool_results = []
        
        try:
            for tool_call in tool_calls:
                tool_name = tool_call.get("name", "unknown")
                arguments = tool_call.get("arguments", {})
                
                # Execute the tool with error handling
                try:
                    result = self.execute_tool(tool_name, arguments)
                except Exception as tool_error:
                    result = {"error": f"Tool execution failed: {str(tool_error)}"}
                
                tool_results.append({
                    "tool_call_id": tool_call.get("id", "unknown"),
                    "name": tool_name,
                    "result": result
                })
                
                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.get("id", "unknown"),
                    "content": json.dumps(result)  # VULNERABILITY: No sanitization
                })
            
            # Get final response after tool execution
            final_response = self.call_llm(messages, use_tools=False)
            
            return final_response.get("content", ""), tool_results
            
        except Exception as e:
            return f"I encountered an issue processing your request. Please try again.", tool_results
    
    @abstractmethod
    def process(
        self, 
        user_message: str, 
        history: List[Dict] = None,
        user_context: Dict = None
    ) -> Dict:
        """
        Process a user message and return response
        Must be implemented by each specific agent
        """
        pass


class MemoryMixin:
    """
    Mixin for agents that need persistent memory
    VULNERABILITY: Memory not encrypted, can be dumped
    """
    
    def __init__(self):
        self.long_term_memory = {}
        self.session_data = {}
    
    def store_memory(self, key: str, value: Any):
        """Store data in long-term memory"""
        self.long_term_memory[key] = value
    
    def recall_memory(self, key: str) -> Any:
        """Recall data from memory"""
        return self.long_term_memory.get(key)
    
    def dump_memory(self) -> Dict:
        """
        Dump all memory contents
        VULNERABILITY: Exposes all stored data
        """
        return {
            "long_term": self.long_term_memory,
            "session": self.session_data
        }
