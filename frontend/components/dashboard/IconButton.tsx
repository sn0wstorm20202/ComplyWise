"use client";

import React from "react";

export type IconButtonVariant = "default" | "subtle" | "dark" | "ghost" | "sage";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  label: string;
  isActive?: boolean;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default:
    "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs hover:border-slate-300",
  subtle:
    "bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border-transparent",
  dark:
    "bg-[#0f172a] hover:bg-slate-800 text-white shadow-xs border-transparent",
  ghost:
    "bg-transparent hover:bg-black/5 text-slate-600 hover:text-slate-900 border-transparent",
  sage:
    "bg-white hover:bg-slate-50 text-slate-900 shadow-md border border-black/[0.04]",
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

export function IconButton({
  icon,
  variant = "default",
  size = "md",
  label,
  isActive = false,
  className = "",
  disabled,
  ...props
}: IconButtonProps) {
  const chosenVariant = isActive ? "dark" : variant;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles[chosenVariant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}

export default IconButton;
