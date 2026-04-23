/**
 * Server functions de administração de usuários.
 * Apenas admins podem chamar (validado via assertAdmin).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { EXPECTED_PROJECT_REF, BUILD_STAMP, extractProjectRef } from "@/integrations/supabase/config";

interface CreateUserInput {
  email: string;
  password: string;
  nome: string;
  ur: string;
  role: "admin" | "user";
}

function logEnv(tag: string) {
  const url = process.env.SUPABASE_URL ?? "(missing)";
  const hasService = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY);
  const hasPub = !!process.env.SUPABASE_PUBLISHABLE_KEY;
  // Loga só o ref do projeto, nunca chaves
  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "?";
  console.log(`[users:${tag}] supabase=${ref} service_key=${hasService} pub_key=${hasPub}`);
}

async function assertAdmin(userId: string) {
  const sb = supabaseAdmin as any;
  const { data, error } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[users:assertAdmin] erro:", error);
    throw new Error(`Falha ao verificar permissões: ${error.message}`);
  }
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
    logEnv("createUser");
    await assertAdmin(context.userId);
    const sb = supabaseAdmin as any;

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nome: data.nome, ur: data.ur },
    });
    if (error) {
      console.error("[users:createUser] auth.admin.createUser erro:", error);
      throw new Error(`Falha ao criar no Auth: ${error.message}`);
    }
    if (!created.user) throw new Error("Falha ao criar usuário (sem retorno do Auth).");

    const newId = created.user.id;

    // Garante profile (não confia silenciosamente no trigger handle_new_user)
    const { data: existingProfile, error: profSelErr } = await sb
      .from("profiles").select("id").eq("id", newId).maybeSingle();
    if (profSelErr) console.error("[users:createUser] profiles.select erro:", profSelErr);

    if (!existingProfile) {
      const { error: insErr } = await sb.from("profiles")
        .insert({ id: newId, nome: data.nome, ur: data.ur });
      if (insErr) {
        console.error("[users:createUser] profiles.insert erro:", insErr);
        throw new Error(`Usuário criado no Auth, mas falhou ao criar profile: ${insErr.message}`);
      }
    } else {
      const { error: updErr } = await sb.from("profiles")
        .update({ nome: data.nome, ur: data.ur }).eq("id", newId);
      if (updErr) {
        console.error("[users:createUser] profiles.update erro:", updErr);
        throw new Error(`Falha ao atualizar profile: ${updErr.message}`);
      }
    }

    // Garante role (default 'user' do trigger + admin se solicitado)
    const desiredRole = data.role;
    const { error: roleDelErr } = await sb.from("user_roles").delete().eq("user_id", newId);
    if (roleDelErr) console.error("[users:createUser] roles.delete erro:", roleDelErr);
    const { error: roleInsErr } = await sb.from("user_roles")
      .insert({ user_id: newId, role: desiredRole });
    if (roleInsErr) {
      console.error("[users:createUser] roles.insert erro:", roleInsErr);
      throw new Error(`Falha ao atribuir papel: ${roleInsErr.message}`);
    }

    console.log(`[users:createUser] ok id=${newId} ur=${data.ur} role=${desiredRole}`);
    return { id: newId };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    logEnv("deleteUser");
    await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("Você não pode remover a si mesmo.");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) {
      console.error("[users:deleteUser] erro:", error);
      throw new Error(error.message);
    }
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

export interface ListUsersDiagnostics {
  projectRef: string;
  authCount: number;
  profilesCount: number;
  rolesCount: number;
  shownCount: number;
  expectedProjectRef: string;
  projectMismatch: boolean;
  suspicious: boolean;
  host: string;
  buildStamp: string;
  hint?: string;
}

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ users: AdminUserRow[]; warning?: string; diagnostics: ListUsersDiagnostics }> => {
    logEnv("listUsers");
    await assertAdmin(context.userId);
    const sb = supabaseAdmin as any;

    const [profRes, rolesRes, authRes] = await Promise.all([
      sb.from("profiles").select("id, nome, ur, created_at"),
      sb.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);
    if (profRes.error) {
      console.error("[users:listUsers] profiles erro:", profRes.error);
      throw new Error(`profiles: ${profRes.error.message}`);
    }
    if (rolesRes.error) {
      console.error("[users:listUsers] roles erro:", rolesRes.error);
      throw new Error(`user_roles: ${rolesRes.error.message}`);
    }
    if (authRes.error) {
      console.error("[users:listUsers] auth erro:", authRes.error);
      throw new Error(`auth.admin.listUsers: ${authRes.error.message}`);
    }

    const profiles = (profRes.data ?? []) as any[];
    const roles = (rolesRes.data ?? []) as any[];
    const authUsers = authRes.data?.users ?? [];

    console.log(`[users:listUsers] auth=${authUsers.length} profiles=${profiles.length} roles=${roles.length}`);

    const roleMap = new Map<string, "admin" | "user">();
    roles.forEach((r: any) => {
      const cur = roleMap.get(r.user_id);
      if (cur !== "admin") roleMap.set(r.user_id, r.role);
    });
    const profileMap = new Map<string, any>();
    profiles.forEach(p => profileMap.set(p.id, p));

    // Monta a partir de auth.users (fonte de verdade) — assim, mesmo sem profile,
    // o usuário aparece e o admin enxerga inconsistência em vez de tela vazia.
    const users: AdminUserRow[] = authUsers.map(u => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        nome: p?.nome ?? (u.user_metadata as any)?.nome ?? "",
        ur: p?.ur ?? (u.user_metadata as any)?.ur ?? "—",
        email: u.email ?? "",
        role: roleMap.get(u.id) ?? "user",
        created_at: p?.created_at ?? u.created_at ?? new Date().toISOString(),
      };
    }).sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email));

    let warning: string | undefined;
    const semProfile = authUsers.filter(u => !profileMap.has(u.id)).length;
    if (semProfile > 0) warning = `${semProfile} usuário(s) sem profile sincronizado.`;

    const projectRef = extractProjectRef(process.env.SUPABASE_URL);
    const projectMismatch = projectRef !== "?" && projectRef !== EXPECTED_PROJECT_REF;
    let host = "?";
    try {
      host = getRequestHost() || getRequestHeader("host") || "?";
    } catch {
      host = "?";
    }
    const suspicious =
      authUsers.length === 0 || projectMismatch || (authUsers.length > 0 && profiles.length === 0);
    let hint: string | undefined;
    if (projectMismatch) {
      hint = `O runtime do deploy (host=${host}) está apontando para o projeto Supabase "${projectRef}", mas o app espera "${EXPECTED_PROJECT_REF}". Revise SUPABASE_URL/SERVICE_ROLE_KEY no Cloudflare e refaça o deploy.`;
    } else if (authUsers.length === 0) {
      hint = `O projeto "${projectRef}" respondeu com 0 usuários no Auth (host=${host}). Provavelmente o deploy está conectado a um Supabase vazio ou o domínio "${host}" está servindo um build antigo.`;
    } else if (profiles.length === 0) {
      hint = `Existem ${authUsers.length} usuário(s) no Auth, mas nenhum profile. Verifique o trigger handle_new_user.`;
    }

    const diagnostics: ListUsersDiagnostics = {
      projectRef,
      authCount: authUsers.length,
      profilesCount: profiles.length,
      rolesCount: roles.length,
      shownCount: users.length,
      expectedProjectRef: EXPECTED_PROJECT_REF,
      projectMismatch,
      suspicious,
      host,
      buildStamp: BUILD_STAMP,
      hint,
    };

    console.log(`[users:listUsers] diag=${JSON.stringify(diagnostics)}`);
    return { users, warning, diagnostics };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "admin" | "user" }) => input)
  .handler(async ({ data, context }) => {
    logEnv("updateUserRole");
    await assertAdmin(context.userId);
    const sb = supabaseAdmin as any;
    const { error: delErr } = await sb.from("user_roles").delete().eq("user_id", data.userId);
    if (delErr) throw new Error(`roles.delete: ${delErr.message}`);
    const { error: insErr } = await sb.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (insErr) throw new Error(`roles.insert: ${insErr.message}`);
    return { ok: true };
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; nome: string; ur: string }) => {
    if (!["UMB", "UML", "UMF"].includes(input.ur)) throw new Error("UR inválida");
    return input;
  })
  .handler(async ({ data, context }) => {
    logEnv("updateUserProfile");
    await assertAdmin(context.userId);
    const sb = supabaseAdmin as any;

    // Garante profile mesmo se o trigger não criou
    const { data: existing } = await sb.from("profiles").select("id").eq("id", data.userId).maybeSingle();
    if (!existing) {
      const { error } = await sb.from("profiles").insert({ id: data.userId, nome: data.nome, ur: data.ur });
      if (error) throw new Error(`profiles.insert: ${error.message}`);
    } else {
      const { error } = await sb.from("profiles").update({ nome: data.nome, ur: data.ur }).eq("id", data.userId);
      if (error) throw new Error(`profiles.update: ${error.message}`);
    }
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => {
    if (input.password.length < 6) throw new Error("Senha deve ter ao menos 6 caracteres");
    return input;
  })
  .handler(async ({ data, context }) => {
    logEnv("resetUserPassword");
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
