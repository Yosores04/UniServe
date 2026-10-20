import { useLayoutEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({ title, description, onClose, busy = false, error, children }: {
  title: string; description?: string; onClose: () => void; busy?: boolean; error?: string; children: ReactNode;
}) {
  const headingId = useId();
  const descriptionId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onClose, busy });
  callbacks.current = { onClose, busy };

  useLayoutEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
    ) ?? []).filter((element) => !element.closest("[hidden], [inert]") && element.getClientRects().length && !element.matches(":disabled"));
    const initial = dialog.current?.querySelector<HTMLElement>("input:not(:disabled), select:not(:disabled), textarea:not(:disabled)");
    (initial ?? dialog.current)?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); if (!callbacks.current.busy) callbacks.current.onClose(); }
      if (event.key !== "Tab") return;
      const elements = focusables();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); dialog.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected && !trigger.matches(":disabled")) trigger.focus();
      else document.querySelector<HTMLElement>('[data-dialog-fallback], .workspace-navigation [aria-current="page"]')?.focus();
    };
  }, []);

  return createPortal(<div className="modal-backdrop" onClick={(event) => {
    if (event.target === event.currentTarget && !busy) onClose();
  }}><div className="modal-card" ref={dialog} role="dialog" aria-modal="true" aria-labelledby={headingId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1}>
    <header className="modal-header"><div><span className="eyebrow">Your storefront</span><h2 id={headingId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={20} /></button></header>
    {error && <p className="dialog-error" role="alert">{error}</p>}
    <fieldset className="modal-body" disabled={busy} aria-busy={busy}>{children}</fieldset>
    {busy && <p className="modal-saving" role="status">Saving your changes…</p>}
  </div></div>, document.body);
}
