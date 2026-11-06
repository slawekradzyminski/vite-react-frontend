import * as React from "react"

import { cn } from "../../lib/utils"
import { fieldErrorAriaProps } from "../../lib/fieldError"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
    'data-testid'?: string;
  }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, 'data-testid': dataTestId, 'aria-describedby': describedBy, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-[1.25rem] border border-stone-200 bg-white/92 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        data-testid={dataTestId || 'textarea'}
        {...props}
        {...fieldErrorAriaProps(props.id, error, describedBy)}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea } 
