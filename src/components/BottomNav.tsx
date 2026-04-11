"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const items: NavItem[] = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Biblioteca", href: "/biblioteca", icon: "▦" },
  { label: "Perfil", href: "/perfil", icon: "◉" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <nav className="flex w-full max-w-md items-center justify-between rounded-[28px] border border-white/10 bg-zinc-900/80 px-3 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-w-[88px] flex-col items-center justify-center rounded-2xl px-4 py-2 transition-all duration-200 ${
                isActive
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`text-base transition-transform duration-200 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
              >
                {item.icon}
              </span>

              <span className="mt-1 text-[11px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}