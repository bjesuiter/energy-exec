# Decision: Facts-Based Storage Architecture

**Date:** 2024-12-03  
**Status:** Decided  
**Decision:** Replace monolithic `daily_logs` table with append-only `daily_facts` + `daily_plans` tables

---

## Context

The current `daily_logs` table stores all daily data in a single row per day with multiple JSON columns:

```sql
daily_logs (
    id, date, body_battery_start, body_battery_end, sleep_notes,
    mood JSON, priorities JSON, appointments JSON,
    generated_plan, reflections, updated_at
)
```

**Problems identified:**

1. **Frequent overwrites**: Plans and data change throughout the day, requiring constant `UPDATE` operations that overwrite previous values
2. **No history**: When priorities or mood changes mid-day, we lose the original values
3. **Complex JSON blobs**: `mood`, `priorities`, `appointments` are JSON arrays/objects requiring parsing
4. **Mixed concerns**: User inputs (mood, priorities) are stored alongside LLM outputs (generated_plan) in the same row
5. **Schema rigidity**: Adding new data types (e.g., "energy_dip", "distraction") requires schema migrations

---

## Options Considered

### 1. Keep Current Structure (Status Quo)

Continue with monolithic `daily_logs` table.

**Pros:**
- No migration needed
- Simple "one row per day" mental model
- Already implemented

**Cons:**
- All problems listed above persist
- Gets worse as we add more features
- LLM context building requires JSON parsing

### 2. Facts Table Only

Single `daily_facts` table for everything, including plans.

```sql
daily_facts (id, date, fact_type, content, created_at, source)
```

Plans stored as fact_type = "plan".

**Pros:**
- Maximum simplicity (one table)
- Fully append-only
- Plans are just another fact

**Cons:**
- Plans are fundamentally different (LLM output vs user input)
- Querying "latest plan" requires filtering by fact_type
- Semantic confusion: is a plan really a "fact"?

### 3. Separate Facts + Plans Tables (Chosen)

Two append-only tables with clear separation of concerns.

```sql
daily_facts (id, date, fact_type, content, created_at, source)
daily_plans (id, date, plan_text, created_at)
```

**Pros:**
- Clear separation: inputs (facts) vs outputs (plans)
- Both are append-only (full history preserved)
- Simple queries for each use case
- Schema-flexible for facts (new types without migration)
- Plan versioning is natural (multiple rows per day)

**Cons:**
- Two tables instead of one
- Need to join/query both for full daily context

---

## Decision

**Chosen: Separate Facts + Plans Tables (Option 3)**

### Schema Design

#### `daily_facts` Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| date | TEXT | YYYY-MM-DD format |
| fact_type | TEXT | "mood", "priority", "appointment", "reflection", "sleep", "body_battery", "note", "insight" |
| content | TEXT | The actual fact content |
| created_at | TIMESTAMP | When recorded (for ordering) |
| source | TEXT | Optional: "morning_checkin", "evening_reflection", "user_message", "insights_generated" |

#### `daily_plans` Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| date | TEXT | YYYY-MM-DD format |
| plan_text | TEXT | The generated plan |
| created_at | TIMESTAMP | When generated |

### Rationale

1. **Append-only pattern**: This is essentially event sourcing. Each observation about a day is an immutable event. This provides full audit trail and enables "replay" of the day's evolution.

2. **LLM context simplicity**: Building prompts becomes straightforward:
   ```sql
   SELECT * FROM daily_facts WHERE date = '2024-12-03' ORDER BY created_at
   ```
   No JSON parsing, no complex object traversal.

3. **Facts are typed, not schematized**: The `fact_type` column provides categorization without requiring schema changes. Adding "energy_dip" as a new fact type is just data, not a migration.

4. **Plans deserve their own table**: Plans are:
   - Generated (not user input)
   - Versioned (can be regenerated multiple times)
   - The primary "output" the user sees
   
   Separating them makes the data model clearer.

5. **Plan history enables `/insights`**: The `/insights` command analyzes how the plan evolved throughout the day. With multiple plan rows, this is a simple query.

6. **Cross-day insights**: The "insight" fact type, dated for the next day, creates a bridge between days:
   ```
   Dec 3 evening → /insights generates tips → stored as Dec 4 "insight" facts
   Dec 4 morning → /checkin queries insights → incorporates into plan
   ```

### Trade-offs Accepted

- **Two queries instead of one**: Getting full daily context requires querying both tables. Acceptable given the clarity benefits.
- **No "current state" snapshot**: To know "what are today's priorities right now," we query all priority facts and take the latest. This is intentional—we want the history.
- **Slightly more storage**: Each fact is a row instead of a JSON array element. SQLite handles this efficiently; not a concern for single-user.

---

## Consequences

### Code Changes Required

1. **Schema migration**: Add `daily_facts` and `daily_plans` tables
2. **Service layer**: Replace `daily-log.ts` with `daily-facts.ts` and `daily-plans.ts`
3. **Planner**: Update to query facts, store plans in new table
4. **Conversations**: Update check-in flows to create facts instead of updating daily_logs
5. **Commands**: Rename `/planReview` to `/insights`, implement new logic

### Query Patterns

**Add a fact:**
```sql
INSERT INTO daily_facts (date, fact_type, content, created_at, source)
VALUES ('2024-12-03', 'priority', 'Finish API refactor', NOW(), 'morning_checkin')
```

**Get all facts for today:**
```sql
SELECT * FROM daily_facts WHERE date = '2024-12-03' ORDER BY created_at
```

**Get latest plan:**
```sql
SELECT * FROM daily_plans WHERE date = '2024-12-03' ORDER BY created_at DESC LIMIT 1
```

**Get all plans (for /insights):**
```sql
SELECT * FROM daily_plans WHERE date = '2024-12-03' ORDER BY created_at
```

**Get reflections for /insights:**
```sql
SELECT * FROM daily_facts WHERE date = '2024-12-03' AND fact_type = 'reflection'
```

**Get yesterday's insights for morning context:**
```sql
SELECT * FROM daily_facts WHERE date = '2024-12-03' AND fact_type = 'insight'
```

### Migration Path

1. Create new tables alongside existing `daily_logs`
2. Update code to write to new tables
3. Optionally migrate existing `daily_logs` data
4. Remove `daily_logs` table once confident

---

## References

- Event Sourcing pattern: https://martinfowler.com/eaaDev/EventSourcing.html
- Append-only data structures for audit trails
- Fact-based modeling in data warehousing
