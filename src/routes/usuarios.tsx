import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, KeyRound, Loader2, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { listUsers, createUser, deleteUser, updateUserProfile, updateUserRole, resetUserPassword, type AdminUserRow } from "@/server/users";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — RedeGestor" },
      { name: "description", content: "Gerenciamento de usuários do sistema." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UsuariosPage,
});

const URS = ["UMB", "UML", "UMF"] as const;

function UsuariosPage() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [resetting, setResetting] = useState<AdminUserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUserRow | null>(null);

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
    enabled: isAdmin,
  });

  const delMut = useMutation({
    mutationFn: (userId: string) => deleteUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Usuário removido");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </AppLayout>
    );
  }
  if (!isAdmin) return <Navigate to="/" />;

  const users = usersQ.data?.users ?? [];
  const warning = usersQ.data?.warning;
  const diag = usersQ.data?.diagnostics;
  const loadError = usersQ.error instanceof Error ? usersQ.error.message : usersQ.isError ? "Falha ao carregar usuários." : null;
  const showDiagnostic = !loadError && diag?.suspicious;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-accent">Usuários</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie quem tem acesso ao sistema e a qual UR pertence.</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo usuário</Button>
            </DialogTrigger>
            <CreateUserDialog onClose={() => setCreateOpen(false)} />
          </Dialog>
        </div>

        {loadError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">Não foi possível carregar a lista.</p>
            <p className="mt-1 text-destructive/80 break-words">{loadError}</p>
          </div>
        )}

        {showDiagnostic && diag && (
          <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">Diagnóstico do ambiente do servidor</p>
            {diag.hint && <p className="mt-1 text-foreground/90">{diag.hint}</p>}
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground">
              <li>projeto detectado: <span className="text-foreground">{diag.projectRef}</span></li>
              <li>projeto esperado: <span className="text-foreground">{diag.expectedProjectRef}</span></li>
              <li>auth.users: <span className="text-foreground">{diag.authCount}</span></li>
              <li>profiles: <span className="text-foreground">{diag.profilesCount}</span></li>
              <li>user_roles: <span className="text-foreground">{diag.rolesCount}</span></li>
              <li>exibidos: <span className="text-foreground">{diag.shownCount}</span></li>
            </ul>
            {diag.projectMismatch && (
              <p className="mt-2 text-xs text-muted-foreground">
                Atualize no Cloudflare as variáveis <code className="font-mono">SUPABASE_URL</code>,{" "}
                <code className="font-mono">SUPABASE_PUBLISHABLE_KEY</code> e{" "}
                <code className="font-mono">SERVICE_ROLE_KEY</code> para o projeto{" "}
                <code className="font-mono">{diag.expectedProjectRef}</code> e refaça o deploy.
              </p>
            )}
          </div>
        )}

        {warning && !loadError && !showDiagnostic && (
          <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
            <p className="font-medium">Atenção: {warning}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Edite cada usuário e salve para sincronizar nome/UR no profile.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[12px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">E-mail</th>
                <th className="text-left px-4 py-3">UR</th>
                <th className="text-left px-4 py-3">Papel</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usersQ.isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{loadError ? "—" : "Nenhum usuário ainda."}</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.nome || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted">{u.ur}</span></td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent"><ShieldCheck className="h-3.5 w-3.5" />Admin</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><UserIcon className="h-3.5 w-3.5" />Usuário</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(u)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setResetting(u)} aria-label="Redefinir senha"><KeyRound className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(u)} aria-label="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        {editing && <EditUserDialog user={editing} onClose={() => setEditing(null)} />}
      </Dialog>

      {/* Reset password */}
      <Dialog open={!!resetting} onOpenChange={o => !o && setResetting(null)}>
        {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente <strong>{confirmDelete?.nome || confirmDelete?.email}</strong> do sistema. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && delMut.mutate(confirmDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: "", password: "", nome: "", ur: "UMB", role: "user" as "admin" | "user" });
  const mut = useMutation({
    mutationFn: () => createUser({ data: form }),
    onSuccess: () => {
      toast.success("Usuário criado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); mut.mutate(); };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
        <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
        <div><Label>Senha inicial (mín. 6)</Label><Input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>UR</Label>
            <select className="w-full h-9 px-2 rounded border border-input bg-background text-sm" value={form.ur} onChange={e => setForm({ ...form, ur: e.target.value })}>
              {URS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <Label>Papel</Label>
            <select className="w-full h-9 px-2 rounded border border-input bg-background text-sm" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as "admin" | "user" })}>
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mut.isPending}>{mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditUserDialog({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(user.nome);
  const [ur, setUr] = useState(user.ur);
  const [role, setRole] = useState<"admin" | "user">(user.role);
  const mut = useMutation({
    mutationFn: async () => {
      await updateUserProfile({ data: { userId: user.id, nome, ur } });
      if (role !== user.role) await updateUserRole({ data: { userId: user.id, role } });
    },
    onSuccess: () => {
      toast.success("Usuário atualizado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Editar usuário</DialogTitle></DialogHeader>
      <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
        <div><Label>E-mail</Label><Input value={user.email} disabled /></div>
        <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>UR</Label>
            <select className="w-full h-9 px-2 rounded border border-input bg-background text-sm" value={ur} onChange={e => setUr(e.target.value)}>
              {URS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <Label>Papel</Label>
            <select className="w-full h-9 px-2 rounded border border-input bg-background text-sm" value={role} onChange={e => setRole(e.target.value as "admin" | "user")}>
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mut.isPending}>{mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const [pwd, setPwd] = useState("");
  const mut = useMutation({
    mutationFn: () => resetUserPassword({ data: { userId: user.id, password: pwd } }),
    onSuccess: () => { toast.success("Senha redefinida"); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Redefinir senha — {user.nome || user.email}</DialogTitle></DialogHeader>
      <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
        <div>
          <Label>Nova senha (mín. 6)</Label>
          <Input type="text" value={pwd} onChange={e => setPwd(e.target.value)} required minLength={6} />
          <p className="text-xs text-muted-foreground mt-1">Comunique a nova senha ao usuário por canal seguro.</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mut.isPending}>{mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
