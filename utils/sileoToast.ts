import Swal, { SweetAlertOptions, SweetAlertResult } from "sweetalert2";
import { sileo } from "sileo";

type SileoToastType = "success" | "error" | "warning" | "info";

let sileoBridgeInitialized = false;

const resolveIsDarkToast = () => {
  if (typeof document === "undefined") return false;
  return (
    document.body.classList.contains("profile-dark") ||
    document.body.classList.contains("dark") ||
    document.documentElement.classList.contains("dark")
  );
};

export const showSileoToast = ({
  type = "info",
  title,
  description,
  duration,
}: {
  type?: SileoToastType;
  title?: string;
  description?: string;
  duration?: number;
}) => {
  const isDarkToast = resolveIsDarkToast();
  const options = {
    title,
    description,
    duration,
    position: "top-center" as const,
    fill: isDarkToast ? "#ffffff" : "#0f172a",
    styles: {
      title: isDarkToast ? "sileo-toast-title-light" : "sileo-toast-title-dark",
      description: isDarkToast
        ? "sileo-toast-description-light"
        : "sileo-toast-description-dark",
    },
  };

  if (type === "success") {
    sileo.success(options);
    return;
  }
  if (type === "error") {
    sileo.error(options);
    return;
  }
  if (type === "warning") {
    sileo.warning(options);
    return;
  }
  sileo.info(options);
};

const shouldUseSileoFromSwal = (opts: SweetAlertOptions) => {
  const icon = opts.icon;
  if (icon !== "success" && icon !== "error") return false;
  if (opts.showCancelButton || opts.showDenyButton) return false;
  if (opts.input || opts.preConfirm || opts.willOpen) return false;
  if (opts.didOpen) return false;
  return true;
};

const toStringContent = (value: unknown) => {
  return typeof value === "string" ? value : undefined;
};

export const initializeSwalSileoBridge = () => {
  if (sileoBridgeInitialized) return;
  sileoBridgeInitialized = true;

  const originalFire = Swal.fire.bind(Swal);

  (Swal as any).fire = (...args: any[]) => {
    if (args.length === 1 && args[0] && typeof args[0] === "object") {
      const opts = args[0] as SweetAlertOptions;
      if (shouldUseSileoFromSwal(opts)) {
        const title =
          toStringContent(opts.titleText) ??
          toStringContent(opts.title) ??
          (opts.icon === "success" ? "Success" : "Error");
        const description =
          toStringContent(opts.text) ?? toStringContent(opts.html);
        const duration = typeof opts.timer === "number" ? opts.timer : 2000;

        showSileoToast({
          type: opts.icon as "success" | "error",
          title,
          description,
          duration,
        });

        const result: SweetAlertResult = {
          isConfirmed: true,
          isDenied: false,
          isDismissed: false,
          value: true,
        };
        return Promise.resolve(result);
      }
    }

    return originalFire(...args);
  };
};
