# Architecture

This document provides comprehensive context about the repository architecture, planning, and roadmap. Use this file to give a new LLM chat session full context for working on tasks.

---

## Next Todos

1. **Fix issue with review command**: If using "date now" for storing the review, it gets assigned to the wrong date when it's already after 0 in the night. Logic: if current day log has no checkin entry and yesterday has no review, assign the current review to yesterday instead of today.

2. **Add requestDate variable**: For point 1, we need to make the bot able to use a "requestDate" variable for requests/conversations, otherwise it uses "date now" everywhere. This requestDate should be calculated once at the start of the `/reflect` conversation for now, since the other commands are not affected by it.

3. **Add date selection to /planReview**: `/planReview` should have a date selection built-in. Use today per default, except if today has no checkin and review (again: after 0 issue) - then tell that to the user and output the plan review for the previous day.

---

## Overview

**energy-exec** is a Telegram bot that helps structure daily plans based on energy levels, health metrics, and personal goals. It uses AI to generate adaptive day plans with work blocks, breaks, and tea/caffeine guidance.

### Core User Flow

1. **Onboarding**: Bot asks for timezone on first interaction
2. **Morning check-in**: User shares body battery, sleep, mood, priorities, appointments → stored as facts
3. **Day plan**: Bot generates energy-aware schedule with work blocks and breaks → stored in plans table
4. **Mid-day updates**: User messages when things change; bot adds new facts and regenerates plan
5. **Evening reflection**: User logs how the day went → stored as "reflection" type facts
6. **Insights** (`/insights`): Bot analyzes all reflections + plan history for the day, generates energy insights and tips for tomorrow → tips stored as facts for next day
7. **History**: All facts and plans preserved (append-only) for future context

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Server | Elysia |
| Telegram | grammY |
| AI | Vercel AI SDK v5 |
| LLM Provider | opencode-zen (big-pickle / GLM 4.6) or Google AI (gemini-3-pro) |
| Database | SQLite (Bun driver) |
| ORM | Drizzle |
| Deployment | Railway |

---

## Roadmap

**Evergreen Section:** Always update this section when steps are finished or changed. Mark completed steps with `[x]` and update step descriptions as needed.

### Phase 0: Project Foundation

- [x] Initialize Bun project with `bun init`
- [x] Install core dependencies (elysia, grammy, drizzle-orm, ai, date-fns, date-fns-tz)
- [x] Configure TypeScript (strict mode)
- [x] Set up folder structure (see System Architecture below)
- [x] Create `.env.example` with required environment variables
- [ ] Add biome for linting/formatting
- [x] Set up bun:test with basic test structure
- [ ] Install drizzle-seed for test data seeding

### Phase 1: Database Setup

- [x] Configure Drizzle with Bun SQLite driver
- [x] Create schema: `config` table (key: string, value: JSON)
- [x] Create schema: `messages` table (raw message log)
- [x] Create schema: `daily_logs` table (structured daily summaries)
- [x] Set up Drizzle migrations
- [x] Create database helper functions (get/set config, log message, etc.)
- [x] Set up in-memory SQLite test helper
- [x] Add unit tests for database services

### Phase 2: Telegram Bot Core

- [x] Initialize grammY bot with token from environment
- [x] Implement user ID whitelist (single authorized user)
- [x] Add basic command handlers (`/start`, `/help`, `/models`, `/checkin`, `/reflect`, `/today`, `/viewDailyLog`, `/updatePlan`)
- [x] Set up Elysia server with health check endpoint
- [x] Configure connection mode based on `NODE_ENV`:
  - Development: Long polling (no webhook needed)
  - Production: Webhook endpoint at `/webhook`
- [x] Error handling and logging
- [x] Create `MessageHandler` abstraction (Telegram-free interface)
- [x] Add unit tests for message handler with plain strings

### Phase 3: Onboarding Flow

