import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageDoodle from "../components/common/PageDoodle";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp,
            newPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("Password reset successful. Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

 const handleResendOtp = async () => {
  setLoading(true);
  setError("");

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/user/resend-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert("OTP resent successfully");
  } catch (err) {
    setError(err.message || "Failed to resend OTP");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="auth-container">
      <div className="mb-4 flex items-center justify-between">
        <h2>Reset Password</h2>
        <PageDoodle type="security" className="hidden md:block" />
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button
  type="button"
  onClick={handleResendOtp}
  disabled={!email}
  style={{ marginTop: "10px" }}
>
  Resend OTP
</button>


        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default ResetPassword;
