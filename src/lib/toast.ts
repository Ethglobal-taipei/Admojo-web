// A simple toast notification system for the application
// This is used to show success, error, warning, and info messages

type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Shows a toast notification
 * @param title The title of the toast
 * @param options Optional configuration for the toast
 * @param type The type of toast (success, error, warning, info)
 */
export function toast(title: string, options?: ToastOptions, type: ToastType = "info") {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent('toast', {
    detail: {
      title,
      description: options?.description || '',
      type,
      duration: options?.duration || 5000,
      action: options?.action || null
    }
  });
  
  window.dispatchEvent(event);
}

// Example usage:
// toast("Transaction completed", { description: "Your swap was successful" }, "success")
// toast("Error occurred", { description: "Please try again" }, "error")
// toast("Warning", { description: "Low balance" }, "warning")
// toast("Information", { description: "New feature available" }, "info")
// toast("Default toast", { description: "This is a default toast" })