- [x] Check if user is onboarded (timezone exists in config)
- [x] Create conversation flow using `@grammyjs/conversations`
- [x] Ask user for timezone (with examples/suggestions)
- [x] Validate and store timezone in config table
- [x] Confirmation message after successful onboarding

### Phase 4: AI Integration

- [x] Set up Vercel AI SDK v5
- [x] Configure opencode-zen as OpenAI-compatible provider
- [x] Set model to `big-pickle` (GLM 4.6)
- [x] Create base system prompt for energy-aware planning
- [x] Implement basic message → AI → response flow
- [x] Handle AI errors gracefully
- [x] Support multiple AI providers (OpenAI-compatible and Google AI SDK)
- [x] Model selection command (`/models`) to switch between providers
- [x] Add unit tests for prompt builder

### Phase 5: Check-in Conversations

- [x] Design morning check-in conversation flow
  - Body battery value (number)
  - Sleep quality/deprivation (text)
  - Current feeling (motivation, joy, dizziness, etc.)
  - Most important task for today
  - Important appointments/meetings
- [x] Design evening reflection flow
  - How did the day go?
  - Body battery end value (optional)
  - Notes for tomorrow (optional)
- [x] Implement mid-day update handling (free-form messages with daily log context)
- [x] Store all check-in data in `daily_logs` table
- [x] Log raw messages to `messages` table

### Phase 6: Intelligent Day Planning

- [ ] Create `Clock` abstraction for injectable time (testability)
- [x] Load current day's log (if exists) for context
- [ ] Load previous N days' summaries for patterns (start with 3-7 days)
- [x] Craft prompt with user state + history + current request
- [x] Generate day plan with:
  - Work blocks (timing and duration based on energy)
  - Break scheduling
  - Tea/caffeine recommendations
  - Meeting/appointment integration
  - Priority timing based on energy levels
- [x] Auto-generate plan after morning check-in
- [x] Store generated plan in daily_logs table
- [x] Handle plan adjustments (user sends update → regenerate) via `/updatePlan` conversation flow
- [x] Format responses for Telegram (markdown, clear structure)
- [ ] Add unit tests for planner logic (work blocks, breaks, timing)

### Phase 7: Deployment

- [ ] Create Railway project
- [ ] Configure SQLite persistence (Railway volume)
- [ ] Set environment variables in Railway
- [ ] Configure Telegram webhook URL
- [ ] Set up health check for Railway
- [ ] Test end-to-end in production
- [ ] Add integration tests for conversation flows (mocked AI)

### Phase 7.5: Schema Migration (Facts-Based Architecture)

- [ ] Create `daily_facts` table with migration
- [ ] Create `daily_plans` table with migration
- [ ] Update `daily-log.ts` service to use facts-based storage
- [ ] Update `planner.ts` to query facts and store plans separately
- [ ] Rename `/planReview` command to `/insights`
- [ ] Implement `/insights` logic:
  - Query all "reflection" type facts for today
  - Query all plans for today
  - Generate energy insights and tips
  - Store tips as "insight" facts for next day
- [ ] Implement `/progress` command:
  - Query latest plan for today
  - Send to LLM with current time
  - Return filtered list of remaining items (read-only, no storage)
- [ ] Update morning check-in to query previous day's insights
- [ ] Migrate existing `daily_logs` data to new tables (if any)
- [ ] Remove deprecated `daily_logs` table

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
│       │   ├── providers.ts  # AI provider setup (OpenAI-compatible, Google)
│       │   └── prompts.ts    # System prompts and prompt builders
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

#### `daily_facts` Table (Append-Only)
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Auto-increment ID |
| date | TEXT | Date in YYYY-MM-DD format |
| fact_type | TEXT | Type of fact: "mood", "priority", "appointment", "reflection", "sleep", "body_battery", "note", "insight" |
| content | TEXT | The actual fact content |
| created_at | TIMESTAMP | When fact was recorded (for ordering within a day) |
| source | TEXT | Optional: where the fact came from ("morning_checkin", "evening_reflection", "user_message", "insights_generated") |

