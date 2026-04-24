

## Adicionar colunas P1–P10 (planos de trabalho) à Gestão de Materiais

Reproduzir a estrutura da planilha original do Google Sheets, onde cada material tem a necessidade distribuída em até 10 planos de trabalho (P1 a P10, por ordem de prioridade), e o total é calculado a partir da soma desses valores.

### 1. Banco de dados — migration

Adicionar 10 colunas numéricas à tabela `materiais` no Supabase:

```sql
ALTER TABLE public.materiais
  ADD COLUMN p1  numeric DEFAULT 0,
  ADD COLUMN p2  numeric DEFAULT 0,
  ADD COLUMN p3  numeric DEFAULT 0,
  ADD COLUMN p4  numeric DEFAULT 0,
  ADD COLUMN p5  numeric DEFAULT 0,
  ADD COLUMN p6  numeric DEFAULT 0,
  ADD COLUMN p7  numeric DEFAULT 0,
  ADD COLUMN p8  numeric DEFAULT 0,
  ADD COLUMN p9  numeric DEFAULT 0,
  ADD COLUMN p10 numeric DEFAULT 0;
```

- Mantém `quantidade_necessaria` existente (agora vira o **total acumulado**, calculado).
- Backfill: para os materiais que já têm `quantidade_necessaria > 0` mas todas as P# zeradas, copiamos o valor para `p1` (assim a tela já mostra os dados atuais sem perda).

### 2. Trigger de soma automática

Trigger `BEFORE INSERT OR UPDATE` que recalcula `quantidade_necessaria` como `COALESCE(p1,0) + COALESCE(p2,0) + ... + COALESCE(p10,0)`. Garante que o total geral nunca fica fora de sincronia, independente de a edição vir pela UI ou direto no banco.

### 3. Camada de dados (`src/data/api.ts`)

- Tipos `MaterialRow` / `MaterialInsert` passam a refletir os novos campos automaticamente após regenerar os types do Supabase.
- Sem mudanças nas funções `fetchMateriais`, `upsertMaterial`, `deleteMaterial` (já fazem `select *` / spread).

### 4. Tela `src/routes/materiais.tsx`

**Tabela principal — após a coluna DN, adicionar 10 colunas compactas P1…P10:**
- Largura mínima por coluna (~48px), texto centralizado, `tabular`/`font-mono`.
- Células com valor `0` ou `null` exibidas como `—` em cinza claro para reduzir poluição visual.
- A coluna existente **Necessário** continua, agora rotulada como **"Total"**, mostrando a soma (vinda do banco) destacada em negrito.
- Adicionar `overflow-x-auto` (já existe) — em telas menores a tabela rola horizontalmente.
- Cabeçalho duplo (rowspan) agrupando as P1–P10 sob o título **"Materiais para execução"**, igual à planilha original.

**KPI de necessidade total** continua usando o campo agregado.

**Diálogo de criar/editar material:**
- Substituir o campo único "Quantidade necessária" por uma grade compacta de 10 inputs numéricos (2 colunas × 5 linhas), rotulados **P1, P2, … P10**.
- Abaixo dela, mostrar o **Total calculado** em tempo real (read-only): `Σ P1..P10`.
- Manter "Quantidade em estoque" como está.
- Ao salvar, enviar todos os `p1..p10` no upsert; o trigger no banco atualiza `quantidade_necessaria` automaticamente.

### 5. Exportação CSV

Adicionar as 10 colunas P1…P10 entre `DN` e `Necessário` no CSV exportado, mantendo compatibilidade visual com a planilha original.

### 6. Não muda

- Filtros por UR, busca, paginação, badges de status (`Adquirir` / `OK` / `sem demanda`) — toda a lógica de saldo continua funcionando porque `quantidade_necessaria` permanece como o total.
- Outros menus (Consolidado, Obras, etc.) — nenhum impacto.

### Resultado esperado

A tela "Gestão de Materiais" passa a mostrar, da esquerda para a direita:
**Código · Descrição · UR · Tipo · DN · P1 P2 P3 P4 P5 P6 P7 P8 P9 P10 · Total · Estoque · Saldo · Status · Ações**

Idêntica ao layout da planilha do Google Sheets que você compartilhou, com os planos de trabalho (P1 = prioridade 1, P2 = prioridade 2, etc.) lançados individualmente e o total somado automaticamente.

### Observação

Os valores **atuais** das suas P1–P10 (que estão hoje só na planilha) precisarão ser **importados ou digitados** depois. A migração só cria a estrutura — o backfill inicial copia o total de hoje para a coluna `p1`, e você redistribui depois pela própria interface (ou eu monto um importador CSV num próximo passo, se quiser).

