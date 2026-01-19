import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme } from "../lib/theme";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
}

/**
 * Custom confirmation modal that respects app theme (dark/tan mode).
 * Replaces browser's native confirm() dialog.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmModalProps) {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Focus confirm button when modal opens
  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isDark = theme === "dark";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0",
          isDark ? "bg-black/60" : "bg-black/40",
          "backdrop-blur-sm"
        )}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-sm mx-4 rounded-lg border shadow-xl animate-fade-in",
          isDark
            ? "bg-zinc-900 border-zinc-800"
            : "bg-[#faf8f5] border-[#e6e4e1]"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 border-b",
            isDark ? "border-zinc-800" : "border-[#e6e4e1]"
          )}
        >
          <h3
            id="modal-title"
            className={cn(
              "text-sm font-medium",
              isDark ? "text-zinc-200" : "text-[#1a1a1a]"
            )}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className={cn(
              "p-1 rounded transition-colors",
              isDark
                ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          <p
            className={cn(
              "text-sm",
              isDark ? "text-zinc-400" : "text-[#6b6b6b]"
            )}
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div
          className={cn(
            "flex items-center justify-end gap-2 px-4 py-3 border-t",
            isDark ? "border-zinc-800" : "border-[#e6e4e1]"
          )}
        >
          <button
            onClick={onClose}
            className={cn(
              "px-3 py-1.5 text-sm rounded transition-colors",
              isDark
                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#ebe9e6]"
            )}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "px-3 py-1.5 text-sm rounded font-medium transition-colors",
              variant === "danger"
                ? isDark
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-red-600 text-white hover:bg-red-500"
                : isDark
                  ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                  : "bg-[#1a1a1a] text-white hover:bg-[#333]"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing confirmation modal state.
 * Returns state and handlers for easy integration.
 */
export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "danger";
    onConfirm: () => void;
  } | null>(null);

  const openConfirm = (options: {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "danger";
    onConfirm: () => void;
  }) => {
    setConfig(options);
    setIsOpen(true);
  };

  const closeConfirm = () => {
    setIsOpen(false);
    setConfig(null);
  };

  return {
    isOpen,
    config,
    openConfirm,
    closeConfirm,
  };
}

// Need to import useState for the hook
import { useState } from "react";
