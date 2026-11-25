-- ====================================================================
-- TOKEN-OS: Master Database Schema, Vault Persistence & RBAC Policies
-- Database: Supabase PostgreSQL (Fully Idempotent & Re-runnable)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Shared Trigger Function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. User Profiles, Workspace Preferences & Access Control (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'SYSTEM_ARCHITECT' CHECK (
    user_type IN (
      'SYSTEM_ARCHITECT',
      'DEVOPS_PLATFORM',
      'AI_RESEARCHER',
      'STUDENT_ENGINEER',
      'SOFTWARE_ENGINEER',
      'PRODUCT_LEAD',
      'OTHER'
    )
  ),
  full_name TEXT,
  organization TEXT,
  avatar_url TEXT,
  -- Role-Based Access Control (RBAC)
  access_role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (access_role IN ('ADMIN', 'ARCHITECT', 'MEMBER', 'VIEWER')),
  can_execute_cloud BOOLEAN NOT NULL DEFAULT true,
  can_manage_vault BOOLEAN NOT NULL DEFAULT true,
  -- Persistent Workspace Preferences
  tour_completed BOOLEAN NOT NULL DEFAULT false,
  custom_template TEXT,
  default_execution_depth TEXT NOT NULL DEFAULT 'medium' CHECK (default_execution_depth IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe idempotent column migrations for existing deployments
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_role TEXT NOT NULL DEFAULT 'MEMBER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_execute_cloud BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_vault BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_template TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_execution_depth TEXT NOT NULL DEFAULT 'medium';

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 4. Zero-Knowledge User Vault Secrets (Salted PIN Hash + AES-GCM Encrypted API Keys)
-- Plaintext PINs and plaintext API keys are NEVER stored in PostgreSQL.
CREATE TABLE IF NOT EXISTS public.user_vault_secrets (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY DEFAULT auth.uid(),
  master_pin_hash TEXT,
  encrypted_vault_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  vault_version INT NOT NULL DEFAULT 1,
  pin_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_vault_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own vault secrets" ON public.user_vault_secrets;
CREATE POLICY "Users can manage their own vault secrets"
  ON public.user_vault_secrets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_user_vault_secrets_updated_at ON public.user_vault_secrets;
CREATE TRIGGER trg_user_vault_secrets_updated_at
  BEFORE UPDATE ON public.user_vault_secrets
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 5. Intent Contracts Table
CREATE TABLE IF NOT EXISTS public.intent_contracts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  version INT DEFAULT 1,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'coding',
  objective TEXT NOT NULL,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  hard_constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_threshold NUMERIC DEFAULT 0.90,
  privacy_level TEXT DEFAULT 'local_only',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.intent_contracts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.intent_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own intent contracts" ON public.intent_contracts;
CREATE POLICY "Users can manage their own intent contracts"
  ON public.intent_contracts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_intent_contracts_updated_at ON public.intent_contracts;
CREATE TRIGGER trg_intent_contracts_updated_at
  BEFORE UPDATE ON public.intent_contracts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 6. Execution Runs Table
CREATE TABLE IF NOT EXISTS public.execution_runs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  intent_contract_id TEXT REFERENCES public.intent_contracts(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL DEFAULT 'coding',
  provider_model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('READY', 'NEEDS_IMPROVEMENT', 'ABSTAIN', 'FAILED', 'RUNNING')),
  total_tokens INT DEFAULT 0,
  total_cost_usd NUMERIC DEFAULT 0.0,
  total_latency_ms INT DEFAULT 0,
  provenance TEXT DEFAULT 'measured_locally',
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  requirement_evaluations JSONB NOT NULL DEFAULT '[]'::jsonb,
  output_content TEXT,
  repair_attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.execution_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own execution runs" ON public.execution_runs;
CREATE POLICY "Users can manage their own execution runs"
  ON public.execution_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Security, Access Control & Vault Audit Logs Table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'RATE_LIMIT_TRIGGERED',
      'IPAR_PATCH_APPLIED',
      'EXECUTION_LAUNCHED',
      'VAULT_PIN_SET',
      'VAULT_PIN_CHANGED',
      'VAULT_PIN_REMOVED',
      'VAULT_KEY_SAVED',
      'VAULT_KEY_DELETED',
      'VAULT_UNLOCK_FAILED',
      'ACCESS_DENIED',
      'PREFERENCES_UPDATED'
    )
  ),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own security audit logs" ON public.security_audit_logs;
CREATE POLICY "Users can view their own security audit logs"
  ON public.security_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert security audit logs" ON public.security_audit_logs;
CREATE POLICY "Users can insert security audit logs"
  ON public.security_audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 8. RBAC Access Check Helper Function
CREATE OR REPLACE FUNCTION public.has_access_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_role TEXT;
BEGIN
  SELECT access_role INTO current_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF current_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF current_role = 'ADMIN' THEN
    RETURN TRUE;
  END IF;

  RETURN current_role = required_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 9. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_intent_contracts_user_id ON public.intent_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_runs_user_id_created ON public.execution_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id_created ON public.security_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_vault_secrets_updated ON public.user_vault_secrets(updated_at DESC);

-- 10. Trigger to automatically create a Profile entry upon auth.users Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type, full_name, organization, access_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'SYSTEM_ARCHITECT'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'organization', ''),
    'MEMBER'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    organization = EXCLUDED.organization,
    user_type = EXCLUDED.user_type,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
