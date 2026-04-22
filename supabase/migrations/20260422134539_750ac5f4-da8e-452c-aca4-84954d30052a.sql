-- Tabela: caderno_encargos
CREATE TABLE public.caderno_encargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'm',
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.caderno_encargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read caderno" ON public.caderno_encargos FOR SELECT USING (true);
CREATE POLICY "Public insert caderno" ON public.caderno_encargos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update caderno" ON public.caderno_encargos FOR UPDATE USING (true);
CREATE POLICY "Public delete caderno" ON public.caderno_encargos FOR DELETE USING (true);

CREATE TRIGGER update_caderno_encargos_updated_at
BEFORE UPDATE ON public.caderno_encargos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: execucao_servicos
CREATE TABLE public.execucao_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  item_encargo_id UUID NOT NULL REFERENCES public.caderno_encargos(id) ON DELETE RESTRICT,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  data_execucao DATE NOT NULL DEFAULT CURRENT_DATE,
  mes_referencia TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.execucao_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read execucao" ON public.execucao_servicos FOR SELECT USING (true);
CREATE POLICY "Public insert execucao" ON public.execucao_servicos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update execucao" ON public.execucao_servicos FOR UPDATE USING (true);
CREATE POLICY "Public delete execucao" ON public.execucao_servicos FOR DELETE USING (true);

CREATE INDEX idx_execucao_obra ON public.execucao_servicos(obra_id);
CREATE INDEX idx_execucao_item ON public.execucao_servicos(item_encargo_id);
CREATE INDEX idx_execucao_mes ON public.execucao_servicos(mes_referencia);

CREATE TRIGGER update_execucao_servicos_updated_at
BEFORE UPDATE ON public.execucao_servicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: medicoes_mensais
CREATE TABLE public.medicoes_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ur TEXT NOT NULL,
  mes_referencia TEXT NOT NULL,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ur, mes_referencia)
);

ALTER TABLE public.medicoes_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read medicoes" ON public.medicoes_mensais FOR SELECT USING (true);
CREATE POLICY "Public insert medicoes" ON public.medicoes_mensais FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update medicoes" ON public.medicoes_mensais FOR UPDATE USING (true);
CREATE POLICY "Public delete medicoes" ON public.medicoes_mensais FOR DELETE USING (true);

CREATE TRIGGER update_medicoes_mensais_updated_at
BEFORE UPDATE ON public.medicoes_mensais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Carga inicial de itens
INSERT INTO public.caderno_encargos (codigo, descricao, unidade, preco_unitario) VALUES
  ('INF-001', 'Escavação mecânica de vala (solo firme)', 'm³', 45.00),
  ('INF-002', 'Escavação manual de vala', 'm³', 85.00),
  ('TUB-001', 'Assentamento de tubulação DEFOFO DN 150', 'm', 32.00),
  ('TUB-002', 'Assentamento de tubulação DEFOFO DN 200', 'm', 42.00),
  ('TUB-003', 'Assentamento de tubulação PEAD DN 63 (eletrofusão)', 'm', 28.00),
  ('TUB-004', 'Assentamento de tubulação PEAD DN 110', 'm', 35.00),
  ('CON-001', 'Reaterro compactado de vala', 'm³', 25.00),
  ('PAV-001', 'Reposição de pavimentação asfáltica (CBUQ)', 'm²', 120.00),
  ('PAV-002', 'Reposição de calçada em concreto', 'm²', 65.00);