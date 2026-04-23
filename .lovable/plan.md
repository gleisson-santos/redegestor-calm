
## Diagnóstico

O erro continua porque a falha acontece antes do build command rodar. Pelas capturas, o Cloudflare ainda entra na etapa:

```text
Installing project dependencies: bun install --frozen-lockfile
```

Isso acontece porque o repositório ainda contém artefatos do Bun:
- `bun.lockb`
- `bunfig.toml`

Mesmo com `Comando da build: npm run build`, o Cloudflare detecta `bun.lockb` e escolhe Bun na fase de instalação. Como esse lockfile está incompatível com a versão do Bun do runner, a instalação aborta.

Também confirmei no código:
- `package.json` usa scripts normais de npm
- `package-lock.json` existe e já pode ser a fonte oficial
- `wrangler.jsonc` ainda está com `"name": "tanstack-start-app"` enquanto o serviço no Cloudflare é `redegestor-calm`

## O que vou ajustar no repositório

### 1) Padronizar o projeto para npm
Arquivos:
- remover `bun.lockb`
- remover `bunfig.toml`
- manter `package-lock.json` como lockfile oficial
- atualizar `package.json` para deixar explícito o gerenciador:
  ```json
  "packageManager": "npm@10.9.2"
  ```

Objetivo:
- impedir que o Cloudflare tente instalar dependências com Bun

### 2) Sincronizar a configuração do worker
Arquivo:
- `wrangler.jsonc`

Trocar:
```json
"name": "tanstack-start-app"
```

Para:
```json
"name": "redegestor-calm"
```

Objetivo:
- eliminar o aviso de configuração inconsistente e alinhar o deploy com o serviço real no Cloudflare

### 3) Revisão rápida de sinais de Bun
Vou revisar referências restantes a Bun para não sobrar nenhum gatilho de autodetecção no projeto.

## O que você fará no Cloudflare depois

Depois que eu aplicar as mudanças no repo:

1. Confirmar que o build command continua:
   ```text
   npm run build
   ```
2. Manter o deploy command:
   ```text
   npx wrangler deploy
   ```
3. Limpar o cache da build
4. Rodar novo deploy

## Variáveis que precisam continuar cadastradas

No Cloudflare devem existir:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SERVICE_ROLE_KEY`

Pelas capturas, isso parece estar quase certo; o bloqueio atual ainda é o Bun, não Supabase.

## Resultado esperado

O fluxo deve passar a ser:

```text
Install: npm install / npm ci usando package-lock.json
Build: npm run build
Deploy: npx wrangler deploy
```

Em vez de:

```text
bun install --frozen-lockfile
```

## Arquivos que serão alterados
- `package.json`
- `wrangler.jsonc`

## Arquivos que serão removidos
- `bun.lockb`
- `bunfig.toml`
