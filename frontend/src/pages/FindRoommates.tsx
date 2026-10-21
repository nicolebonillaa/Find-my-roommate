
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import StudentCard from "../components/StudentCard";
import { getStudents } from "../services/api";

import {
  buildSearchParams,
  FILTER_GROUPS,
  matchesRoommateSearch,
  readSearchParams,
} from "../utils/roommateSearch";

import type { Student } from "../types";

import "../styles/FindRoommatesSearch.css";

export default function FindRoommates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState("name");

  const { query, filters } = readSearchParams(searchParams);

  // Load students and allow retrying if the request fails.
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    getStudents()
      .then((data) => {
        if (!active) return;

        setStudents(data);
        setError(false);
     })
      .catch(() => {
      if (!active) return;

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
}, [retryCount]);

function loadStudents() {
  setLoading(true);
  setError(false);
  setRetryCount((count) => count + 1);
}

  // Keep lifestyle filters on this page.
  const matching = students
    .filter((student) =>
      matchesRoommateSearch(student, query, filters)
    )
    .sort((a, b) =>
      sort === "nameDesc"
        ? b.user.name.localeCompare(a.user.name)
        : a.user.name.localeCompare(b.user.name)
    );

  function removeFilter(
    key: keyof typeof filters,
    value: string
  ) {
    const next = {
      ...filters,
      [key]: (filters[key] ?? []).filter(
        (item) => item !== value
      ),
    };

    setSearchParams(buildSearchParams(query, next));
  }

  const hasActiveFilters =
    Boolean(query) ||
    FILTER_GROUPS.some(
      (group) => (filters[group.key]?.length ?? 0) > 0
    );

  return (
    <>
      <PageHeader
        title="Find a roommate"
        subtitle="Browse verified CSUN students. Reviews stay locked until a request is accepted."
      />

      <div className="roomie-results__toolbar">
        <p>
          Showing <strong>{matching.length}</strong> of{" "}
          {students.length} students
        </p>

        <label className="roomie-results__sort">
          <span className="roomie-results__visually-hidden">
            Sort by
          </span>

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
          >
            <option value="name">Name A–Z</option>
            <option value="nameDesc">Name Z–A</option>
          </select>
        </label>
      </div>

      <div className="roomie-results__pills">
        {query && (
          <button
            type="button"
            onClick={() =>
              setSearchParams(
                buildSearchParams("", filters)
              )
            }
          >
            Search: {query}{" "}
            <span aria-hidden="true">×</span>
          </button>
        )}

        {FILTER_GROUPS.flatMap((group) =>
          (filters[group.key] ?? []).map((value) => (
            <button
              type="button"
              key={`${group.key}-${value}`}
              onClick={() =>
                removeFilter(group.key, value)
              }
            >
              {group.label}: {value}{" "}
              <span aria-hidden="true">×</span>
            </button>
          ))
        )}

        {hasActiveFilters && (
          <button
            type="button"
            className="roomie-results__reset"
            onClick={() => setSearchParams("")}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="roomie-results__grid">
        {loading ? (
          <div className="roomie-results__empty">
            <h3>Loading students...</h3>
            <p>Finding available CSUN student profiles.</p>
          </div>
        ) : error ? (
          <div className="roomie-results__empty">
            <h3>Could not load students</h3>
            <p>
              There was a problem loading student profiles.
              Please try again.
            </p>
            <button
              type="button"
              className="btn btn__secondary btn__sm"
              onClick={() => void loadStudents()}
            >
              Try again
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="roomie-results__empty">
            <h3>No students to show yet</h3>
            <p>
              Verified CSUN student profiles will appear here
              as students join RoomieReport.
            </p>
          </div>
        ) : matching.length > 0 ? (
          matching.map((student) => (
            <StudentCard
              key={student.userId}
              student={student}
              variant="full"
            />
          ))
        ) : (
          <div className="roomie-results__empty">
            <h3>No students match yet</h3>
            <p>
              Try removing a filter or searching for
              something else.
            </p>

            <button
              type="button"
              className="btn btn__secondary btn__sm"
              onClick={() => setSearchParams("")}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}