import type { ReactNode } from "react";

export default function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-4xl border border-black/5 bg-white p-6 shadow-card transition-shadow hover:shadow-cardHover dark:border-white/10 dark:bg-white/5 sm:p-7">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-black/45 dark:text-white/45">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
