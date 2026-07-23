"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: "home" | "library" | "sparkles" | "chart" | "profile";
  match: (pathname: string) => boolean;
  featured?: boolean;
};

const items: NavItem[] = [
  {
    label: "Início",
    href: "/",
    icon: "home",
    match: (pathname) => pathname === "/",
  },
  {
    label: "Biblioteca",
    href: "/biblioteca",
    icon: "library",
    match: (pathname) =>
      pathname.startsWith("/biblioteca") || pathname.startsWith("/jogos/"),
  },
  {
    label: "IA",
    href: "/ia",
    icon: "sparkles",
    match: (pathname) => pathname.startsWith("/ia"),
    featured: true,
  },
  {
    label: "Análises",
    href: "/analises",
    icon: "chart",
    match: (pathname) => pathname.startsWith("/analises"),
  },
  {
    label: "Perfil",
    href: "/perfil",
    icon: "profile",
    match: (pathname) => pathname.startsWith("/perfil"),
  },
];

type NavIconProps = {
  name: NavItem["icon"];
};

function NavIcon({ name }: NavIconProps) {
  const commonProps = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...commonProps}>
        <path d="M3.5 10.7 12 3.8l8.5 6.9" />
        <path d="M5.5 9.5v10.2h13V9.5" />
        <path d="M9.4 19.7v-5.8h5.2v5.8" />
      </svg>
    );
  }

  if (name === "library") {
    return (
      <svg {...commonProps}>
        <rect x="3.5" y="4" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="4" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="14" width="7" height="6" rx="1.5" />
        <rect x="13.5" y="14" width="7" height="6" rx="1.5" />
      </svg>
    );
  }

  if (name === "sparkles") {
    return (
      <svg {...commonProps}>
        <path d="M12 3.2c.5 3.2 2.2 4.9 5.4 5.4-3.2.5-4.9 2.2-5.4 5.4-.5-3.2-2.2-4.9-5.4-5.4C9.8 8.1 11.5 6.4 12 3.2Z" />
        <path d="M18.1 14.3c.3 1.9 1.3 2.9 3.2 3.2-1.9.3-2.9 1.3-3.2 3.2-.3-1.9-1.3-2.9-3.2-3.2 1.9-.3 2.9-1.3 3.2-3.2Z" />
        <path d="M5.2 14.7c.2 1.2.9 1.9 2.1 2.1-1.2.2-1.9.9-2.1 2.1-.2-1.2-.9-1.9-2.1-2.1 1.2-.2 1.9-.9 2.1-2.1Z" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg {...commonProps}>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20V8" />
        <path d="M2.5 20.2h20" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.2 20c.7-4 3-6 6.8-6s6.1 2 6.8 6" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pt-2"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        aria-label="Navegação principal"
        className="grid w-full max-w-xl grid-cols-5 items-end rounded-[30px] border border-white/10 bg-zinc-950/90 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl"
      >
        {items.map((item) => {
          const isActive = item.match(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex min-w-0 flex-col items-center justify-center rounded-[20px] px-1 py-2 text-center transition-all duration-200 ${
                isActive
                  ? "bg-white text-black shadow-lg shadow-black/20"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-100"
              } ${item.featured ? "mx-0.5" : ""}`}
            >
              {item.featured && !isActive ? (
                <span className="absolute inset-x-2 -top-1 h-px bg-gradient-to-r from-transparent via-violet-400/80 to-transparent" />
              ) : null}

              <span
                className={`flex h-7 w-7 items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
                  item.featured && !isActive
                    ? "rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-400/10 text-violet-200"
                    : ""
                }`}
              >
                <NavIcon name={item.icon} />
              </span>

              <span className="mt-1 max-w-full truncate text-[10px] font-medium tracking-tight sm:text-[11px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
