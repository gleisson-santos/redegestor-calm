/**
 * Server functions de administração de usuários.
 * Apenas admins podem chamar (validado via assertAdmin).
 *
 * As tabelas profiles e user_roles foram criadas via migration mas o types.ts
 * gerado pela Supabase ainda não as inclui — usamos cast `as any` no client.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const sb = supabaseAdmin as any;
  const { data, error } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
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
    await assertAdmin(context.userId);
    const sb = supabaseAdmin as any;

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nome: data.nome, ur: data.ur },
    });
    if (error) throw new Error(error.message);
    if (!created.user) throw new Error("Falha ao criar usuário");

    // O trigger handle_new_user já criou o profile + role 'user'.
    await sb.from("profiles").update({ nome: data.nome, ur: data.ur }).eq("id", created.user.id);
    if (data.role === "admin") {
      await sb.from("user_roles").upsert(
        { user_id: created.user.id, role: "admin" },
        { onConflict: "user_id,role" }
      );
    }
    return { id: created.user.id };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("Você não pode remover a si mesmo.");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface AdminUserRow {
  id: string;
  nome: string;
  ur: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
}

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ users: AdminUserRow[] }> => {
    await assertAdmin(context.userId);
    const sb = supabaseAdmin as any;

    const [profRes, rolesRes, authRes] = await Promise.all([
      sb.from("profiles").select("id, nome, ur, created_at"),
      sb.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);
    if (profRes.error) throw new Error(profRes.error.message);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (authRes.error) throw new Error(authRes.error.message);

    const roleMap = new Map<string, "admin" | "user">();
    (rolesRes.data ?? []).forEach((r: any) => {
      const cur = roleMap.get(r.user_id);
      if (cur !== "admin") roleMap.set(r.user_id, r.role);
    });
    const emailMap = new Map<string, string>();
    (authRes.data?.users ?? []).forEach(u => emailMap.set(u.id, u.email ?? ""));

    return {
      users: ((profRes.data ?? []) as any[]).map(p => ({
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
    await assertAdmin(context.userId);
    const sb = supabaseAdmin as any;
    await sb.from("user_roles").delete().eq("user_id", data.userId);
    await sb.from("user_roles").insert({ user_id: data.userId, role: data.role });
    return { ok: true };
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; nome: string; ur: string }) => {
    if (!["UMB", "UML", "UMF"].includes(input.ur)) throw new Error("UR inválida");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sb = supabaseAdmin as any;
    const { error } = await sb
      .from("profiles")
      .update({ nome: data.nome, ur: data.ur })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => {
    if (input.password.length < 6) throw new Error("Senha deve ter ao menos 6 caracteres");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
