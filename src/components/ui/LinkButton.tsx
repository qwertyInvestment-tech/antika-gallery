import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  primary: "bg-ink text-ivory-soft hover:bg-walnut-deep border border-ink",
  secondary: "bg-transparent text-ink border border-ink/25 hover:border-ink",
  ghost: "bg-transparent text-ink",
} as const;

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
};

export function LinkButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={`group inline-flex items-center justify-center rounded-[1px] px-6 py-3 text-[0.8rem] tracking-[0.16em] uppercase transition-colors duration-300 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
