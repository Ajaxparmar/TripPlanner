import { Check } from "lucide-react";
import { Brand } from "./profile-photo";

export function Loading() {
  return <div className="loading"><Brand /><p role="status">Loading Tripthread…</p></div>;
}

export function ErrorMessage({ message, banner = false }: { message: string; banner?: boolean }) {
  return message ? <p className={banner ? "error banner-error" : "error"} role="alert">{message}</p> : null;
}

export function Notice({ message }: { message: string }) {
  return message ? <div className="toast" role="status"><Check size={19} />{message}</div> : null;
}
