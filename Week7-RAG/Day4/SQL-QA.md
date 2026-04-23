# SQL-QA SYSTEM — DAY 4

## 1. Objective

The goal of Day 4 is to build a SQL Question Answering system that converts natural language into SQL, validates it, executes it safely, and summarizes the results.

---

## 2. Learning Outcomes

This implementation demonstrates:

- natural language to SQL conversion
- schema-aware reasoning
- SQL validation
- SQL correction on error
- injection-safe execution
- result summarization

---

## 3. System Architecture

```text
User Question
    ↓
Schema Loader
    ↓
Prompt Builder
    ↓
SQL Generator (LLM)
    ↓
SQL Validator
    ↓
Safe Executor
    ↓
Result Summarizer
    ↓
Final Answer
```

---

## 4. Core Components

### 4.1 Schema Loader
Loads database tables and columns automatically from SQLite.

### 4.2 SQL Generator
Uses a local LLM to convert natural language questions into SQL.

### 4.3 Validator
Blocks unsafe SQL such as:
- INSERT
- UPDATE
- DELETE
- DROP
- ALTER
- PRAGMA

Only SELECT and WITH queries are allowed.

### 4.4 Safe Executor
Executes validated SQL against SQLite.

### 4.5 Result Summarizer
Converts raw rows into a readable natural language summary.

---

## 5. Features Implemented

- automatic schema loader
- schema-aware prompt generation
- SQL validation
- query correction on error
- safe execution
- result summarization

---

## 6. Sample Database

A sample SQLite database is created locally with two tables:

### artists
- artist_id
- artist_name
- genre
- country

### sales
- sale_id
- artist_id
- sale_year
- album_name
- units_sold
- revenue




