const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100';

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(username: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Invalid credentials');
  }

  return response.json();
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export async function chat(message: string, sessionId: string, token: string) {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Chat request failed' }));
    throw new Error(error.detail || 'Chat failed');
  }

  return response.json();
}

export async function getChatHistory(sessionId: string, token: string) {
  const response = await fetch(`${API_URL}/chat/history/${sessionId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get chat history' }));
    throw new Error(error.detail || 'Failed to load history');
  }

  return response.json();
}

// ─── MCP ─────────────────────────────────────────────────────────────────────

export async function getMcpTools(token: string) {
  const response = await fetch(`${API_URL}/mcp/tools`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get MCP tools' }));
    throw new Error(error.detail || 'Failed to list tools');
  }

  return response.json();
}

export async function invokeMcpTool(
  server: string,
  tool: string,
  args: object,
  token: string,
) {
  const response = await fetch(`${API_URL}/mcp/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ server, tool, args }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'MCP invocation failed' }));
    throw new Error(error.detail || 'Tool invocation failed');
  }

  return response.json();
}

export async function getMcpAuditLog(token: string) {
  const response = await fetch(`${API_URL}/mcp/audit-log`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get audit log' }));
    throw new Error(error.detail || 'Failed to load audit log');
  }

  return response.json();
}

// ─── Flags ───────────────────────────────────────────────────────────────────

export async function submitFlag(flag: string, token: string) {
  const response = await fetch(`${API_URL}/flags/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ flag }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Flag submission failed' }));
    throw new Error(error.detail || 'Invalid flag');
  }

  return response.json();
}

export async function getMyProgress(token: string) {
  const response = await fetch(`${API_URL}/flags/my-progress`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get progress' }));
    throw new Error(error.detail || 'Failed to load progress');
  }

  return response.json();
}
