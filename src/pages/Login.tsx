import { useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  signInWithGoogle,
  signInWithUsername,
  createAccountWithUsername,
} from "../lib/auth";
import { useAuth } from "../context/AuthContext";

type View = "main" | "login" | "signup";

export function Login() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>("main");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const burstId = useRef(0);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  function spawnBurst(x: number, y: number) {
    const id = ++burstId.current;
    setBursts((b) => [...b, { id, x, y }]);
    setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), 1500);
  }

  function handleClick(e: React.MouseEvent) {
    if (e.target instanceof HTMLElement && e.target.closest("input, button, a, form")) return;
    spawnBurst(e.clientX, e.clientY);
  }

  async function withBusy(action: () => Promise<unknown>, e?: React.MouseEvent) {
    if (e) spawnBurst(e.clientX, e.clientY);
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setBusy(false);
    }
  }

  function switchView(next: View) {
    setError(null);
    setView(next);
  }

  return (
    <div
      onClick={handleClick}
      className="party-bg relative flex min-h-screen items-center justify-center overflow-hidden p-6"
    >
      <DiscoRays />
      <Streamers />
      <Stars />
      <Confetti />
      <Balloons />
      {bursts.map((b) => (
        <BurstBurst key={b.id} x={b.x} y={b.y} />
      ))}

      <div className="card-pop relative z-10 w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur sm:p-10">
        <div className="party-glow absolute inset-0 -z-10 rounded-3xl" />

        <div className="mb-6 flex items-end justify-center gap-3">
          <SpinningGift />
          <Cake />
          <PartyHat />
        </div>

        <h1 className="rainbow-text wiggle text-center text-6xl font-extrabold tracking-tight">
          Gaveapp
        </h1>
        <p className="mt-4 text-center text-lg font-bold text-zinc-800">
          🎉 LA FESTEN BEGYNNE 🎉
        </p>

        {view === "main" && (
          <MainView
            busy={busy}
            onGoogle={(e) => withBusy(signInWithGoogle, e)}
            onLogin={() => switchView("login")}
            onSignup={() => switchView("signup")}
          />
        )}

        {view === "login" && (
          <LoginForm
            busy={busy}
            onSubmit={(u, p) => withBusy(() => signInWithUsername(u, p))}
            onBack={() => switchView("main")}
            onGoSignup={() => switchView("signup")}
          />
        )}

        {view === "signup" && (
          <SignupForm
            busy={busy}
            onSubmit={(name, u, p) =>
              withBusy(() => createAccountWithUsername(u, p, name))
            }
            onBack={() => switchView("main")}
            onGoLogin={() => switchView("login")}
          />
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        <p className="mt-4 text-center text-xs text-zinc-400">
          Tips: klikk hvor som helst for konfetti 🎊
        </p>
      </div>
    </div>
  );
}

function MainView({
  busy,
  onGoogle,
  onLogin,
  onSignup,
}: {
  busy: boolean;
  onGoogle: (e: React.MouseEvent) => void;
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <>
      <p className="mt-1 text-center text-sm text-zinc-600">
        Velg hvordan du vil logge inn:
      </p>

      <button
        onClick={onGoogle}
        disabled={busy}
        className="party-btn mt-6 flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-4 text-lg font-bold text-white shadow-xl disabled:opacity-60"
      >
        <GoogleIcon />
        Logg inn med Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200" />
        ELLER
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onLogin}
          disabled={busy}
          className="rounded-2xl border-2 border-fuchsia-300 bg-white px-3 py-3 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
        >
          Brukernavn
        </button>
        <button
          onClick={onSignup}
          disabled={busy}
          className="rounded-2xl border-2 border-purple-300 bg-white px-3 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
        >
          Lag konto
        </button>
      </div>
    </>
  );
}

function LoginForm({
  busy,
  onSubmit,
  onBack,
  onGoSignup,
}: {
  busy: boolean;
  onSubmit: (username: string, password: string) => void;
  onBack: () => void;
  onGoSignup: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(username, password);
      }}
      className="mt-6 space-y-4"
    >
      <Field
        label="Brukernavn"
        type="text"
        value={username}
        onChange={setUsername}
        autoComplete="username"
        autoFocus
      />
      <Field
        label="Passord"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />
      <button
        type="submit"
        disabled={busy}
        className="party-btn flex w-full items-center justify-center rounded-2xl px-4 py-3 text-base font-bold text-white shadow-xl disabled:opacity-60"
      >
        {busy ? "Logger inn…" : "Logg inn"}
      </button>
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <button type="button" onClick={onBack} className="hover:text-zinc-800">
          ← Tilbake
        </button>
        <button type="button" onClick={onGoSignup} className="font-medium text-fuchsia-700 hover:underline">
          Lag ny konto
        </button>
      </div>
    </form>
  );
}

