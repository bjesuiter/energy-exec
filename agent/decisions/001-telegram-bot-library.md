# Decision: Telegram Bot Library

**Date:** 2024-12-01  
**Status:** Decided  
**Decision:** grammY

---

## Context

We need a Telegram bot library for Bun/TypeScript to handle bot interactions for the energy-exec daily planning bot.

## Options Considered

### 1. grammY

**Overview:** Modern, TypeScript-first Telegram bot framework. Built as a spiritual successor to Telegraf with lessons learned.

**Pros:**
- Native TypeScript with excellent type inference
- First-class Deno and Bun support (not just Node)
- Plugin ecosystem (sessions, menus, conversations, rate limiting)
- Built-in session handling with multiple storage adapters
- Excellent documentation with interactive examples
- Smaller bundle size, faster startup
- Active development and maintenance
- Conversation plugin for multi-step flows (useful for check-ins)
- Web framework adapters including for serverless

**Cons:**
- Smaller community than Telegraf (but growing fast)
- Fewer Stack Overflow answers (documentation compensates)

### 2. Telegraf

**Overview:** Mature, widely-used Telegram bot framework. The "default choice" for many years.

**Pros:**
- Large community and ecosystem
- Many tutorials and Stack Overflow answers
- Battle-tested in production
- Middleware architecture similar to Koa

**Cons:**
- Node.js focused; Bun support is incidental
- TypeScript support added later, less idiomatic
- Heavier bundle, slower cold starts
- Some plugins abandoned or outdated
- Less active development recently
- Session handling requires more boilerplate

---

## Decision

**Chosen: grammY**

### Rationale

1. **Bun-first compatibility**: grammY explicitly supports Bun, while Telegraf is Node-focused. Given our stack choice, this alignment matters.

2. **TypeScript experience**: grammY was designed for TypeScript from day one. Better type inference means fewer bugs and better IDE support.

3. **Conversation flows**: The `@grammyjs/conversations` plugin is ideal for our morning/evening check-in flows where we need to collect multiple pieces of information in sequence.

4. **Session management**: Built-in session support with SQLite adapter available—aligns with our Drizzle/SQLite choice.

5. **Documentation quality**: grammY's docs are exceptional with runnable examples, which accelerates development.

6. **Future-proofing**: Active development, modern architecture, growing ecosystem.

### Trade-offs Accepted

- Smaller community means occasionally needing to dig into source code
- Fewer "copy-paste" solutions from Stack Overflow

---

## Consequences

- Use `grammy` as the main dependency
- Use `@grammyjs/conversations` for multi-step check-in flows
- Use `@grammyjs/storage-*` or custom adapter for SQLite session storage
- Follow grammY patterns and conventions throughout the codebase
