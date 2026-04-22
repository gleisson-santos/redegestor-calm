import { createFileRoute, useNavigate, Navigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Loader2, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — RedeGestor" },
      { name: "description", content: "Acesso restrito ao sistema RedeGestor." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
});

/* ---------------- Mapa de pontos animado ---------------- */
type RoutePoint = { x: number; y: number; delay: number };

function DotMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const routes: { start: RoutePoint; end: RoutePoint; color: string }[] = [
    { start: { x: 100, y: 150, delay: 0 }, end: { x: 200, y: 80, delay: 2 }, color: "#0ea5e9" },
    { start: { x: 200, y: 80, delay: 2 }, end: { x: 260, y: 120, delay: 4 }, color: "#0ea5e9" },
    { start: { x: 50, y: 50, delay: 1 }, end: { x: 150, y: 180, delay: 3 }, color: "#0ea5e9" },
    { start: { x: 280, y: 60, delay: 0.5 }, end: { x: 180, y: 180, delay: 2.5 }, color: "#0ea5e9" },
  ];

  const generateDots = (width: number, height: number) => {
    const dots: { x: number; y: number; radius: number; opacity: number }[] = [];
    const gap = 14;
    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const inShape =
          (x < width * 0.25 && x > width * 0.05 && y < height * 0.4 && y > height * 0.1) ||
          (x < width * 0.25 && x > width * 0.15 && y < height * 0.8 && y > height * 0.4) ||
          (x < width * 0.45 && x > width * 0.3 && y < height * 0.35 && y > height * 0.15) ||
          (x < width * 0.5 && x > width * 0.35 && y < height * 0.65 && y > height * 0.35) ||
          (x < width * 0.7 && x > width * 0.45 && y < height * 0.5 && y > height * 0.1) ||
          (x < width * 0.8 && x > width * 0.65 && y < height * 0.8 && y > height * 0.6);
        if (inShape && Math.random() > 0.3) {
          dots.push({ x, y, radius: 1, opacity: Math.random() * 0.5 + 0.25 });
        }
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = generateDots(dimensions.width, dimensions.height);
    let raf = 0;
    let start = Date.now();

    const draw = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      dots.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${d.opacity})`;
        ctx.fill();
      });

      const t = (Date.now() - start) / 1000;
      routes.forEach(r => {
        const elapsed = t - r.start.delay;
        if (elapsed <= 0) return;
        const progress = Math.min(elapsed / 3, 1);
        const x = r.start.x + (r.end.x - r.start.x) * progress;
        const y = r.start.y + (r.end.y - r.start.y) * progress;

        ctx.beginPath();
        ctx.moveTo(r.start.x, r.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(r.start.x, r.start.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56,189,248,0.4)";
        ctx.fill();

        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(r.end.x, r.end.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = r.color;
          ctx.fill();
        }
      });

      if (t > 15) start = Date.now();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [dimensions]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

/* ---------------- Página de login ---------------- */
function LoginPage() {
  const { session, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session) return <Navigate to="/" />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      toast.success("Bem-vindo!");
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao entrar";
      toast.error(msg.includes("Invalid login") ? "Credenciais inválidas" : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted via-background to-muted p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-elevated border border-border bg-card">
        {/* Lado esquerdo — mapa */}
        <div className="relative hidden md:block bg-gradient-to-br from-foreground via-foreground/90 to-accent overflow-hidden min-h-[560px]">
          <DotMap />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
          <div className="relative z-10 flex flex-col justify-end h-full p-10 text-white">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/20">
              <Activity className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">RedeGestor</h2>
            <p className="mt-2 text-sm text-white/70 max-w-sm leading-relaxed">
              Plataforma de gestão de obras, materiais e medições para as Unidades Regionais — UMB, UML e UMF.
            </p>
            <div className="mt-6 flex gap-2 text-[11px] text-white/60">
              <span className="rounded-full bg-white/10 px-2 py-1 ring-1 ring-white/15">UMB</span>
              <span className="rounded-full bg-white/10 px-2 py-1 ring-1 ring-white/15">UML</span>
              <span className="rounded-full bg-white/10 px-2 py-1 ring-1 ring-white/15">UMF</span>
            </div>
          </div>
        </div>

        {/* Lado direito — formulário */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground mt-1">Entre com suas credenciais para continuar</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-2">
              <Button type="submit" className="w-full h-11 group" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </motion.div>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Esqueceu sua senha? Fale com o administrador.
              </Link>
            </div>
          </form>

          <p className="text-[11px] text-muted-foreground text-center mt-8 pt-6 border-t border-border">
            Acesso restrito. Apenas o administrador pode criar novos usuários.
          </p>
        </div>
      </div>
    </main>
  );
}
