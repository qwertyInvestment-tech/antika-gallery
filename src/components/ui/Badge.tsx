type BadgeProps = {
  children: string;
  tone?: "default" | "sold" | "quiet";
};

const tones = {
  default: "text-walnut",
  sold: "text-muted",
  quiet: "text-muted",
};

export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span className={`text-[0.68rem] tracking-[0.22em] uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}
