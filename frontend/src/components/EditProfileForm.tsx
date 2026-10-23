
import { useRef, useState } from "react";
import { Pencil, X } from "lucide-react";

import Button from "./Button";
import { getInitials } from "../utils/getInitials";

import type {
  Student,
  LifestylePreferences,
} from "../types";

import "../styles/PhotoUploader.css";

interface EditProfileFormProps {
  readonly profile: Student;
  readonly onCancel: () => void;
  readonly onSave: (profile: Student) => void | Promise<void>;
}

const COLORS = [
  "#f18b61",
  "#3461e8",
  "#9468e9",
  "#51b989",
  "#ea7597",
  "#e5a63e",
  "#294878",
  "#4e9ea8",
];

const preferenceOptions: {
  key: keyof LifestylePreferences;
  label: string;
  options: string[];
}[] = [
  {
    key: "cleanliness",
    label: "Cleanliness",
    options: [
      "Very important",
      "Moderate",
      "Flexible",
    ],
  },
  {
    key: "noise",
    label: "Noise",
    options: [
      "Quiet",
      "Quiet on weekdays",
      "Flexible",
    ],
  },
  {
    key: "guests",
    label: "Guests",
    options: [
      "With notice",
      "Ask first",
      "Flexible",
    ],
  },
  {
    key: "sleepSchedule",
    label: "Sleep Schedule",
    options: [
      "Early bird",
      "Night owl",
    ],
  },
  {
    key: "sharedFood",
    label: "Shared Food",
    options: [
      "Ask first",
      "Share okay",
    ],
  },
  {
    key: "pets",
    label: "Pets",
    options: [
      "Okay with cats",
      "No pets",
    ],
  },
];

