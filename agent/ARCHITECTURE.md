# Architecture

This document provides comprehensive context about the repository architecture, planning, and roadmap. Use this file to give a new LLM chat session full context for working on tasks.

---

## Overview

**energy-exec** is a Telegram bot that helps structure daily plans based on energy levels, health metrics, and personal goals. It uses AI to generate adaptive day plans with work blocks, breaks, and tea/caffeine guidance.

### Core User Flow

1. **Onboarding**: Bot asks for timezone on first interaction
2. **Morning check-in**: User shares body battery, sleep, mood, priorities, appointments
3. **Day plan**: Bot generates energy-aware schedule with work blocks and breaks
4. **Mid-day updates**: User messages when things change; bot adjusts the plan
5. **Evening reflection**: User logs how the day went
6. **History**: All interactions stored for future context

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Server | Elysia |
| Telegram | grammY |
| AI | Vercel AI SDK v5 |
| LLM Provider | opencode-zen (big-pickle / GLM 4.6) |
| Database | SQLite (Bun driver) |
| ORM | Drizzle |
| Deployment | Railway |

---

## Roadmap

**Evergreen Section:** Always update this section when steps are finished or changed. Mark completed steps with `[x]` and update step descriptions as needed.

### Phase 0: Project Foundation

- [ ] Initialize Bun project with `bun init`
- [ ] Install core dependencies (elysia, grammy, drizzle-orm, ai)
- [ ] Configure TypeScript (strict mode)
- [ ] Set up folder structure (see System Architecture below)
- [ ] Create `.env.example` with required environment variables
- [ ] Add biome for linting/formatting
- [ ] Set up bun:test with basic test structure
- [ ] Install drizzle-seed for test data seeding

### Phase 1: Database Setup

- [ ] Configure Drizzle with Bun SQLite driver
- [ ] Create schema: `config` table (key: string, value: JSON)
- [ ] Create schema: `messages` table (raw message log)
- [ ] Create schema: `daily_logs` table (structured daily summaries)
- [ ] Set up Drizzle migrations
- [ ] Create database helper functions (get/set config, log message, etc.)
- [ ] Set up in-memory SQLite test helper
- [ ] Add unit tests for database services

### Phase 2: Telegram Bot Core

- [ ] Initialize grammY bot with token from environment
- [ ] Implement user ID whitelist (single authorized user)
- [ ] Add basic command handlers (`/start`, `/help`)
- [ ] Set up Elysia server with health check endpoint
- [ ] Configure connection mode based on `NODE_ENV`:
  - Development: Long polling (no webhook needed)
  - Production: Webhook endpoint at `/webhook`
- [ ] Error handling and logging
- [ ] Create `MessageHandler` abstraction (Telegram-free interface)
- [ ] Add unit tests for message handler with plain strings

### Phase 3: Onboarding Flow

- [ ] Check if user is onboarded (timezone exists in config)
- [ ] Create conversation flow using `@grammyjs/conversations`
- [ ] Ask user for timezone (with examples/suggestions)
- [ ] Validate and store timezone in config table
- [ ] Confirmation message after successful onboarding

### Phase 4: AI Integration

- [ ] Set up Vercel AI SDK v5
- [ ] Configure opencode-zen as OpenAI-compatible provider
- [ ] Set model to `big-pickle` (GLM 4.6)
- [ ] Create base system prompt for energy-aware planning
- [ ] Implement basic message → AI → response flow
- [ ] Handle AI errors gracefully
- [ ] Create `AIClient` interface for swappable implementations
- [ ] Add mock AI client for testing
- [ ] Add unit tests for prompt builder

### Phase 5: Check-in Conversations

- [ ] Design morning check-in conversation flow
  - Body battery value (number)
  - Sleep quality/deprivation (text)
  - Current feeling (motivation, joy, dizziness, etc.)
  - Most important task for today
  - Important appointments/meetings
- [ ] Design evening reflection flow
  - How did the day go?
  - Any notes for tomorrow?
- [ ] Implement mid-day update handling (free-form messages)
- [ ] Store all check-in data in `daily_logs` table
- [ ] Log raw messages to `messages` table
- [ ] Add integration tests for conversation flows (mocked AI)

### Phase 6: Intelligent Day Planning

- [ ] Create `Clock` abstraction for injectable time (testability)
- [ ] Load current day's log (if exists) for context
- [ ] Load previous N days' summaries for patterns (start with 3-7 days)
- [ ] Craft prompt with user state + history + current request
- [ ] Generate day plan with:
  - Work blocks (1×90min, 2×45min, etc. based on energy)
  - Break scheduling
  - Tea/caffeine recommendations
  - Meeting/appointment integration
