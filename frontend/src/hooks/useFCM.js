import { getFCMToken } from "../firebase";
import { auth } from "../firebase";

export const registerFCM = async () => {
  const token = await getFCMToken();
  const idToken = await auth.currentUser.getIdToken();

  await fetch(`${import.meta.env.VITE_API_URL}/notifications/register-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ token }),
  });
};
