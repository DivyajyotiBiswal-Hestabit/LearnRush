# Multi-Agent Flow Diagram

User Query
   ↓
Planner → creates TASK GRAPH (DAG)
   ↓
Executor → runs tasks respecting dependencies
   ↓
Parallel Workers (when possible)
   ↓
Reflection → improves
   ↓
Validator → checks
   ↓
Retry loop (if invalid)
   ↓
Final Answer