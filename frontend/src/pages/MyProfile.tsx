
import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";

import { useAuth } from "../auth/AuthProvider";
import { updateMyProfile } from "../services/profileService";

import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EditProfileForm from "../components/EditProfileForm";

import type { Student } from "../types";

import "../styles/MyProfile.css";

export default function MyProfile() {
  const {
    profile,
    loading,
    refreshProfile,
  } = useAuth();

  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  /* Save profile changes to Firebase */

  async function handleSave(updatedProfile: Student) {
    await updateMyProfile({
      displayName: updatedProfile.user.name,
      bio: updatedProfile.bio,
      preferences: updatedProfile.preferences,
      avatarColor: updatedProfile.user.avatarColor,
    });

    await refreshProfile();

    setEditing(false);
    setMessage("Profile updated successfully.");
  }

  if (loading) {
    return (
      <PageHeader
        title="My Profile"
        subtitle="Loading your profile..."
      />
    );
  }

  if (!profile) {
    return (
      <PageHeader
        title="My Profile"
        subtitle="Your profile is not available. Please try signing in again."
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

  /* Edit profile screen */

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
            onSave={handleSave}
          />
        </Card>
      </>
    );
  }

  /* My profile screen */

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
        {/* Profile information */}

        <Card className="profile-card">
          <div className="profile-card__content">
            <Avatar
              user={profile.user}
              size="lg"
              round
            />

            <h2
              className="profile-card__name"
              style={{ color: "#151e38" }}
            >
              {profile.user.name}
            </h2>

            <Badge variant="green">
              Verified CSUN Student
            </Badge>

            {/* About Me */}

            <div
              style={{
                width: "100%",
                marginTop: "24px",
                paddingTop: "18px",
                borderTop: "1px solid #e6eaf2",
                textAlign: "left",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#151e38",
                }}
              >
                About Me
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  lineHeight: 1.7,
                  color: "#151e38",
                  overflowWrap: "anywhere",
                  whiteSpace: "pre-wrap",
                }}
              >
                {profile.bio || "No bio added yet."}
              </p>
            </div>
          </div>
        </Card>

        {/* Lifestyle preferences */}

        <Card title="Lifestyle Preferences">
          <div className="preferences-grid">
            {preferences.map((preference) => (
              <div
                key={preference.label}
                className="preference-card"
              >
                <span
                  className="preference-card__label"
                  style={{
                    color: "#151e38",
                    fontWeight: 500,
                  }}
                >
                  {preference.label}
                </span>

                <strong
                  style={{
                    color: "#151e38",
                    fontWeight: 700,
                  }}
                >
                  {preference.value || "Not specified"}
                </strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}