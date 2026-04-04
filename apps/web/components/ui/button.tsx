import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
  {
    variants: {
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
      },
      variant: {
        default: "border-primary bg-primary text-primary-foreground shadow-[0_16px_40px_-24px_rgba(193,87,46,0.55)] hover:bg-primary/92",
        secondary: "border-border/70 bg-white/70 text-foreground hover:bg-white",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/70 hover:text-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export function Button({
  className,
  size,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  );
}
