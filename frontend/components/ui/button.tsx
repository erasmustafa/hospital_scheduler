"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "icon";

const byVariant: Record<ButtonVariant, string> = {
  default: "bg-sky-600 text-white hover:bg-sky-700",
  outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100"
};

const bySize: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-sm",
  icon: "h-9 w-9"
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
        byVariant[variant],
        bySize[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

Button.displayName = "Button";
