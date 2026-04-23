

## Atualizar guia `.md` com fluxo de publicação manual

Adicionar uma nova seção ao arquivo `/mnt/documents/deploy-cloudflare-lovable.md` documentando o fluxo de branch `production` para controle manual de deploys, que acabamos de validar com sucesso.

## O que será adicionado

Uma nova seção ao final do guia existente (mantendo todo o conteúdo atual intacto), contendo:

### 1. Introdução à estratégia
Explicação curta do "porquê": separar edição contínua (Lovable → `main`) de publicação controlada (merge → `production` → Cloudflare).

### 2. Diagrama do fluxo
Bloco ASCII mostrando os dois ambientes:

```text
Lovable edita  →  main         (não publica)
Você decide    →  merge para production  →  Cloudflare faz deploy
```

### 3. Setup inicial (passo a passo único)
- **Passo 1** — Criar branch `production` no GitHub a partir da `main`
- **Passo 2** — No Cloudflare (Workers e Pages → projeto → Configurações → Build → Controle da ramificação):
  - Trocar ramificação de produção: `main` → `production`
  - Desmarcar "Compilações para ramificações de não produção"

### 4. Fluxo do dia a dia (publicação manual)
- Edita normalmente no Lovable (vai pra `main`, não publica)
- Quando quiser publicar, abre o link de atalho:
  ```text
  https://github.com/<usuario>/<repo>/compare/production...main
  ```
- Clica em "Create pull request" → "Merge pull request" → "Confirm merge"
- Cloudflare detecta e faz o deploy em ~1-2 min

### 5. Prompt curto para reaproveitar em novos projetos
Um prompt pronto para o usuário colar em qualquer projeto Lovable novo, pedindo para configurar o mesmo fluxo:

> "Quero usar fluxo de publicação manual no Cloudflare. Me dê o passo a passo para criar uma branch `production` no GitHub e configurar o Cloudflare Workers para só fazer deploy quando eu fizer merge de `main` para `production`. Inclua o link de atalho do PR."

### 6. Tabela comparativa rápida
Mini tabela: auto-deploy vs branch `production` (quando vale a pena cada um).

### 7. Troubleshooting curto
- "Fiz merge e não publicou" → verificar se a branch de produção no Cloudflare é mesmo `production`
- "Não aparece o banner de PR no GitHub" → usar o link `/compare/production...main` direto
- "Quero voltar pro auto-deploy" → trocar de volta produção para `main` no Cloudflare

## Arquivo afetado
- `/mnt/documents/deploy-cloudflare-lovable.md` — nova versão `_v2` para preservar a versão anterior como baseline

## Entrega
Após escrever, emitir tag `<lov-artifact>` apontando para o novo arquivo `.md` para você baixar.

