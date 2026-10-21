import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#1565C0] text-white shadow-sm hover:bg-[#1565C0]/90 dark:bg-[#3B82F6] dark:hover:bg-[#3B82F6]/90",
        magenta:
          "bg-[#D81B60] text-white shadow-sm hover:bg-[#D81B60]/90 dark:bg-[#EC4899] dark:hover:bg-[#EC4899]/90",
        plum:
          "bg-[#6A1B4D] text-white shadow-sm hover:bg-[#6A1B4D]/90 dark:bg-[#9D2B73] dark:hover:bg-[#9D2B73]/90",
        orange:
          "bg-[#F57C00] text-white shadow-sm hover:bg-[#F57C00]/90 dark:bg-[#FB923C] dark:text-slate-950 dark:hover:bg-[#FB923C]/90",
        navy:
          "bg-[#1E3A8A] text-white shadow-sm hover:bg-[#1E3A8A]/90 dark:bg-[#4F46E5] dark:hover:bg-[#4F46E5]/90",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-600/90",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100",
        link: "text-[#1565C0] underline-offset-4 hover:underline dark:text-[#60A5FA]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base font-semibold", // >= 48px touch target
        field: "min-h-[48px] px-5 py-2.5 text-sm font-semibold", // Regra de Ouro mobile 48px
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
