"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onDebounce?: (value: string) => void
  debounceMs?: number
  className?: string
  inputClassName?: string
}

const SearchBarComponent = ({
  placeholder = "Search...",
  value,
  onChange,
  onDebounce,
  debounceMs = 500,
  className,
  inputClassName,
}: SearchBarProps) => {
  const [inputValue, setInputValue] = React.useState(value)

  // Sync with external value
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Debounce effect
  React.useEffect(() => {
    if (onDebounce) {
      const timer = setTimeout(() => {
        onDebounce(inputValue)
      }, debounceMs)

      return () => clearTimeout(timer)
    }
  }, [inputValue, debounceMs, onDebounce])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        className={cn("pl-10", inputClassName)}
      />
    </div>
  )
}

const SearchBar = React.memo(SearchBarComponent, (prevProps, nextProps) => {
  // Only re-render if props actually change
  return (
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.value === nextProps.value &&
    prevProps.debounceMs === nextProps.debounceMs &&
    prevProps.className === nextProps.className &&
    prevProps.inputClassName === nextProps.inputClassName &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.onDebounce === nextProps.onDebounce
  )
})

SearchBar.displayName = "SearchBar"

export default SearchBar

