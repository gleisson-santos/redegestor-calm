
## Mensagem de permissão ao tentar editar obra de outra UR

Hoje, quando um usuário lotado em uma UR tenta editar uma obra de outra UR, o RLS do Supabase silenciosamente bloqueia o `UPDATE` (não retorna erro, apenas 0 linhas afetadas), e a UI mostra o toast genérico **"Obra atualizada."** — passando a falsa impressão de que salvou.

Vou trocar isso por uma checagem de permissão **antes** da chamada ao Supabase, mostrando um toast de erro claro com a UR da obra.

### Comportamento novo

- Se `profile.ur !== obra.ur` e o usuário **não** for admin → toast vermelho:
  > **Você não tem permissão para editar dados da UR {UR_DA_OBRA}**
- Se for admin ou da mesma UR → fluxo atual (salva + toast "Obra atualizada").
- Mesma regra aplicada a:
  - Edição inline de **Extensão** (`InlineExtensao`)
  - Edição inline de **Observações** (`ObsCell`)
  - Edição via diálogo (`ObraDialogContent` — quando `obra` existe = modo edição)
  - **Excluir** obra
  - Botão **"marcar serviço executado"** (se aparecer na listagem)

### Onde aplicar

Arquivo principal: `src/routes/obras.tsx`

1. Importar `useAuth` no topo do arquivo.
2. Criar um helper local dentro de `ObrasPage`:
   ```ts
   const { profile, role } = useAuth();
   const isAdmin = role === "admin";
   const canEdit = (obra: Obra) => isAdmin || profile?.ur === obra.ur;
   ```
3. Passar `canEdit` (ou o resultado booleano) para `InlineExtensao`, `ObsCell` e `ObraDialogContent` via props.
4. Em cada handler de mutação, antes de chamar `patchObra` / `upsertObra` / `deleteObra` / `marcarServicoExecutado`:
   ```ts
   if (!canEdit(obra)) {
     toast.error(`Você não tem permissão para editar dados da UR ${obra.ur}`);
     return;
   }
   ```
5. Bônus de UX (opcional, sem mudar layout): aplicar `disabled` + `title` nos botões de editar/excluir quando `!canEdit(obra)`, para que o usuário entenda visualmente.

### Detalhes técnicos

- `useAuth()` já expõe `profile.ur` e `role` (`"admin" | "user"`) — nenhuma nova query necessária.
- A checagem é client-side **defensiva** (UX); a segurança real continua no RLS do Postgres.
- Nenhuma migração de banco, nenhuma mudança em outros arquivos.
- Nada muda para admin nem para usuários editando obras da própria UR.

### Fora de escopo (posso fazer depois se quiser)

- Aplicar a mesma checagem no Diário de Obra e em Lançamentos de Encargos.
- Esconder completamente os botões em vez de só desabilitar.
