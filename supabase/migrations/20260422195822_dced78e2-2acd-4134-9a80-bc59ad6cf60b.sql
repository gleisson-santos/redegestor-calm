-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  ur TEXT NOT NULL DEFAULT 'UMB',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. ROLES (separate table to avoid privilege escalation)
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. SECURITY DEFINER HELPERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.current_user_ur()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur FROM public.profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- 4. AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, ur)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'ur', 'UMB')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. PROFILES & USER_ROLES POLICIES
-- ============================================================
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. DROP OLD PUBLIC POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public read obras"        ON public.obras;
DROP POLICY IF EXISTS "Public insert obras"      ON public.obras;
DROP POLICY IF EXISTS "Public update obras"      ON public.obras;
DROP POLICY IF EXISTS "Public delete obras"      ON public.obras;

DROP POLICY IF EXISTS "Public read diario"       ON public.diario_obra;
DROP POLICY IF EXISTS "Public insert diario"     ON public.diario_obra;
DROP POLICY IF EXISTS "Public update diario"     ON public.diario_obra;
DROP POLICY IF EXISTS "Public delete diario"     ON public.diario_obra;

DROP POLICY IF EXISTS "Public read execucao"     ON public.execucao_servicos;
DROP POLICY IF EXISTS "Public insert execucao"   ON public.execucao_servicos;
DROP POLICY IF EXISTS "Public update execucao"   ON public.execucao_servicos;
DROP POLICY IF EXISTS "Public delete execucao"   ON public.execucao_servicos;

DROP POLICY IF EXISTS "Public read historico"    ON public.obra_historico;
DROP POLICY IF EXISTS "Public insert historico"  ON public.obra_historico;
DROP POLICY IF EXISTS "Public update historico"  ON public.obra_historico;
DROP POLICY IF EXISTS "Public delete historico"  ON public.obra_historico;

DROP POLICY IF EXISTS "Public read materiais"    ON public.materiais;
DROP POLICY IF EXISTS "Public insert materiais"  ON public.materiais;
DROP POLICY IF EXISTS "Public update materiais"  ON public.materiais;
DROP POLICY IF EXISTS "Public delete materiais"  ON public.materiais;

DROP POLICY IF EXISTS "Public read caderno"      ON public.caderno_encargos;
DROP POLICY IF EXISTS "Public insert caderno"    ON public.caderno_encargos;
DROP POLICY IF EXISTS "Public update caderno"    ON public.caderno_encargos;
DROP POLICY IF EXISTS "Public delete caderno"    ON public.caderno_encargos;

DROP POLICY IF EXISTS "Public read consolidada"  ON public.gestao_consolidada;
DROP POLICY IF EXISTS "Public insert consolidada" ON public.gestao_consolidada;
DROP POLICY IF EXISTS "Public update consolidada" ON public.gestao_consolidada;
DROP POLICY IF EXISTS "Public delete consolidada" ON public.gestao_consolidada;

DROP POLICY IF EXISTS "Public read medicoes"     ON public.medicoes_mensais;
DROP POLICY IF EXISTS "Public insert medicoes"   ON public.medicoes_mensais;
DROP POLICY IF EXISTS "Public update medicoes"   ON public.medicoes_mensais;
DROP POLICY IF EXISTS "Public delete medicoes"   ON public.medicoes_mensais;

-- ============================================================
-- 7. NEW POLICIES — global read for authenticated, write by UR/admin
-- ============================================================

-- OBRAS: leitura global; escrita só na própria UR ou admin
CREATE POLICY "Auth read obras" ON public.obras
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "UR write obras insert" ON public.obras
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR ur = public.current_user_ur());
CREATE POLICY "UR write obras update" ON public.obras
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR ur = public.current_user_ur())
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR ur = public.current_user_ur());
CREATE POLICY "UR write obras delete" ON public.obras
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR ur = public.current_user_ur());

-- DIARIO_OBRA: leitura global; escrita conforme UR da obra
CREATE POLICY "Auth read diario" ON public.diario_obra
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "UR write diario insert" ON public.diario_obra
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.ur = public.current_user_ur())
  );
CREATE POLICY "UR write diario update" ON public.diario_obra
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.ur = public.current_user_ur())
  );
CREATE POLICY "UR write diario delete" ON public.diario_obra
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.ur = public.current_user_ur())
  );

-- EXECUCAO_SERVICOS: leitura global; escrita conforme UR da obra
CREATE POLICY "Auth read execucao" ON public.execucao_servicos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "UR write execucao insert" ON public.execucao_servicos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.ur = public.current_user_ur())
  );
CREATE POLICY "UR write execucao update" ON public.execucao_servicos
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.ur = public.current_user_ur())
  );
CREATE POLICY "UR write execucao delete" ON public.execucao_servicos
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.ur = public.current_user_ur())
  );

-- OBRA_HISTORICO: leitura global; escrita só admin (trigger preenche)
CREATE POLICY "Auth read historico" ON public.obra_historico
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write historico" ON public.obra_historico
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- MATERIAIS: leitura global; escrita admin (catálogo central)
CREATE POLICY "Auth read materiais" ON public.materiais
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write materiais" ON public.materiais
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CADERNO_ENCARGOS: leitura global; escrita admin
CREATE POLICY "Auth read caderno" ON public.caderno_encargos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write caderno" ON public.caderno_encargos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- GESTAO_CONSOLIDADA: leitura global; escrita admin
CREATE POLICY "Auth read consolidada" ON public.gestao_consolidada
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write consolidada" ON public.gestao_consolidada
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- MEDICOES_MENSAIS: leitura global; escrita admin
CREATE POLICY "Auth read medicoes" ON public.medicoes_mensais
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write medicoes" ON public.medicoes_mensais
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
