import Link from "next/link";
import type { ReactNode } from "react";

type DynamicNavigationLink = {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
};

type DynamicNavigationProps = {
  links: DynamicNavigationLink[];
  theme?: "light" | "dark";
  glowIntensity?: number;
  className?: string;
};

export function DynamicNavigation({
  links,
  theme = "light",
  glowIntensity = 4,
  className = "",
}: DynamicNavigationProps) {
  const isDark = theme === "dark";
  const glowOpacity = Math.min(Math.max(glowIntensity, 1), 10) / 10;

  return (
    <nav
      aria-label="Ana navigasyon"
      className={[
        "hidden items-center gap-2 md:flex",
        isDark ? "text-white" : "text-slate-700",
        className,
      ].join(" ")}
    >
      {links.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className={[
            "group relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-xl px-3 text-[13px] font-semibold transition duration-300",
            isDark ? "text-white/82 hover:text-white" : "text-slate-600 hover:text-blue-700",
          ].join(" ")}
        >
          <span
            className={[
              "absolute inset-0 scale-95 rounded-xl opacity-0 blur-sm transition duration-300 group-hover:scale-100 group-hover:opacity-100",
              isDark ? "bg-white/16" : "bg-blue-50",
            ].join(" ")}
            style={{
              boxShadow: isDark
                ? `0 0 ${glowIntensity * 5}px rgba(255,255,255,${glowOpacity * 0.18})`
                : `0 0 ${glowIntensity * 5}px rgba(37,99,235,${glowOpacity * 0.14})`,
            }}
          />
          {link.icon ? (
            <span className="relative z-10 flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4 [&_svg]:stroke-[1.9]">
              {link.icon}
            </span>
          ) : null}
          <span className="relative z-10">{link.label}</span>
          <span
            className={[
              "absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full transition-all duration-300 group-hover:w-5",
              isDark ? "bg-white" : "bg-blue-600",
            ].join(" ")}
          />
        </Link>
      ))}
    </nav>
  );
}
