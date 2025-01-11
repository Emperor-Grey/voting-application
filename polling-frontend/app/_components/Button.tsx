import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 shadow-sm hover:scale-95",
          variant === "primary" && "bg-primary text-white hover:bg-primary/90",
          variant === "secondary" &&
            "bg-gray-200 text-gray-900 hover:bg-gray-300",
          isLoading && "opacity-50 cursor-not-allowed",
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
