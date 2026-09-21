import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-ink text-ivory-soft hover:bg-walnut-deep border border-ink",
  secondary:
    "bg-transparent text-ink border border-ink/25 hover:border-ink hover:bg-parchment/50",
  ghost: "bg-transparent text-ink hover:text-walnut",
} as const;

const sizes = {
  md: "px-6 py-3 text-[0.8rem] tracking-[0.16em] uppercase",
  sm: "px-4 py-2 text-[0.72rem] tracking-[0.14em] uppercase",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-[1px] transition-colors duration-300 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
