

# Plano: Mapa de Calor + Histórico/Auditoria + Diário de Obra

Três frentes integradas que transformam o sistema em uma ferramenta completa de inteligência operacional e registro técnico.

## 1. Mapa de Calor Geográfico (nova rota `/mapa`)

Visualização agregada por **bairro × UR**, sem dependência de mapa real (evita custo de API e geocodificação inicial).

**Layout em grid de calor:**
- Eixo Y: bairros (top 30 por volume)
- Eixo X: UMB / UML / UMF
- Cada célula colorida pela métrica selecionada
- Toggle de métrica: Obras ativas | Pendências de alvará | Extensão (m) executada
- Click na célula → drill-down listando as obras daquele bairro/UR

**Cards complementares:**
- Top 5 bairros mais saturados (mais obras simultâneas)
- Top 5 bairros negligenciados (sem obras há +90 dias com prioridade alta)
- Distribuição percentual por UR

Adicionado ao menu lateral abaixo de "Unidades Regionais".

## 2. Histórico e Auditoria

**2a. Tabela `obra_historico`** — registra automaticamente cada mudança relevante:
- `obra_id`, `campo_alterado`, `valor_anterior`, `valor_novo`, `tipo_evento`, `created_at`, `autor`
- Trigger Postgres `AFTER UPDATE ON obras` popula automaticamente para campos: status, data_inicio, data_termino, alvara_liberado, prioridade, observacoes

**2b. Timeline na ficha da obra:**
- Novo botão "Histórico" em cada linha da Base de Obras
- Drawer lateral com timeline vertical: ícone + descrição humanizada + timestamp relativo ("há 3 dias")
- Inclui também os lançamentos do diário (item 3)

**2c. Comparativo mensal no Dashboard:**
- Card "Este mês vs. mês anterior" com seta ↑↓ e variação % para: obras concluídas, extensão executada, alvarás liberados, valor medido

**2d. Exportação PDF executivo (1 página):**
- Botão "Relatório executivo" no Dashboard
- PDF A4 com: KPIs do mês, top 5 obras críticas, comparativo mensal, gráfico por UR
- Gerado client-side com jsPDF (sem servidor)

## 3. Diário de Obra (submenu de "Base de Obras")

**3a. Estrutura do menu:**
Reorganização do AppLayout — "Base de Obras" vira grupo expansível com subitens:
```
Base de Obras  ▼
  ├ Carteira de Obras   (atual /obras)
  └ Diário de Obra      (nova /obras/diario)
```

**3b. Tabela `diario_obra`:**
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | PK |
| obra_id | uuid | FK obras |
| data_lancamento | date | dia do registro |
| autor | text | nome do fiscal/responsável |
| clima | text | ensolarado/chuvoso/nublado |
| equipe_tamanho | int | nº de operários |
| atividade | text enum | escavação, assentamento, soldagem, reaterro, teste estanqueidade, sinalização, outros |
| material_tipo | text | DEFOFO/PEAD/FOFO/OUTRO |
| material_dn | int | diâmetro nominal |
| metragem_executada | numeric | metros do dia |
| profundidade_media | numeric | em metros |
| descricao | text | relato técnico livre |
| ocorrencias | text | imprevistos, paralisações |
| created_at | timestamptz | |

**3c. Tela `/obras/diario` — Diário Profissional:**

Layout em 3 colunas:

**Coluna esquerda (sidebar):**
- Lista de obras em execução (chips com código + bairro)
- Filtro: todas / por UR / por mês
- Indicador visual de obras sem lançamento há +3 dias (badge âmbar)

**Coluna central (timeline):**
- Header da obra selecionada: código, endereço, % executado (metragem somada / extensão total), barra de progresso
- Timeline cronológica reversa (mais recente primeiro)
- Cada card de dia mostra: data formatada, clima (ícone), equipe, atividade (badge colorido), material+DN, metragem do dia, descrição
- Agrupamento por semana com totalizadores

**Coluna direita (formulário "Novo lançamento"):**
- Form vertical compacto, colapsável
- Campos pré-preenchidos a partir da obra (material, DN)
- Botão "Salvar lançamento" → invalida queries → toast

**3d. Integrações:**
- Soma da `metragem_executada` por obra alimenta o cálculo de progresso real
- Lançamentos aparecem também na Timeline de Histórico (item 2b)
- Quando soma de metragem ≥ extensão total → sugere "Marcar obra como concluída"

## Detalhes técnicos

**Migrações SQL necessárias:**
1. `CREATE TABLE diario_obra (...)` + RLS pública (padrão do projeto) + índice em `(obra_id, data_lancamento DESC)`
2. `CREATE TABLE obra_historico (...)` + RLS pública + índice em `(obra_id, created_at DESC)`
3. `CREATE FUNCTION log_obra_changes()` + `TRIGGER trg_obra_historico AFTER UPDATE ON obras`

**Arquivos novos:**
- `src/routes/mapa.tsx` — Mapa de calor
- `src/routes/obras.diario.tsx` — Diário de Obra (submenu)
- `src/routes/obras.tsx` — vira layout com `<Outlet/>` ou mantém atual e novo arquivo `obras.carteira.tsx` (avaliar manter URL `/obras` como carteira por compatibilidade)
- `src/components/ObraTimeline.tsx` — Timeline reutilizável
- `src/components/HistoricoDrawer.tsx` — Drawer de histórico
- `src/data/diario.ts` — fetch/insert/delete do diário
- `src/data/historico.ts` — fetch do histórico
- `src/lib/pdfExecutivo.ts` — geração do PDF executivo (jsPDF)

**Arquivos editados:**
- `src/components/AppLayout.tsx` — adiciona submenu "Diário" sob Base de Obras + item Mapa
- `src/routes/index.tsx` — card comparativo mensal + botão "Relatório executivo"
- `src/routes/obras.tsx` — coluna "Histórico" com botão que abre drawer
- `src/integrations/supabase/types.ts` — regenerado automaticamente após migração

**Dependências novas:**
- `jspdf` + `jspdf-autotable` para o PDF executivo

**Sequência de implementação sugerida:**
1. Migrações (diario_obra + obra_historico + trigger)
2. Diário de Obra (rota + tela 3 colunas + CRUD)
3. Histórico (drawer + integração na carteira)
4. Mapa de Calor
5. Comparativo mensal + PDF executivo

## Pergunta antes de implementar

Para a primeira leva, faz sentido entregar nesta ordem (Diário → Histórico → Mapa → PDF), ou prefere que eu inverta e comece pelo Mapa de Calor? E confirma: o Diário deve ter campo de **fotos** (upload de imagens via Supabase Storage) já nesta v1, ou deixamos para uma segunda iteração?

