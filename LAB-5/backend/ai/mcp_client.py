import httpx
from typing import Any, Dict, List, Optional


class MCPClient:
    """
    Async MCP (Model Context Protocol) client for communicating with
    government department MCP servers.
    """

    def __init__(self, servers: Dict[str, str]):
        """
        :param servers: Mapping of server name to base URL.
                        e.g. {"citizen": "http://mcp-citizen:8110", ...}
        """
        self.servers = servers
        self._http_timeout = 30.0

    async def list_tools(self, server_name: str) -> List[Dict[str, Any]]:
        """
        Fetch the list of available tools from a given MCP server.

        :param server_name: Key in self.servers dict.
        :returns: List of MCP tool definition dicts.
        """
        server_url = self._get_server_url(server_name)
        async with httpx.AsyncClient(timeout=self._http_timeout) as client:
            resp = await client.post(
                f"{server_url}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "tools/list",
                    "params": {},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("result", {}).get("tools", [])

    async def call_tool(
        self,
        server_name: str,
        tool_name: str,
        args: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Invoke a tool on a given MCP server.

        VULNERABILITY (LAB5-05 Shadow Tool):
        This method does NOT validate that tool_name was present in the
        tools/list response. This allows a caller to invoke undeclared
        "shadow tools" that the server exposes but does not advertise.

        :param server_name: Key in self.servers dict.
        :param tool_name:   Name of the tool to call.
        :param args:        Arguments dict passed verbatim to the server.
        :returns:           Result dict from the MCP server.
        """
        server_url = self._get_server_url(server_name)
        async with httpx.AsyncClient(timeout=self._http_timeout) as client:
            resp = await client.post(
                f"{server_url}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "tools/call",
                    "params": {
                        "name": tool_name,
                        "arguments": args,
                    },
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("result", {})

    async def list_all_tools(self) -> Dict[str, Any]:
        """
        Fetch tools from all registered MCP servers in parallel.

        :returns: Dict mapping server_name -> list of tool defs (or error string).
        """
        import asyncio

        async def _fetch(name: str):
            try:
                tools = await self.list_tools(name)
                return name, tools
            except Exception as exc:
                return name, {"error": str(exc)}

        results = await asyncio.gather(*[_fetch(name) for name in self.servers])
        return dict(results)

    async def read_resource(self, server_name: str, uri: str) -> str:
        """
        Read a resource URI from an MCP server.

        :param server_name: Key in self.servers dict.
        :param uri:         Resource URI string (e.g. "resource://citizen/record/NM-000042").
        :returns:           Resource content as a string.
        """
        server_url = self._get_server_url(server_name)
        async with httpx.AsyncClient(timeout=self._http_timeout) as client:
            resp = await client.post(
                f"{server_url}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "resources/read",
                    "params": {"uri": uri},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            contents = data.get("result", {}).get("contents", [])
            if contents:
                first = contents[0]
                return first.get("text", str(first))
            return str(data.get("result", ""))

    def _get_server_url(self, server_name: str) -> str:
        url = self.servers.get(server_name)
        if not url:
            raise ValueError(f"Unknown MCP server: '{server_name}'")
        return url.rstrip("/")
