
ALTER TABLE public.obras
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_termino date,
  ADD COLUMN IF NOT EXISTS observacoes text;

CREATE INDEX IF NOT EXISTS idx_obras_data_inicio ON public.obras(data_inicio);
CREATE INDEX IF NOT EXISTS idx_obras_data_termino ON public.obras(data_termino);
