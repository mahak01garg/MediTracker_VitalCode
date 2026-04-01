import { useState } from "react";
import axios from "axios";
import PageDoodle from "../components/common/PageDoodle";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      await axios.put(
        "/api/user/change-password",
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Error changing password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Change Password
        </h1>
        <PageDoodle type="security" className="hidden md:block" />
      </div>

      <input
        type="password"
        placeholder="Old Password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        className="w-full p-3 rounded-lg
                   bg-white dark:bg-gray-800
                   text-gray-900 dark:text-gray-100
                   border border-gray-300 dark:border-gray-700
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full p-3 rounded-lg
                   bg-white dark:bg-gray-800
                   text-gray-900 dark:text-gray-100
                   border border-gray-300 dark:border-gray-700
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={handleChangePassword}
        disabled={loading}
        className="w-full py-3 rounded-lg font-semibold
                   bg-blue-600 hover:bg-blue-700
                   text-white transition disabled:opacity-50"
      >
        {loading ? "Updating..." : "Change Password"}
      </button>
    </div>
  );
}
