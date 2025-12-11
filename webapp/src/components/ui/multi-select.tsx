"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface MultiSelectProps {
  /** Options to display in the dropdown */
  options: MultiSelectOption[]
  /** Current selected values */
  value?: string[]
  /** Callback when values change */
  onValueChange?: (values: string[]) => void
  /** Placeholder text for the trigger button */
  placeholder?: string
  /** Additional class names */
  className?: string
  /** Whether the select is disabled */
  disabled?: boolean
  /** Maximum number of items that can be selected */
  maxItems?: number
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select options...",
  className,
  disabled = false,
  maxItems,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState<string[]>(value ?? [])
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0)

  React.useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  const currentValues = value ?? internalValue

  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => currentValues.includes(option.value))
  }, [options, currentValues])

  const handleSelect = (selectedValue: string) => {
    const isSelected = currentValues.includes(selectedValue)
    let newValues: string[]

    if (isSelected) {
      newValues = currentValues.filter((v) => v !== selectedValue)
    } else {
      if (maxItems && currentValues.length >= maxItems) {
        return
      }
      newValues = [...currentValues, selectedValue]
    }

    setInternalValue(newValues)
    onValueChange?.(newValues)
  }

  const renderTriggerContent = () => {
    if (selectedOptions.length === 0) {
      return placeholder
    }

    const firstOption = selectedOptions[0]
    const remainingCount = selectedOptions.length - 1

    if (remainingCount > 0) {
      return `${firstOption.label} +${remainingCount}`
    }

    return firstOption.label
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-[200px] justify-between", className)}
        >
          <span className="truncate">
            {renderTriggerContent()}
          </span>
          <ChevronDownIcon className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
            open && "rotate-180"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-1"
        align="start"
        style={{ minWidth: triggerWidth > 0 ? triggerWidth : undefined }}
      >
        <ScrollArea className="max-h-[300px]">
          <div className="flex flex-col">
            {options.map((option) => {
              const isSelected = currentValues.includes(option.value)
              const isDisabled = option.disabled || (!isSelected && maxItems !== undefined && currentValues.length >= maxItems)

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    isDisabled && "pointer-events-none opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <CheckIcon className="h-3 w-3" />
                  </div>
                  {option.label}
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
