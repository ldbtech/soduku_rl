import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";
import { IconButton } from "./Button";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/** Centered modal dialog with backdrop dismiss + Escape to close. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 dialog-backdrop dark:bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "mx-auto mt-[6vh] mb-8 w-full rounded-[24px] border border-black/[0.07] bg-white p-6 shadow-2xl dialog-panel",
          "dark:border-white/10 dark:bg-zinc-900",
          wide ? "max-w-xl" : "max-w-md",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Close dialog" onClick={onClose} className="size-9 shrink-0">
            <X className="size-[18px]" aria-hidden />
          </IconButton>
        </div>
        <div className="mt-5">{children}</div>
        {footer && (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
