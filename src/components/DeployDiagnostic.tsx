import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import {
  EXPECTED_PROJECT_REF,
  BUILD_STAMP,
} from "@/integrations/supabase/config";
import { cn } from "@/lib/utils";

interface RuntimeInfo {
  host: string;
  buildStamp: string;
  serverProjectRef: string;
  expectedProjectRef: string;
  projectMismatch: boolean;
  hasServiceKey: boolean;
  hasPublishableKey: boolean;
  timestamp: string;
}

/**
 * Indicador discreto de diagnóstico de deploy, visível só para admin.
 * Detecta divergência entre client (browser) e server (worker runtime).
 */
export function DeployDiagnostic() {
  const [info, setInfo] = useState<RuntimeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/runtime", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RuntimeInfo;
      setInfo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const browserHost = typeof window !== "undefined" ? window.location.host : "?";
  const stampMatch = info && info.buildStamp === BUILD_STAMP;
  const projectOk = info && !info.projectMismatch;
  const hostMatch = info && info.host === browserHost;
  const allOk = !error && info && stampMatch && projectOk && hostMatch && info.hasServiceKey;

  const badgeColor = error
    ? "bg-destructive/15 text-destructive border-destructive/30"
    : allOk
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
      : "bg-warning/15 text-warning-foreground border-warning/40";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono border",
          badgeColor
        )}
        title="Diagnóstico do deploy"
      >
        {loading ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : allOk ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <AlertTriangle className="h-3 w-3" />
        )}
        <span>build {BUILD_STAMP.slice(0, 10)}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-[360px] z-50 rounded-md border border-border bg-popover text-popover-foreground shadow-lg p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Diagnóstico do deploy</span>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              recarregar
            </button>
          </div>

          {error && (
            <p className="text-destructive mb-2">
              Falha ao consultar /api/public/runtime: {error}
            </p>
          )}

          <ul className="space-y-1 font-mono text-[11px]">
            <Row label="host navegador" value={browserHost} />
            <Row
              label="host servidor"
              value={info?.host ?? "?"}
              warn={!!info && info.host !== browserHost}
            />
            <Row
              label="build navegador"
              value={BUILD_STAMP}
            />
            <Row
              label="build servidor"
              value={info?.buildStamp ?? "?"}
              warn={!!info && info.buildStamp !== BUILD_STAMP}
            />
            <Row
              label="projeto servidor"
              value={info?.serverProjectRef ?? "?"}
              warn={!!info?.projectMismatch}
            />
            <Row label="projeto esperado" value={EXPECTED_PROJECT_REF} />
            <Row
              label="service key"
              value={info?.hasServiceKey ? "sim" : "NÃO"}
              warn={!!info && !info.hasServiceKey}
            />
          </ul>

          {info && info.projectMismatch && (
            <p className="mt-2 text-[11px] text-warning-foreground">
              O runtime aponta para Supabase <code>{info.serverProjectRef}</code>, mas o frontend espera <code>{EXPECTED_PROJECT_REF}</code>. Atualize as variáveis no Cloudflare e refaça o deploy.
            </p>
          )}
          {info && info.buildStamp !== BUILD_STAMP && (
            <p className="mt-2 text-[11px] text-warning-foreground">
              O servidor está em build diferente do navegador. Provável deploy desatualizado neste domínio (<code>{browserHost}</code>).
            </p>
          )}
          {info && info.host !== browserHost && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Host do servidor difere do navegador — possível proxy/CDN reescrevendo o cabeçalho Host.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <li className="flex items-start justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className={cn("text-right break-all", warn && "text-warning-foreground font-semibold")}>
        {value}
      </span>
    </li>
  );
}
