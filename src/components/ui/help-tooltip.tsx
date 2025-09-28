import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

interface HelpTooltipProps {
  title: string
  description: string
  whatToLookFor?: string
  className?: string
}

export function HelpTooltip({ title, description, whatToLookFor, className }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className={`h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors ${className}`} />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm p-4">
          <div className="space-y-2">
            <div className="font-semibold text-foreground">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
            {whatToLookFor && (
              <div className="text-sm">
                <span className="font-medium text-blue-400">What to look for:</span>
                <div className="text-muted-foreground mt-1">{whatToLookFor}</div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}