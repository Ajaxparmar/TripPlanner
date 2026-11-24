"use client";

import { useEffect, useState, type FormEvent } from "react";

export async function api<T>(path: string, body?: object): Promise<T> {
  const response = await fetch("/api/" + path, body === undefined ? { cache: "no-store" } : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(result?.error ?? "Could not reach Tripthread. Try again.");
  return result;
}

export function formValues(event: FormEvent<HTMLFormElement>) {
  return Object.fromEntries(new FormData(event.currentTarget));
}

export const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Something went wrong.";

export function useSubmission() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>, action: (values: ReturnType<typeof formValues>) => Promise<void>) {
    event.preventDefault();
    if (busy) return;
    const values = formValues(event);
    setBusy(true);
    setError("");
    try {
      await action(values);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, submit };
}

export function useRemoteData<T>(path: string, interval = 0) {
  const [result, setResult] = useState<{ path: string; data: T } | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    let pending = false;
    async function load() {
      if (pending) return;
      pending = true;
      try {
        const data = await api<T>(path);
        if (live) {
          setResult({ path, data });
          setError("");
        }
      } catch (error) {
        if (live) setError(errorMessage(error));
      } finally {
        pending = false;
      }
    }
    function refreshVisible() {
      if (document.visibilityState !== "hidden") void load();
    }
    void load();
    const timer = interval ? window.setInterval(refreshVisible, interval) : undefined;
    if (interval) window.addEventListener("focus", refreshVisible);
    return () => {
      live = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
    };
  }, [path, interval, revision]);

  return {
    data: result?.path === path ? result.data : null,
    error,
    refresh: () => setRevision((value) => value + 1),
  };
}
