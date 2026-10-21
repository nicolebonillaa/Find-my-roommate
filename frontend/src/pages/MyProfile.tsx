import { useState } from "react";

import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EditProfileForm from "../components/EditProfileForm";

import { myProfile } from "../data/mock";

import "../styles/MyProfile.css";

export default function MyProfile() {
  const [profile, setProfile] =
    useState(myProfile);

  const [editing, setEditing] =
    useState(false);

  const [message, setMessage] =
    useState("");

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
        />

        <Card>
          <EditProfileForm
            profile={profile}
            onCancel={() =>
              setEditing(false)
            }
            onSave={(updatedProfile) => {
              setProfile(updatedProfile);

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
      />

      {message && (
        <div className="profile-success">
          {message}
        </div>
      )}

      <div className="profile-grid">

        <Card className="profile-card">
          <div className="profile-card__content">

            <Avatar
              user={profile.user}
              size="lg"
              round
            />

           <h2 className="profile-card__name">
            {profile.user.name}
            </h2>

            <Badge variant="green">
              Verified CSUN Student
            </Badge>

            <p className="profile-card__area">
              📍 {profile.area}
            </p>
            

            <p className="profile-card__bio-preview">
              {profile.bio}
            </p>

            <Button
              variant="light"
              onClick={() =>
                setEditing(true)
              }
            >
              Edit Profile
            </Button>

          </div>
        </Card>

        <Card title="Lifestyle Preferences">

          <div className="preferences-grid">

            {preferences.map(
              (preference) => (
                <div
                  key={preference.label}
                  className="preference-card"
                >
                  <span className="preference-card__label">
                    {preference.label}
                  </span>

                  <strong>
                    {preference.value}
                  </strong>
                </div>
              )
            )}

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