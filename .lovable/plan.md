
Objetivo: eliminar o “sucesso falso” em Usuários e confirmar se `gestorr.controllserv.com.br` está mesmo servindo este projeto.

1. Confirmar e expor o problema de deploy/domínio
- Adicionar à tela `/usuarios` um bloco discreto de diagnóstico visível só para admin com:
  - host atual da requisição
  - ref do projeto Supabase visto no servidor
  - contagens de `auth.users`, `profiles`, `user_roles`
  - identificador do build atual
- Exibir mensagem específica quando o host em uso não bater com o deploy esperado ou quando a resposta do servidor indicar ambiente diferente/stale.

2. Tornar o “criado com sucesso” realmente confiável
- Ajustar `createUser` para, após criar no Auth/Profile/Role, validar o resultado final antes de retornar sucesso.
- Depois da criação, a UI deve recarregar a lista e confirmar que o novo `id` apareceu.
- Se o usuário não aparecer após a confirmação, trocar o toast de sucesso por erro orientado, informando que o frontend e o backend do domínio atual não estão sincronizados.

3. Centralizar a referência correta do projeto Supabase
- Remover dependências espalhadas de ref esperada/hardcode duplicado.
- Criar uma única fonte de verdade para:
  - `SUPABASE_URL`
  - ref esperada do projeto
  - publishable key pública
- Fazer cliente e servidor usarem a mesma referência pública para evitar divergência entre browser e server functions.

4. Fortalecer o diagnóstico do servidor
- Ampliar `listUsers` para retornar também:
  - host recebido pela requisição
  - build/version stamp
  - indício de deploy desatualizado
- Refinar logs para diferenciar claramente:
  - deploy correto sem usuários
  - deploy apontando para projeto Supabase errado
  - domínio externo servindo build antigo
  - criação no Auth sem refletir na interface atual

5. Ajustar a UX da página de Usuários
- Substituir o “Nenhum usuário ainda.” por estados mais precisos:
  - “Este domínio parece estar em um deploy antigo”
  - “Servidor conectado ao projeto Supabase X, esperado Y”
  - “Usuário criado no Auth, mas este deploy não recarregou a lista correta”
- Manter a tabela vazia apenas para o caso realmente normal.

6. Verificação final
- Testar o comportamento em:
  - `redegestor.lovable.app`
  - `gestorr.controllserv.com.br`
- Confirmar se ambos mostram o mesmo build stamp e o mesmo diagnóstico.
- Se o `.com.br` continuar divergente, o problema deixa de ser código e passa a ser apontamento/publicação do domínio.

Arquivos previstos
- `src/server/users.ts`
- `src/routes/usuarios.tsx`
- `src/integrations/supabase/client.server.ts`
- possivelmente um helper compartilhado de configuração Supabase

Observação importante
- Pelos sinais atuais, o comportamento visto no print não bate com a lógica mais recente do `listUsers`, e este projeto não está com custom domain configurado na publicação atual. Isso indica forte chance de `gestorr.controllserv.com.br` estar servindo outro deploy, um build antigo, ou uma publicação paralela. O ajuste acima vai tornar isso visível na própria tela, sem depender de suposição.

Detalhes técnicos
- Hoje, com o código atual de `listUsers`, se houver usuários em `auth.users`, a tabela não deveria continuar vazia silenciosamente.
- Como o print ainda mostra “Nenhum usuário ainda.” após “Usuário criado”, a hipótese principal não é mais trigger/RLS, e sim desalinhamento entre domínio, build ativo e server runtime.
- A implementação vai transformar esse cenário em diagnóstico explícito e bloquear o falso positivo de criação.
