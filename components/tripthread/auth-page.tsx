"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Eye, EyeOff, LockKeyhole, Mail, MapPin, UserRound, Users, Utensils } from "lucide-react";
import { api, useSubmission } from "@/lib/trip-client";
import { authDestination, authPath } from "@/lib/trip-routes";
import type { User } from "@/lib/trip-types";
import { Brand, PhotoField } from "./profile-photo";
import { useSession } from "./session";
import { ErrorMessage, Loading } from "./status";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = authDestination(params);
  const invite = next.startsWith("/join?");
  const { user, loading, error: sessionError, setUser } = useSession();
  const { busy, error, submit } = useSubmission();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const register = mode === "register";

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, router, next]);

  if (loading || user) return <Loading />;
  return <main className="auth-layout">
    <section className="auth-cover" aria-label="Alpine lake and mountains">
      <div><Brand /></div>
      <div className="cover-content">
        <div className="cover-label"><Compass size={16} /> TRIPS WITH FRIENDS</div>
        <h1>Good trips.<br />Better together.</h1>
        <p>One place for your trip, your friends, and everything you spend along the way.</p>
        <div className="expense-preview">
          <span className="preview-icon"><Utensils size={19} /></span>
          <div><b>Food</b><span>Paid by Akhil</span></div>
          <div className="preview-amount"><b>₹2,000</b><span>Split between friends</span></div>
        </div>
      </div>
      <div className="cover-place"><MapPin size={15} /> The Dolomites, Italy</div>
    </section>
    <section className="auth-panel">
      <div className="mobile-brand"><Brand /></div>
      <div className="auth-card">
        <div className="auth-heading-icon">{invite ? <Users size={23} /> : <Compass size={23} />}</div>
        <h2>{register ? "Create your account" : "Welcome back"}</h2>
        <p className="muted">{invite ? "Sign in or create an account to join your friend’s trip." : register ? "Set up your profile to start planning trips with friends." : "Sign in to manage your trips and shared expenses."}</p>
        <nav className="auth-tabs" aria-label="Account options">
          <Link href={authPath("login", next)} aria-current={register ? undefined : "page"}>Sign in</Link>
          <Link href={authPath("register", next)} aria-current={register ? "page" : undefined}>Create account</Link>
        </nav>
        <form className="form" onSubmit={(event) => submit(event, async (values) => {
          const { user } = await api<{ user: User }>(mode, { ...values, photo });
          setUser(user);
        })}>
          {register && <>
            <PhotoField name={name} photo={photo} onChange={setPhoto} />
            <label>Full name<div className="input-icon"><UserRound size={17} /><input name="name" required maxLength={80} autoComplete="name" placeholder="Akhil Sharma" value={name} onChange={(event) => setName(event.target.value)} /></div></label>
          </>}
          <label>Email address<div className="input-icon"><Mail size={17} /><input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" /></div></label>
          <div>
            <label htmlFor="password">Password</label>
            <div className="input-icon">
              <LockKeyhole size={17} />
              <input id="password" name="password" type={visible ? "text" : "password"} required maxLength={128} minLength={register ? 8 : undefined} autoComplete={register ? "new-password" : "current-password"} placeholder={register ? "At least 8 characters" : "Enter your password"} />
              <button className="icon-button" type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          {register && <label>Home city <span className="optional">Optional</span><div className="input-icon"><MapPin size={17} /><input name="city" autoComplete="address-level2" maxLength={80} placeholder="e.g. Bengaluru" /></div></label>}
          <ErrorMessage message={error || sessionError} />
          <button className="button primary auth-submit" disabled={busy}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
        </form>
      </div>
    </section>
  </main>;
}
