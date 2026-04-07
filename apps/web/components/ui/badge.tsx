import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]",
  {
    variants: {
      variant: {
        default: "border-accent/30 bg-accent/10 text-accent",
        secondary: "border-border bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        muted: "border-border/50 bg-surface/50 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
