import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, ChevronDown, X, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export type MultiSelectOption = {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
  group?: string
}

const badgeVariants = cva("select-none", {
  variants: {
    variant: {
      default: "bg-[#e3e3e3] text-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      destructive: "bg-destructive text-destructive-foreground",
      inverted: "bg-black text-white",
    },
  },
  defaultVariants: { variant: "default" },
})

type MultiSelectBaseProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "defaultValue" | "onChange"
>

export interface MultiSelectProps
  extends MultiSelectBaseProps,
    VariantProps<typeof badgeVariants> {
  options: MultiSelectOption[]
  onValueChange: (value: string[]) => void
  value?: string[]
  defaultValue?: string[]
  placeholder?: string
  maxCount?: number
  searchable?: boolean
  hideSelectAll?: boolean
  closeOnSelect?: boolean
  modalPopover?: boolean
  autoSize?: boolean
  singleLine?: boolean
  deduplicateOptions?: boolean
  /**
   * If true, show "{n} selected" in the trigger instead of rendering selected badges.
   * Useful for compact layouts like sidebars.
   */
  showSelectedCount?: boolean
}

function uniqueOptions(options: MultiSelectOption[]) {
  const seen = new Set<string>()
  const out: MultiSelectOption[] = []
  for (const o of options) {
    if (seen.has(o.value)) continue
    seen.add(o.value)
    out.push(o)
  }
  return out
}

