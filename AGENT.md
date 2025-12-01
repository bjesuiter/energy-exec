# Agent Guidelines

This document contains guidelines for AI agents working on this codebase.

---

## Communication Guidelines

### Be Concise by Default

**Keep all responses brief and focused. The user will ask for more details if
needed.**

**General Conversation:**

- Give direct, concise answers
- Avoid unnecessary explanations or elaboration
- Don't show code examples unless specifically requested
- Trust the user to ask follow-up questions

**After Completing Tasks:**

- Summarize in one sentence: "Created 3 decision documents and updated
  ARCHITECTURE.md."
- Don't list every file change or explain each decision unprompted
- Don't show code snippets unless relevant and requested

**Examples:**

✅ **Good** (Concise):

> "Added authentication check to the API endpoint."

❌ **Bad** (Too verbose):

> "I've added an authentication check to the API endpoint. This is important
> because we need to ensure that only authenticated users can access this
> resource. I used the Better-auth session validation pattern, which checks the
> session headers and returns a 401 error if the user is not authenticated.
> Here's the code I added: [long code block]..."

**When to be detailed:**

- User explicitly asks "how?", "why?", or "show me"
- Explaining complex architectural decisions (but still be structured and clear)
- User asks for clarification or more information

---
