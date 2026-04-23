
## Corrigir o “vazio silencioso” na tela de Usuários

### O que o comportamento atual indica
O fato de a tela mostrar apenas **“Nenhum usuário ainda.”** sem banner de erro é um sinal importante:

- a query `listUsers()` está **respondendo com sucesso**
- mas ela está retornando **lista vazia**
- isso é mais compatível com **runtime do deploy apontando para um ambiente/projeto válido porém vazio**, do que com “chave ausente” ou “token inválido”

Se fosse falta de `SERVICE_ROLE_KEY`, token inválido, ou erro de autenticação, a UI atual tenderia a mostrar **erro**, não tabela vazia.

### O que será ajustado

1. **Adicionar diagnóstico explícito no retorno de `listUsers`**
   - Incluir no retorno metadados seguros para debug:
     - `projectRef` do runtime
     - contagem de `auth.users`
     - contagem de `profiles`
     - contagem de `user_roles`
     - quantidade final exibida
   - Detectar o caso “sucesso com zero usuários” como **estado suspeito**, não como vazio normal.

2. **Melhorar a lógica de detecção no servidor**
   - Em `src/server/users.ts`, tratar como diagnóstico especial quando:
     - `auth.users = 0`
     - `profiles = 0`
     - `user_roles = 0`
     - ou quando as contagens forem incoerentes
   - Retornar uma mensagem clara do tipo:
     - “O deploy está conectado a um projeto Supabase sem usuários”
     - ou “As credenciais do runtime não parecem ser do mesmo projeto do app”

3. **Mostrar esse diagnóstico na página `/usuarios`**
   - Em `src/routes/usuarios.tsx`, trocar o estado silencioso de “Nenhum usuário ainda” por um bloco mais útil quando o vazio for suspeito.
   - Exibir algo como:
     - projeto detectado no servidor
     - quantidade encontrada em `auth.users`, `profiles` e `user_roles`
     - instrução objetiva para revisar as variáveis do Cloudflare

4. **Reduzir chance de divergência entre cliente e servidor**
   - Centralizar a configuração pública do Supabase para que servidor e navegador usem a mesma referência pública do projeto sempre que possível.
   - Manter apenas a chave de serviço dependente do ambiente.
   - Isso evita cenário em que o navegador aponta para um projeto e o backend do deploy para outro.

5. **Adicionar logs mais objetivos para o deploy**
   - Refinar os logs em `src/server/users.ts` para registrar:
     - ref do projeto em uso
     - contagens retornadas
     - qual caminho de diagnóstico foi acionado
   - Assim, no próximo teste, o problema aparece claramente no log do worker.

### Arquivos previstos
- `src/server/users.ts`
- `src/routes/usuarios.tsx`
- possivelmente `src/integrations/supabase/client.server.ts`
- possivelmente `src/integrations/supabase/auth-middleware.ts`
- possivelmente um helper compartilhado de configuração Supabase

### Resultado esperado
Depois da correção, a tela de usuários vai parar de falhar de forma “silenciosa”:
- se houver usuários, eles aparecem
- se o deploy estiver apontando para credenciais/projeto incorretos, a própria tela vai dizer isso de forma objetiva
- se houver inconsistência entre `auth.users`, `profiles` e `user_roles`, isso também ficará visível

### Detalhe técnico
Hoje o vazio da tabela é enganoso porque o frontend só diferencia:
- **erro**
- **lista vazia**

Mas o seu caso parece ser um terceiro cenário:
- **resposta bem-sucedida, porém vinda do ambiente errado ou inconsistente**

A correção vai separar esse caso para não parecer que “não há usuários”, quando na prática o deploy é que não está enxergando o conjunto correto.
