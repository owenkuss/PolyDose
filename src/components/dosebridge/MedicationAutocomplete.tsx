import { useEffect, useId, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  filterLocalMedications,
  mergeMedicationSuggestions,
  searchRxTerms,
  type MedicationSuggestion,
} from "@/lib/medication-search";

interface MedicationAutocompleteProps {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: MedicationSuggestion) => void;
  onClear: () => void;
}

export function MedicationAutocomplete({
  id,
  value,
  placeholder,
  onChange,
  onSelect,
  onClear,
}: MedicationAutocompleteProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remoteResults, setRemoteResults] = useState<MedicationSuggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const localResults = filterLocalMedications(value, 8);
  const suggestions = mergeMedicationSuggestions(localResults, remoteResults, 8);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setRemoteResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchRxTerms(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          setRemoteResults(results);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setRemoteResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function chooseSuggestion(item: MedicationSuggestion) {
    onSelect(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      const chosen = suggestions[highlightedIndex];
      if (chosen) {
        e.preventDefault();
        chooseSuggestion(chosen);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  const showDropdown = isOpen && value.trim().length > 0 && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={
          showDropdown && highlightedIndex >= 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined
        }
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => {
          if (value.trim().length > 0) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-12 bg-background pr-16 text-base"
      />

      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1">
        {isLoading && (
          <Loader2
            className="h-4 w-4 animate-spin text-muted-foreground"
            aria-label="Searching medications"
          />
        )}
        {value.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear medication name"
            onClick={() => {
              onClear();
              setRemoteResults([]);
              setIsOpen(false);
              setHighlightedIndex(-1);
              inputRef.current?.focus();
            }}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute right-0 left-0 z-30 mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md"
        >
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={`${item.name}-${item.form ?? idx}`}
                id={`${listboxId}-opt-${idx}`}
                role="option"
                aria-selected={isHighlighted}
                onMouseDown={(e) => {
                  e.preventDefault();
                  chooseSuggestion(item);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isHighlighted
                    ? "bg-accent text-accent-foreground"
                    : "text-popover-foreground hover:bg-accent/70"
                }`}
              >
                <span className="truncate font-bold">{item.name}</span>
                {item.form && (
                  <span className="shrink-0 text-xs text-muted-foreground">{item.form}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}