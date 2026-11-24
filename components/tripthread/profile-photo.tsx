"use client";

import { useState } from "react";
import { Camera, Mountain, UserRound, X } from "lucide-react";

export function Brand() {
  return <div className="brand"><span className="brand-icon"><Mountain size={21} /></span><span>tripthread<span className="brand-period">.</span></span></div>;
}

export function Avatar({ person, className = "" }: { person: { name: string; photo: string }; className?: string }) {
  const initials = person.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
  /* Uploaded images are already resized in the profile form. */
  // eslint-disable-next-line @next/next/no-img-element
  return <span className={`avatar ${className}`} aria-hidden="true">{person.photo ? <img src={person.photo} alt="" /> : initials || <UserRound size={17} />}</span>;
}

export function PhotoField({ name, photo, onChange }: { name: string; photo: string; onChange: (photo: string) => void }) {
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  return <fieldset className="photo-field" disabled={processing}>
    <Avatar person={{ name, photo }} className="avatar-large" />
    <div><label className="photo-pick"><Camera size={15} /> {photo ? "Change photo" : "Add profile photo"}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (!file) return;
        setError("");
        if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10_000_000) {
          setError("Choose a JPEG, PNG, or WebP under 10 MB.");
          return;
        }
        setProcessing(true);
        try {
          const bitmap = await createImageBitmap(file);
          const canvas = document.createElement("canvas");
          const side = Math.min(bitmap.width, bitmap.height);
          canvas.width = canvas.height = 256;
          const context = canvas.getContext("2d");
          if (!context) throw new Error();
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, 256, 256);
          context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
          bitmap.close();
          onChange(canvas.toDataURL("image/jpeg", 0.85));
        } catch {
          setError("This image could not be opened.");
        } finally {
          setProcessing(false);
        }
      }} />
    </label><small>{processing ? "Preparing image…" : "JPEG, PNG or WebP"}</small></div>
    {photo && <button className="icon-button photo-remove" type="button" title="Remove photo" aria-label="Remove photo" onClick={() => onChange("")}><X size={17} /></button>}
    {error && <p className="error" role="alert">{error}</p>}
  </fieldset>;
}

