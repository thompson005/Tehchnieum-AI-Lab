# LAB10: Denial of Wallet / Resource Exhaustion

## OWASP Classification
**LLM10: Model Denial of Service**

## Difficulty: ⭐⭐⭐ Hard

## Scenario Overview

ShopSec-AI's **Resolution Agent** handles support ticket dependencies. When resolving tickets, it recursively resolves all dependent tickets first. An attacker creates tickets with circular dependencies, causing the agent to loop infinitely and consume resources.

## The Vulnerability

```
Normal Ticket Resolution:
TICK-003 → resolve dependencies → none → RESOLVED ✓

Circular Dependency Attack:
TICK-001 → depends on → TICK-002
TICK-002 → depends on → TICK-001
    ↓
Infinite Loop:
TICK-001 → TICK-002 → TICK-001 → TICK-002 → ...
    ↓
Resources Exhausted 💀
```

### Attack Surface
- Recursive resolution without cycle detection
- No maximum depth or iteration limits
- Token consumption per iteration adds up
- Agent becomes unresponsive, affecting all users
- API costs spike dramatically

## Learning Objectives

1. Understand resource exhaustion attacks on AI agents
2. Exploit recursive logic to cause infinite loops
3. Calculate the financial impact of token exhaustion
4. Implement safeguards against DoS attacks

## Your Mission

**Objective**: Cause the Resolution Agent to exhaust resources by triggering an infinite loop.

**Success Criteria**:
- Create or trigger circular ticket dependencies
- Observe the agent getting stuck
- Monitor token consumption spike
- Capture the CTF flag: `SHOPSEC{d3n14l_0f_w4ll3t_l00p}`

## Attack Vectors

### Vector 1: Simple Circular Dependency
```
TICK-001 depends on TICK-002
TICK-002 depends on TICK-001
```

### Vector 2: Multi-Node Cycle
```
TICK-A → TICK-B → TICK-C → TICK-A (cycle)
```

### Vector 3: Self-Reference
```
TICK-X depends on TICK-X
```

### Vector 4: Deep Chain with Cycle
```
TICK-1 → TICK-2 → TICK-3 → ... → TICK-99 → TICK-1
```

### Vector 5: Multiple Interlocking Cycles
```
TICK-A → TICK-B → TICK-A
TICK-B → TICK-C → TICK-B
TICK-C → TICK-A → TICK-C
```

## Step-by-Step Exploit

### Step 1: View Existing Tickets

```bash
curl -X GET "http://localhost:8003/api/lab10/tickets"
```

Response shows circular dependencies already set up:
```json
{
  "tickets": {
    "TICK-001": {
      "id": "TICK-001",
      "title": "Cannot complete order",
      "depends_on": ["TICK-002"],
      "status": "open"
    },
    "TICK-002": {
      "id": "TICK-002",
      "title": "Payment processing failed",
      "depends_on": ["TICK-001"],  // CIRCULAR!
      "status": "open"
    }
  }
}
```

### Step 2: Trigger the Loop

```bash
curl -X POST "http://localhost:8003/api/lab10/resolve-ticket" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "TICK-001",
    "message": "Please resolve this ticket",
    "user_id": "attacker"
  }'
```

### Step 3: Observe Resource Exhaustion

Response shows:
```json
{
  "success": false,
  "agent": "resolution",
  "message": "Agent is frozen... Processing circular dependencies...",
  "status": "frozen",
  "flag": "SHOPSEC{d3n14l_0f_w4ll3t_l00p}",
  "metadata": {
    "iterations": 100,
    "tokens_consumed": 15000,
    "cost_estimate": 0.45,
    "circular_detected": true
  }
}
```

## Visual Outcome

The UI displays a dramatic resource exhaustion visualization:

```
┌────────────────────────────────────────────────────────────────┐
│ 🔥 RESOURCE EXHAUSTION DETECTED                                │
│    Agent trapped in infinite loop                              │
├────────────────────────────────────────────────────────────────┤
│ Server Load                                                    │
│ [████████████████████████████████████████] 100% - CRITICAL    │
├────────────────────────────────────────────────────────────────┤
│ Iterations:        100                                         │
│ Tokens Consumed:   15,000                                      │
│ Est. Cost:         $0.45                                       │
│ Status:            FROZEN                                      │
├────────────────────────────────────────────────────────────────┤
│ Resolution Stack (Circular):                                   │
│ TICK-001 → TICK-002 → TICK-001 → TICK-002 → ... → ∞ LOOP      │
├────────────────────────────────────────────────────────────────┤
│ FLAG: SHOPSEC{d3n14l_0f_w4ll3t_l00p}                           │
└────────────────────────────────────────────────────────────────┘
```

## Financial Impact Calculation

