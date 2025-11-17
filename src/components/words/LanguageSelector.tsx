/**
 * @fileoverview Standardized language selector with autocomplete
 *
 * Provides a searchable dropdown for language selection with ISO 639-1 codes.
 * Ensures consistent language naming across the application for smart puzzle grouping.
 *
 * @module components/words/LanguageSelector
 */

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * Common languages with ISO 639-1 codes
 * Ordered by popularity for language learning
 */
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'cs', name: 'Czech' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'et', name: 'Estonian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ur', name: 'Urdu' },
  { code: 'fa', name: 'Persian' },
  { code: 'am', name: 'Amharic' },
]

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * Language selector with search functionality
 *
 * @param value - Current selected language code (e.g., "en", "de")
 * @param onChange - Callback when language is selected
 * @param placeholder - Placeholder text (default: "Select language...")
 * @param className - Optional CSS class
 */
export function LanguageSelector({
  value,
  onChange,
  placeholder = 'Select language...',
  className,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)

  // Find the selected language object
  const selectedLanguage = useMemo(
    () => LANGUAGES.find(lang => lang.code === value),
    [value]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedLanguage ? selectedLanguage.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search languages..." className="h-9" />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {LANGUAGES.map((language) => (
              <CommandItem
                key={language.code}
                value={language.name}
                onSelect={() => {
                  onChange(language.code)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === language.code ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {language.name}
                <span className="ml-auto text-xs text-gray-500">{language.code}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Helper function to get language name from code
 * @param code - ISO 639-1 language code
 * @returns Language name or the code if not found
 */
export function getLanguageName(code: string): string {
  const language = LANGUAGES.find(lang => lang.code === code)
  return language ? language.name : code
}

/**
 * Helper function to validate language code
 * @param code - Language code to validate
 * @returns true if valid, false otherwise
 */
export function isValidLanguageCode(code: string): boolean {
  return LANGUAGES.some(lang => lang.code === code)
}
