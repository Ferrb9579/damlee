import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronsUpDownIcon,
  EyeOffIcon,
  RotateCcwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  FilterIcon,
  ColumnsIcon,
  GripVerticalIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  XIcon,
  CheckIcon,
  PlusIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select } from "@/components/select"

// ============================================================================
// Types
// ============================================================================

// Re-export ColumnDef from TanStack Table for convenience
export type { ColumnDef }

export interface FilterConfig {
  id: string
  column: string
  operator: FilterOperator
  value: string
}

export type FilterOperator = "contains" | "equals" | "starts_with" | "ends_with" | "not_equals"

export interface DataTableProps<TData, TValue> {
  /** Data to display in the table */
  data: TData[]
  /** Column definitions (TanStack Table format) */
  columns: ColumnDef<TData, TValue>[]
  /** Additional class names */
  className?: string
  /** Whether to show the search bar */
  showSearch?: boolean
  /** Whether to show the filter menu */
  showFilter?: boolean
  /** Whether to show the sort menu */
  showSort?: boolean
  /** Whether to show the view menu */
  showView?: boolean
  /** Whether to show pagination */
  showPagination?: boolean
  /** Default page size */
  defaultPageSize?: number
  /** Available page size options */
  pageSizeOptions?: number[]
}

// ============================================================================
// Constants
// ============================================================================

const FILTER_OPERATORS = [
  { value: "contains", label: "contains" },
  { value: "equals", label: "equals" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "not_equals", label: "not equals" },
]

// ============================================================================
// Helper Functions
// ============================================================================

function getColumnHeader<TData, TValue>(column: ColumnDef<TData, TValue>): string {
  if (typeof column.header === "string") return column.header
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (column as any).accessorKey ?? column.id ?? ""
}

function applyCustomFilters<TData>(
  data: TData[],
  filters: FilterConfig[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[]
): TData[] {
  if (filters.length === 0) return data

  return data.filter((row) => {
    return filters.every((filter) => {
      if (!filter.value) return true

      // Find the column and get accessor key
      const column = columns.find((col) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const colId = col.id ?? (col as any).accessorKey
        return colId === filter.column
      })
      if (!column) return true

      // Get value from row
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accessorKey = (column as any).accessorKey as keyof TData
      if (!accessorKey) return true

      const cellValue = String(row[accessorKey] ?? "").toLowerCase()
      const filterValue = filter.value.toLowerCase()

      switch (filter.operator) {
        case "contains":
          return cellValue.includes(filterValue)
        case "equals":
          return cellValue === filterValue
        case "starts_with":
          return cellValue.startsWith(filterValue)
        case "ends_with":
          return cellValue.endsWith(filterValue)
        case "not_equals":
          return cellValue !== filterValue
        default:
          return true
      }
    })
  })
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ColumnHeaderMenuProps {
  header: string
  isSorted: false | "asc" | "desc"
  onSort: (direction: "asc" | "desc" | false) => void
  onHide: () => void
}

function ColumnHeaderMenu({ header, isSorted, onSort, onHide }: ColumnHeaderMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
          <span>{header}</span>
          {isSorted === "asc" ? (
            <ArrowUpIcon className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDownIcon className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onSort("asc")}>
          <ArrowUpIcon className="mr-2 h-4 w-4" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort("desc")}>
          <ArrowDownIcon className="mr-2 h-4 w-4" />
          Desc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort(false)}>
          <RotateCcwIcon className="mr-2 h-4 w-4" />
          Reset
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onHide}>
          <EyeOffIcon className="mr-2 h-4 w-4" />
          Hide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ViewMenuProps {
  columns: { id: string; header: string; isVisible: boolean }[]
  onToggleColumn: (columnId: string) => void
}

