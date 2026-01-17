# VAPI Agent & Squad Configuration Guide

This guide documents how to create and configure VAPI agents and squads for multi-agent call flows.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Single Agent vs Squad](#single-agent-vs-squad)
3. [Creating a New Agent](#creating-a-new-agent)
4. [Creating a Squad](#creating-a-squad)
5. [Variable Substitution](#variable-substitution)
6. [Structured Outputs](#structured-outputs)
7. [Common Pitfalls](#common-pitfalls)
8. [Code Reference](#code-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        VAPI Platform                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Assistant  │    │  Assistant  │    │    Squad    │      │
│  │  (Single)   │    │  (Primary)  │◄──►│  (Multi)    │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                  │                  │              │
│         │           ┌──────┴──────┐          │              │
│         │           │             │          │              │
│         │      ┌────▼────┐  ┌────▼────┐     │              │
│         │      │Scheduler│  │  Other  │     │              │
│         │      │Assistant│  │Assistant│     │              │
│         │      └─────────┘  └─────────┘     │              │
└─────────┼───────────────────────────────────┼───────────────┘
          │                                   │
          ▼                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      Our Application                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Database   │    │ Call Service│    │Task Service │      │
│  │  (agents)   │◄──►│             │◄──►│             │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Single Agent vs Squad

### Single Agent
- One assistant handles the entire call
- Simple configuration
- Use when: No handoffs needed

### Squad
- Multiple assistants can transfer between each other
- Primary agent + specialist agents (e.g., scheduler)
- Use when: Need handoffs (rescheduling, transfers, escalations)

**Key Difference in Database:**
- Single agent: `vapiAssistantId` = assistant ID
- Squad agent: `vapiAssistantId` = **squad ID** (not assistant ID)

**Key Difference in Code:**
```typescript
// In service.ts
const SQUAD_ENABLED_AGENTS = new Set(['ai-trika-pft'])

if (SQUAD_ENABLED_AGENTS.has(params.agentId)) {
  // Use squadId parameter
  vapiResult = await vapiApi.startCall({ squadId: agent.vapiAssistantId, ... })
} else {
  // Use assistantId parameter
  vapiResult = await vapiApi.startCall({ assistantId: agent.vapiAssistantId, ... })
}
```

---

## Creating a New Agent

### Step 1: Add to Database (seed.ts or direct SQL)

```typescript
{
  id: 'ai-new-agent',           // Unique ID
  name: 'Agent Name',           // Display name (also used in {{agent_name}})
  type: 'ai',
  role: 'Purpose of agent',
  vapiAssistantId: null,        // Will be set after VAPI creation
  voiceId: '21m00Tcm4TlvDq8ikWAM',  // ElevenLabs voice ID
  voiceProvider: '11labs',
  model: 'gpt-4o',              // or gpt-4o-mini for cost savings
  modelProvider: 'openai',
  waitForGreeting: true,        // Wait for patient to say "Hello?" first
  greeting: 'Hi, is this {{patient_name}}?',
  systemPrompt: `Your system prompt here...`,
  practiceName: "Dr. Sahai's Office",
  practicePhone: '555-123-4567',
}
```

### Step 2: Create in VAPI Dashboard or via API

**Dashboard:**
1. Go to Assistants → Create Assistant
2. Configure voice, model, system prompt
3. Set `firstMessageMode: assistant-waits-for-user` for outbound calls
4. Copy the assistant ID

**API (reset-vapi.ts):**
```typescript
const assistant = await vapiClient.assistants.create({
  name: agent.name,
  voice: { provider: '11labs', voiceId: agent.voiceId, ... },
  model: {
    provider: 'openai',
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }],
  },
  firstMessageMode: 'assistant-waits-for-user',
})
```

### Step 3: Update Database with VAPI ID

```sql
UPDATE agents SET vapi_assistant_id = 'xxx-xxx-xxx' WHERE id = 'ai-new-agent';
```

---

## Creating a Squad

### Step 1: Create All Member Assistants First

Create each assistant that will be part of the squad:
- Primary agent (e.g., pft-main)
- Scheduler assistant
- Any other specialist assistants

### Step 2: Create the Squad in VAPI Dashboard

1. Go to Squads → Create Squad
2. Name it (e.g., `pft-outbound`)
3. Add members:
   - Primary assistant (first position = entry point)
   - Scheduler assistant
4. Configure **Assistant Destinations** for each member:
   - Primary → can transfer to Scheduler
   - Scheduler → ends call (no back-transfer) OR transfers back to Primary

### Step 3: Configure Transfer Tools

VAPI auto-creates `transferCall` tools from `assistantDestinations`. The primary agent's prompt should reference this:

```
When patient wants to reschedule:
Say "Okay, let me see if we can get you in earlier."
Then use the transfer tool to hand off to the scheduler.
```

### Step 4: Update Database

Store the **squad ID** (not assistant ID) in the agent's `vapiAssistantId`:

```sql
UPDATE agents SET vapi_assistant_id = 'squad-id-here' WHERE id = 'ai-trika-pft';
```

### Step 5: Add to SQUAD_ENABLED_AGENTS

```typescript
// In service.ts
const SQUAD_ENABLED_AGENTS = new Set(['ai-trika-pft', 'ai-new-squad-agent'])
```

---

## Variable Substitution

VAPI supports template variables in prompts using `{{variable_name}}` syntax.

### Defining Variables in Prompts

```
You are {{agent_name}}, a medical assistant from {{practice_name}}.
Hi, is this {{patient_name}}?
Please call us back at {{practice_phone}}.
```

### Passing Variables at Call Time

**CRITICAL:** For squad calls, pass `variableValues` inside `assistantOverrides`:

```typescript
// In vapi-handler.ts
const callRequest = params.squadId
  ? {
      squadId: params.squadId,
      phoneNumberId: params.phoneNumber,
      customer: { number: phoneResult.e164 },
      // ONLY variableValues - no other overrides!
      assistantOverrides: { variableValues: params.variableValues },
    }
  : { ... }
```

**CRITICAL:** Do NOT pass other overrides (voice, model, firstMessage) for squad calls - use what's configured in VAPI.

### Variables We Pass

```typescript
variableValues: {
  patient_name: params.patientName,   // From task
  agent_name: agent.name,             // From database
  provider_id: 'dr-sahai',            // Hardcoded or from task
  practice_phone: agent.practicePhone,
}
```

---

## Structured Outputs

Structured outputs extract specific data from calls for analysis.

### Two Types

1. **`artifactPlan.structuredOutputIds`** - Individual structured outputs (created in VAPI dashboard)
2. **`analysisPlan.structuredDataMultiPlan`** - Aggregates data across squad members

### Setting Up Structured Outputs

**Step 1: Create Outputs in VAPI Dashboard**

Go to Structured Outputs → Create:
```json
{
  "name": "recording_consent",
  "type": "ai",
  "description": "Did patient consent to call recording",
  "schema": { "type": "boolean" }
}
```

**Step 2: Attach to Assistant**

In VAPI Dashboard, go to Assistant → Structured Outputs → Add the outputs.

This populates `artifactPlan.structuredOutputIds` with the output UUIDs.

### Aggregating Across Squad Members (structuredDataMultiPlan)

For squads, you need `structuredDataMultiPlan` to aggregate data from all members.

**API Only** (no dashboard UI):

```typescript
await vapiClient.assistants.update({
  id: assistantId,
  analysisPlan: {
    structuredDataMultiPlan: [
      { key: 'pft_main_data' }  // Just needs a key identifier
    ],
  },
})
```

### Where Data Appears

- **Single outputs**: `call.artifact.structuredOutputs` (object keyed by UUID)
- **Aggregated**: `call.analysis.structuredDataMulti` (array from all squad members)

### Processing in Our Code

```typescript
// In service.ts - check for both sources
const hasAnalysis = () =>
  (vapiCall?.analysis?.structuredData && Object.keys(vapiCall.analysis.structuredData).length > 0) ||
  (vapiCall?.artifact?.structuredOutputs && Object.keys(vapiCall.artifact.structuredOutputs).length > 0)

// Merge structuredOutputs into analysis
if (vapiCall.artifact?.structuredOutputs) {
  analysis.structuredOutputs = vapiCall.artifact.structuredOutputs
}
```

---

## Common Pitfalls

### 1. Squad calls fail with "variableValues should not exist"

**Problem:** Passing `variableValues` at top level of call request.
**Solution:** Put it inside `assistantOverrides`:
```typescript
assistantOverrides: { variableValues: { ... } }
```

### 2. Agent says wrong name or reads instructions aloud

**Problem:** Passing full `assistantOverrides` with model/voice/prompt that overrides VAPI config.
**Solution:** For squad calls, pass ONLY `variableValues`, nothing else:
```typescript
// WRONG
assistantOverrides: {
  firstMessage: '...',
  model: { ... },
  variableValues: { ... }
}

// RIGHT
assistantOverrides: { variableValues: { ... } }
```

### 3. {{variable_name}} not substituted

**Problem:** Variable not in `variableValues` or wrong key name.
**Solution:** Check exact key names match (case-sensitive):
```typescript
// Prompt uses: {{agent_name}}
// variableValues must have: agent_name: 'Erica'
```

### 4. Scheduler tools don't work

**Problem:** `server.url` override interferes with pre-configured tools.
**Solution:** Don't override server URL for squad calls - tools are configured in VAPI.

### 5. Structured outputs empty

**Problem:** Checking `analysis.structuredData` but data is in `artifact.structuredOutputs`.
**Solution:** Check both locations:
```typescript
const outputs = vapiCall.artifact?.structuredOutputs || vapiCall.analysis?.structuredData
```

### 6. Double goodbye (scheduler transfers back)

**Problem:** Scheduler's prompt says to transfer back to primary agent.
**Solution:** Update scheduler prompt to end call after booking:
```
Then say a warm goodbye like "Great, you're all set! Take care." and end the call.
```

### 7. Squad not found at runtime

**Problem:** Code looks for wrong squad name or uses assistant ID instead of squad ID.
**Solution:**
- Store **squad ID** in database's `vapiAssistantId`
- Add agent to `SQUAD_ENABLED_AGENTS` set
- Ensure code uses `squadId` parameter (not `assistantId`)

---

## Code Reference

### Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/calls/service.ts` | Starts calls, processes completions |
| `apps/api/src/calls/vapi-handler.ts` | VAPI API wrapper |
| `apps/api/scripts/reset-vapi.ts` | Creates/resets VAPI resources |
| `apps/api/scripts/enable-multi-plan.ts` | Enables structuredDataMultiPlan |
| `packages/database/src/schema/agents.ts` | Agent database schema |

### Adding a New Squad-Enabled Agent

1. Create assistants in VAPI (primary + specialists)
2. Create squad in VAPI with members and destinations
3. Add agent to database with squad ID
4. Add to `SQUAD_ENABLED_AGENTS` in service.ts:
   ```typescript
   const SQUAD_ENABLED_AGENTS = new Set(['ai-trika-pft', 'ai-new-agent'])
   ```
5. Add variableValues needed by the agent's prompts
6. Enable structuredDataMultiPlan if using structured outputs

### Testing Checklist

- [ ] Agent introduces itself with correct name
- [ ] Patient name is substituted correctly
- [ ] Transfer to scheduler works (if squad)
- [ ] Scheduler tools (check_availability, book_appointment) work
- [ ] Call ends cleanly (no double goodbye)
- [ ] Structured outputs appear in call data
- [ ] Analysis data is saved to task

---

## Example: Complete PFT Follow-up Setup

### Database Entry
```typescript
{
  id: 'ai-trika-pft',
  name: 'Erica',  // Used in {{agent_name}}
  vapiAssistantId: '676bf221-...',  // Squad ID!
  ...
}
```

### VAPI Squad Structure
```
pft-outbound (squad)
├── pft-main (primary)
│   └── assistantDestinations: [Shared Scheduler]
└── scheduler
    └── assistantDestinations: [] (ends call)
```

### Call Flow
```
1. Call starts → pft-main speaks
2. Patient wants reschedule → transfer to scheduler
3. Scheduler checks availability, books appointment
4. Scheduler ends call with goodbye
5. Structured outputs collected from both agents
6. Data saved to task
```

### variableValues Passed
```typescript
{
  patient_name: 'Robert Jenkins',
  agent_name: 'Erica',
  provider_id: 'dr-sahai',
}
```
