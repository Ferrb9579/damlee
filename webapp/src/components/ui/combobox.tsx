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

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxSearchResult {
  options: ComboboxOption[]
  hasMore: boolean
}

export interface ComboboxProps {
  /** Static options (used when onSearch is not provided) */
  options?: ComboboxOption[]
  /** Current selected value */
  value?: string
  /** Callback when value changes */
  onValueChange?: (value: string) => void
  /** Async search function for server-side search */
  onSearch?: (query: string, page: number) => Promise<ComboboxSearchResult>
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
}

export function Combobox({
  options: staticOptions = [],
  value,
  onValueChange,
  onSearch,
  searchDebounce = 300,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  loadingText = "Loading...",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(value ?? "")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [options, setOptions] = React.useState<ComboboxOption[]>(staticOptions)
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [selectedOption, setSelectedOption] = React.useState<ComboboxOption | null>(null)
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

  const currentValue = value ?? internalValue

  // For static mode, use staticOptions directly; for async mode, use options state
  const effectiveOptions = isAsyncMode ? options : staticOptions

  // Find selected option from current options or cached selection
  const displayOption = React.useMemo(() => {
    const found = effectiveOptions.find((option) => option.value === currentValue)
    if (found) return found
    if (selectedOption?.value === currentValue) return selectedOption
    return null
  }, [effectiveOptions, currentValue, selectedOption])

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
    const newValue = selectedValue === currentValue ? "" : selectedValue
    const option = effectiveOptions.find((o) => o.value === selectedValue)
    if (option) {
      setSelectedOption(option)
    }
    setInternalValue(newValue)
    onValueChange?.(newValue)
    setOpen(false)
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
            {displayOption?.label ?? placeholder}
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
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentValue === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
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