function SignupForm({
  busy,
  onSubmit,
  onBack,
  onGoLogin,
}: {
  busy: boolean;
  onSubmit: (displayName: string, username: string, password: string) => void;
  onBack: () => void;
  onGoLogin: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(displayName, username, password);
      }}
      className="mt-6 space-y-4"
    >
      <Field
        label="Navn"
        type="text"
        value={displayName}
        onChange={setDisplayName}
        autoComplete="name"
        autoFocus
      />
      <Field
        label="Brukernavn"
        type="text"
        value={username}
        onChange={setUsername}
        autoComplete="username"
        hint="3–20 tegn, bokstaver/tall/_/-"
      />
      <Field
        label="Passord"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint="Minst 6 tegn"
      />
      <button
        type="submit"
        disabled={busy}
        className="party-btn flex w-full items-center justify-center rounded-2xl px-4 py-3 text-base font-bold text-white shadow-xl disabled:opacity-60"
      >
        {busy ? "Lager konto…" : "Lag konto"}
      </button>
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <button type="button" onClick={onBack} className="hover:text-zinc-800">
          ← Tilbake
        </button>
        <button type="button" onClick={onGoLogin} className="font-medium text-fuchsia-700 hover:underline">
          Har du allerede konto? Logg inn
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  autoFocus,
  hint,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  autoFocus?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200"
      />
      {hint && <span className="mt-1 block text-xs text-zinc-400">{hint}</span>}
    </label>
  );
}

function Cake() {
  return (
    <svg width="100" height="100" viewBox="0 0 120 120" aria-hidden="true" className="cake-bounce">
      <ellipse cx="60" cy="22" rx="3" ry="7" fill="#fbbf24" className="cake-flame" />
      <ellipse cx="60" cy="22" rx="6" ry="10" fill="#fef3c7" opacity="0.5" className="cake-flame" />
      <rect x="58" y="26" width="4" height="20" fill="#f9a8d4" />
      <rect x="20" y="46" width="80" height="22" rx="4" fill="#f472b6" />
      <path d="M20 56 q10 -8 20 0 t20 0 t20 0 t20 0 v12 h-80 z" fill="#fce7f3" />
      <rect x="14" y="66" width="92" height="30" rx="6" fill="#a855f7" />
      <path d="M14 78 q12 -10 23 0 t23 0 t23 0 t23 0 v18 h-92 z" fill="#fbbf24" />
      <circle cx="30" cy="86" r="3.5" fill="#ef4444" />
      <circle cx="60" cy="90" r="3.5" fill="#3b82f6" />
      <circle cx="90" cy="86" r="3.5" fill="#10b981" />
      <rect x="10" y="96" width="100" height="10" rx="3" fill="#7c3aed" />
    </svg>
  );
}

function SpinningGift() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true" className="gift-spin">
      <rect x="6" y="22" width="48" height="34" rx="3" fill="#ef4444" />
      <rect x="26" y="22" width="8" height="34" fill="#fbbf24" />
      <rect x="6" y="18" width="48" height="8" rx="2" fill="#dc2626" />
      <rect x="26" y="18" width="8" height="8" fill="#f59e0b" />
      <path d="M30 18 q-10 -10 -14 -2 q-2 6 8 4 q-4 -4 6 -2 z" fill="#fbbf24" />
      <path d="M30 18 q10 -10 14 -2 q2 6 -8 4 q4 -4 -6 -2 z" fill="#fbbf24" />
    </svg>
  );
}

function PartyHat() {
  return (
    <svg width="60" height="80" viewBox="0 0 60 80" aria-hidden="true" className="hat-tilt">
      <path d="M30 8 L48 64 L12 64 Z" fill="#a855f7" />
      <path d="M30 8 L42 44 L18 44 Z" fill="#c084fc" opacity="0.7" />
      <circle cx="30" cy="8" r="5" fill="#fbbf24" />
      <circle cx="30" cy="8" r="2" fill="#fff" />
      <circle cx="22" cy="32" r="3" fill="#f472b6" />
      <circle cx="38" cy="48" r="3" fill="#10b981" />
      <ellipse cx="30" cy="66" rx="20" ry="4" fill="#7c3aed" />
    </svg>
  );
}