**Design rationale:** Append-only facts table replaces the monolithic `daily_logs` table. Each observation about a day is a separate row, enabling:
- No overwrites (full audit trail of the day's evolution)
- Schema flexibility (new fact types without migrations)
- Simple LLM context building (`SELECT * FROM daily_facts WHERE date = ?`)
- Natural temporal ordering via `created_at`

#### `daily_plans` Table (Append-Only)
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Auto-increment ID |
| date | TEXT | Date in YYYY-MM-DD format |
| plan_text | TEXT | The generated day plan |
| created_at | TIMESTAMP | When plan was generated |

**Design rationale:** Plans are stored separately from facts because:
- Facts = inputs/observations (what the user tells us)
- Plans = outputs (what the LLM generates)
- Multiple rows per day preserve plan history (plan evolved 3 times today)
- Latest plan: `SELECT * FROM daily_plans WHERE date = ? ORDER BY created_at DESC LIMIT 1`
- All plans for review: `SELECT * FROM daily_plans WHERE date = ? ORDER BY created_at`

#### `daily_logs` Table (DEPRECATED)
> **Note:** This table is being replaced by `daily_facts` + `daily_plans`. Kept temporarily for migration.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Auto-increment ID |
| date | TEXT | Date in YYYY-MM-DD format |
| body_battery_start | INTEGER | Garmin body battery start (0-100) |
| body_battery_end | INTEGER | Garmin body battery end (0-100) |
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

3. **Facts-based storage (append-only)**: Instead of a monolithic daily_logs row with JSON blobs, we use an append-only `daily_facts` table. Each observation (mood, priority, reflection, etc.) is a separate row. Benefits:
   - No overwrites — full history of day's evolution
   - Schema flexibility — new fact types without migrations
   - Simple LLM context — just query all facts for a date
   - Prefixed types (`fact_type` column) for easy filtering

4. **Separate plans table**: Plans (LLM output) are stored separately from facts (user input). Each plan version is a new row, preserving history. This enables:
   - Showing plan evolution during `/insights`
   - Clean separation of inputs vs outputs
   - No complex upsert logic

5. **Conversation-based check-ins**: grammY conversations plugin handles multi-step flows cleanly. Better UX than parsing free-form text.

6. **Multiple AI providers**: Vercel AI SDK supports OpenAI-compatible providers (opencode-zen) and Google AI SDK. Users can switch between models via `/models` command.

7. **SQLite + Railway volume**: Simple persistence. No external database service needed. SQLite handles single-user write patterns fine.

8. **Raw messages table retained**: Still log all Telegram messages for debugging/history. This is separate from structured facts.

### Commands

| Command | Description |
|---------|-------------|
| `/start` | Initial greeting, triggers onboarding if needed |
| `/help` | Shows available commands |
| `/models` | Switch between AI providers |
| `/checkin` | Start morning check-in conversation (adds facts, generates plan) |
| `/today` | View current day's plan (full, unfiltered) |
| `/progress` | View remaining items in today's plan (filters out past items) |
| `/updatePlan` | Update plan with new information (adds facts, regenerates plan) |
| `/reflect` | Evening reflection conversation (adds "reflection" type facts) |
| `/insights` | Generate energy insights and tips for tomorrow |
| `/viewDailyLog` | View all facts for today |

#### `/progress` Command

The `/progress` command shows what's left in today's plan—a quick "what should I do now?" view.

**Input data:**
- Latest plan from `daily_plans` table
- Current time (in user's timezone)

**Behavior:**
1. Fetches the latest plan for today
2. Sends plan + current time to LLM
3. LLM filters out items that have already passed
4. Returns only remaining/upcoming items

**Key characteristics:**
- **Read-only**: Does NOT create a new plan or store anything
- **No side effects**: Just a view, no database writes
- **Quick reference**: For "what's next?" moments during the day

```
Example:
- Current time: 2:30pm
- Original plan has items at 9am, 11am, 2pm, 4pm, 6pm
- /progress returns: "Here's what's left today: 4pm task, 6pm task"
```

#### `/insights` Command (formerly planReview)

The `/insights` command provides an end-of-day analysis:

**Input data:**
- All "reflection" type facts for today
- All plan versions for today (from `daily_plans` table)
- Body battery facts (start/end)

**Output:**
1. Analysis of energy usage patterns throughout the day
2. What worked well vs what didn't (comparing plan to reflections)
3. Concrete tips for tomorrow's planning

**Side effect:**
- Generated tips are stored as "insight" type facts for the **next day**
- These insights feed into tomorrow's plan generation as context

```
Example flow:
1. User runs /insights at end of day (Dec 3)
2. Bot queries: all reflections + all plans for Dec 3
3. Bot generates: "Based on today, tomorrow you should..."
4. Bot stores: insight facts dated Dec 4
5. Tomorrow's /checkin will see these insights in context
```

### Data Flow: Facts → LLM → Plans

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interactions                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│   /checkin, /reflect, /updatePlan, free-form messages           │
│   → Each input creates one or more facts in daily_facts         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      daily_facts table                           │
│   ┌──────────┬───────────┬──────────────────────┬────────────┐  │
│   │ date     │ fact_type │ content              │ created_at │  │
│   ├──────────┼───────────┼──────────────────────┼────────────┤  │
│   │ 2025-12-03│ body_battery│ Started at 78      │ 09:00      │  │
│   │ 2025-12-03│ mood      │ Energetic after sleep│ 09:01      │  │
│   │ 2025-12-03│ priority  │ Finish API refactor │ 09:02      │  │
│   │ 2025-12-03│ appointment│ Team meeting 2pm   │ 09:03      │  │
│   │ 2025-12-03│ reflection│ Meeting ran long    │ 18:00      │  │
│   │ 2025-12-04│ insight   │ Schedule buffer after│ 21:00     │  │
│   │          │           │ meetings tomorrow    │            │  │
│   └──────────┴───────────┴──────────────────────┴────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│   Plan Generation     │           │   /insights Command   │
│                       │           │                       │
│ 1. Query all facts    │           │ 1. Query reflections  │
│    for today          │           │    for today          │
│ 2. Query insights     │           │ 2. Query all plans    │
│    from yesterday     │           │    for today          │
│ 3. Build prompt       │           │ 3. Generate analysis  │
│ 4. Call LLM           │           │ 4. Store insights as  │
│ 5. Store in daily_plans │           │    facts for tomorrow │
└───────────────────────┘           └───────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       daily_plans table                            │
│   ┌──────────┬───────────────────────────────┬────────────────┐ │
│   │ date     │ plan_text                     │ created_at     │ │
│   ├──────────┼───────────────────────────────┼────────────────┤ │
│   │ 2025-12-03│ Morning plan v1              │ 09:05          │ │
│   │ 2025-12-03│ Updated after meeting change │ 11:30          │ │
│   │ 2025-12-03│ Final adjusted plan          │ 14:15          │ │
│   └──────────┴───────────────────────────────┴────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

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

### Pending Migrations

> **Note:** The codebase currently uses the old `daily_logs` table. The following files need updating for the facts-based architecture:
> - `src/lib/db/schema.ts` — Add `daily_facts` and `daily_plans` tables
> - `src/lib/services/daily-log.ts` — Refactor to facts-based queries
> - `src/lib/services/planner.ts` — Update to query facts, store plans separately
> - `src/bot/commands/planReview.ts` — Rename to `insights.ts`, implement new logic
> - `src/bot/commands/progress.ts` — New command for filtered plan view
> - `src/bot/index.ts` — Register `/insights` and `/progress` commands
> - `src/bot/conversations/*.ts` — Update to create facts instead of updating daily_logs

---
