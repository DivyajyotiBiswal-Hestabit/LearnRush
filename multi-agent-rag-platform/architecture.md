# Architecture — MultiAgent RAG Platform



## High-Level Architecture

```
Browser (Next.js 15)
        │
        ▼
   Next.js API Routes  ──────────────────────────────────────────┐
        │                                                         │
        ├── Supabase (PostgreSQL + pgvector)                      │
        │     ├── Auth (users, sessions)                          │
        │     ├── Storage (documents, avatars)                    │
        │     └── Tables (teams, agents, chunks, queries...)      │
        │                                                         │
        ├── Ollama (local)                                        │
        │     ├── nomic-embed-text  → embeddings                  │
        │     ├── llava             → image/chart understanding   │
        │     └── llama3/mistral/phi3 → fallback chat             │
        │                                                         │
        └── Groq API (remote)                                     │
              └── llama-3.1-8b-instant / mistral-saba-24b         │
                  → agent responses (10x faster than local)       │
```

---

## Request Flow — Chat Query

```
User types question
        │
        ▼
1. Prompt Sanitizer
   ├── Layer 1: Rule-based regex (instant)
   └── Layer 2: LLM classification (ambiguous queries)
        │
        ▼
2. RAG Retrieval Pipeline
   ├── Generate query embedding (nomic-embed-text)
   ├── Hybrid search: pgvector + BM25 → candidate chunks
   ├── Lexical reranker (term overlap, phrase matching, position)
   ├── LLM reranker (Groq scores each chunk)
   └── If empty → Query Rewriting → Keyword Search → Graceful empty
        │
        ▼
3. Multi-Agent Orchestrator
   ├── Load team agents + collaboration mode
   ├── Inject: context chunks + memory + system prompt
   ├── Run agents (Sequential / Parallel / Debate / Hierarchical)
   └── Synthesize final answer
        │
        ▼
4. SSE Stream to Browser
   ├── trace events  → live agent thinking panel
   ├── answer event  → final response with citations
   └── score event   → quality scorecard
        │
        ▼
5. Post-processing
   ├── Save query + traces + citations to Supabase
   ├── Extract + save memories (if memory enabled)
   └── Optional: RAG evaluation metrics on demand
```

---

## Document Processing Pipeline

```
File Upload (PDF / Image / TXT / CSV)
        │
        ▼
Parser (unpdf for PDF, buffer for TXT)
        │
        ▼
Multi-Modal Processor
   ├── PDF  → text extraction + table detection
   ├── Image → LLaVA classification + description + OCR
   └── Scanned → Tesseract OCR + LLaVA vision
        │
        ▼
Smart Chunker (hybrid strategy)
   ├── < 3000 words → paragraph + heading preservation
   └── ≥ 3000 words → semantic chunking (embedding-based topic boundaries)
        │
        ▼
Embed each chunk (nomic-embed-text → 768-dim vector)
        │
        ▼
Store in Supabase document_chunks
   ├── content (text)
   ├── embedding (vector 768)
   ├── tsv_content (GIN index for BM25)
   └── metadata (filename, page, chunk_type)
```

---

## Agent Architecture

```
Team
 ├── Collaboration Mode: sequential | parallel | debate | hierarchical
 └── Agents[]
      ├── Agent 1: Researcher
      │    ├── model_id: llama3:latest → routed to Groq llama-3.1-8b-instant
      │    ├── system_prompt: "You are a thorough researcher..."
      │    ├── routing_rules: [if query contains "legal" → use mistral]
      │    └── memory_enabled: true
      │
      ├── Agent 2: Critic
      │    ├── model_id: mistral:latest → Groq mistral-saba-24b
      │    └── system_prompt: "You are a critical analyst..."
      │
      └── Agent 3: Synthesizer
           ├── model_id: phi3:latest → Groq llama-3.1-8b-instant
           └── system_prompt: "You are a skilled synthesizer..."
```

### Collaboration Modes

| Mode | How It Works | Best For |
|------|-------------|----------|
| Sequential | A → B → C, each sees previous output | Default, good quality |
| Parallel ⚡ | A, B, C run simultaneously | Fastest |
| Debate | Round 1: independent, Round 2: respond to each other | Controversial topics |
| Hierarchical | Lead agent delegates subtasks | Complex multi-part queries |

---

## RAG Pipeline Detail

```
Query
  │
  ├── Vector Search (pgvector cosine similarity, weight 0.7)
  ├── BM25 Keyword Search (Postgres full-text, weight 0.3)
  │         ↓
  │    hybrid_score = vector * 0.7 + bm25 * 0.3
  │         ↓
  ├── Lexical Reranker
  │    signals: term overlap, bigram matches, length, position, heading bonus
  │         ↓
  ├── LLM Reranker (Groq, optional)
  │    scores each (query, chunk) pair 0-10
  │         ↓
  └── Top K chunks → agent context

If empty at any stage:
  Level 1: Hybrid search (original query)
  Level 2: Query rewriting → retry hybrid (3 rewrites via LLM)
  Level 3: Full-text keyword search
  Level 4: ILIKE loose matching across all KBs
  Level 5: Graceful empty → agents acknowledge no context
```

---

## Database Schema (Key Tables)

```
profiles          → user info, usage limits, role
teams             → agent team config, collaboration mode
agents            → per-agent model, prompt, routing rules
knowledge_bases   → document collections
documents         → uploaded files with processing metadata
document_chunks   → text chunks with vector embeddings
chat_sessions     → research sessions
queries           → questions + answers + scores + evaluation metrics
agent_traces      → per-agent outputs for each query
citations         → which chunks were used in each answer
agent_memory      → cross-session shared memory per team
routing_logs      → model routing decisions
analytics_events  → usage tracking
```

---

## Security

- **Auth**: Supabase RLS — users can only access their own data
- **Prompt sanitization**: 2-layer (regex rules + LLM classification)
- **PII redaction**: emails, phones, SSNs, credit cards stripped before LLM
- **Storage**: files stored under `userId/` prefix, private bucket policies
- **API keys**: server-side only, never exposed to client

---

