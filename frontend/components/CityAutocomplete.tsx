"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  airportLabel,
  suggestAirports,
  type AirportOption,
} from "@/lib/airports";

type Props = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSelect: (airport: AirportOption) => void;
  selected?: AirportOption;
};

export default function CityAutocomplete({
  id,
  label,
  value,
  placeholder,
  onChange,
  onSelect,
  selected,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLLabelElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => suggestAirports(value), [value]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function choose(airport: AirportOption) {
    onSelect(airport);
    onChange(airportLabel(airport));
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && suggestions[activeIndex]) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <label className="field suggest-field" ref={rootRef} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul id={listId} role="listbox" className="suggest-list">
          {suggestions.map((airport, index) => (
            <li key={airport.code}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "is-active" : ""}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(airport)}
              >
                <strong>
                  {airport.city} · {airport.code}
                </strong>
                <span>
                  {airport.airport} · {airport.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className="route-meta">
        {selected
          ? `${selected.airport} (${selected.code})`
          : "Type a city, then pick an airport"}
      </span>
    </label>
  );
}
