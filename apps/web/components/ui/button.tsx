import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/60",
  {
    variants: {
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
      },
      variant: {
        default: "border-accent bg-accent text-accent-foreground hover:opacity-90",
        secondary: "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-surface hover:text-foreground",
        outline: "border-border bg-transparent text-foreground hover:bg-surface",
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