- [ ] Handle plan adjustments (user sends update → regenerate)
- [ ] Format responses for Telegram (markdown, clear structure)
- [ ] Add unit tests for planner logic (work blocks, breaks, timing)

### Phase 7: Deployment

- [ ] Create Railway project
- [ ] Configure SQLite persistence (Railway volume)
- [ ] Set environment variables in Railway
- [ ] Configure Telegram webhook URL
- [ ] Set up health check for Railway
- [ ] Test end-to-end in production

### Phase 8: Post-MVP (Future)

- [ ] Proactive notifications (break reminders, tea time, etc.)
- [ ] Garmin API integration for automatic body battery sync
- [ ] Weekly/monthly summary generation
- [ ] Web dashboard for viewing history (if needed)
- [ ] Multi-user support (if needed)
- [ ] Upgrade to more capable LLM if big-pickle proves insufficient
- [ ] evalite integration for AI response quality testing
- [ ] Define AI test cases and expected response patterns

---

## System Architecture

**Evergreen Section:** Always update this section when making changes to the system architecture.

### Folder Structure

```
/
├── src/
│   ├── index.ts              # Entry point, starts Elysia + bot
│   ├── server/
│   │   └── index.ts          # Elysia server setup, routes
│   ├── bot/
│   │   ├── index.ts          # grammY bot initialization
│   │   ├── commands/         # Command handlers (/start, /help, etc.)
│   │   ├── conversations/    # Multi-step conversation flows
│   │   └── middleware/       # Auth, logging, error handling
│   └── lib/
│       ├── ai/
│       │   ├── client.ts     # Vercel AI SDK setup
│       │   └── prompts/      # System prompts and prompt builders
│       ├── db/
│       │   ├── index.ts      # Drizzle client
│       │   ├── schema.ts     # Table definitions
│       │   └── migrations/   # Drizzle migrations
│       └── services/
│           ├── config.ts    # Config get/set helpers
│           ├── daily-log.ts  # Daily log CRUD
│           └── planner.ts    # Day planning logic
├── agent/
│   ├── ARCHITECTURE.md       # This file
│   ├── AGENT.md              # Agent instructions
│   └── decisions/            # Architecture decision records
├── drizzle.config.ts         # Drizzle configuration
├── .env.example              # Environment template
├── .env                      # Local environment (gitignored)
└── package.json
```

### Database Schema

#### `config` Table
| Column | Type | Description |
|--------|------|-------------|
| key | TEXT (PK) | Configuration key (e.g., "timezone") |
| value | JSON | Configuration value |
| updated_at | TIMESTAMP | Last update time |

#### `messages` Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Auto-increment ID |
| telegram_message_id | INTEGER | Original Telegram message ID |
| direction | TEXT | "incoming" or "outgoing" |
| content | TEXT | Message text |
| created_at | TIMESTAMP | When message was sent/received |

#### `daily_logs` Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Auto-increment ID |
| date | TEXT | Date in YYYY-MM-DD format |
| body_battery | INTEGER | Garmin body battery (0-100) |
| sleep_notes | TEXT | Sleep quality/deprivation notes |
| mood | JSON | Mood indicators (motivation, joy, etc.) |
| priorities | JSON | Array of priorities/tasks |
| appointments | JSON | Array of appointments |
| generated_plan | TEXT | AI-generated day plan |
| reflections | TEXT | Evening reflection notes |
| updated_at | TIMESTAMP | Last update time |

### Key Design Decisions

1. **Single-user by design**: User ID whitelist in environment variable. No auth complexity.

2. **Config in database**: Allows bot to collect settings (like timezone) conversationally rather than requiring env vars for everything.

3. **Separate messages vs daily_logs**: Raw message log for debugging/history; structured daily_logs for AI context. Different purposes, different schemas.

4. **Conversation-based check-ins**: grammY conversations plugin handles multi-step flows cleanly. Better UX than parsing free-form text.

5. **OpenAI-compatible provider**: Vercel AI SDK's OpenAI adapter works with any compatible API. Easy to swap providers later.

6. **SQLite + Railway volume**: Simple persistence. No external database service needed. SQLite handles single-user write patterns fine.

### Environment Variables

```
# Telegram
TELEGRAM_BOT_TOKEN=           # Bot token (dev or prod, from @BotFather)
AUTHORIZED_USER_ID=           # Your Telegram user ID

# AI
OPENCODE_ZEN_API_KEY=         # API key for opencode-zen
OPENCODE_ZEN_BASE_URL=        # Base URL for opencode-zen API

# Server
PORT=3000                     # Elysia server port
NODE_ENV=development          # "development" or "production"

# Webhook (production only)
WEBHOOK_URL=                  # Telegram webhook URL (e.g., https://your-app.railway.app/webhook)

# Database
DATABASE_PATH=./data/energy.db  # SQLite file path
```

