import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function StatCard({ 
  title, 
  value, 
  subValue,
  trend 
}: { 
  title: string; 
  value: React.ReactNode; 
  subValue?: React.ReactNode;
  trend?: "up" | "down" | "neutral"
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">{title}</h3>
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
        {subValue && (
          <div className={cn(
            "text-sm font-medium",
            trend === "up" ? "text-green-600 dark:text-green-400" : 
            trend === "down" ? "text-red-600 dark:text-red-400" : 
            "text-neutral-500 dark:text-neutral-400"
          )}>
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfitLossNumber({ amount, percentage, className }: { amount: number, percentage?: number, className?: string }) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  
  const sign = isPositive ? "+" : isNegative ? "-" : "";
  const absAmount = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  return (
    <span className={cn(
      "font-semibold tabular-nums",
      isPositive ? "text-green-600 dark:text-green-400" : isNegative ? "text-red-600 dark:text-red-400" : "text-neutral-600 dark:text-neutral-400",
      className
    )}>
      {sign}${absAmount}
      {percentage !== undefined && (
        <span className="ml-1 text-xs">
          ({sign}{Math.abs(percentage).toFixed(2)}%)
        </span>
      )}
    </span>
  );
}

export function Tag({ children, color }: { children: React.ReactNode, color: "green" | "red" | "blue" | "gray" | "yellow" }) {
  const colorClasses = {
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    gray: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium inline-flex items-center", colorClasses[color])}>
      {children}
    </span>
  );
}

export function Button({ 
  children, 
  variant = "primary",
  size = "md",
  className,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost",
  size?: "sm" | "md" | "lg"
}) {
  const base = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950 rounded-lg disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 focus:ring-neutral-900 dark:focus:ring-white",
    secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 focus:ring-neutral-500",
    outline: "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:ring-neutral-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 dark:focus:ring-red-500",
    ghost: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={cn(
        "flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-500",
        className
      )}
      {...props}
    />
  );
}
