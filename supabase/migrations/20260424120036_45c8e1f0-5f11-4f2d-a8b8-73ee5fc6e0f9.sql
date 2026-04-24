-- 1. Adicionar colunas P1..P10
ALTER TABLE public.materiais
  ADD COLUMN IF NOT EXISTS p1  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS p2  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS p3  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS p4  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS p5  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS p6  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS p7  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS p8  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS p9  numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS p10 numeric NOT NULL DEFAULT 0;

-- 2. Backfill: copiar quantidade_necessaria existente para p1 (apenas onde p1..p10 estão zerados)
UPDATE public.materiais
SET p1 = quantidade_necessaria
WHERE quantidade_necessaria > 0
  AND COALESCE(p1,0) + COALESCE(p2,0) + COALESCE(p3,0) + COALESCE(p4,0) + COALESCE(p5,0)
    + COALESCE(p6,0) + COALESCE(p7,0) + COALESCE(p8,0) + COALESCE(p9,0) + COALESCE(p10,0) = 0;

-- 3. Função que recalcula quantidade_necessaria como soma de P1..P10
CREATE OR REPLACE FUNCTION public.materiais_recalc_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.quantidade_necessaria :=
      COALESCE(NEW.p1,0)  + COALESCE(NEW.p2,0)  + COALESCE(NEW.p3,0)
    + COALESCE(NEW.p4,0)  + COALESCE(NEW.p5,0)  + COALESCE(NEW.p6,0)
    + COALESCE(NEW.p7,0)  + COALESCE(NEW.p8,0)  + COALESCE(NEW.p9,0)
    + COALESCE(NEW.p10,0);
  RETURN NEW;
END;
$$;

-- 4. Trigger BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS trg_materiais_recalc_total ON public.materiais;
CREATE TRIGGER trg_materiais_recalc_total
BEFORE INSERT OR UPDATE ON public.materiais
FOR EACH ROW
EXECUTE FUNCTION public.materiais_recalc_total();