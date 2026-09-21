type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  invert?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  invert = false,
}: SectionHeadingProps) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow ? (
        <p
          className={`text-[0.72rem] tracking-[0.28em] uppercase ${invert ? "text-ivory-soft/60" : "text-muted"}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl ${eyebrow ? "mt-4" : ""} ${invert ? "text-ivory-soft" : "text-ink"}`}
      >
        {title}
      </h2>
      {description ? (
        <p className={`mt-5 max-w-xl text-base leading-8 ${invert ? "text-ivory-soft/70" : "text-muted"}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
