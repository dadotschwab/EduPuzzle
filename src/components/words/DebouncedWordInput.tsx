import React, { memo, useCallback, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'

interface DebouncedWordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

const DebouncedWordInput = memo<DebouncedWordInputProps>(
  ({ value, onChange, placeholder, debounceMs = 500, className }) => {
    const [localValue, setLocalValue] = useState(value)
    const debouncedValue = useDebounce(localValue, debounceMs)

    // Update local value when prop value changes (external updates)
    React.useEffect(() => {
      setLocalValue(value)
    }, [value])

    // Call onChange when debounced value changes
    React.useEffect(() => {
      if (debouncedValue !== value) {
        onChange(debouncedValue)
      }
    }, [debouncedValue, onChange, value])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value)
    }, [])

    return (
      <Input
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
    )
  }
)

DebouncedWordInput.displayName = 'DebouncedWordInput'

export default DebouncedWordInput
