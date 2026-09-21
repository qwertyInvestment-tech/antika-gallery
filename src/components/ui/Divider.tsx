type DividerProps = {
  className?: string;
  soft?: boolean;
};

export function Divider({ className = "", soft = false }: DividerProps) {
  return (
    <hr
      className={`border-0 ${soft ? "h-px bg-line" : "h-px bg-rule"} ${className}`}
    />
  );
}
