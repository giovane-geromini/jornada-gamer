"use client";

import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";

type AppShellProps = {
  children: ReactNode;
  withNav?: boolean;
};

export default function AppShell({
  children,
  withNav = true,
}: AppShellProps) {
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-80px] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[-140px] top-[160px] h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[-180px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 pb-28 pt-6 sm:px-6 sm:pt-8">
        {children}
      </section>

      {withNav ? <BottomNav /> : null}
    </main>
  );
}