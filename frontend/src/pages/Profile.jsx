import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMedications } from "../context/MedicationContext";
import { fetchDashboardAnalytics } from "../api/analytics";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiEdit2,
  FiSave,
  FiLock,
  FiShield,
  FiBell,
  FiActivity,
  FiCamera,
  FiTrash2,
} from "react-icons/fi";
import PageDoodle from "../components/common/PageDoodle";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { getMedicationStats } = useMedications();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    address: "",
    emergencyContact: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adherenceRate, setAdherenceRate] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [previewImageFailed, setPreviewImageFailed] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        birthDate: user.birthDate || "",
        address: user.address || "",
        emergencyContact:
          typeof user.emergencyContact === "string"
            ? user.emergencyContact
            : user.emergencyContact?.phone || "",
      });
      setSelectedImage(null);
      setImagePreview(user.profilePicture || "");
      setPreviewImageFailed(false);
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (user?.role === 'doctor') {
      setAdherenceRate(0);
      return;
    }

    const loadAdherence = async () => {
      try {
        const endDate = dayjs().toDate();
        const startDate = dayjs().subtract(30, "day").toDate();
        const dashboardData = await fetchDashboardAnalytics({ startDate, endDate });
        const rate = Number.parseFloat(dashboardData?.overview?.adherenceRate) || 0;
        setAdherenceRate(rate);
      } catch (fetchError) {
        console.error("Failed to load profile adherence:", fetchError);
        setAdherenceRate(0);
      }
    };

    loadAdherence();
  }, [user?.role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async ({ profileImageFile, successMessage, closeEditor = true } = {}) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("phone", formData.phone);
      payload.append("birthDate", formData.birthDate);
      payload.append("address", formData.address);
      payload.append("emergencyContact", formData.emergencyContact);
      if (profileImageFile) {
        payload.append("profilePicture", profileImageFile);
      }

      const result = await updateProfile(payload);
      if (result.success) {
        setSuccess(successMessage || "Profile updated successfully!");
        setSelectedImage(null);
        setImagePreview(result.data?.user?.profilePicture || imagePreview);
        setPreviewImageFailed(false);
        setIsEditing(!closeEditor);
        return true;
      }

      setError(result.error || "Failed to update profile");
      return false;
    } catch {
      setError("An error occurred. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setPreviewImageFailed(false);
    setIsEditing(true);
    setSuccess("");
    setError("");

    await saveProfile({
      profileImageFile: file,
      successMessage: "Profile photo updated successfully!",
      closeEditor: false,
    });
  };

  const handleRemoveSelectedImage = () => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview(user?.profilePicture || "");
    setPreviewImageFailed(false);
  };

  const handleRemoveProfilePhoto = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("phone", formData.phone);
      payload.append("birthDate", formData.birthDate);
      payload.append("address", formData.address);
      payload.append("emergencyContact", formData.emergencyContact);
      payload.append("removeProfilePicture", "true");

      const result = await updateProfile(payload);
      if (result.success) {
        if (imagePreview?.startsWith("blob:")) {
          URL.revokeObjectURL(imagePreview);
        }
        setSelectedImage(null);
        setImagePreview("");
        setPreviewImageFailed(false);
        setSuccess("Profile photo removed successfully!");
      } else {
        setError(result.error || "Failed to remove profile photo");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      birthDate: user?.birthDate || "",
      address: user?.address || "",
      emergencyContact:
        typeof user?.emergencyContact === "string"
          ? user.emergencyContact
          : user?.emergencyContact?.phone || "",
    });
    setSelectedImage(null);
    setImagePreview(user?.profilePicture || "");
    setPreviewImageFailed(false);
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveProfile({ profileImageFile: selectedImage });
  };

  const stats = user?.role === 'doctor'
    ? { today: 0, active: 0, total: 0 }
    : getMedicationStats();

  const userStats = [
    {
      label: user?.role === 'doctor' ? "Profile Status" : "Medication Streak",
      value: user?.role === 'doctor' ? 'Doctor' : `${stats.today} days`,
      icon: FiActivity,
      bg: "bg-gradient-to-r from-blue-600 to-blue-400",
    },
    {
      label: user?.role === 'doctor' ? "Specialization" : "Adherence Rate",
      value: user?.role === 'doctor' ? (user?.specialization || 'Doctor') : `${adherenceRate}%`,
      icon: FiBell,
      bg: "bg-gradient-to-r from-green-600 to-green-400",
    },
    {
      label: user?.role === 'doctor' ? "Experience" : "Active Medications",
      value: user?.role === 'doctor' ? `${user?.experience || 0} yrs` : stats.active,
      icon: FiShield,
      bg: "bg-gradient-to-r from-purple-600 to-purple-400",
    },
    {
      label: user?.role === 'doctor' ? "Degree" : "Total Medications",
      value: user?.role === 'doctor' ? (user?.degree || 'N/A') : stats.total,
      icon: FiActivity,
      bg: "bg-gradient-to-r from-yellow-600 to-yellow-400",
    },
  ];

  const accountCreated =
    user?.createdAt || user?.updatedAt
      ? new Date(user?.createdAt || user?.updatedAt).toLocaleDateString()
      : "N/A";

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Manage your account and preferences
          </p>
        </div>
        <div className="mt-2 md:mt-0 flex items-center gap-3">
          <PageDoodle type="profile" className="hidden lg:block" />
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="primary">
              <FiEdit2 className="mr-2 h-5 w-5" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {userStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`${stat.bg} rounded-xl p-4 text-white shadow-lg`}>
              <div className="flex items-center">
                <div className="mr-4 rounded-lg bg-white/20 p-3">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm font-semibold">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900">
          <p className="text-green-700 dark:text-green-200">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="text-gray-900 dark:text-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 dark:border-gray-700 dark:bg-gray-800/50 md:flex-row md:items-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-blue-100 to-indigo-200 shadow-lg dark:border-gray-800 dark:from-blue-900/50 dark:to-indigo-900/50">
                  {imagePreview && !previewImageFailed ? (
                    <img
                      src={imagePreview}
                      alt={formData.name || "Profile"}
                      className="h-full w-full object-cover"
                      onError={() => setPreviewImageFailed(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-blue-700 dark:text-blue-200">
                      {(formData.name || user?.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Profile Photo</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    You can upload JPG, PNG, GIF, or WEBP files up to 5MB.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                      <FiCamera className="mr-2 h-4 w-4" />
                      {imagePreview ? "Change Photo" : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {selectedImage && (
                      <button
                        type="button"
                        onClick={handleRemoveSelectedImage}
                        className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <FiTrash2 className="mr-2 h-4 w-4" />
                        Remove New Photo
                      </button>
                    )}
                    {!selectedImage && user?.profilePicture && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePhoto}
                        disabled={loading}
                        className="inline-flex items-center rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        <FiTrash2 className="mr-2 h-4 w-4" />
                        Remove Photo
                      </button>
                    )}
                  </div>
                  {!isEditing && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Selecting a photo will update your profile photo immediately.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  bold
                  className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                  icon={<FiUser className="h-5 w-5 text-gray-400 dark:text-gray-300" />}
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  bold
                  className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                  icon={<FiMail className="h-5 w-5 text-gray-400 dark:text-gray-300" />}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  bold
                  className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                  icon={<FiPhone className="h-5 w-5 text-gray-400 dark:text-gray-300" />}
                />
                <Input
                  label="Birth Date"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  bold
                  className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                  icon={<FiCalendar className="h-5 w-5 text-gray-400 dark:text-gray-300" />}
                />
              </div>

              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                bold
                className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                icon={<FiMapPin className="h-5 w-5 text-gray-400 dark:text-gray-300" />}
              />

              <Input
                label="Emergency Contact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                disabled={!isEditing}
                helperText="Phone number of emergency contact"
                bold
                className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                icon={<FiPhone className="h-5 w-5 text-gray-400 dark:text-gray-300" />}
              />

              {isEditing && (
                <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={loading}>
                    <FiSave className="mr-2 h-5 w-5" />
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="text-gray-900 dark:text-gray-100">
            <h3 className="mb-4 font-bold text-gray-900 dark:text-white">Account Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 dark:text-gray-300">Account Created</span>
                <span className="font-semibold text-gray-900 dark:text-white">{accountCreated}</span>
              </div>
            </div>
          </Card>

          <Card className="text-gray-900 dark:text-gray-100">
            <h3 className="mb-4 font-bold text-gray-900 dark:text-white">Quick Actions</h3>
            <Button variant="outline" fullWidth onClick={() => navigate("/change-password")}>
              <FiLock className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
