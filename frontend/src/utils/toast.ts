import halfmoon from "halfmoon";

type ToastType = "alert-success" | "alert-info" | "alert-warning" | "alert-danger";

export const showToast = (message: string, type: ToastType = "alert-info", duration: number = 4000) => {
  halfmoon.initStickyAlert({
    content: message,
    alertType: type,
    timeShown: duration,
  });
};
