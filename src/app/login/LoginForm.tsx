"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type User = { id: string; name: string };

export default function LoginForm({ users }: { users: User[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (users.length === 0) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white p-6 text-center text-sm text-black/60 shadow-card dark:border-white/10 dark:bg-white/5 dark:text-white/60">
        No accounts have been set up yet. From the project on your computer,
        run <code className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">npm run setup-users</code>{" "}
        to create your two accounts, then refresh this page.
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      userId: selected.id,
      pin,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Incorrect PIN. Try again.");
      setPin("");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (!selected) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => setSelected(user)}
            className="flex flex-col items-center gap-3 rounded-3xl border border-black/10 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover dark:border-white/10 dark:bg-white/5"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-xl font-semibold text-accent">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="font-medium">{user.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-black/10 bg-white p-6 shadow-card dark:border-white/10 dark:bg-white/5"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
          {selected.name.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1">
          <div className="font-medium">{selected.name}</div>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setPin("");
              setError(null);
            }}
            className="text-xs text-accent hover:text-accent-hover"
          >
            Not you?
          </button>
        </div>
      </div>

      <label htmlFor="pin" className="mb-1.5 block text-sm font-medium text-black/60 dark:text-white/60">
        PIN
      </label>
      <input
        id="pin"
        type="password"
        inputMode="numeric"
        autoFocus
        maxLength={8}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        className="w-full rounded-xl border border-black/10 bg-canvas px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
        placeholder="••••"
      />

      {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || pin.length < 4}
        className="mt-5 w-full rounded-xl bg-accent py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
