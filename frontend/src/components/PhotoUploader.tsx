import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

import {
  Camera,
  Check,
  ImagePlus,
  Palette,
  Pencil,
  X,
} from "lucide-react";

import { getCroppedBlob } from "../utils/cropImages";
import { getInitials } from "../utils/getInitials";
import Button from "./Button";

import "../styles/PhotoUploader.css";

interface PhotoUploaderProps {
  name: string;
  photoUrl?: string;
  avatarColor: string;
  onChange: (update: {
    photoUrl?: string;
    avatarColor: string;
  }) => void;
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

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read the cropped photo."));
    };

    reader.readAsDataURL(blob);
  });
}

export default function PhotoUploader({
  name,
  photoUrl,
  avatarColor,
  onChange,
}: PhotoUploaderProps) {
  const [open, setOpen] = useState(false);

  const [tab, setTab] = useState<"photo" | "initials">(
    photoUrl ? "photo" : "initials"
  );

  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  const [selectedColor, setSelectedColor] = useState(
    avatarColor
  );

  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const customRef = useRef<HTMLInputElement>(null);

  // Clean up temporary image URLs.
  useEffect(() => {
    if (!src) return;

    return () => {
      URL.revokeObjectURL(src);
    };
  }, [src]);

  // Close the popup when Escape is pressed.
  useEffect(() => {
    if (!open) return;

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  function openEditor() {
    setTab(photoUrl ? "photo" : "initials");
    setSelectedColor(avatarColor);
    setError("");
    setOpen(true);
  }

  function closeEditor() {
    setOpen(false);
    setSrc(null);
    setArea(null);
    setError("");
  }

  function handleFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be smaller than 5 MB.");
      return;
    }

    setError("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);

    setSrc(URL.createObjectURL(file));
    setTab("photo");
  }

  async function applyPhoto() {
    if (!src || !area) return;

    setWorking(true);
    setError("");

    try {
      const cropped = await getCroppedBlob(src, area);
      const url = await readBlobAsDataUrl(cropped);

      onChange({
        photoUrl: url,
        avatarColor: selectedColor,
      });

      closeEditor();
    } catch {
      setError(
        "Could not crop that photo. Please try again."
      );
    } finally {
      setWorking(false);
    }
  }

  function applyInitials() {
    onChange({
      photoUrl: undefined,
      avatarColor: selectedColor,
    });

    closeEditor();
  }

  return (
    <>
      {/* Circular editable avatar */}
      <div className="profile-photo-field">
        <button
          type="button"
          className="profile-photo-field__edit"
          onClick={openEditor}
          aria-label="Customize profile avatar"
          title="Edit avatar"
        >
          <span
            className="profile-photo-field__circle"
            style={{ background: avatarColor }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" />
            ) : (
              getInitials(name)
            )}
          </span>

          <span className="profile-photo-field__pencil">
            <Pencil size={14} />
          </span>
        </button>

        <div className="profile-photo-field__copy">
          <strong>Your profile picture</strong>

          <span>
            Choose a photo or personalize your initials.
          </span>

          <small>
            Click the pencil on your avatar to edit it.
          </small>
        </div>
      </div>

      {/* Avatar customization popup */}
      {open && (
        <div
          className="avatar-editor__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditor();
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
                onClick={closeEditor}
                aria-label="Close avatar editor"
              >
                <X size={19} />
              </button>
            </div>

            <div className="avatar-editor__body">
              {/* Upload / initials tabs */}
              <div
                className="avatar-editor__tabs"
                role="tablist"
                aria-label="Avatar options"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "photo"}
                  className={
                    tab === "photo" ? "is-active" : ""
                  }
                  onClick={() => setTab("photo")}
                >
                  <ImagePlus size={17} />
                  Upload photo
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "initials"}
                  className={
                    tab === "initials" ? "is-active" : ""
                  }
                  onClick={() => setTab("initials")}
                >
                  <Palette size={17} />
                  Use initials
                </button>
              </div>

              {/* Photo uploading and cropping */}
              {tab === "photo" ? (
                <div className="avatar-editor__photo-tab">
                  {src ? (
                    <>
                      <div className="avatar-editor__crop">
                        <Cropper
                          image={src}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          cropShape="round"
                          showGrid={false}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={(_, pixels) =>
                            setArea(pixels)
                          }
                        />
                      </div>

                      <label className="avatar-editor__zoom">
                        Zoom

                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.05"
                          value={zoom}
                          onChange={(event) =>
                            setZoom(Number(event.target.value))
                          }
                        />
                      </label>
                    </>
                  ) : (
                    <div className="avatar-editor__upload-empty">
                      <div className="avatar-editor__upload-icon">
                        <Camera size={27} />
                      </div>

                      <strong>
                        {photoUrl
                          ? "Change your profile photo"
                          : "Add a profile photo"}
                      </strong>

                      <p>
                        Upload a photo, then crop it to fit
                        your avatar.
                      </p>

                      {photoUrl && (
                        <img
                          className="avatar-editor__current-photo"
                          src={photoUrl}
                          alt="Current profile"
                        />
                      )}
                    </div>
                  )}

                  <input
                    ref={inputRef}
                    className="avatar-editor__file"
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    aria-label="Choose profile photo"
                  />

                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => inputRef.current?.click()}
                  >
                    <ImagePlus size={16} />

                    {src
                      ? "Choose another photo"
                      : "Choose photo"}
                  </Button>

                  <small>
                    JPG, PNG, or other image formats · Max 5 MB
                  </small>
                </div>
              ) : (
                /* Customizable initials */
                <div className="avatar-editor__initials-tab">
                  <span
                    className="avatar-editor__initials-preview"
                    style={{ background: selectedColor }}
                  >
                    {getInitials(name)}
                  </span>

                  <p className="avatar-editor__section-label">
                    Choose a background color
                  </p>

                  <div className="avatar-editor__colors">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={
                          `avatar-editor__swatch${
                            selectedColor === color
                              ? " is-selected"
                              : ""
                          }`
                        }
                        style={{ background: color }}
                        aria-label={`Select avatar color ${color}`}
                        aria-pressed={selectedColor === color}
                        onClick={() =>
                          setSelectedColor(color)
                        }
                      >
                        {selectedColor === color && (
                          <Check size={17} />
                        )}
                      </button>
                    ))}

                    {/* Custom color: its own circle */}
                    <button
                      type="button"
                      className={
                        "avatar-editor__swatch " +
                        "avatar-editor__swatch--custom"
                      }
                      aria-label="Choose a custom avatar color"
                      title="Custom color"
                      onClick={() =>
                        customRef.current?.click()
                      }
                    >
                      <Palette size={17} />
                    </button>

                    <input
                      ref={customRef}
                      className="avatar-editor__hidden-color"
                      type="color"
                      value={
                        /^#[0-9a-f]{6}$/i.test(selectedColor)
                          ? selectedColor
                          : "#3461e8"
                      }
                      onChange={(event) =>
                        setSelectedColor(event.target.value)
                      }
                      aria-label="Custom avatar color"
                    />
                  </div>
                </div>
              )}

              {error && (
                <p
                  className="avatar-editor__error"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>

            <div className="avatar-editor__footer">
              <Button
                type="button"
                variant="secondary"
                onClick={closeEditor}
              >
                Cancel
              </Button>

              {tab === "initials" ? (
                <Button
                  type="button"
                  onClick={applyInitials}
                >
                  Use initials avatar
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!src || !area || working}
                  onClick={() => void applyPhoto()}
                >
                  {working
                    ? "Saving photo..."
                    : "Save photo"}
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}