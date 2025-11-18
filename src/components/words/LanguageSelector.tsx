/**
 * @fileoverview Standardized language selector with autocomplete
 *
 * Provides a searchable dropdown for language selection with ISO 639-1 codes.
 * Ensures consistent language naming across the application for smart puzzle grouping.
 *
 * @module components/words/LanguageSelector
 */

import { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
  onSelect?: () => void // Called when a language is selected (for auto-advancing to next field)
  placeholder?: string
  className?: string
}

export interface LanguageSelectorRef {
  focus: () => void
}

/**
 * Language selector with search functionality
 *
 * @param value - Current selected language code (e.g., "en", "de") or name (e.g., "English", "German")
 * @param onChange - Callback when language is selected (returns ISO code)
 * @param onSelect - Callback when a language is selected (for auto-advancing to next field)
 * @param placeholder - Placeholder text (default: "Select language...")
 * @param className - Optional CSS class
 */
export const LanguageSelector = forwardRef<LanguageSelectorRef, LanguageSelectorProps>(
  function LanguageSelector({
    value,
    onChange,
    onSelect,
    placeholder = 'Select language...',
    className,
  }, ref) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    console.log('[LanguageSelector] Render - value prop:', value)

    // Expose focus method to parent via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus()
      }
    }))

    // Find the selected language object - support both code and name for backwards compatibility
    const selectedLanguage = useMemo(() => {
      // Return undefined if value is not provided
      if (!value) return undefined

      // Try to match by code first (e.g., "en")
      let lang = LANGUAGES.find(l => l.code === value)

      // If not found, try to match by name (e.g., "English") for backwards compatibility
      if (!lang && value) {
        lang = LANGUAGES.find(l => l.name.toLowerCase() === value.toLowerCase())
      }

      return lang
    }, [value])

    // Update search value when selection changes
    useEffect(() => {
      console.log('[LanguageSelector] selectedLanguage changed:', selectedLanguage)
      if (selectedLanguage) {
        setSearchValue(selectedLanguage.name)
        console.log('[LanguageSelector] Set searchValue to:', selectedLanguage.name)
      } else {
        setSearchValue('')
        console.log('[LanguageSelector] Cleared searchValue')
      }
    }, [selectedLanguage])

    // Filter languages based on search
    const filteredLanguages = useMemo(() => {
      if (!searchValue) return LANGUAGES

      const search = searchValue.toLowerCase()
      return LANGUAGES.filter(lang =>
        lang.name.toLowerCase().includes(search) ||
        lang.code.toLowerCase().includes(search)
      )
    }, [searchValue])

    const handleSelect = (languageCode: string) => {
      console.log('[LanguageSelector] handleSelect called with:', languageCode)
      onChange(languageCode)
      setOpen(false)
      onSelect?.() // Call onSelect callback for auto-advancing
    }

    return (
      <div className="relative">
        <Input
          ref={inputRef}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay closing to allow click on dropdown items
            setTimeout(() => setOpen(false), 200)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filteredLanguages.length > 0) {
              e.preventDefault()
              handleSelect(filteredLanguages[0].code)
            } else if (e.key === 'Escape') {
              setOpen(false)
              inputRef.current?.blur()
            }
          }}
          placeholder={placeholder}
          className={cn('w-full', className)}
          autoComplete="off"
        />
        {open && filteredLanguages.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
            <div className="py-1">
              {filteredLanguages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => {
                    handleSelect(language.code)
                  }}
                  onMouseDown={(e) => {
                    // Prevent input blur so click can complete
                    e.preventDefault()
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedLanguage?.code === language.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex-1">{language.name}</span>
                  <span className="text-xs text-gray-500">{language.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)

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

/**
 * Helper function to convert language name to code
 * @param nameOrCode - Language name or code
 * @returns ISO 639-1 code or the input if not found
 */
export function normalizeLanguageToCode(nameOrCode: string): string {
  // Try exact code match first
  const byCode = LANGUAGES.find(lang => lang.code === nameOrCode)
  if (byCode) return byCode.code

  // Try name match (case-insensitive)
  const byName = LANGUAGES.find(lang => lang.name.toLowerCase() === nameOrCode.toLowerCase())
  if (byName) return byName.code

  // Return original if not found
  return nameOrCode
}
