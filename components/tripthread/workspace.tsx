"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { api, errorMessage } from "@/lib/trip-client";
import { authPath } from "@/lib/trip-routes";
import { Avatar, Brand } from "./profile-photo";
import { useSession } from "./session";
import { ErrorMessage, Loading } from "./status";

export function Workspace({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, setUser } = useSession();
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    if (!loading && !user && !signingOut) router.replace(authPath("login", pathname + window.location.search));
  }, [loading, user, signingOut, router, pathname]);

  if (!user) return <Loading />;
  async function logout() {
    setSigningOut(true);
    try {
      await api("logout", {});
      setUser(null);
      router.replace("/login");
    } catch (error) {
      setError(errorMessage(error));
      setSigningOut(false);
    }
  }

  return <div className="workspace">
    <header className="workspace-header"><div className="header-inner">
      <Link className="brand-button" href="/trips" aria-label="Tripthread home"><Brand /></Link>
      <div className="account-menu">
        <Link className="account" href="/profile" title="Edit profile"><Avatar person={user} /><span>{user.name}</span></Link>
        <button type="button" className="icon-button" disabled={signingOut} onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={19} /></button>
      </div>
    </div></header>
    <main className="workspace-main"><ErrorMessage message={error} banner />{children}</main>
  </div>;
}
