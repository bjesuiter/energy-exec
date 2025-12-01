# energy-exec

An AI-powered Telegram bot that helps you structure your day based on your energy levels, health metrics, and personal goals.

## Purpose

Managing productivity isn't just about time—it's about energy. This bot acts as your personal energy-aware daily planner, helping you make the most of your natural rhythms and current state.

## Features

### 📊 Daily Check-ins
- **Morning briefing**: Share your body battery, sleep quality, mood (motivation, joy, dizziness, etc.), and top priorities
- **Evening reflection**: Log how the day went and prepare for tomorrow
- **Mid-day adjustments**: Update the bot when things change—meetings run long, energy crashes, or new priorities emerge

### 🗓️ Smart Day Planning
- **Work block structuring**: Get recommendations for focus sessions (1×90 min, 2×45 min, etc.) based on your current energy
- **Break scheduling**: Know when to rest before you burn out
- **Tea/caffeine guidance**: Suggestions for green or black tea intake timed to your energy curve
- **Vital sign awareness**: Plans adapt based on body battery and other health markers from your Garmin

### 🔄 Adaptive Replanning
Send a message anytime something changes, and the bot will adjust your plan on the fly—no need to start over.

### 📝 Daily History & Logging
- Each interaction is logged to build a history of your energy patterns
- Access previous days' plans and health data to inform today's strategy
- Stored as markdown summaries or in a database for easy review

## How It Works

1. **Morning**: Tell the bot your body battery, how you slept, how you're feeling, and what you need to accomplish
2. **Receive**: Get a personalized day plan with work blocks, breaks, and energy management tips
3. **Adapt**: Message the bot whenever circumstances change
4. **Evening**: Reflect on the day and log any final notes

## Tech Stack

- Bun + Elysia
- Telegram Bot API
- Minimal/headless frontend (API-first design)

## Status

🚧 **MVP in development**

---

*Built for humans who want to work with their energy, not against it.*
