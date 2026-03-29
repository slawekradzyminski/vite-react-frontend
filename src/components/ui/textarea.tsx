import * as React from "react"

import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    'data-testid'?: string;
  }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, 'data-testid': dataTestId, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-[1.25rem] border border-stone-200 bg-white/92 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        data-testid={dataTestId || 'textarea'}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea } 