function ViewMenu({ columns, onToggleColumn }: ViewMenuProps) {
  const [search, setSearch] = React.useState("")

  const filteredColumns = columns.filter((col) =>
    col.header.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <ColumnsIcon className="mr-2 h-4 w-4" />
          View
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="flex items-center gap-2 pb-2">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search columns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredColumns.map((column) => (
            <button
              key={column.id}
              onClick={() => onToggleColumn(column.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground outline-none"
              )}
            >
              <span>{column.header}</span>
              {column.isVisible && <CheckIcon className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface SortMenuProps {
  columns: { id: string; header: string }[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
}

function SortMenu({ columns, sorting, onSortingChange }: SortMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const columnOptions = columns.map((col) => ({
    value: col.id,
    label: col.header,
  }))

  const directionOptions = [
    { value: "asc", label: "Asc" },
    { value: "desc", label: "Desc" },
  ]

  const addSort = () => {
    const usedColumns = new Set(sorting.map((s) => s.id))
    const availableColumn = columns.find((col) => !usedColumns.has(col.id))
    if (availableColumn) {
      onSortingChange([...sorting, { id: availableColumn.id, desc: false }])
    }
  }

  const removeSort = (index: number) => {
    onSortingChange(sorting.filter((_, i) => i !== index))
  }

  const updateSortColumn = (index: number, columnId: string) => {
    onSortingChange(
      sorting.map((sort, i) => (i === index ? { ...sort, id: columnId } : sort))
    )
  }

  const updateSortDirection = (index: number, direction: string) => {
    onSortingChange(
      sorting.map((sort, i) => (i === index ? { ...sort, desc: direction === "desc" } : sort))
    )
  }

  const resetSorts = () => {
    onSortingChange([])
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(index))
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newSorting = [...sorting]
    const [draggedItem] = newSorting.splice(draggedIndex, 1)
    newSorting.splice(dropIndex, 0, draggedItem)
    onSortingChange(newSorting)

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <SlidersHorizontalIcon className="mr-2 h-4 w-4" />
          Sort
          {sorting.length > 0 && (
            <span className="ml-1 rounded-sm bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {sorting.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="space-y-3">
          <div className="text-sm font-medium">Sort by</div>
          <div className="space-y-2">
            {sorting.map((sort, index) => {
              // Available columns: current + unused
              const usedColumns = new Set(sorting.map((s) => s.id))
              const availableOptions = columnOptions.filter(
                (opt) => opt.value === sort.id || !usedColumns.has(opt.value)
              )

              return (
                <div
                  key={`${sort.id}-${index}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md transition-colors",
                    draggedIndex === index && "opacity-50",
                    dragOverIndex === index && "bg-accent"
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <button
                    type="button"
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <Select
                    options={availableOptions}
                    value={sort.id}
                    onValueChange={(value) => updateSortColumn(index, value)}
                    placeholder="Column"
                    className="flex-1 h-8"
                  />
                  <Select
                    options={directionOptions}
                    value={sort.desc ? "desc" : "asc"}
                    onValueChange={(value) => updateSortDirection(index, value)}
                    placeholder="Direction"
                    className="w-20 h-8"
                  />
                  <Button variant="ghost" size="icon-sm" onClick={() => removeSort(index)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addSort}
              disabled={sorting.length >= columns.length}
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              Add sort
            </Button>
            {sorting.length > 0 && (
              <Button variant="outline" size="sm" onClick={resetSorts}>
                Reset sorting
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface FilterMenuProps {
  columns: { id: string; header: string }[]
  filters: FilterConfig[]
  onFiltersChange: (filters: FilterConfig[]) => void
}

function FilterMenu({ columns, filters, onFiltersChange }: FilterMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const columnOptions = columns.map((col) => ({
    value: col.id,
    label: col.header,
  }))

  const operatorOptions = FILTER_OPERATORS.map((op) => ({
    value: op.value,
    label: op.label,
  }))

  const addFilter = () => {
    if (columns.length > 0) {
      onFiltersChange([
        ...filters,
        {
          id: crypto.randomUUID(),
          column: columns[0].id,
          operator: "contains",
          value: "",
        },
      ])
    }
  }

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter((f) => f.id !== id))
  }

  const updateFilter = (id: string, updates: Partial<FilterConfig>) => {
    onFiltersChange(
      filters.map((filter) => (filter.id === id ? { ...filter, ...updates } : filter))
    )
  }

  const resetFilters = () => {
    onFiltersChange([])
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(index))
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newFilters = [...filters]
    const [draggedItem] = newFilters.splice(draggedIndex, 1)
    newFilters.splice(dropIndex, 0, draggedItem)
    onFiltersChange(newFilters)

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <FilterIcon className="mr-2 h-4 w-4" />
          Filter
          {filters.length > 0 && (
            <span className="ml-1 rounded-sm bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {filters.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[520px] p-3">
        <div className="space-y-3">
          <div className="text-sm font-medium">Filters</div>
          <div className="space-y-2">
            {filters.map((filter, index) => {
              const column = columns.find((col) => col.id === filter.column)
              return (
                <div
                  key={filter.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md transition-colors",
                    draggedIndex === index && "opacity-50",
                    dragOverIndex === index && "bg-accent"
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <button
                    type="button"
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <span className="text-sm text-muted-foreground w-12">
                    {index === 0 ? "Where" : "And"}
                  </span>
                  <Select
                    options={columnOptions}
                    value={filter.column}
                    onValueChange={(value) => updateFilter(filter.id, { column: value })}
                    placeholder="Column"
                    className="w-28 h-8"
                  />
                  <Select
                    options={operatorOptions}
                    value={filter.operator}
                    onValueChange={(value) =>
                      updateFilter(filter.id, { operator: value as FilterOperator })
                    }
                    placeholder="Operator"
                    className="w-28 h-8"
                  />
                  <Input
                    placeholder={`Search ${column?.header.toLowerCase() ?? ""}...`}
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    className="flex-1 h-8"
                  />
                  <Button variant="ghost" size="icon-sm" onClick={() => removeFilter(filter.id)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addFilter}>
              <PlusIcon className="mr-1 h-4 w-4" />
              Add filter
            </Button>
            {filters.length > 0 && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  pageSize: number
  pageSizeOptions: number[]
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (size: number) => void
}

function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const pageSizeSelectOptions = pageSizeOptions.map((size) => ({
    value: String(size),
    label: String(size),
  }))

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page</span>
        <Select
          options={pageSizeSelectOptions}
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          className="w-18 h-8"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(0)}
            disabled={currentPage === 1}
          >
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(currentPage - 2)}
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(currentPage)}
            disabled={currentPage === totalPages}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function DataTable<TData, TValue>({
  data,
  columns,
  className,
  showSearch = true,
  showFilter = true,
  showSort = true,
  showView = true,
  showPagination = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: DataTableProps<TData, TValue>) {
  // Custom filters state (for the Filter menu)
  const [customFilters, setCustomFilters] = React.useState<FilterConfig[]>([])

  // TanStack Table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  // Apply custom filters to data before passing to table
  const filteredData = React.useMemo(
    () => applyCustomFilters(data, customFilters, columns),
    [data, customFilters, columns]
  )

  // Initialize TanStack Table
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  })

  // Get column info for menus
  const allColumns = React.useMemo(() => {
    return table.getAllColumns().map((col) => ({
      id: col.id,
      header: getColumnHeader(col.columnDef),
      isVisible: col.getIsVisible(),
      canSort: col.getCanSort(),
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, columnVisibility])

  const sortableColumns = allColumns.filter((col) => col.canSort)
  const filterColumns = allColumns

  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount() || 1

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {showFilter && (
            <FilterMenu
              columns={filterColumns}
              filters={customFilters}
              onFiltersChange={setCustomFilters}
            />
          )}
          {showSort && (
            <SortMenu
              columns={sortableColumns}
              sorting={sorting}
              onSortingChange={setSorting}
            />
          )}
          {showView && (
            <ViewMenu
              columns={allColumns}
              onToggleColumn={(columnId) => {
                const column = table.getColumn(columnId)
                column?.toggleVisibility()
              }}
            />
          )}
        </div>
        {showSearch && (
          <div className="relative w-64">
            <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-8"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const isSorted = header.column.getIsSorted()
                    const headerText = getColumnHeader(header.column.columnDef)

                    return (
                      <th
                        key={header.id}
                        className="h-10 px-4 text-left align-middle font-medium text-muted-foreground"
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <ColumnHeaderMenu
                            header={headerText}
                            isSorted={isSorted}
                            onSort={(direction) => {
                              if (direction === false) {
                                header.column.clearSorting()
                              } else {
                                header.column.toggleSorting(direction === "desc")
                              }
                            }}
                            onHide={() => header.column.toggleVisibility(false)}
                          />
                        ) : (
                          <span className="text-sm">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No results found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t hover:bg-muted/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={table.getState().pagination.pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
          onPageSizeChange={(size) => table.setPageSize(size)}
        />
      )}
    </div>
  )
}
