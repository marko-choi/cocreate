import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// cmdk's subcomponents are attached as properties (Command.Input, Command.Item, ...)
// In some TS setups these property types don't flow through cleanly.
// We explicitly widen them to keep our wrappers strongly usable across the app.
const CommandRoot = CommandPrimitive as unknown as React.ComponentType<any>
const CommandInputPrimitive = (CommandPrimitive as any).Input as React.ComponentType<any>
const CommandListPrimitive = (CommandPrimitive as any).List as React.ComponentType<any>
const CommandEmptyPrimitive = (CommandPrimitive as any).Empty as React.ComponentType<any>
const CommandGroupPrimitive = (CommandPrimitive as any).Group as React.ComponentType<any>
const CommandSeparatorPrimitive = (CommandPrimitive as any).Separator as React.ComponentType<any>
const CommandItemPrimitive = (CommandPrimitive as any).Item as React.ComponentType<any>

const Command = React.forwardRef<
  React.ElementRef<typeof CommandRoot>,
  React.ComponentPropsWithoutRef<typeof CommandRoot> & { children?: React.ReactNode }
>(({ className, ...props }, ref) => (
  <CommandRoot
    ref={ref}
    data-slot="command"
    className={cn(
      "bg-white text-black flex h-full w-full flex-col overflow-hidden rounded-md",
      className
    )}
    {...props}
  />
))
Command.displayName = "Command"

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandInputPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandInputPrimitive>
>(({ className, ...props }, ref) => (
  <div
    data-slot="command-input-wrapper"
    className="flex h-9 items-center gap-2 border-b px-3"
  >
    <SearchIcon className="size-4 shrink-0 opacity-50" />
    <CommandInputPrimitive
      ref={ref}
      data-slot="command-input"
      className={cn(
        "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = "CommandInput"

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandListPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandListPrimitive> & { children?: React.ReactNode }
>(({ className, ...props }, ref) => (
  <CommandListPrimitive
    ref={ref}
    data-slot="command-list"
    className={cn(
      "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto",
      className
    )}
    {...props}
  />
))
CommandList.displayName = "CommandList"

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandEmptyPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandEmptyPrimitive> & { children?: React.ReactNode }
>(({ className, ...props }, ref) => (
  <CommandEmptyPrimitive
    ref={ref}
    data-slot="command-empty"
    className={cn("py-6 text-center text-sm", className)}
    {...props}
  />
))
CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandGroupPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandGroupPrimitive> & { children?: React.ReactNode }
>(({ className, ...props }, ref) => (
  <CommandGroupPrimitive
    ref={ref}
    data-slot="command-group"
    className={cn(
      "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = "CommandGroup"

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandSeparatorPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandSeparatorPrimitive>
>(({ className, ...props }, ref) => (
  <CommandSeparatorPrimitive
    ref={ref}
    data-slot="command-separator"
    className={cn("bg-border -mx-1 h-px", className)}
    {...props}
  />
))
CommandSeparator.displayName = "CommandSeparator"

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandItemPrimitive> & { children?: React.ReactNode }
>(({ className, ...props }, ref) => (
  <CommandItemPrimitive
    ref={ref}
    data-slot="command-item"
    className={cn(
      "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = "CommandItem"

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
