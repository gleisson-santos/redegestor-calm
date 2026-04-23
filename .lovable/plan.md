

## Remover diagnóstico e documentar configuração correta do Cloudflare

Funcionou. O domínio `gestor.controllserv.com.br` agora mostra `supabase url: sim`, `publishable key: sim`, `service key: sim` e lista os usuários. Confirmado: o problema era cadastro das variáveis no painel errado.

### 1. Remover o badge de diagnóstico da interface
- Em `src/components/AppLayout.tsx`, remover o import e o uso de `<DeployDiagnostic />` da topbar.
- Excluir o arquivo `src/components/DeployDiagnostic.tsx`.
- Manter o endpoint `/api/public/runtime` ativo (útil para futura verificação rápida via URL, sem poluir a UI).

### 2. Atualizar `.lovable/plan.md` com a instrução definitiva
Substituir o conteúdo do arquivo por um guia objetivo, registrando o que foi descoberto e como reproduzir a configuração correta:

- **Causa**: variáveis cadastradas em "Build → Variáveis e segredos" só valem em build-time. As server functions de admin leem `process.env` em **runtime** do Worker, que vem de outro painel.
- **Local correto**: Cloudflare → Workers & Pages → `redegestor-calm` → **Configurações → Variáveis e segredos** (não a aba Build).
- **Variáveis obrigatórias** (todas como tipo **Segredo**):
  - `SUPABASE_URL` = `https://mrvplahmthguvrauzwpy.supabase.co`
  - `SUPABASE_PUBLISHABLE_KEY` = anon/publishable key do Supabase
  - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (Supabase Dashboard → Project Settings → API → `service_role`)
  - `SERVICE_ROLE_KEY` = mesmo valor da service_role (fallback aceito pelo código)
- **Passo final**: clicar em **Implantar** no painel lateral após salvar — sem isso as variáveis não passam a valer.
- **Validação**: abrir `https://<dominio>/api/public/runtime` e conferir `hasSupabaseUrl: true`, `hasPublishableKey: true`, `hasServiceKey: true`, `serverProjectRef: "mrvplahmthguvrauzwpy"`.

### Arquivos previstos
- `src/components/AppLayout.tsx` (remover uso do diagnóstico)
- `src/components/DeployDiagnostic.tsx` (excluir)
- `.lovable/plan.md` (reescrever como guia de configuração)

### Resultado esperado
- Topbar limpa, sem o badge de build.
- Endpoint `/api/public/runtime` continua disponível para inspeção pontual.
- `.lovable/plan.md` passa a servir como referência permanente para configurar qualquer novo deploy do Worker no Cloudflare.

