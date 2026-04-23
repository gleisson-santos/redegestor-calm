
## Corrigir a inconsistência de usuários no deploy Cloudflare

### Diagnóstico mais provável
Pelas telas e pelo código atual, o problema parece ser um destes dois cenários:

1. **As credenciais do runtime do Cloudflare estão diferentes do projeto Supabase usado pelo app no navegador**
   - O frontend usa `src/integrations/supabase/client.ts`, que está com URL/key fixas do projeto.
   - Já as server functions de usuários usam `process.env` em `src/integrations/supabase/auth-middleware.ts` e `src/integrations/supabase/client.server.ts`.
   - Isso explica por que obras/materiais funcionam no deploy, mas `/usuarios` não.

2. **O fluxo de criação depende do trigger `handle_new_user`, mas o código não valida se `profiles` e `user_roles` foram realmente criados**
   - Em `src/server/users.ts`, `createUser` cria o usuário no Auth e depois só faz `update` no profile, sem conferir se o profile existe.
   - Se o trigger falhar ou houver usuários antigos sem `profiles`, o toast mostra “criado”, mas a lista continua vazia porque `listUsers` monta a tabela a partir de `profiles`.

### O que será feito
1. **Instrumentar e endurecer as server functions de usuários**
   - Adicionar logs claros em `src/server/users.ts` para registrar:
     - URL/projeto usado no runtime
     - quantidade de registros em `profiles`, `user_roles` e `auth.users`
     - erros exatos de `createUser`, `listUsers`, `update`, `upsert`
   - Verificar explicitamente o resultado de cada operação que hoje está sem checagem de erro.

2. **Corrigir o fluxo de criação para não depender silenciosamente do trigger**
   - Após `auth.admin.createUser`, conferir se existe linha em `profiles`.
   - Se não existir, criar `profiles` manualmente via service role.
   - Garantir também a existência da role padrão em `user_roles`.
   - Só retornar sucesso depois que Auth + Profile + Role estiverem consistentes.

3. **Tornar `listUsers` mais resiliente**
   - Se houver usuários em `auth.users` mas faltarem registros em `profiles`, retornar isso como erro diagnóstico em vez de simplesmente mostrar lista vazia.
   - Opcionalmente ordenar e padronizar o merge entre `profiles`, `user_roles` e emails do Auth.

4. **Melhorar a mensagem visual da página `/usuarios`**
   - Em `src/routes/usuarios.tsx`, trocar o estado silencioso de “Nenhum usuário ainda” por uma mensagem mais útil quando houver falha de sincronização ou erro de ambiente.
   - Exibir orientação específica se o runtime do Cloudflare estiver apontando para projeto/credenciais divergentes.

5. **Se os dados estiverem incompletos no banco, aplicar backfill**
   - Se a análise mostrar usuários existentes em `auth.users` sem correspondência em `profiles` ou `user_roles`, criar uma migration para preencher os registros faltantes com segurança.

### Arquivos que devem ser ajustados
- `src/server/users.ts`
- `src/routes/usuarios.tsx`
- Possivelmente `supabase/migrations/*` se for necessário backfill de `profiles`/`user_roles`

### Resultado esperado
- O deploy Cloudflare passará a listar os usuários existentes.
- Criar usuário só mostrará sucesso quando o usuário estiver realmente completo no sistema.
- Se houver credencial errada no Cloudflare, a aplicação vai acusar isso de forma clara em vez de parecer “vazio”.

### Detalhe técnico importante
Hoje o app tem uma separação crítica:
- **Cliente/navegador**: usa Supabase fixo no código
- **Server functions**: usam variáveis de ambiente do Cloudflare

Por isso, mesmo com o resto do sistema funcionando, a área de usuários pode quebrar isoladamente se o runtime estiver com credenciais incorretas ou se a sincronização `auth.users -> profiles/user_roles` estiver incompleta.
