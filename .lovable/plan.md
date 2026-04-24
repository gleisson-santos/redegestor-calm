

## Importar valores P1–P10 do Google Sheets para o sistema

Ler diretamente da planilha **"Consolidação de Frentes de Serviço — Gestão de Obras"**, aba **"Gestão de Materiais"**, e atualizar os campos P1–P10 dos materiais já cadastrados no banco, casando pelo `codigo` + `ur`.

### 1. Conectar o Google Sheets ao projeto

Verificar se já existe uma conexão Google Sheets linkada (o conector aparece em `<useful-context>`, então provavelmente sim). Se não, abrir o seletor para o usuário escolher/criar a conexão.

### 2. Ler a planilha via gateway

- Spreadsheet ID: `12bVQlU4NUQR9JncZG4vIn-_SuTncrS3yLsN9hHFgAks`
- Aba: `Gestão de Materiais`
- Range: `'Gestão de Materiais'!A2:P` (pula o cabeçalho da linha 1; a linha 2 é o sub-cabeçalho UR/DN/Tipo/1..10/Total Geral, que será descartada)

Mapeamento das colunas:
| Coluna | Campo |
|---|---|
| A | `codigo` |
| B | `descricao` (referência, não sobrescreve) |
| C | `ur` |
| D | `dn` (referência) |
| E | `tipo` (referência) |
| F | `p1` |
| G | `p2` |
| H | `p3` |
| I | `p4` |
| J | `p5` |
| K | `p6` |
| L | `p7` |
| M | `p8` |
| N | `p9` |
| O | `p10` |
| P | Total Geral (ignorado — o trigger recalcula) |

Linhas vazias / linhas-cabeçalho repetidas (sem código numérico em A) são puladas.

### 3. Importar via script de uma única execução (`code--exec`)

Como é uma operação pontual de carga inicial, faço via script no sandbox que:
1. Chama o gateway do Google Sheets para baixar os dados.
2. Para cada linha válida, monta um `UPSERT` por `(codigo, ur)`:
   - Se o material existir → atualiza apenas `p1..p10` (preserva `quantidade_estoque`, `descricao`, etc).
   - Se não existir → insere novo registro com os dados da planilha (`codigo`, `descricao`, `ur`, `dn`, `tipo`, `p1..p10`, `quantidade_estoque = 0`).
3. O trigger `materiais_recalc_total` (já criado) recalcula `quantidade_necessaria` automaticamente.

Para suportar o upsert por `(codigo, ur)`, preciso adicionar uma **constraint UNIQUE (codigo, ur)** na tabela `materiais` (migration leve, antes da carga). Isso também previne duplicatas futuras e é coerente com a planilha (o mesmo código aparece uma vez por UR).

### 4. Relatório de importação

Ao final, mostro no chat:
- Quantas linhas foram lidas da planilha
- Quantos materiais foram **atualizados** (já existiam)
- Quantos foram **inseridos** (novos)
- Quantas linhas foram **puladas** (sem código, sem UR ou inválidas)
- Lista dos códigos que tinham diferenças relevantes (opcional, primeiros 20)

### 5. O que NÃO muda

- UI da tela de Materiais (já está pronta para mostrar P1–P10)
- Estoque atual de cada material (preservado)
- Código de aplicação — só roda script + 1 migration de constraint

### Pré-requisito de permissão

Para o script rodar via `code--exec` com `psql`, preciso que você aprove **"Add data"** (insert/update) nas configurações do Lovable Cloud quando a permissão for solicitada — é o que permite escrever os P1–P10 de volta no banco. Alternativa: gero uma migration SQL grande com todos os UPDATEs (funciona, mas fica um arquivo enorme no histórico).

### Resultado esperado

Ao abrir a tela **Gestão de Materiais**, todas as linhas da UML, UMB e UMF aparecem com os valores P1–P10 idênticos à planilha do Google Sheets, e a coluna **Total** mostra a soma correta automaticamente. A partir daí, novos lançamentos podem ser feitos manualmente pela interface.

