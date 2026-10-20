
import type { LifestylePreferences, Student } from "../types";

// Lifestyle filter categories
export const FILTER_GROUPS: {
  key: keyof LifestylePreferences;
  label: string;
  options: string[];
}[] = [
  {
    key: "noise",
    label: "Noise",
    options: [
      "Quiet",
      "Quiet on weekdays",
      "Flexible",
      "Lively",
    ],
  },
  {
    key: "cleanliness",
    label: "Cleanliness",
    options: [
      "Very important",
      "Moderate",
      "Relaxed",
    ],
  },
  {
    key: "guests",
    label: "Guests",
    options: [
      "With notice",
      "Ask first",
      "Anytime",
    ],
  },
  {
    key: "sleepSchedule",
    label: "Sleep schedule",
    options: [
      "Early bird",
      "Night owl",
      "Flexible",
    ],
  },
  {
    key: "pets",
    label: "Pets",
    options: [
      "No pets",
      "Okay with cats",
      "Okay with dogs",
    ],
  },
  {
    key: "sharedFood",
    label: "Shared food",
    options: [
      "Ask first",
      "Share okay",
      "Keep separate",
    ],
  },
];

// Stores the selected lifestyle filters
export type SearchFilters = Partial<
  Record<keyof LifestylePreferences, string[]>
>;

// Read search text and selected filters from the URL
export function readSearchParams(params: URLSearchParams) {
  const filters: SearchFilters = {};

  for (const group of FILTER_GROUPS) {
    const selected = params
      .getAll(group.key)
      .filter((value) => group.options.includes(value));

    if (selected.length > 0) {
      filters[group.key] = selected;
    }
  }

  return {
    query: params.get("q") ?? "",
    filters,
  };
}

// Build the URL parameters when the student searches
export function buildSearchParams(
  query: string,
  filters: SearchFilters
) {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("q", query.trim());
  }

  for (const group of FILTER_GROUPS) {
    for (const value of filters[group.key] ?? []) {
      params.append(group.key, value);
    }
  }

  return params.toString();
}

// Count how many lifestyle filters are selected
export function selectedFilterCount(filters: SearchFilters) {
  return FILTER_GROUPS.reduce(
    (count, group) =>
      count + (filters[group.key]?.length ?? 0),
    0
  );
}

// Check whether a student matches the search and filters
export function matchesRoommateSearch(
  student: Student,
  query: string,
  filters: SearchFilters
) {
  const search = query.trim().toLowerCase();

  // Require at least 3 characters for a text search.
  // An empty search is allowed when using filters only.
  if (search.length > 0 && search.length < 3) {
    return false;
  }

  // Search the student's name, area, bio, and tags.
  // Area is searchable text, but NOT a filter category.
  const searchableText = [
    student.user.name,
    student.area,
    student.bio,
    ...student.tags,
  ]
    .join(" ")
    .toLowerCase();

  // Split text into words.
  // This prevents random letters in the middle
  // of a word from creating unexpected matches.
  const words = searchableText.split(/[^a-z0-9]+/);

  // Match text at the beginning of a word.
  // Example: "Jor" matches "Jordan".
  const matchesText =
    search.length === 0 ||
    words.some((word) => word.startsWith(search));

  if (!matchesText) {
    return false;
  }

  // Check all selected lifestyle filters.
  // Multiple choices in one category use OR logic.
  // Different categories use AND logic.
  return FILTER_GROUPS.every((group) => {
    const selected = filters[group.key] ?? [];

    return (
      selected.length === 0 ||
      selected.includes(
        student.preferences[group.key]
      )
    );
  });
}