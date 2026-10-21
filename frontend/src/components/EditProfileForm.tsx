import { useState } from "react";

import Button from "./Button";
import PhotoUploader from "./PhotoUploader";

import type { Student } from "../types";

interface EditProfileFormProps {
  readonly profile: Student;
  readonly onCancel: () => void;
  readonly onSave: (profile: Student) => void;
}

export default function EditProfileForm({
  profile,
  onCancel,
  onSave,
}: EditProfileFormProps) {
  const [bio, setBio] = useState(profile.bio);
  const [area, setArea] = useState(profile.area);

  const [preferences, setPreferences] = useState({
    ...profile.preferences,
  });

  const [photoUploaded, setPhotoUploaded] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleSave() {
    if (!bio.trim()) {
      setError("Bio is required.");
      return;
    }

    if (!area.trim()) {
      setError("Area is required.");
      return;
    }

    setError("");
    setSaving(true);

    setTimeout(() => {
      onSave({
        ...profile,
        bio,
        area,
        preferences,
      });

      setSaving(false);
    }, 1000);
  }

  return (
    <div className="edit-profile">

      <h2>Edit Profile</h2>

      <div className="edit-profile__group">

        <p>Profile Photo</p>

        <PhotoUploader
          onSave={() => {
            setPhotoUploaded(true);
          }}
        />

        {photoUploaded && (
          <p className="edit-profile__success">
            Photo selected successfully.
          </p>
        )}

      </div>

      <div className="edit-profile__group">

        <label htmlFor="area">
          Area
        </label>

        <input
          id="area"
          value={area}
          onChange={(e) =>
            setArea(e.target.value)
          }
        />

      </div>

      <div className="edit-profile__group">

        <label htmlFor="bio">
          Bio
        </label>

        <textarea
          id="bio"
          rows={4}
          value={bio}
          onChange={(e) =>
            setBio(e.target.value)
          }
        />

      </div>

      <div className="preferences-grid">

        <div>

          <label htmlFor="cleanliness">
            Cleanliness
          </label>

          <select
            id="cleanliness"
            value={preferences.cleanliness}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                cleanliness: e.target.value,
              })
            }
          >
            <option>Very important</option>
            <option>Moderate</option>
            <option>Flexible</option>
          </select>

        </div>

        <div>

          <label htmlFor="noise">
            Noise
          </label>

          <select
            id="noise"
            value={preferences.noise}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                noise: e.target.value,
              })
            }
          >
            <option>Quiet</option>
            <option>Quiet on weekdays</option>
            <option>Flexible</option>
          </select>

        </div>

        <div>

          <label htmlFor="guests">
            Guests
          </label>

          <select
            id="guests"
            value={preferences.guests}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                guests: e.target.value,
              })
            }
          >
            <option>With notice</option>
            <option>Ask first</option>
            <option>Flexible</option>
          </select>

        </div>

        <div>

          <label htmlFor="sleepSchedule">
            Sleep Schedule
          </label>

          <select
            id="sleepSchedule"
            value={preferences.sleepSchedule}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                sleepSchedule: e.target.value,
              })
            }
          >
            <option>Early bird</option>
            <option>Night owl</option>
          </select>

        </div>

        <div>

          <label htmlFor="sharedFood">
            Shared Food
          </label>

          <select
            id="sharedFood"
            value={preferences.sharedFood}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                sharedFood: e.target.value,
              })
            }
          >
            <option>Ask first</option>
            <option>Share okay</option>
          </select>

        </div>

        <div>

          <label htmlFor="pets">
            Pets
          </label>

          <select
            id="pets"
            value={preferences.pets}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                pets: e.target.value,
              })
            }
          >
            <option>Okay with cats</option>
            <option>No pets</option>
          </select>

        </div>

      </div>

      {error && (
        <p className="edit-profile__error">
          {error}
        </p>
      )}

      <div className="edit-profile__actions">

        <Button
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          disabled={saving}
          onClick={handleSave}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </Button>

      </div>

      <p className="edit-profile__note">
        Demo mode: profile updates are not
        persisted yet.
      </p>

    </div>
  );
}