
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { useNavigate } from "react-router-dom";
import { Search, X, ChevronRight } from "lucide-react";

import { useAuth } from "../auth/AuthProvider";

import {
  getFirebaseStudents,
} from "../services/firebaseRoommates";

import type { Student } from "../types";

import "../styles/GlobalSearch.css";

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const searchRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const currentUserId = user?.id || "";

  /* Load real student profiles from Firebase */

  const loadStudents = useCallback(async () => {
    const profiles = await getFirebaseStudents();

    return profiles.filter(
      (student) => student.userId !== currentUserId
    );
  }, [currentUserId]);

  /* Load students when the user signs in */

  useEffect(() => {
    let active = true;

    loadStudents()
      .then((profiles) => {
        if (!active) return;

        setStudents(profiles);
        setError(false);
      })
      .catch(() => {
        if (!active) return;

        setStudents([]);
        setError(true);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadStudents]);

  /* Refresh students when searching again */

  async function refreshStudents() {
    try {
      const profiles = await loadStudents();

      setStudents(profiles);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  /* Close search results when clicking outside */

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* Search real Firebase students by name */

  const searchText = query.trim().toLowerCase();

  const results = searchText
    ? students.filter((student) =>
        student.user.name
          .toLowerCase()
          .includes(searchText)
      )
    : [];

  /* Open the selected student's profile */

  function openStudent(student: Student) {
    setQuery("");
    setIsOpen(false);

    navigate(`/students/${student.userId}`);
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!searchText) return;

    if (!loading && !error && results.length === 1) {
      openStudent(results[0]);
    } else {
      setIsOpen(true);
    }
  }

  function clearSearch() {
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div
      className="global-search"
      ref={searchRef}
    >
      <form
        className="global-search__form"
        onSubmit={handleSubmit}
        role="search"
      >
        <div className="global-search__field">
          <input
            type="search"
            value={query}
            placeholder="Search students by name..."
            aria-label="Search CSUN students by name"
            aria-expanded={
              isOpen && Boolean(searchText)
            }
            aria-controls="global-search-results"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (searchText) {
                setIsOpen(true);
              }

              void refreshStudents();
            }}
          />

          {query.length > 0 && (
            <button
              type="button"
              className="global-search__clear"
              aria-label="Clear search"
              onClick={clearSearch}
            >
              <X size={16} />
            </button>
          )}

          <span
            className="global-search__divider"
            aria-hidden="true"
          />

          <button
            type="submit"
            className="global-search__submit"
            aria-label="Search students"
            title="Search students"
          >
            <Search size={18} />
          </button>
        </div>
      </form>

      {/* Firebase search results */}

      {isOpen && searchText && (
        <div
          className="global-search__results"
          id="global-search-results"
        >
          {loading ? (
            <p className="global-search__message">
              Loading students...
            </p>
          ) : error ? (
            <p
              className="global-search__message"
              role="alert"
            >
              Could not load student profiles.
              Please try again.
            </p>
          ) : results.length > 0 ? (
            <>
              <p className="global-search__results-title">
                CSUN STUDENTS
              </p>

              {results.map((student) => {
                const initials = student.user.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <button
                    key={student.userId}
                    type="button"
                    className="global-search__result"
                    onClick={() =>
                      openStudent(student)
                    }
                  >
                    <span className="global-search__result-avatar">
                      {initials}
                    </span>

                    <span className="global-search__result-info">
                      <strong>
                        {student.user.name}
                      </strong>

                      <small>
                        CSUN student
                      </small>
                    </span>

                    <ChevronRight
                      size={17}
                      className="global-search__result-arrow"
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </>
          ) : (
            <p className="global-search__message">
              No students found for "
              {query.trim()}".
            </p>
          )}
        </div>
      )}
    </div>
  );
}