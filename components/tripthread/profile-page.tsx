"use client";

import { useState } from "react";
import Link from "next/link";
import { api, useSubmission } from "@/lib/trip-client";
import type { User } from "@/lib/trip-types";
import { PhotoField } from "./profile-photo";
import { useSession } from "./session";
import { ErrorMessage } from "./status";

export function ProfilePage() {
  const { user, setUser } = useSession();
  return user && <ProfileForm key={user.id} user={user} onSave={setUser} />;
}

function ProfileForm({ user, onSave }: { user: User; onSave: (user: User) => void }) {
  const [photo, setPhoto] = useState(user.photo);
  const [notice, setNotice] = useState("");
  const { busy, error, submit } = useSubmission();
  return <section className="profile-page">
    <Link className="back-button" href="/trips">My trips</Link>
    <h1>Your profile</h1>
    <p className="muted">Your tripmates can see your name and photo.</p>
    <form className="form card profile-form" onSubmit={(event) => submit(event, async (values) => {
      setNotice("");
      const { user } = await api<{ user: User }>("profile", { ...values, photo });
      onSave(user);
      setNotice("Profile saved.");
    })}>
      <PhotoField name={user.name} photo={photo} onChange={setPhoto} />
      <label>Full name<input name="name" defaultValue={user.name} maxLength={80} autoComplete="name" required /></label>
      <label>Home city <span className="optional">Optional</span><input name="city" defaultValue={user.city} maxLength={80} autoComplete="address-level2" /></label>
      <label>Bio <span className="optional">Optional</span><textarea name="bio" rows={3} maxLength={240} defaultValue={user.bio} /></label>
      <ErrorMessage message={error} />
      {!error && notice && <p className="muted" role="status">{notice}</p>}
      <button className="button primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    </form>
  </section>;
}