function Balloons() {
  const balloons = [
    { left: "5%", color: "#f472b6", delay: "0s", duration: "14s", size: 56 },
    { left: "12%", color: "#a855f7", delay: "4s", duration: "18s", size: 40 },
    { left: "20%", color: "#fbbf24", delay: "2s", duration: "16s", size: 60 },
    { left: "32%", color: "#3b82f6", delay: "6s", duration: "20s", size: 44 },
    { left: "45%", color: "#10b981", delay: "1s", duration: "17s", size: 52 },
    { left: "60%", color: "#ef4444", delay: "8s", duration: "22s", size: 48 },
    { left: "70%", color: "#f472b6", delay: "3s", duration: "15s", size: 56 },
    { left: "82%", color: "#a855f7", delay: "5s", duration: "19s", size: 42 },
    { left: "92%", color: "#fbbf24", delay: "7s", duration: "21s", size: 50 },
  ];
  return (
    <>
      {balloons.map((b, i) => (
        <div
          key={i}
          className="balloon"
          style={{
            left: b.left,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        >
          <svg width={b.size} height={b.size * 1.4} viewBox="0 0 48 64" aria-hidden="true">
            <ellipse cx="24" cy="22" rx="18" ry="22" fill={b.color} opacity="0.9" />
            <ellipse cx="18" cy="14" rx="4" ry="6" fill="#fff" opacity="0.4" />
            <path d="M24 44 l-2 4 l4 0 z" fill={b.color} opacity="0.9" />
            <path d="M24 48 q-3 6 0 12 t0 4" stroke="#94a3b8" strokeWidth="1" fill="none" />
          </svg>
        </div>
      ))}
    </>
  );
}

function Confetti() {
  const colors = ["#f472b6", "#a855f7", "#fbbf24", "#3b82f6", "#10b981", "#ef4444", "#ec4899", "#06b6d4"];
  const shapes = ["rect", "circle", "tri"] as const;
  const pieces = Array.from({ length: 70 }, (_, i) => ({
    left: `${(i * 17) % 100}%`,
    color: colors[i % colors.length],
    delay: `${(i % 14) * 0.4}s`,
    duration: `${5 + (i % 6)}s`,
    rotate: `${i * 27}deg`,
    shape: shapes[i % 3],
    size: 6 + (i % 4) * 2,
  }));
  return (
    <>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`confetti confetti-${p.shape}`}
          style={{
            left: p.left,
            background: p.shape !== "tri" ? p.color : "transparent",
            borderBottomColor: p.shape === "tri" ? p.color : undefined,
            width: `${p.size}px`,
            height: `${p.size + 4}px`,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotate})`,
          }}
        />
      ))}
    </>
  );
}

function Stars() {
  const stars = Array.from({ length: 25 }, (_, i) => ({
    left: `${(i * 13) % 100}%`,
    top: `${(i * 31) % 100}%`,
    delay: `${(i % 8) * 0.3}s`,
    size: 4 + (i % 3) * 3,
  }));
  return (
    <>
      {stars.map((s, i) => (
        <span
          key={i}
          className="sparkle"
          style={{
            left: s.left,
            top: s.top,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: s.delay,
          }}
        />
      ))}
    </>
  );
}

function Streamers() {
  const colors = ["#f472b6", "#a855f7", "#fbbf24", "#3b82f6", "#10b981", "#ef4444", "#ec4899"];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-around">
      {colors.map((c, i) => (
        <div
          key={i}
          className="streamer"
          style={{
            background: `linear-gradient(to bottom, ${c} 0%, ${c} 70%, transparent 100%)`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

function DiscoRays() {
  return <div className="disco-rays absolute inset-0" />;
}

function BurstBurst({ x, y }: { x: number; y: number }) {
  const colors = ["#f472b6", "#a855f7", "#fbbf24", "#3b82f6", "#10b981", "#ef4444", "#ec4899", "#06b6d4"];
  const pieces = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const dist = 80 + (i % 4) * 30;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      color: colors[i % colors.length],
    };
  });
  return (
    <>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="burst"
          style={{
            left: x,
            top: y,
            background: p.color,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
          }}
        />
      ))}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#fff" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.5-8 19.5-20 0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
