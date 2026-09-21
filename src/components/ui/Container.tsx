import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  width?: "default" | "wide" | "narrow";
};

const widths = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-[88rem]",
};

export function Container({ children, className = "", width = "default" }: ContainerProps) {
  return <div className={`mx-auto w-full px-5 sm:px-8 ${widths[width]} ${className}`}>{children}</div>;
}
