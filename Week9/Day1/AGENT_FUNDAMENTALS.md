# Agent Fundamentals

## What is an AI Agent?
An AI agent is a system that perceives input, reasons using an LLM, and takes action.

## Agent vs Chatbot vs Pipeline
- Chatbot: Single response system
- Pipeline: Fixed sequence of steps
- Agent: Dynamic reasoning + decision-making

## ReAct Pattern
Reason → Act loop where agent decides what to do and executes

## Role Isolation
Each agent has a strict responsibility:
- Research → gather info
- Summarizer → compress info
- Answer → final output

## Message Passing
Agents communicate via structured messages (input/output)

## Memory Handling
Each agent maintains a memory window of last 10 interactions