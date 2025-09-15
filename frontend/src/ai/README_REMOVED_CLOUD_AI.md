Cloud AI integration (OpenAI via Emergent key) has been removed per project requirements. The chat now operates fully offline using local heuristics, recipes and knowledge base.
Files affected:
- Removed usage: app/chat.tsx (no hybridGreeting/hybridReply/getAIStatus)
- Candidate for deletion: src/ai/hybridChat.ts (kept for now in case of rollback)
- Keep: src/ai/localChat.ts, src/ai/recipes.ts, src/ai/knowledge.ts, src/ai/insights.ts

If you need to re-enable cloud AI, restore hybridChat usage and re-add EXPO_PUBLIC_EMERGENT_LLM_KEY to app.json extra.
