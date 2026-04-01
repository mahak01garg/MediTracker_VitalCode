import { getFCMToken } from "../firebase";

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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/notifications/register-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // JWT from Google login
          },
          body: JSON.stringify({ fcmToken: token }),
        }
      );
      const data = await res.json();
      console.log("FCM token register response:", data);
    }

    return token;
  } catch (error) {
    console.error("FCM setup failed:", error);
    return null;
  }
};
