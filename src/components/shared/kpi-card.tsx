import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: string
    direction: "up" | "down" | "neutral"
  }
  icon?: LucideIcon
  color?: "blue" | "yellow" | "pink" | "white"
  rotate?: "left" | "right" | "none"
}

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = "blue",
  rotate = "right",
}: KPICardProps) {
  const colorClasses = {
    blue: "bg-[#0055FF] text-white",
    yellow: "bg-[#FFCC00] text-black",
    pink: "bg-[#FF3366] text-white",
    white: "bg-white text-black",
  }

  const rotateClasses = {
    left: "-rotate-1",
    right: "rotate-1",
    none: "",
  }

  return (
    <div
      className={cn(
        "border-[6px] border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all transform",
        colorClasses[color],
        rotateClasses[rotate],
        "group",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-black">{title}</h3>
        {Icon && <Icon className="w-8 h-8 opacity-70 group-hover:scale-125 transition-transform" />}
      </div>
      <div className="bg-white border-[4px] border-black p-3 mb-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
        <div className="text-4xl font-black">{value}</div>
      </div>
      <div className="flex items-center justify-between">
        {subtitle && <div className={cn(color === "white" ? "font-bold" : "text-white font-bold")}>{subtitle}</div>}
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 font-bold text-sm",
              trend.direction === "up"
                ? "bg-black text-white group-hover:bg-[#FFCC00] group-hover:text-black"
                : "bg-black text-white group-hover:bg-[#FF3366] group-hover:text-white",
              "transition-colors",
            )}
          >
            {trend.direction === "up" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                <polyline points="17 18 23 18 23 12"></polyline>
              </svg>
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  )
}

