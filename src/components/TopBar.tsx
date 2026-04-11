"use client";

type TopBarProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export default function TopBar({
  eyebrow,
  title,
  subtitle,
  rightSlot,
}: TopBarProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
        ) : null}
      </div>

      {rightSlot ? <div>{rightSlot}</div> : null}
    </div>
  );
}