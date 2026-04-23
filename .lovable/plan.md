# Configuração do deploy Cloudflare Worker

Guia definitivo para configurar (ou diagnosticar) qualquer novo deploy do Worker
deste projeto no Cloudflare. Baseado no caso real do Worker `redegestor-calm`.

## Causa raiz (conhecida)

O frontend funciona em qualquer deploy porque a `SUPABASE_URL` e a anon/publishable
key estão hardcoded em `src/integrations/supabase/client.ts` (vão no bundle do
navegador). Por isso telas que leem o Supabase via RLS funcionam normalmente.

Já as **server functions de admin** (`listUsers`, `createUser`, `updateUserProfile`,
`deleteUser`, etc., em `src/server/users.ts`) rodam dentro do Worker e leem
`process.env.SUPABASE_URL`, `process.env.SUPABASE_PUBLISHABLE_KEY` e
`process.env.SUPABASE_SERVICE_ROLE_KEY` em **runtime**. Sem essas três variáveis,
a tela `/usuarios` retorna lista vazia mesmo havendo usuários no banco.

## Local CORRETO de cadastro no Cloudflare

⚠️ Cuidado: o Cloudflare tem dois painéis de variáveis. **Não confunda**.

- ❌ **Build → Variáveis e segredos** (aba "Configuração do Workers" / Build):
  só vale durante `npm run build`. Não chega ao runtime do Worker.
- ✅ **Configurações → Variáveis e segredos** (painel lateral "Definir variáveis
  e segredos para este ambiente"): este sim alimenta `process.env` em runtime.

Cadastrar no painel **Configurações → Variáveis e segredos**, todas como tipo
**Segredo** (não Variable):

| Nome                          | Valor                                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| `SUPABASE_URL`                | `https://mrvplahmthguvrauzwpy.supabase.co`                            |
| `SUPABASE_PUBLISHABLE_KEY`    | anon/publishable key do Supabase                                      |
| `SUPABASE_SERVICE_ROLE_KEY`   | service_role key (Supabase → Project Settings → API → `service_role`) |
| `SERVICE_ROLE_KEY` (opcional) | mesmo valor da service_role (fallback aceito pelo código)             |

## Passo final obrigatório

Após salvar as variáveis no painel lateral, clicar em **Implantar**. Sem esse
clique as variáveis não passam a valer no runtime, mesmo já salvas. Esse é o
passo que normalmente é esquecido.

## Validação objetiva

Abrir no navegador:

```
https://<seu-dominio>/api/public/runtime
```

O JSON retornado deve mostrar:

```json
{
  "hasSupabaseUrl": true,
  "hasPublishableKey": true,
  "hasServiceKey": true,
  "serverProjectRef": "mrvplahmthguvrauzwpy",
  "envComplete": true,
  "missingEnv": []
}
```

Se algum campo vier `false` ou `missingEnv` listar variáveis, repetir o cadastro
no painel correto e clicar em **Implantar** novamente.

Quando o JSON estiver verde, a tela `/usuarios` passa a listar os usuários
cadastrados no Supabase, igual ao preview Lovable.

## Por que a service_role nunca pode ir no bundle

A `service_role` ignora RLS e tem poder total sobre o banco. Ela **não pode**
ser exposta no frontend (bundle do navegador). Por isso ela só vive em
`process.env` no runtime do Worker, e por isso o cadastro manual no painel do
Cloudflare é inevitável — não há atalho via código.
