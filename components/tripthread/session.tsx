"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, errorMessage } from "@/lib/trip-client";
import type { User } from "@/lib/trip-types";

type Session = { user: User | null; loading: boolean; error: string; setUser: (user: User | null) => void };
const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    api<{ user: User | null }>("session").then(({ user }) => {
      if (live) setUser(user);
    }).catch((error) => { if (live) setError(errorMessage(error)); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  return <SessionContext.Provider value={{ user, setUser, loading, error }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("SessionProvider is missing.");
  return session;
}
