import { getFCMToken } from "../firebase";

const getApiUrl = () => {
  const configured =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "/api";

  return configured.replace(/\/$/, "");
};

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const token = await getFCMToken();
    console.log("FCM Token:", token);

    if (token) {
      const authToken = localStorage.getItem("token");

      if (!authToken) {
        console.warn("Skipping FCM token registration: user auth token is missing");
        return token;
      }

      const res = await fetch(
        `${getApiUrl()}/notifications/register-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ fcmToken: token }),
        }
      );
      const data = await res.json();
      console.log("FCM token register response:", data);

      if (!res.ok) {
        console.warn("FCM token registration failed:", data);
      }
    }

    return token;
  } catch (error) {
    console.error("FCM setup failed:", error);
    return null;
  }
};