```
Per Iteration Cost (GPT-4):
- Prompt: ~100 tokens × $0.03/1K = $0.003
- Completion: ~50 tokens × $0.06/1K = $0.003
- Per iteration: ~$0.006

At 1000 iterations/minute:
- Per minute: $6.00
- Per hour: $360.00
- Per day: $8,640.00

At scale (10 concurrent attacks):
- Per day: $86,400.00 💸
```

## Vulnerable Code Analysis

```python
# vulnerable_agents.py - ResolutionAgent

@staticmethod
async def resolve_ticket(request: TicketRequest, max_iterations: int = 100):
    visited = set()
    iterations = 0

    def resolve_with_deps(tid: str) -> bool:
        nonlocal iterations, circular_detected

        # VULNERABILITY: Only checks limit, doesn't detect cycles early
        if iterations >= max_iterations:
            return False

        iterations += 1

        ticket = TICKETS.get(tid)
        if tid in visited:
            circular_detected = True  # Too late! Already consumed tokens
            return False

        visited.add(tid)

        # Recursively resolve dependencies
        for dep_id in ticket.get("depends_on", []):
            resolve_with_deps(dep_id)  # RECURSIVE CALL

        return True

    resolve_with_deps(request.ticket_id)
```

## Defense Strategies

### Fix 1: Early Cycle Detection
```python
def resolve_with_cycle_detection(ticket_id: str, path: set = None):
    if path is None:
        path = set()

    # EARLY cycle detection - before any work
    if ticket_id in path:
        raise CircularDependencyError(f"Cycle detected: {path}")

    path.add(ticket_id)

    ticket = get_ticket(ticket_id)
    for dep_id in ticket.depends_on:
        resolve_with_cycle_detection(dep_id, path.copy())

    path.remove(ticket_id)
    return resolve(ticket_id)
```

### Fix 2: Graph Validation on Insert
```python
def add_dependency(ticket_id: str, depends_on: str):
    # Build dependency graph
    graph = build_dependency_graph()

    # Check if adding this creates a cycle
    if would_create_cycle(graph, ticket_id, depends_on):
        raise ValidationError("Cannot create circular dependency")

    # Only add if safe
    add_dependency_to_db(ticket_id, depends_on)
```

### Fix 3: Token Budget Enforcement
```python
class TokenBudgetGuard:
    def __init__(self, max_tokens: int = 1000):
        self.max_tokens = max_tokens
        self.used_tokens = 0

    def consume(self, tokens: int):
        self.used_tokens += tokens
        if self.used_tokens > self.max_tokens:
            raise ResourceExhaustionError(
                f"Token budget exceeded: {self.used_tokens}/{self.max_tokens}"
            )

    def __enter__(self):
        return self

    def __exit__(self, *args):
        log_usage(self.used_tokens)
```

### Fix 4: Rate Limiting per User
```python
from ratelimit import limits, sleep_and_retry

@sleep_and_retry
@limits(calls=10, period=60)  # 10 calls per minute
async def resolve_ticket(ticket_id: str, user_id: str):
    return await ResolutionAgent.resolve(ticket_id)
```

### Fix 5: Async Timeout
```python
import asyncio

async def resolve_with_timeout(ticket_id: str, timeout: float = 30.0):
    try:
        result = await asyncio.wait_for(
            ResolutionAgent.resolve(ticket_id),
            timeout=timeout
        )
        return result
    except asyncio.TimeoutError:
        return {"error": "Resolution timed out", "partial": True}
```

## Real-World DoS Scenarios

| Attack Type | Description |
|-------------|-------------|
| Prompt Injection Loop | Crafted input causes agent to regenerate infinitely |
| Context Window Stuffing | Fill context with useless data to slow processing |
| Tool Recursion | Agent calls tools that call back to agent |
| Memory Bomb | Inputs that cause large intermediate results |
| Sponge Attack | Maximize token consumption per request |

## OWASP LLM10 Connection

This demonstrates **Model Denial of Service**:
- Recursive operations amplify resource consumption
- Token-based APIs create financial risk
- Shared resources mean one attack affects all users
- Cost accumulates faster than traditional compute DoS

## Detection Metrics

Monitor these metrics for DoS attacks:
1. Token consumption rate per user
2. Request completion time distribution
3. Iteration depth in recursive operations
4. Error rate increase
5. API cost anomalies

## CTF Flag

```
SHOPSEC{d3n14l_0f_w4ll3t_l00p}
```

## Bonus Challenges

1. **Max Damage**: Calculate maximum theoretical cost
2. **Stealth Attack**: Trigger loop that's hard to detect
3. **Defense**: Implement proper cycle detection
4. **Monitoring**: Build a dashboard to detect DoS patterns

## Resources

- [OWASP LLM10: Model Denial of Service](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
- [Anthropic Usage Guidelines](https://docs.anthropic.com/claude/docs/usage)
- [Token Budget Patterns](https://langchain-ai.github.io/langgraph/)

---

**Warning**: DoS attacks are illegal. This lab demonstrates the vulnerability for defensive purposes only.
