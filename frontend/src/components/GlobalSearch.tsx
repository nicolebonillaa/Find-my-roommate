import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";

import {
  buildSearchParams,
  FILTER_GROUPS,
  readSearchParams,
  selectedFilterCount,
  type SearchFilters,
} from "../utils/roommateSearch";

import "../styles/GlobalSearch.css";

export default function GlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const hostRef = useRef<HTMLDivElement>(null);

  const currentUrl = `${location.pathname}${location.search}`;

  const [query, setQuery] = useState(() => {
    if (location.pathname === "/find") {
      return readSearchParams(
        new URLSearchParams(location.search)
      ).query;
    }

    return "";
  });

  const [filters, setFilters] = useState<SearchFilters>(() => {
    if (location.pathname === "/find") {
      return readSearchParams(
        new URLSearchParams(location.search)
      ).filters;
    }

    return {};
  });

  const [isOpen, setIsOpen] = useState(false);
  const [previousUrl, setPreviousUrl] = useState(currentUrl);

  const count = selectedFilterCount(filters);

  // Keep the search field synchronized with the results URL.
  // This also supports the browser Back and Forward buttons.
  if (previousUrl !== currentUrl) {
    setPreviousUrl(currentUrl);

    if (location.pathname === "/find") {
      const applied = readSearchParams(
        new URLSearchParams(location.search)
      );

      setQuery(applied.query);
      setFilters(applied.filters);
    }
  }

  // Close the filter popup when clicking outside
  // or pressing Escape.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (
        !hostRef.current?.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      onPointerDown
    );

    document.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        onPointerDown
      );

      document.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [isOpen]);

  function toggleFilter(
    key: keyof SearchFilters,
    value: string
  ) {
    setFilters((previous) => {
      const selected = previous[key] ?? [];

      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];

      return {
        ...previous,
        [key]: next,
      };
    });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsOpen(false);

    const params = buildSearchParams(query, filters);

    navigate(params ? `/find?${params}` : "/find");
  }

  return (
    <div
      className="global-search"
      ref={hostRef}
    >
      <form
        className="global-search__form"
        onSubmit={submitSearch}
        role="search"
      >
        <div className="global-search__field">
          <Search
            size={16}
            className="global-search__leading"
            aria-hidden="true"
          />

          <input
            type="search"
            aria-label="Search CSUN students"
            placeholder="Search CSUN students…"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />

          {query.length > 0 && (
            <button
              className="global-search__clear"
              type="button"
              aria-label="Clear search text"
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          )}

          <span
            className="global-search__divider"
            aria-hidden="true"
          />

          <button
            type="button"
            className="global-search__filter-button"
            aria-label="Lifestyle filters"
            aria-expanded={isOpen}
            aria-controls="roomie-search-filters"
            onClick={() =>
              setIsOpen((open) => !open)
            }
          >
            <SlidersHorizontal size={17} />

            {count > 0 && (
              <span className="global-search__count">
                {count}
              </span>
            )}
          </button>

          <span
            className="global-search__divider"
            aria-hidden="true"
          />

          <button
            className="global-search__submit"
            type="submit"
            aria-label="Search roommates"
            title="Search roommates"
          >
            <Search size={18} />
          </button>
        </div>
      </form>

      {isOpen && (
        <section
          className="global-search__panel"
          id="roomie-search-filters"
          aria-label="Lifestyle filters"
        >
          <div className="global-search__panel-heading">
            <strong>Filter by lifestyle</strong>

            <span>
              Choose the preferences you want
            </span>
          </div>

          <div className="global-search__groups">
            {FILTER_GROUPS.map((group) => (
              <fieldset
                className="global-search__group"
                key={group.key}
              >
                <legend>{group.label}</legend>

                <div className="global-search__chips">
                  {group.options.map((option) => {
                    const selected = (
                      filters[group.key] ?? []
                    ).includes(option);

                    return (
                      <button
                        key={option}
                        type="button"
                        className={
                          selected
                            ? "is-selected"
                            : ""
                        }
                        aria-pressed={selected}
                        onClick={() =>
                          toggleFilter(
                            group.key,
                            option
                          )
                        }
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="global-search__panel-actions">
            <button
              type="button"
              className="global-search__reset"
              onClick={() => setFilters({})}
            >
              Clear filters
            </button>

            {count > 0 && (
              <button
                type="button"
                className="global-search__done"
                onClick={() => setIsOpen(false)}
              >
                Done
                <Check size={15} />
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}