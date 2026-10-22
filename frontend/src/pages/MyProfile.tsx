import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";

import { useAuth } from "../auth/AuthProvider";

import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EditProfileForm from "../components/EditProfileForm";

import "../styles/MyProfile.css";

export default function MyProfile() {
  const { profile, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  if (!profile) {
    return (
      <PageHeader
        title="My Profile"
        subtitle="Your profile is not available."
      />
    );
  }

  const preferences = [
    {
      label: "Cleanliness",
      value: profile.preferences.cleanliness,
    },
    {
      label: "Noise",
      value: profile.preferences.noise,
    },
    {
      label: "Guests",
      value: profile.preferences.guests,
    },
    {
      label: "Sleep Schedule",
      value: profile.preferences.sleepSchedule,
    },
    {
      label: "Shared Food",
      value: profile.preferences.sharedFood,
    },
    {
      label: "Pets",
      value: profile.preferences.pets,
    },
  ];

  if (editing) {
    return (
      <>
        <PageHeader
          title="Edit Profile"
          subtitle="Update the information future roommates can see."
          action={
            <Button
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              <ArrowLeft size={17} />
              Back to profile
            </Button>
          }
        />

        <Card>
          <EditProfileForm
            profile={profile}
            onCancel={() => setEditing(false)}
            onSave={async (updatedProfile) => {
              // Later, await the Firebase save here
              // before updating the shared profile.
              updateProfile(updatedProfile);

              setEditing(false);
              setMessage(
                "Profile updated successfully."
              );
            }}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Show future roommates what it is like to live with you."
        action={
          <Button
            onClick={() => {
              setMessage("");
              setEditing(true);
            }}
          >
            <Pencil size={16} />
            Edit Profile
          </Button>
        }
      />

      {message && (
        <div
          className="profile-success"
          role="status"
        >
          {message}
        </div>
      )}

      <div className="profile-grid">
        <Card className="profile-card">
          <div className="profile-card__content">
            <Avatar
              user={profile.user}
              photoUrl={profile.photoUrl}
              size="lg"
              round
            />

            <h2 className="profile-card__name">
              {profile.user.name}
            </h2>

            <Badge variant="green">
              Verified CSUN Student
            </Badge>

            <p className="profile-card__bio-preview">
              {profile.bio}
            </p>
          </div>
        </Card>

        <Card title="Lifestyle Preferences">
          <div className="preferences-grid">
            {preferences.map((preference) => (
              <div
                key={preference.label}
                className="preference-card"
              >
                <span className="preference-card__label">
                  {preference.label}
                </span>

                <strong>{preference.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="About Me">
        <p className="about-me">
          {profile.bio}
        </p>
      </Card>
    </>
  );
}