"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Dialog({ title, subtitle, close, children }: { title: string; subtitle: string; close: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="dialog" aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
    <div className="dialog-body"><div className="dialog-head"><div><h2 id="dialog-title">{title}</h2><p className="muted">{subtitle}</p></div><button type="button" className="icon-button" aria-label="Close" onClick={close}><X size={22} /></button></div>{children}</div>
  </dialog>;
}

