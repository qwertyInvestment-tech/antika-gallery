import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "ivory" | "parchment" | "walnut";
};

const tones = {
  ivory: "bg-ivory text-ink",
  parchment: "bg-parchment/55 text-ink",
  walnut: "bg-walnut-deep text-ivory-soft",
};

export function Section({ children, className = "", id, tone = "ivory" }: SectionProps) {
  return (
    <section id={id} className={`py-20 md:py-28 ${tones[tone]} ${className}`}>
      {children}
    </section>
  );
}
