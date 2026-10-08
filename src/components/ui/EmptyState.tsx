import { motion } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "cn"

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon = "search_off", title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 bg-card border border-dashed border-border/60 rounded-3xl text-center min-h-[300px]",
        className
      )}
    >
      <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 rotate-3">
        <span className="material-symbols-outlined text-4xl text-primary -rotate-3">
          {icon}
        </span>
      </div>
      <h3 className="text-xl font-extrabold text-foreground mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="flex items-center justify-center">
          {action}
        </div>
      )}
    </motion.div>
  )
}