function useControllableArrayState(params: {
  value?: string[]
  defaultValue: string[]
  onChange: (v: string[]) => void
}) {
  const { value, defaultValue, onChange } = params
  const isControlled = value !== undefined
  const [internal, setInternal] = React.useState<string[]>(defaultValue)

  React.useEffect(() => {
    if (!isControlled) setInternal(defaultValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled, JSON.stringify(defaultValue)])

  const current = isControlled ? (value as string[]) : internal

  const set = React.useCallback(
    (next: string[]) => {
      if (!isControlled) setInternal(next)
      onChange(next)
    },
    [isControlled, onChange]
  )

  return [current, set] as const
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options: optionsProp,
      onValueChange,
      value,
      defaultValue = [],
      placeholder = "Select options",
      maxCount = 3,
      searchable = true,
      hideSelectAll = false,
      closeOnSelect = false,
      modalPopover = false,
      autoSize = false,
      singleLine = false,
      deduplicateOptions = true,
      showSelectedCount = false,
      variant,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const options = React.useMemo(
      () => (deduplicateOptions ? uniqueOptions(optionsProp) : optionsProp),
      [deduplicateOptions, optionsProp]
    )

    const [open, setOpen] = React.useState(false)
    const [selectedValues, setSelectedValues] = useControllableArrayState({
      value,
      defaultValue,
      onChange: onValueChange,
    })

    const enabledOptions = React.useMemo(() => options.filter((o) => !o.disabled), [options])
    const enabledValues = React.useMemo(() => enabledOptions.map((o) => o.value), [enabledOptions])
    const isAllSelected =
      enabledOptions.length > 0 && enabledValues.every((v) => selectedValues.includes(v))

    const selectedOptionMap = React.useMemo(() => {
      const map = new Map<string, MultiSelectOption>()
      for (const o of options) map.set(o.value, o)
      return map
    }, [options])

    const selectedOptions = React.useMemo(
      () => selectedValues.map((v) => selectedOptionMap.get(v)).filter(Boolean) as MultiSelectOption[],
      [selectedOptionMap, selectedValues]
    )

    const toggleValue = (v: string) => {
      const opt = selectedOptionMap.get(v)
      if (!opt || opt.disabled) return

      const next = selectedValues.includes(v)
        ? selectedValues.filter((x) => x !== v)
        : [...selectedValues, v]
      setSelectedValues(next)
      if (closeOnSelect) setOpen(false)
    }

    const clearAll = () => setSelectedValues([])
    const removeValue = (v: string) => setSelectedValues(selectedValues.filter((x) => x !== v))

    const toggleAll = () => {
      setSelectedValues(isAllSelected ? [] : enabledValues)
    }

    // Grouping support (optional): group by `group` prop while preserving original order.
    const grouped = React.useMemo(() => {
      const groups = new Map<string, MultiSelectOption[]>()
      const ungrouped: MultiSelectOption[] = []
      for (const o of options) {
        if (!o.group) {
          ungrouped.push(o)
          continue
        }
        if (!groups.has(o.group)) groups.set(o.group, [])
        groups.get(o.group)!.push(o)
      }
      return { groups, ungrouped }
    }, [options])

    const triggerLabel =
      selectedOptions.length === 0
        ? placeholder
        : showSelectedCount
          ? `${selectedOptions.length} selected`
          : selectedOptions
              .slice(0, maxCount)
              .map((o) => o.label)
              .join(", ")

    return (
      <Popover open={open} onOpenChange={setOpen} modal={modalPopover}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-between rounded-md border border-[#000] bg-inherit hover:bg-inherit",
              "min-h-10 h-auto px-3 py-2",
              className
            )}
            {...props}
          >
            {selectedOptions.length === 0 ? (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            ) : showSelectedCount ? (
              <span className="text-sm text-foreground">
                {selectedOptions.length} selected
              </span>
            ) : (
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2",
                  singleLine ? "overflow-hidden" : ""
                )}
              >
                <div
                  className={cn(
                    "flex min-w-0 items-center gap-1",
                    singleLine ? "flex-nowrap overflow-x-auto" : "flex-wrap"
                  )}
                >
                  {selectedOptions.slice(0, maxCount).map((opt) => (
                    <Badge key={opt.value} className={cn(badgeVariants({ variant }))}>
                      {opt.label}
                      <button
                        type="button"
                        className="ml-2 inline-flex items-center"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeValue(opt.value)
                        }}
                        aria-label={`Remove ${opt.label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedOptions.length > maxCount && (
                    <Badge className="bg-transparent text-foreground border border-border">
                      +{selectedOptions.length - maxCount} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {selectedOptions.length > 0 && (
                <>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      clearAll()
                    }}
                    aria-label="Clear"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                  <Separator orientation="vertical" className="h-5" />
                </>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Screen reader friendly label (helps when badges overflow) */}
            <span className="sr-only">{triggerLabel}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn(
            "p-0",
            autoSize ? "w-auto" : "w-[var(--radix-popover-trigger-width)]"
          )}
        >
          <Command>
            {searchable && (
              <CommandInput
                placeholder="Search..."
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Escape") setOpen(false)
                  if (e.key === "Enter") setOpen(true)
                  if (e.key === "Backspace") {
                    // If cmdk input is empty, remove last selected for keyboard UX.
                    const target = e.target as HTMLInputElement | null
                    if (target && target.value === "" && selectedValues.length > 0) {
                      setSelectedValues(selectedValues.slice(0, -1))
                    }
                  }
                }}
              />
            )}

            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>

              <CommandGroup>
                {!hideSelectAll && enabledOptions.length > 0 && (
                  <CommandItem
                    value="__select_all__"
                    onSelect={() => toggleAll()}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isAllSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>(Select All)</span>
                  </CommandItem>
                )}

                {grouped.ungrouped.map((opt) => {
                  const isSelected = selectedValues.includes(opt.value)
                  const Icon = opt.icon
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      disabled={opt.disabled}
                      onSelect={() => toggleValue(opt.value)}
                      className={cn("cursor-pointer", opt.disabled ? "opacity-60" : "")}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      {Icon ? <Icon className="mr-2 h-4 w-4 text-muted-foreground" /> : null}
                      <span className="truncate">{opt.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {grouped.groups.size > 0 &&
                Array.from(grouped.groups.entries()).map(([groupName, groupOptions]) => (
                  <React.Fragment key={groupName}>
                    <CommandSeparator />
                    <CommandGroup heading={groupName}>
                      {groupOptions.map((opt) => {
                        const isSelected = selectedValues.includes(opt.value)
                        const Icon = opt.icon
                        return (
                          <CommandItem
                            key={opt.value}
                            value={`${groupName} ${opt.label}`}
                            disabled={opt.disabled}
                            onSelect={() => toggleValue(opt.value)}
                            className={cn("cursor-pointer", opt.disabled ? "opacity-60" : "")}
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </div>
                            {Icon ? <Icon className="mr-2 h-4 w-4 text-muted-foreground" /> : null}
                            <span className="truncate">{opt.label}</span>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </React.Fragment>
                ))}

              <CommandSeparator />
              <CommandGroup>
                <div className="flex items-center justify-between">
                  {selectedValues.length > 0 && (
                    <>
                      <CommandItem
                        value="__clear__"
                        onSelect={() => clearAll()}
                        className="flex-1 justify-center cursor-pointer"
                      >
                        Clear
                      </CommandItem>
                      <Separator orientation="vertical" className="h-6" />
                    </>
                  )}
                  <CommandItem
                    value="__close__"
                    onSelect={() => setOpen(false)}
                    className="flex-1 justify-center cursor-pointer"
                  >
                    Close
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

MultiSelect.displayName = "MultiSelect"