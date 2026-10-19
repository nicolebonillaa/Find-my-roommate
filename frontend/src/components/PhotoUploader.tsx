
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { getCroppedBlob } from "../utils/cropImages";
import Button from "./Button";
import "../styles/PhotoUploader.css";

interface PhotoUploaderProps {
  onSave: (photo: Blob) => void;
}

export default function PhotoUploader({
  onSave,
}: PhotoUploaderProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState("");

  // Release the temporary image URL whenever the image changes,
  // the cropper closes, or the component unmounts.
  useEffect(() => {
    if (!src) return;

    return () => {
      URL.revokeObjectURL(src);
    };
  }, [src]);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);

    // The cleanup effect automatically releases the old URL.
    setSrc(URL.createObjectURL(file));

    // Allows selecting the same image again later.
    e.target.value = "";
  }

  async function handleSave() {
    if (!src || !area) return;

    try {
      setError("");

      const croppedPhoto = await getCroppedBlob(src, area);

      onSave(croppedPhoto);

      // The cleanup effect releases the URL.
      setSrc(null);
    } catch {
      setError("Could not crop the photo. Please try again.");
    }
  }

  function handleCancel() {
    // The cleanup effect releases the URL.
    setSrc(null);
    setArea(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setError("");
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
      />

      {error && (
        <p className="photo-uploader__error" role="alert">
          {error}
        </p>
      )}

      {src && (
        <div className="photo-uploader__modal">
          <div className="photo-uploader__crop">
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          </div>

          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
          />

          <div className="photo-uploader__actions">
            <Button
              variant="secondary"
              onClick={handleCancel}
            >
              Cancel
            </Button>

            <Button onClick={handleSave}>
              Save photo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}