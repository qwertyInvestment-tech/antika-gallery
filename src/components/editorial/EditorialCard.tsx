import type { ReactNode } from "react";

type EditorialCardProps = {
  children: ReactNode;
  className?: string;
};

export function EditorialCard({ children, className = "" }: EditorialCardProps) {
  return <article className={`relative ${className}`}>{children}</article>;
}
