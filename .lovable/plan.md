
Objetivo: parar o ciclo de “cria com sucesso / lista vazia” e tornar explícito quando o domínio aberto não é o deploy atual deste projeto.

Problema mais provável
- O print mostra o app rodando em `redegestor-calm.jsgleisson9350.workers.dev/usuarios`.
- A publicação atual deste projeto é `redegestor.lovable.app` e não há custom domain configurado no projeto.
- Como a tela ainda mostra o estado antigo “Nenhum usuário ainda.” sem o bloco de diagnóstico já previsto no código recente, o mais provável não é mais RLS nem trigger: é um frontend/backend diferente do deploy atual, servido por um Worker/host paralelo ou antigo.

O que será implementado

1. Centralizar de vez a identidade do ambiente
- Fazer `client.ts`, `client.server.ts` e `auth-middleware.ts` consumirem a mesma configuração pública compartilhada.
- Manter em um único lugar:
  - URL Supabase esperada
  - ref do projeto esperada
  - publishable key pública
  - build stamp
- Evitar divergência entre browser, middleware e server functions.

2. Criar um diagnóstico global, não só em `/usuarios`
- Adicionar um indicador discreto para admin no layout principal mostrando:
  - host atual
  - build stamp
  - ref Supabase do cliente
- Isso permite detectar deploy stale mesmo antes de abrir a tela de usuários.
- Se o bundle aberto não for o atual, isso ficará evidente em qualquer página.

3. Criar um endpoint público de inspeção do runtime
- Adicionar uma rota pública do tipo `/api/public/runtime` retornando:
  - host recebido
  - build stamp
  - projeto Supabase detectado no servidor
  - projeto esperado
- Isso permite comparar rapidamente:
  - `redegestor.lovable.app`
  - `redegestor-calm.jsgleisson9350.workers.dev`
  - qualquer `.com.br`
- Se os valores divergirem, o problema é publicação/apontamento e não código da lista.

4. Endurecer `listUsers` para nunca voltar “vazio normal” em cenário suspeito
- Ajustar `src/server/users.ts` para classificar separadamente:
  - deploy correto sem usuários
  - projeto Supabase errado
  - host/build desatualizado
  - resposta sem metadados esperados
- Se `auth.users = 0`, ou se o runtime vier de projeto diferente, ou se o frontend estiver sem o diagnóstico esperado, a UI não mostrará mais “Nenhum usuário ainda.” como se fosse caso normal.

5. Fortalecer `createUser` contra falso positivo
- Após criar em Auth/Profile/Role:
  - confirmar no Auth
  - confirmar em `profiles`
  - confirmar em `user_roles`
  - recarregar a lista
  - confirmar presença do novo `id`
- Se qualquer etapa falhar, retornar erro explícito.
- Se o Auth confirmar, mas a lista do domínio atual não refletir o novo usuário, exibir mensagem orientada dizendo que o domínio atual não está sincronizado com o runtime correto.

6. Ajustar a UX da página `/usuarios`
- Trocar o estado vazio genérico por mensagens exatas:
  - “Este domínio parece estar em um deploy antigo”
  - “Servidor conectado ao projeto Supabase X, esperado Y”
  - “Usuário criado no Auth, mas esta interface não está lendo o mesmo runtime”
  - “Resposta sem diagnóstico: provável frontend antigo”
- Reservar “Nenhum usuário ainda.” apenas para o caso realmente legítimo.

7. Verificação final
- Comparar os três ambientes:
  - `redegestor.lovable.app`
  - `redegestor-calm.jsgleisson9350.workers.dev`
  - eventual domínio `.com.br`
- Confirmar igualdade de:
  - build stamp
  - host percebido
  - projeto Supabase do servidor
  - contagens de `auth.users`, `profiles`, `user_roles`
- Se o `workers.dev` ou `.com.br` continuarem diferentes do `lovable.app`, concluir formalmente que o problema é deploy/apontamento externo, não mais a lógica deste repositório.

Arquivos previstos
- `src/integrations/supabase/config.ts`
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/auth-middleware.ts`
- `src/server/users.ts`
- `src/routes/usuarios.tsx`
- `src/components/AppLayout.tsx`
- novo endpoint público em `src/routes/api/public/runtime.ts`

Detalhes técnicos
- O indício mais forte hoje é: o domínio do print não é a publicação atual conhecida do projeto.
- Se o código recente tivesse sido carregado nesse host, a tela de usuários já deveria estar mostrando diagnóstico, não apenas a mensagem antiga.
- Portanto, a próxima correção precisa sair da tela isolada de usuários e passar a expor versão/host/runtime globalmente, para provar qual deploy está sendo servido em cada domínio.
