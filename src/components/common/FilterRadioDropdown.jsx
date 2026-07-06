import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

const FilterRadioDropdown = ({
  triggerLabel,
  panelTitle,
  value,
  options,
  onChange,
  onReset,
  showReset = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectedOptionLabel = useMemo(() => {
    const selected = options.find((option) => option.value === value);
    return selected?.label || triggerLabel;
  }, [options, triggerLabel, value]);

  const handleReset = () => {
    onReset?.();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-1.5 text-sm font-normal text-foreground transition-colors hover:bg-muted/80"
      >
        <span>{triggerLabel}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[320px] rounded-2xl border border-border bg-background p-3.5 shadow-2xl">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-xl font-medium text-foreground">
              {panelTitle}
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-foreground hover:bg-muted"
              aria-label={`Close ${panelTitle}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-3">
            {options.map((option, index) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 py-3 ${
                  index !== options.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <input
                  type="radio"
                  name={`${panelTitle}-radio`}
                  checked={value === option.value}
                  onChange={() => onChange?.(option.value)}
                  className="sr-only"
                />
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-[3px] ${
                    value === option.value
                      ? "border-primary bg-primary"
                      : "border-muted-foreground bg-transparent"
                  }`}
                >
                  {value === option.value && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  )}
                </span>
                <span className="text-sm font-normal text-foreground">
                  {option.label}
                </span>
              </label>
            ))}
          </div>

          {showReset && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1.5 text-xs font-normal text-foreground"
              >
                Reset
              </button>
            </div>
          )}

          <span className="sr-only">{selectedOptionLabel}</span>
        </div>
      )}
    </div>
  );
};

export default FilterRadioDropdown;
