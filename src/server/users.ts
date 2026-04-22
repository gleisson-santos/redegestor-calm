/**
 * Server functions de administração de usuários.
 * Apenas admins podem chamar (validado via has_role).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface CreateUserInput {
  email: string;
  password: string;
  nome: string;
  ur: string;
  role: "admin" | "user";
}

async function assertAdmin(userId: string) {
  // Usa o admin client para checar role (bypass RLS, sem ambiguidade de tipos)
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Apenas administradores podem executar esta ação.");
}

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CreateUserInput) => {
    if (!input.email || !input.password || !input.ur) throw new Error("Campos obrigatórios ausentes");
    if (input.password.length < 6) throw new Error("Senha deve ter ao menos 6 caracteres");
    if (!["UMB", "UML", "UMF"].includes(input.ur)) throw new Error("UR inválida");
    if (!["admin", "user"].includes(input.role)) throw new Error("Role inválida");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    // Cria o usuário já confirmado (sem precisar verificar e-mail)
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nome: data.nome, ur: data.ur },
    });
    if (error) throw error;
    if (!created.user) throw new Error("Falha ao criar usuário");

    // O trigger handle_new_user já criou o profile e role 'user'.
    // Ajusta o profile (caso o trigger não tenha pego o metadata) e a role se for admin.
    await supabaseAdmin
      .from("profiles")
      .update({ nome: data.nome, ur: data.ur })
      .eq("id", created.user.id);

    if (data.role === "admin") {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: created.user.id, role: "admin" }, { onConflict: "user_id,role" });
    }
    return { id: created.user.id };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Você não pode remover a si mesmo.");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const [{ data: profiles, error: e1 }, { data: roles, error: e2 }, { data: authList, error: e3 }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, nome, ur, created_at"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;

    const roleMap = new Map<string, "admin" | "user">();
    (roles ?? []).forEach(r => {
      const cur = roleMap.get(r.user_id);
      if (cur !== "admin") roleMap.set(r.user_id, r.role as "admin" | "user");
    });
    const emailMap = new Map<string, string>();
    (authList?.users ?? []).forEach(u => emailMap.set(u.id, u.email ?? ""));

    return {
      users: (profiles ?? []).map(p => ({
        id: p.id,
        nome: p.nome,
        ur: p.ur,
        email: emailMap.get(p.id) ?? "",
        role: roleMap.get(p.id) ?? "user",
        created_at: p.created_at,
      })),
    };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "admin" | "user" }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    // Remove todas as roles e insere a nova
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    return { ok: true };
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; nome: string; ur: string }) => {
    if (!["UMB", "UML", "UMF"].includes(input.ur)) throw new Error("UR inválida");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ nome: data.nome, ur: data.ur })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });
