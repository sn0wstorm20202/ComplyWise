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
    "bg-white hover:bg-[var(--ui-bg)] text-[var(--ui-secondary)] border border-[var(--ui-border)]/80 shadow-2xs hover:border-[var(--ui-border-strong)]",
  subtle:
    "bg-[var(--ui-inset)]/80 hover:bg-[var(--ui-inset)]/80 text-[var(--ui-secondary)] hover:text-[var(--ui-text)] border-transparent",
  dark:
    "bg-[var(--ui-text)] hover:bg-[var(--ui-text)] text-white shadow-xs border-transparent",
  ghost:
    "bg-transparent hover:bg-black/5 text-[var(--ui-secondary)] hover:text-[var(--ui-text)] border-transparent",
  sage:
    "bg-white hover:bg-[var(--ui-bg)] text-[var(--ui-text)] shadow-md border border-black/[0.04]",
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