### Telegram Bot Setup

Two separate bots are used to avoid conflicts between local development and production:

| Environment | Bot | Connection | Created via |
|-------------|-----|------------|-------------|
| Development | `@YourDevBot` | Long polling | @BotFather |
| Production | `@YourProdBot` | Webhook | @BotFather |

**Why two bots?**
- Long polling and webhooks conflict if both try to receive updates for the same bot
- Separate bots allow local testing without disrupting production
- Different bot tokens in `.env` (local) vs Railway environment variables (prod)

**Connection mode logic:**
- `NODE_ENV=development` → Long polling (no server needed to receive updates)
- `NODE_ENV=production` → Webhook at `WEBHOOK_URL` (Railway provides HTTPS)

**Important distinction:**
- **Automated tests do NOT use Telegram at all** — they test via the `MessageHandler` abstraction with plain strings
- **Dev bot is for manual testing** — interacting with the bot while developing, checking UX/formatting, dogfooding features
- The dev bot is your sandbox; the prod bot is the one you rely on daily

---

## Testing Strategy

### Test Runner

Bun's built-in test runner (`bun:test`) for all tests.

### Database Testing

- **In-memory SQLite** for fast, ephemeral test runs
- **drizzle-seed** for seeding test data (previous days' logs, config, etc.)
- Each test suite gets a fresh database instance

### Abstraction Layers for Testability

To test core logic without Telegram or AI dependencies:

| Abstraction | Purpose |
|-------------|---------|
| `MessageHandler` | `handleMessage(text, context) → Response` — Telegram-free message processing |
| `AIClient` interface | Swappable: real provider vs mock for tests |
| `Clock` | Inject time instead of `new Date()` — test morning/evening logic |
| `Database` | Inject connection — production file vs test in-memory |

### Test Categories

#### Unit Tests
- **Planner logic**: Work block calculations, break timing, tea recommendations
- **Prompt builder**: Assert prompts contain expected context/data
- **Config service**: Get/set operations
- **Daily log service**: CRUD, date queries, history loading
- **Message parsing**: Extract structured data from free-form text

#### Integration Tests
- **Conversation flows**: Simulate multi-step check-ins with mocked session
- **Full message → response flow**: With mocked AI, assert response structure
- **Database seeding → history loading**: Verify context is built correctly

#### AI Tests (Future)
- **evalite** integration for AI response quality testing
- Structure TBD once evalite patterns are established
- Placeholder phase in roadmap

### Mocking Strategy

**AI Client Mock:**
- Returns canned responses based on input patterns
- Allows asserting prompt structure without calling real AI
- Configurable per-test for different scenarios

**Telegram Mock:**
- Not needed — `MessageHandler` abstraction bypasses Telegram entirely
- Bot layer is a thin adapter that calls `MessageHandler`
- Automated tests never touch Telegram; dev bot is for manual testing only

### Folder Structure Addition

```
src/
├── ...
├── src/
│   ├── lib/
│   │   ├── clock.ts          # Time abstraction (injectable)
│   │   └── interfaces.ts     # AIClient, MessageHandler interfaces
└── tests/
    ├── setup.ts              # Test database setup, mocks
    ├── seed.ts               # drizzle-seed helpers
    ├── unit/
    │   ├── planner.test.ts
    │   ├── prompt-builder.test.ts
    │   └── services.test.ts
    ├── integration/
    │   ├── conversations.test.ts
    │   └── message-flow.test.ts
    └── ai/                   # Future: evalite tests
        └── .gitkeep
```

---

## Planning Information

### MVP Scope

The MVP includes Phases 0-7. The goal is a working bot that:
- Onboards user with timezone
- Collects morning check-in data
- Generates an energy-aware day plan
- Handles mid-day updates
- Logs everything to SQLite
- Runs on Railway

### Out of Scope for MVP

- Proactive notifications/reminders
- Garmin API integration (manual input only)
- Web dashboard
- Multi-user support

### Open Questions

1. **big-pickle model capability**: May need to upgrade to a paid model if planning quality is insufficient. Monitor and evaluate.

2. **Railway SQLite persistence**: Verify volume persistence works correctly. Have backup strategy if issues arise.

3. **Conversation flow details**: Exact questions and format for check-ins to be refined during implementation.

---