export default function EditProfileForm({
  profile,
  onCancel,
  onSave,
}: EditProfileFormProps) {
  const [bio, setBio] = useState(profile.bio);

  const [preferences, setPreferences] =
    useState<LifestylePreferences>({
      ...profile.preferences,
    });

  const [avatarColor, setAvatarColor] = useState(
    profile.user.avatarColor
  );

  const [selectedColor, setSelectedColor] = useState(
    profile.user.avatarColor
  );

  const [avatarEditorOpen, setAvatarEditorOpen] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const [error, setError] = useState("");

  /* Update a lifestyle preference */

  function updatePreference(
    key: keyof LifestylePreferences,
    value: string
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /* Save the selected initials color */

  function applyAvatarColor() {
    setAvatarColor(selectedColor);
    setAvatarEditorOpen(false);
  }

  /* Save the profile to Firestore */

  async function handleSave() {
    if (savingRef.current) return;

    if (!bio.trim()) {
      setError("Please enter a bio before saving.");
      return;
    }

    if (bio.trim().length > 2000) {
      setError(
        "Your bio must be 2,000 characters or fewer."
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");

    try {
      await onSave({
        ...profile,
        bio: bio.trim(),
        photoUrl: undefined,
        user: {
          ...profile.user,
          avatarColor,
        },
        preferences,
      });
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      if (code.includes("permission-denied")) {
        setError(
          "You don't have permission to update this profile."
        );
      } else if (
        code.includes("unauthenticated") ||
        code.startsWith("auth/")
      ) {
        setError(
          "Please sign in again before saving."
        );
      } else if (
        code.includes("unavailable") ||
        code.includes("network")
      ) {
        setError(
          "Connection problem. Your changes are still here. Please try again."
        );
      } else {
        setError(
          error instanceof Error && error.message
            ? error.message
            : "Couldn't save your profile. Please try again."
        );
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="edit-profile">
      {/* Profile avatar */}

      <div className="edit-profile__group">
        <label>Profile Photo</label>

        <div className="profile-photo-field">
          <button
            type="button"
            className="profile-photo-field__edit"
            aria-label="Customize profile avatar"
            title="Edit avatar"
            onClick={() => {
              setSelectedColor(avatarColor);
              setAvatarEditorOpen(true);
            }}
          >
            <span
              className="profile-photo-field__circle"
              style={{ background: avatarColor }}
            >
              {getInitials(profile.user.name)}
            </span>

            <span className="profile-photo-field__pencil">
              <Pencil size={14} />
            </span>
          </button>

          <div className="profile-photo-field__copy">
            <strong>Your profile picture</strong>

            <span>
              Personalize your initials and avatar color.
            </span>

            <small>
              Click the pencil on your avatar to edit it.
            </small>
          </div>
        </div>
      </div>

      {/* Bio */}

      <div className="edit-profile__group">
        <label htmlFor="bio">
          Bio
        </label>

        <textarea
          id="bio"
          rows={4}
          maxLength={2000}
          value={bio}
          onChange={(event) =>
            setBio(event.target.value)
          }
        />
      </div>

      {/* Lifestyle preferences */}

      <div className="preferences-grid">
        {preferenceOptions.map((field) => (
          <div key={field.key}>
            <label htmlFor={field.key}>
              {field.label}
            </label>

            <select
              id={field.key}
              value={preferences[field.key]}
              onChange={(event) =>
                updatePreference(
                  field.key,
                  event.target.value
                )
              }
            >
              {!field.options.includes(
                preferences[field.key]
              ) && (
                <option
                  value={preferences[field.key]}
                >
                  {preferences[field.key] ||
                    "Not specified"}
                </option>
              )}

              {field.options.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Save and cancel buttons */}

      {error && (
        <p
          className="edit-profile__error"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="edit-profile__actions">
        <Button
          variant="secondary"
          disabled={saving}
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </Button>
      </div>

      {/* Avatar color editor */}

      {avatarEditorOpen && (
        <div
          className="avatar-editor__overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setAvatarEditorOpen(false);
            }
          }}
        >
          <section
            className="avatar-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-editor-title"
          >
            <div className="avatar-editor__header">
              <h2 id="avatar-editor-title">
                Customize your avatar
              </h2>

              <button
                type="button"
                className="avatar-editor__close"
                onClick={() =>
                  setAvatarEditorOpen(false)
                }
                aria-label="Close avatar editor"
              >
                <X size={19} />
              </button>
            </div>

            <div
              className="avatar-editor__body"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                alignItems: "center",
              }}
            >
              <span
                className="profile-photo-field__circle"
                style={{
                  background: selectedColor,
                  width: 110,
                  height: 110,
                  fontSize: 32,
                }}
              >
                {getInitials(profile.user.name)}
              </span>

              <p
                style={{
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Choose a background color for
                your initials.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setSelectedColor(color)
                    }
                    aria-label={`Select color ${color}`}
                    aria-pressed={
                      selectedColor === color
                    }
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: color,
                      cursor: "pointer",
                      border:
                        selectedColor === color
                          ? "3px solid #192855"
                          : "3px solid white",
                      boxShadow:
                        "0 0 0 1px #dce3f1",
                    }}
                  />
                ))}

                {/* Custom color */}

                <label
                  title="Choose custom color"
                  style={{
                    position: "relative",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background:
                      "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                    cursor: "pointer",
                    overflow: "hidden",
                    border: "3px solid white",
                    boxShadow:
                      "0 0 0 1px #dce3f1",
                  }}
                >
                  <input
                    type="color"
                    aria-label="Custom avatar color"
                    value={
                      /^#[0-9a-f]{6}$/i.test(
                        selectedColor
                      )
                        ? selectedColor
                        : "#3461e8"
                    }
                    onChange={(event) =>
                      setSelectedColor(
                        event.target.value
                      )
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="avatar-editor__footer">
              <Button
                variant="secondary"
                onClick={() =>
                  setAvatarEditorOpen(false)
                }
              >
                Cancel
              </Button>

              <Button onClick={applyAvatarColor}>
                Use initials avatar
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}