-- Tabela de Obras (Frentes de Serviço)
CREATE TABLE public.obras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prioridade INTEGER NOT NULL DEFAULT 99,
  ur TEXT NOT NULL,
  bairro TEXT NOT NULL,
  logradouro TEXT NOT NULL,
  finalidade TEXT NOT NULL DEFAULT 'extensao',
  dn INTEGER,
  extensao NUMERIC(10,2) NOT NULL DEFAULT 0,
  material TEXT NOT NULL,
  alvara_necessario BOOLEAN NOT NULL DEFAULT false,
  alvara_liberado BOOLEAN,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Materiais (Catálogo Técnico + Necessidade)
CREATE TABLE public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ur TEXT NOT NULL,
  dn INTEGER,
  tipo TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'm',
  quantidade_necessaria NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantidade_estoque NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela Consolidada de Gestão por UR
CREATE TABLE public.gestao_consolidada (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  umb NUMERIC(12,2) NOT NULL DEFAULT 0,
  uml NUMERIC(12,2) NOT NULL DEFAULT 0,
  umf NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS - acesso público (sem auth ainda, apenas design/MVP)
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestao_consolidada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read obras" ON public.obras FOR SELECT USING (true);
CREATE POLICY "Public insert obras" ON public.obras FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update obras" ON public.obras FOR UPDATE USING (true);
CREATE POLICY "Public delete obras" ON public.obras FOR DELETE USING (true);

CREATE POLICY "Public read materiais" ON public.materiais FOR SELECT USING (true);
CREATE POLICY "Public insert materiais" ON public.materiais FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update materiais" ON public.materiais FOR UPDATE USING (true);
CREATE POLICY "Public delete materiais" ON public.materiais FOR DELETE USING (true);

CREATE POLICY "Public read consolidada" ON public.gestao_consolidada FOR SELECT USING (true);
CREATE POLICY "Public insert consolidada" ON public.gestao_consolidada FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update consolidada" ON public.gestao_consolidada FOR UPDATE USING (true);
CREATE POLICY "Public delete consolidada" ON public.gestao_consolidada FOR DELETE USING (true);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_obras_updated BEFORE UPDATE ON public.obras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_materiais_updated BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_consolidada_updated BEFORE UPDATE ON public.gestao_consolidada
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance de filtros
CREATE INDEX idx_obras_ur ON public.obras(ur);
CREATE INDEX idx_obras_prioridade ON public.obras(prioridade);
CREATE INDEX idx_obras_material ON public.obras(material);
CREATE INDEX idx_materiais_ur ON public.materiais(ur);
CREATE INDEX idx_materiais_tipo ON public.materiais(tipo);