import Link from "next/link";
import { publicPaths } from "@/lib/i18n/routes";

type CartButtonProps = {
  className?: string;
};

export function CartButton({ className = "" }: CartButtonProps) {
  return (
    <Link href={publicPaths.cart} className={`text-[0.72rem] tracking-[0.16em] uppercase ${className}`} aria-label="Кошничка">
      Кошничка
    </Link>
  );
}
