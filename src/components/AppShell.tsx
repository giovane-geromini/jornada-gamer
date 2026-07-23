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
    <main className="min-h-screen overflow-x-hidden bg-black text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-140px] top-[-100px] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[-170px] top-[120px] h-[430px] w-[430px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[-210px] left-1/2 h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <section
        className={`relative mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 pt-6 sm:px-6 sm:pt-8 ${
          withNav ? "pb-36" : "pb-10"
        }`}
      >
        {children}
      </section>

      {withNav ? <BottomNav /> : null}
    </main>
  );
}
