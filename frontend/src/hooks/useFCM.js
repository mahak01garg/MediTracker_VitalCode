import { getFCMToken } from "../firebase";

const getApiUrl = () => {
  const configured =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "/api";

  return configured.replace(/\/$/, "");
};

export const registerFCM = async () => {
  const token = await getFCMToken();
  const authToken = localStorage.getItem("token");

  if (!token || !authToken) {
    return null;
  }

  const response = await fetch(`${getApiUrl()}/notifications/register-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ fcmToken: token }),
  });

  return response.json();
};
