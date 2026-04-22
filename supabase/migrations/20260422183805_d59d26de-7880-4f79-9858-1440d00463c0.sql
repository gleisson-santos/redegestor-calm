-- =====================================================
-- 1) DIARIO DE OBRA
-- =====================================================
CREATE TABLE public.diario_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  data_lancamento date NOT NULL DEFAULT CURRENT_DATE,
  autor text NOT NULL DEFAULT '',
  clima text NOT NULL DEFAULT 'ensolarado',
  equipe_tamanho integer NOT NULL DEFAULT 0,
  atividade text NOT NULL DEFAULT 'assentamento',
  material_tipo text NOT NULL DEFAULT 'OUTRO',
  material_dn integer,
  metragem_executada numeric NOT NULL DEFAULT 0,
  profundidade_media numeric NOT NULL DEFAULT 0,
  descricao text NOT NULL DEFAULT '',
  ocorrencias text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_diario_obra_obra_data
  ON public.diario_obra (obra_id, data_lancamento DESC);

ALTER TABLE public.diario_obra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read diario" ON public.diario_obra FOR SELECT USING (true);
CREATE POLICY "Public insert diario" ON public.diario_obra FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update diario" ON public.diario_obra FOR UPDATE USING (true);
CREATE POLICY "Public delete diario" ON public.diario_obra FOR DELETE USING (true);

CREATE TRIGGER trg_diario_obra_updated_at
  BEFORE UPDATE ON public.diario_obra
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2) HISTORICO DE OBRAS
-- =====================================================
CREATE TABLE public.obra_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  campo_alterado text NOT NULL,
  valor_anterior text,
  valor_novo text,
  tipo_evento text NOT NULL DEFAULT 'update',
  autor text NOT NULL DEFAULT 'sistema',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_obra_historico_obra_created
  ON public.obra_historico (obra_id, created_at DESC);

ALTER TABLE public.obra_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read historico" ON public.obra_historico FOR SELECT USING (true);
CREATE POLICY "Public insert historico" ON public.obra_historico FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update historico" ON public.obra_historico FOR UPDATE USING (true);
CREATE POLICY "Public delete historico" ON public.obra_historico FOR DELETE USING (true);

-- =====================================================
-- 3) TRIGGER DE LOG AUTOMATICO EM OBRAS
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_obra_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.obra_historico (obra_id, campo_alterado, valor_anterior, valor_novo, tipo_evento)
    VALUES (NEW.id, 'status', OLD.status::text, NEW.status::text, 'status_change');
  END IF;

  IF NEW.data_inicio IS DISTINCT FROM OLD.data_inicio THEN
    INSERT INTO public.obra_historico (obra_id, campo_alterado, valor_anterior, valor_novo, tipo_evento)
    VALUES (NEW.id, 'data_inicio', OLD.data_inicio::text, NEW.data_inicio::text, 'date_change');
  END IF;

  IF NEW.data_termino IS DISTINCT FROM OLD.data_termino THEN
    INSERT INTO public.obra_historico (obra_id, campo_alterado, valor_anterior, valor_novo, tipo_evento)
    VALUES (NEW.id, 'data_termino', OLD.data_termino::text, NEW.data_termino::text, 'date_change');
  END IF;

  IF NEW.alvara_liberado IS DISTINCT FROM OLD.alvara_liberado THEN
    INSERT INTO public.obra_historico (obra_id, campo_alterado, valor_anterior, valor_novo, tipo_evento)
    VALUES (NEW.id, 'alvara_liberado', OLD.alvara_liberado::text, NEW.alvara_liberado::text, 'alvara_change');
  END IF;

  IF NEW.prioridade IS DISTINCT FROM OLD.prioridade THEN
    INSERT INTO public.obra_historico (obra_id, campo_alterado, valor_anterior, valor_novo, tipo_evento)
    VALUES (NEW.id, 'prioridade', OLD.prioridade::text, NEW.prioridade::text, 'priority_change');
  END IF;

  IF NEW.observacoes IS DISTINCT FROM OLD.observacoes THEN
    INSERT INTO public.obra_historico (obra_id, campo_alterado, valor_anterior, valor_novo, tipo_evento)
    VALUES (NEW.id, 'observacoes', LEFT(COALESCE(OLD.observacoes, ''), 200), LEFT(COALESCE(NEW.observacoes, ''), 200), 'note_change');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_obra_historico
  AFTER UPDATE ON public.obras
  FOR EACH ROW
  EXECUTE FUNCTION public.log_obra_changes();