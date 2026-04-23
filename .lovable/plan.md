

## Causa raiz confirmada

O Worker `redegestor-calm` no Cloudflare é deste mesmo projeto (definido em `wrangler.jsonc`). A diferença é que:

- O **cliente do navegador** usa `SUPABASE_URL` e a chave pública **hardcoded** em `src/integrations/supabase/client.ts`. Por isso todas as outras telas funcionam — elas leem direto do Supabase via RLS.
- As **server functions** (`listUsers`, `createUser`, etc.) dependem 100% de `process.env.SUPABASE_URL`, `process.env.SUPABASE_PUBLISHABLE_KEY` e `process.env.SUPABASE_SERVICE_ROLE_KEY`/`SERVICE_ROLE_KEY` no runtime do Worker.

Como o seu Worker no Cloudflare **não tem essas variáveis configuradas**, qualquer chamada para a área de Usuários falha silenciosamente ou volta vazia, mesmo o app renderizando o resto normalmente.

## O que você precisa fazer no Cloudflare (manual, fora do código)

No painel do Cloudflare, em Workers & Pages → `redegestor-calm` → Settings → Variables and Secrets, cadastrar como **Secret** (não Variable):

- `SUPABASE_URL` = `https://mrvplahmthguvrauzwpy.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` = mesma anon/publishable key do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` = service role key do projeto (Supabase Dashboard → Project Settings → API → `service_role`)
- opcional: `SERVICE_ROLE_KEY` com o mesmo valor (fallback que o código já aceita)

Depois, fazer um novo deploy do Worker para aplicar as variáveis.

Sem esse passo, **nenhuma alteração de código resolve**, porque o problema é ausência de credenciais no runtime do Cloudflare.

## O que será feito no código para te ajudar a confirmar isso

1. **Endurecer mensagens das server functions de usuários**
   - Em `src/server/users.ts`, detectar explicitamente se `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` ou a service role estão ausentes.
   - Em vez de quebrar com erro genérico, retornar um diagnóstico estruturado dizendo exatamente quais variáveis faltam no runtime atual.

2. **Mostrar essa falha na tela `/usuarios`**
   - Em `src/routes/usuarios.tsx`, quando a resposta vier marcando “credenciais ausentes no servidor”, exibir um alerta vermelho explícito:
     - “Este deploy (host X) não tem as variáveis Supabase configuradas no Cloudflare. Cadastre SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e SUPABASE_SERVICE_ROLE_KEY no Worker.”
   - Não cair mais para “Nenhum usuário ainda.” quando o problema é configuração.

3. **Expandir `/api/public/runtime`**
   - Já reporta `serviceKey: sim/não`. Adicionar também:
     - `hasSupabaseUrl`
     - `hasPublishableKey`
   - Assim, abrir `https://redegestor-calm.jsgleisson9350.workers.dev/api/public/runtime` mostra na hora se as três variáveis existem no Cloudflare. Esse é o teste objetivo para confirmar a causa.

4. **Refletir o estado no badge global**
   - O `DeployDiagnostic` no topbar mudará para vermelho quando o servidor reportar variáveis Supabase ausentes, em qualquer página, não só em `/usuarios`.

### Arquivos previstos
- `src/server/users.ts`
- `src/routes/usuarios.tsx`
- `src/routes/api.public.runtime.ts`
- `src/components/DeployDiagnostic.tsx`

### Resultado esperado
- No preview Lovable: continua tudo verde, usuários aparecem.
- No Cloudflare Worker: a tela de Usuários para de mentir “vazio” e passa a dizer claramente qual variável falta.
- Após você cadastrar os secrets no Cloudflare e refazer o deploy, a lista de usuários passa a aparecer também lá, igual ao preview.

### Detalhe técnico
O frontend funciona em qualquer host porque a URL/anon key estão fixas no bundle. As server functions de admin não podem usar esse atalho: precisam do `service_role`, que **nunca** pode ir no bundle do navegador. Por isso o Worker exige as três variáveis configuradas no painel do Cloudflare. O código já está correto — falta apenas o ambiente do deploy receber as credenciais.

