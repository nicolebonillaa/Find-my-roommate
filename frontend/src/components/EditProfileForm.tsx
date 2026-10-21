import { useRef, useState } from "react";
import Button from "./Button";
import PhotoUploader from "./PhotoUploader";
import type { Student } from "../types";

interface EditProfileFormProps {
  readonly profile: Student;
  readonly onCancel: () => void;
  readonly onSave: (profile: Student) => void | Promise<void>;
}

export default function EditProfileForm({ profile, onCancel, onSave }: EditProfileFormProps) {
  const [bio, setBio] = useState(profile.bio);
  const [preferences, setPreferences] = useState({ ...profile.preferences });
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  const [avatarColor, setAvatarColor] = useState(profile.user.avatarColor);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (savingRef.current) return;
    if (!bio.trim()) {
      setError("Please enter a bio before saving.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      // Later, the parent can await a Firestore update and Storage upload here.
      await onSave({
        ...profile,
        bio: bio.trim(),
        photoUrl,
        user: { ...profile.user, avatarColor },
        preferences,
      });
    } catch (error: unknown) {
      const code = typeof error === "object" && error !== null && "code" in error
        ? String(error.code) : "";
      setError(
        code.includes("permission-denied")
          ? "You don't have permission to update this profile."
          : code.includes("unauthenticated") || code.startsWith("auth/")
            ? "Please sign in again before saving."
            : code.includes("unavailable") || code.includes("network")
              ? "Connection problem. Your changes are still here; please try saving again."
              : error instanceof Error && error.message
                ? error.message
                : "Couldn't save your profile. Please try again."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="edit-profile">
      <div className="edit-profile__group">
        <label>Profile Photo</label>
        <PhotoUploader name={profile.user.name} photoUrl={photoUrl} avatarColor={avatarColor} onChange={(next) => { setPhotoUrl(next.photoUrl); setAvatarColor(next.avatarColor); }} />
      </div>
      <div className="edit-profile__group">
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="preferences-grid">
        <div><label htmlFor="cleanliness">Cleanliness</label><select id="cleanliness" value={preferences.cleanliness} onChange={(e) => setPreferences({ ...preferences, cleanliness: e.target.value })}><option>Very important</option><option>Moderate</option><option>Flexible</option></select></div>
        <div><label htmlFor="noise">Noise</label><select id="noise" value={preferences.noise} onChange={(e) => setPreferences({ ...preferences, noise: e.target.value })}><option>Quiet</option><option>Quiet on weekdays</option><option>Flexible</option></select></div>
        <div><label htmlFor="guests">Guests</label><select id="guests" value={preferences.guests} onChange={(e) => setPreferences({ ...preferences, guests: e.target.value })}><option>With notice</option><option>Ask first</option><option>Flexible</option></select></div>
        <div><label htmlFor="sleepSchedule">Sleep Schedule</label><select id="sleepSchedule" value={preferences.sleepSchedule} onChange={(e) => setPreferences({ ...preferences, sleepSchedule: e.target.value })}><option>Early bird</option><option>Night owl</option></select></div>
        <div><label htmlFor="sharedFood">Shared Food</label><select id="sharedFood" value={preferences.sharedFood} onChange={(e) => setPreferences({ ...preferences, sharedFood: e.target.value })}><option>Ask first</option><option>Share okay</option></select></div>
        <div><label htmlFor="pets">Pets</label><select id="pets" value={preferences.pets} onChange={(e) => setPreferences({ ...preferences, pets: e.target.value })}><option>Okay with cats</option><option>No pets</option></select></div>
      </div>
      {error && <p className="edit-profile__error" role="alert">{error}</p>}
      <div className="edit-profile__actions"><Button variant="secondary" disabled={saving} onClick={onCancel}>Cancel</Button><Button disabled={saving} onClick={() => void handleSave()}>{saving ? "Saving..." : "Save Changes"}</Button></div>
    </div>
  );
}