import * as React from "react"

interface CollapsibleProps {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ children, defaultOpen = false, open, onOpenChange, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen

    const handleToggle = React.useCallback(() => {
      if (isControlled) {
        onOpenChange?.(!isOpen)
      } else {
        setInternalOpen(!internalOpen)
      }
    }, [isControlled, isOpen, internalOpen, onOpenChange])

    return (
      <div ref={ref} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === CollapsibleTrigger) {
              return React.cloneElement(child, { onClick: handleToggle })
            }
            if (child.type === CollapsibleContent) {
              return isOpen ? child : null
            }
          }
          return child
        })}
      </div>
    )
  }
)
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { onClick?: () => void }
>(({ children, onClick, ...props }, ref) => (
  <button ref={ref} onClick={onClick} {...props}>
    {children}
  </button>
))
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }