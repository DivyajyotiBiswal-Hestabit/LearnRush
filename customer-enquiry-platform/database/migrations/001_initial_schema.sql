-- USERS (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text default 'user',
  workspace_id uuid,
  created_at timestamp with time zone default now()
);

-- WORKSPACES (for team collaboration)
create table public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- INTEGRATIONS (per user credentials)
create table public.integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null, -- 'gmail','whatsapp','google_drive','google_sheets'
  credentials jsonb, -- encrypted tokens stored here
  status text default 'disconnected',
  connected_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- TEMPLATES
create table public.templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  industry text,
  agent_prompts jsonb, -- default prompts per agent
  tools jsonb,
  is_public boolean default true,
  created_at timestamp with time zone default now()
);

-- WORKFLOWS
create table public.workflows (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  workspace_id uuid references public.workspaces(id),
  template_id uuid references public.templates(id),
  name text not null,
  business_context text,
  trigger_channel text, -- 'gmail' or 'whatsapp'
  status text default 'inactive', -- 'active','inactive','error'
  n8n_workflow_id text, -- ID from n8n after registration
  n8n_webhook_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- AGENTS (per workflow)
create table public.agents (
  id uuid default gen_random_uuid() primary key,
  workflow_id uuid references public.workflows(id) on delete cascade,
  role text not null, -- 'classifier','researcher','qualifier','responder','executor'
  system_prompt text,
  tools jsonb, -- ['gmail_read','drive_search','sheets_update']
  handoff_rules jsonb,
  fallback_prompt text,
  retry_count integer default 3,
  order_index integer, -- 1=classifier, 2=researcher etc
  created_at timestamp with time zone default now()
);

-- EXECUTIONS
create table public.executions (
  id uuid default gen_random_uuid() primary key,
  workflow_id uuid references public.workflows(id) on delete cascade,
  user_id uuid references public.profiles(id),
  n8n_execution_id text,
  trigger_channel text,
  original_message text,
  original_sender text,
  final_reply text,
  status text default 'pending', -- 'pending','running','completed','failed','cancelled'
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  duration_ms integer
);

-- EXECUTION LOGS (per agent step)
create table public.execution_logs (
  id uuid default gen_random_uuid() primary key,
  execution_id uuid references public.executions(id) on delete cascade,
  agent_role text not null,
  input jsonb,
  output jsonb,
  status text, -- 'running','completed','failed'
  duration_ms integer,
  error_message text,
  created_at timestamp with time zone default now()
);

-- SCORECARDS
create table public.scorecards (
  id uuid default gen_random_uuid() primary key,
  execution_id uuid references public.executions(id) on delete cascade,
  overall_score integer, -- 1-10
  classifier_score integer,
  researcher_score integer,
  qualifier_score integer,
  responder_score integer,
  executor_score integer,
  response_relevance integer,
  response_completeness integer,
  bottleneck_agent text,
  bottleneck_reason text,
  suggestions jsonb,
  created_at timestamp with time zone default now()
);

-- WORKFLOW BRANCHES (conditional branching)
create table public.workflow_branches (
  id uuid default gen_random_uuid() primary key,
  workflow_id uuid references public.workflows(id) on delete cascade,
  condition text, -- 'high_value_lead','complaint','urgent'
  action text, -- 'notify_slack','escalate','create_calendar_event'
  config jsonb,
  created_at timestamp with time zone default now()
);


-- Function that runs on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger that calls the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Profiles RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Workflows RLS
alter table public.workflows enable row level security;

create policy "Users can manage own workflows"
  on public.workflows for all
  using (auth.uid() = user_id);

-- Agents RLS
alter table public.agents enable row level security;

create policy "Users can manage agents of own workflows"
  on public.agents for all
  using (
    exists (
      select 1 from public.workflows
      where workflows.id = agents.workflow_id
      and workflows.user_id = auth.uid()
    )
  );

-- Integrations RLS
alter table public.integrations enable row level security;

create policy "Users can manage own integrations"
  on public.integrations for all
  using (auth.uid() = user_id);

-- Executions RLS
alter table public.executions enable row level security;

create policy "Users can view own executions"
  on public.executions for all
  using (auth.uid() = user_id);

-- Execution logs RLS
alter table public.execution_logs enable row level security;

create policy "Users can view own execution logs"
  on public.execution_logs for all
  using (
    exists (
      select 1 from public.executions
      where executions.id = execution_logs.execution_id
      and executions.user_id = auth.uid()
    )
  );

-- Scorecards RLS
alter table public.scorecards enable row level security;

create policy "Users can view own scorecards"
  on public.scorecards for all
  using (
    exists (
      select 1 from public.executions
      where executions.id = scorecards.execution_id
      and executions.user_id = auth.uid()
    )
  );

-- Templates RLS (public read, admin write)
alter table public.templates enable row level security;

create policy "Anyone can read templates"
  on public.templates for select
  using (is_public = true);  