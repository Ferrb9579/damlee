"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface MultiComboboxOption {
  value: string
  label: string
}

export interface MultiComboboxSearchResult {
  options: MultiComboboxOption[]
  hasMore: boolean
}

export interface MultiComboboxProps {
  /** Static options (used when onSearch is not provided) */
  options?: MultiComboboxOption[]
  /** Current selected values */
  value?: string[]
  /** Callback when values change */
  onValueChange?: (values: string[]) => void
  /** Async search function for server-side search */
  onSearch?: (query: string, page: number) => Promise<MultiComboboxSearchResult>
  /** Debounce delay for search in milliseconds */
  searchDebounce?: number
  /** Placeholder text for the trigger button */
  placeholder?: string
  /** Placeholder text for the search input */
  searchPlaceholder?: string
  /** Text shown when no results found */
  emptyText?: string
  /** Text shown while loading */
  loadingText?: string
  /** Additional class names */
  className?: string
  /** Whether the combobox is disabled */
  disabled?: boolean
  /** Maximum number of items that can be selected */
  maxItems?: number
  /** Whether to show selected items as badges in the trigger */
  showBadges?: boolean
}

export function MultiCombobox({
  options: staticOptions = [],
  value,
  onValueChange,
  onSearch,
  searchDebounce = 300,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  loadingText = "Loading...",
  className,
  disabled = false,
  maxItems,
  showBadges = true,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState<string[]>(value ?? [])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [options, setOptions] = React.useState<MultiComboboxOption[]>(staticOptions)
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [selectedOptions, setSelectedOptions] = React.useState<MultiComboboxOption[]>([])
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0)

  const listRef = React.useRef<HTMLDivElement>(null)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const isAsyncMode = Boolean(onSearch)

  React.useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  const currentValues = value ?? internalValue

  // For static mode, use staticOptions directly; for async mode, use options state
  const effectiveOptions = isAsyncMode ? options : staticOptions

  // Sync selected options when values change
  React.useEffect(() => {
    const newSelectedOptions: MultiComboboxOption[] = []
    for (const val of currentValues) {
      const existing = selectedOptions.find((o) => o.value === val)
      if (existing) {
        newSelectedOptions.push(existing)
      } else {
        const fromOptions = effectiveOptions.find((o) => o.value === val)
        if (fromOptions) {
          newSelectedOptions.push(fromOptions)
        }
      }
    }
    // Only update if different
    if (JSON.stringify(newSelectedOptions.map(o => o.value)) !== JSON.stringify(selectedOptions.map(o => o.value))) {
      setSelectedOptions(newSelectedOptions)
    }
  }, [currentValues, effectiveOptions])

  // Reset state when popover opens (async mode only)
  React.useEffect(() => {
    if (open && isAsyncMode) {
      setSearchQuery("")
      setPage(1)
      setOptions([])
      setHasMore(false)
    }
  }, [open, isAsyncMode])

  // Debounced search
  React.useEffect(() => {
    if (!isAsyncMode || !open) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      setPage(1)
      try {
        const result = await onSearch!(searchQuery, 1)
        setOptions(result.options)
        setHasMore(result.hasMore)
      } catch (error) {
        console.error("Search error:", error)
        setOptions([])
        setHasMore(false)
      } finally {
        setIsLoading(false)
      }
    }, searchDebounce)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery, isAsyncMode, onSearch, searchDebounce, open])

  // Load more for infinite scroll
  const loadMore = React.useCallback(async () => {
    if (!isAsyncMode || !hasMore || isLoading) return

    setIsLoading(true)
    const nextPage = page + 1
    try {
      const result = await onSearch!(searchQuery, nextPage)
      setOptions((prev) => [...prev, ...result.options])
      setHasMore(result.hasMore)
      setPage(nextPage)
    } catch (error) {
      console.error("Load more error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [isAsyncMode, hasMore, isLoading, page, onSearch, searchQuery])

  // Infinite scroll handler
  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight

      if (scrollBottom < 50 && hasMore && !isLoading) {
        loadMore()
      }
    },
    [hasMore, isLoading, loadMore]
  )

  const handleSelect = (selectedValue: string) => {
    const isSelected = currentValues.includes(selectedValue)
    let newValues: string[]

    if (isSelected) {
      // Remove from selection
      newValues = currentValues.filter((v) => v !== selectedValue)
      setSelectedOptions((prev) => prev.filter((o) => o.value !== selectedValue))
    } else {
      // Add to selection (check maxItems)
      if (maxItems && currentValues.length >= maxItems) {
        return
      }
      newValues = [...currentValues, selectedValue]
      const option = effectiveOptions.find((o) => o.value === selectedValue)
      if (option) {
        setSelectedOptions((prev) => [...prev, option])
      }
    }

    setInternalValue(newValues)
    onValueChange?.(newValues)
  }

  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
  }

  // Filter static options locally when not in async mode
  const filteredOptions = React.useMemo(() => {
    if (isAsyncMode) return effectiveOptions
    if (!searchQuery) return effectiveOptions
    return effectiveOptions.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [effectiveOptions, searchQuery, isAsyncMode])

  // Render trigger content
  const renderTriggerContent = () => {
    if (currentValues.length === 0) {
      return placeholder
    }

    if (!showBadges || selectedOptions.length === 0) {
      return `${currentValues.length} selected`
    }

    // Show first selected option + count of remaining
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
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        style={{ minWidth: triggerWidth > 0 ? triggerWidth : undefined }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={handleSearchChange}
          />
          <CommandList ref={listRef} onScroll={handleScroll}>
            {isLoading && filteredOptions.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                {loadingText}
              </div>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const isSelected = currentValues.includes(option.value)
                  const isDisabled = !isSelected && maxItems !== undefined && currentValues.length >= maxItems

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={handleSelect}
                      disabled={isDisabled}
                      className={cn(isDisabled && "opacity-50")}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <CheckIcon className="h-3 w-3" />
                      </div>
                      {option.label}
                    </CommandItem>
                  )
                })}
                {isLoading && filteredOptions.length > 0 && (
                  <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                  </div>
                )}
                {hasMore && !isLoading && (
                  <div className="py-2 text-center text-xs text-muted-foreground">
                    Scroll for more
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
