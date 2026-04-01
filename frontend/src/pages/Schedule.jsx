import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import {
  FiClock,
  FiBell,
  FiCheckCircle,
  FiAlertTriangle,
  FiTrendingUp,
  FiBarChart2,
  FiRefreshCw,
  FiPieChart,
  FiActivity,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { FaPills, FaCalendarCheck } from "react-icons/fa";
import { useNotifications } from "../context/NotificationContext";
import PageDoodle from "../components/common/PageDoodle";

const MedicationSchedule = () => {
  const navigate = useNavigate();
  const { addAlert } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [activeMedicationsList, setActiveMedicationsList] = useState([]);
  const [todayDoseList, setTodayDoseList] = useState([]);
  const [stats, setStats] = useState({
    activeMedications: 0,
    todayDoses: 0,
    adherenceRate: 0,
  });
  const [actionModal, setActionModal] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(dayjs().startOf("month"));
  const [doseHistory, setDoseHistory] = useState([]);
  const [systemHealth] = useState({
    reminderService: "active",
    doseTracker: "active",
    notificationService: "active",
    database: "healthy",
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const showActionModal = (title, message, type = "success") => {
    setActionModal({ title, message, type });
  };

  const formatDoseTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getDoseTimingText = (dateString) => {
    const now = new Date();
    const doseTime = new Date(dateString);
    const diffMinutes = Math.round((doseTime - now) / 60000);

    if (diffMinutes === 0) {
      return "Now";
    }

    const absMinutes = Math.abs(diffMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    const timeText =
      hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return diffMinutes > 0 ? `In ${timeText}` : `${timeText} ago`;
  };

  const getDoseStatusLabel = (dose) => {
    if (dose?.status === "taken") {
      return "Taken";
    }

    if (dose?.status === "missed") {
      return "Missed";
    }

    if (dose?.status === "snoozed") {
      return "Snoozed";
    }

    const now = new Date();
    const doseTime = new Date(dose?.scheduledTime);

    if (doseTime < now) {
      return "Overdue";
    }

    const diffMinutes = Math.round((doseTime - now) / 60000);
    if (diffMinutes <= 30) {
      return "Due Soon";
    }

    return "Upcoming";
  };

  const getDoseStatusClasses = (dose) => {
    const status = getDoseStatusLabel(dose);

    if (status === "Taken") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }

    if (status === "Missed") {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }

    if (status === "Snoozed") {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }

    if (status === "Overdue") {
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    }

    if (status === "Due Soon") {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }

    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchDoseHistory(calendarMonth);
  }, [calendarMonth]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const analyticsParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const [medsRes, dosesRes, reportRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/medications`, { headers: authHeaders }),
        axios.get(`${API_BASE_URL}/medications/upcoming/today`, { headers: authHeaders }),
        axios.get(`${API_BASE_URL}/schedule/reports/daily`, { headers: authHeaders }),
        axios.get(`${API_BASE_URL}/analytics/dashboard?${analyticsParams.toString()}`, {
          headers: authHeaders,
        }),
      ]);

      const activeMeds = Array.isArray(medsRes.data)
        ? medsRes.data.filter((medication) => medication.isActive).length
        : 0;
      const todayDoses = dosesRes.data?.doses?.length || 0;
      const dailyReport = reportRes.data?.report;
      const analyticsOverview = analyticsRes.data?.data?.overview;
      const activeMedicationItems = Array.isArray(medsRes.data)
        ? medsRes.data.filter((medication) => medication.isActive)
        : [];
      const doseItems = Array.isArray(dosesRes.data?.doses) ? dosesRes.data.doses : [];
      const adherenceRate =
        Number.parseFloat(analyticsOverview?.adherenceRate) ||
        Number.parseFloat(dailyReport?.adherenceRate) ||
        0;

      setActiveMedicationsList(activeMedicationItems);
      setTodayDoseList(doseItems);

      setStats({
        activeMedications: activeMeds,
        todayDoses,
        adherenceRate,
      });

      setRecentActivity([
        {
          id: 1,
          type: "report",
          message: dailyReport?.summary || "Daily report ready",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "success",
        },
        {
          id: 2,
          type: "dose",
          message: `${todayDoses} doses scheduled for today`,
          time: "Today",
          status: todayDoses > 0 ? "success" : "warning",
        },
        {
          id: 3,
          type: "reminder",
          message: `${activeMeds} active medications are being monitored`,
          time: "Live",
          status: "success",
        },
      ]);
    } catch (error) {
      console.error(error);
      addAlert("Failed to fetch dashboard data", "error");
      showActionModal("Dashboard Error", "Failed to fetch dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoseHistory = async (monthDate) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/doses/history?month=${monthDate.format("YYYY-MM")}`,
        { headers: authHeaders }
      );
      setDoseHistory(Array.isArray(response.data?.doses) ? response.data.doses : []);
    } catch (error) {
      console.error("Failed to fetch dose history:", error);
      setDoseHistory([]);
    }
  };

  const takenDoseDays = new Set(
    doseHistory
      .filter((dose) => dose.status === "taken")
      .map((dose) => dayjs(dose.actualTime || dose.scheduledTime).format("YYYY-MM-DD"))
  );

  const monthStart = calendarMonth.startOf("month");
  const calendarStart = monthStart.startOf("week");
  const calendarDays = Array.from({ length: 42 }, (_, index) => calendarStart.add(index, "day"));
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleAction = async (actionId, actionFn, fallbackError) => {
    try {
      setActionLoadingId(actionId);
      const result = await actionFn();

      if (typeof result === "string") {
        addAlert(result, "success");
        showActionModal("Action Completed", result, "success");
      } else if (result?.type === "doses") {
        setActionModal(result);
        addAlert(result.title, "success");
      } else if (result?.type === "report") {
        setReportModal(result);
        addAlert(result.title, "success");
      } else if (result?.message) {
        addAlert(result.message, "success");
        showActionModal("Action Completed", result.message, "success");
      }

      await fetchDashboardData();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        fallbackError;
      addAlert(message, "error");
      showActionModal("Action Failed", message, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const generateTodayDoses = async () => {
    const response = await axios.post(
      `${API_BASE_URL}/schedule/generate-today-doses`,
      {},
      { headers: authHeaders }
    );

    const dosesResponse = await axios.get(`${API_BASE_URL}/medications/upcoming/today`, {
      headers: authHeaders,
    });
    const doses = Array.isArray(dosesResponse.data?.doses) ? dosesResponse.data.doses : [];

    let message = response.data?.message || "Today's doses are ready";
    if ((response.data?.count ?? 0) === 0 && (response.data?.eligibleCount ?? 0) > 0) {
      message = "All today's doses are already generated and available.";
    }

    return {
      type: "doses",
      title: "Today's Doses",
      message,
      doses,
    };
  };

  const sendTestReminder = async () => {
    const nextDose = [...todayDoseList].sort(
      (a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime)
    )[0];
    const fallbackMedication = activeMedicationsList[0];

    const medicationName =
      nextDose?.medicationId?.name || fallbackMedication?.name || "Your next medication";
    const dosage =
      nextDose?.dosage || nextDose?.medicationId?.dosage || fallbackMedication?.dosage || "Scheduled dose";
    const scheduledTime = nextDose?.scheduledTime
      ? new Date(nextDose.scheduledTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    const response = await axios.post(
      `${API_BASE_URL}/notifications/reminder/test`,
      {
        medicationName,
        dosage,
      },
      { headers: authHeaders }
    );

    const details = scheduledTime
      ? `Reminder sent for ${medicationName} (${dosage}) scheduled at ${scheduledTime}.`
      : `Reminder sent for ${medicationName} (${dosage}).`;

    return details || response.data?.message || "Reminder sent";
  };

  const checkMissedDoses = async () => {
    const response = await axios.post(
      `${API_BASE_URL}/schedule/check-missed`,
      {},
      { headers: authHeaders }
    );

    const missed = response.data?.missed ?? 0;
    return missed === 0
      ? "Checked missed doses. None found."
      : response.data?.message || `Found ${missed} missed doses`;
  };

  const generateDailyReport = async () => {
    const response = await axios.get(`${API_BASE_URL}/schedule/reports/daily`, {
      headers: authHeaders,
    });

    const report = response.data?.report || {};

    return {
      type: "report",
      title: response.data?.message || "Daily report generated",
      generatedAt: new Date().toLocaleString(),
      report: {
        date: report.date || new Date().toDateString(),
        summary: report.summary || "Your daily adherence report is ready.",
        activeMedications: report.activeMedications ?? 0,
        totalDoses: report.totalDoses ?? 0,
        taken: report.taken ?? 0,
        missed: report.missed ?? 0,
        pending: report.pending ?? 0,
        adherenceRate: report.adherenceRate || "0%",
      },
    };
  };

  const quickActions = [
    {
      id: 1,
      title: "Generate Today's Doses",
      description: "Create medication doses for today",
      icon: FaCalendarCheck,
      color: "bg-blue-500",
      action: () =>
        handleAction(1, generateTodayDoses, "Failed to generate today's doses"),
    },
    {
      id: 2,
      title: "Send Reminder",
      description: "Send a medication reminder now",
      icon: FiBell,
      color: "bg-green-500",
      action: () => handleAction(2, sendTestReminder, "Failed to send reminder"),
    },
    {
      id: 3,
      title: "Check Missed Doses",
      description: "Scan for missed medications",
      icon: FiAlertTriangle,
      color: "bg-yellow-500",
      action: () => handleAction(3, checkMissedDoses, "Failed to check missed doses"),
    },
    {
      id: 4,
      title: "Generate Report",
      description: "Create adherence report",
      icon: FiBarChart2,
      color: "bg-purple-500",
      action: () => handleAction(4, generateDailyReport, "Failed to generate report"),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading medication dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {actionModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-800"
          >
            <div
              className={`px-6 py-5 text-white ${
                actionModal.type === "error"
                  ? "bg-gradient-to-r from-red-600 to-rose-500"
                  : "bg-gradient-to-r from-emerald-600 to-teal-500"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/80">
                    Schedule Action
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{actionModal.title}</h2>
                </div>
                <button
                  onClick={() => setActionModal(null)}
                  className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-white/25 transition-colors"
                  aria-label="Close notification"
                >
                  <FiX className="h-5 w-5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-700/60">
                <p className="text-lg text-gray-800 dark:text-gray-100">
                  {actionModal.message}
                </p>
              </div>

              {Array.isArray(actionModal.doses) && actionModal.doses.length > 0 ? (
                <div className="mt-6 space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {actionModal.doses.map((dose) => (
                    <div
                      key={dose._id}
                      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-blue-100 p-3 dark:bg-blue-900">
                          <FiBell className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {dose.medicationId?.name || "Medication"}
                          </h3>
                          <p className="mt-1 text-xl text-gray-600 dark:text-gray-300">
                            {dose.dosage || dose.medicationId?.dosage || ""}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center text-gray-700 dark:text-gray-300">
                              <FiClock className="mr-2 h-4 w-4" />
                              <span>{formatDoseTime(dose.scheduledTime)}</span>
                            </div>
                            <div
                              className={`rounded-full px-3 py-1 font-medium ${getDoseStatusClasses(dose)}`}
                            >
                              {getDoseStatusLabel(dose)} • {getDoseTimingText(dose.scheduledTime)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setActionModal(null)}
                  className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  Close Notification
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}

      {reportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-blue-100">
                    Medication Report
                  </p>
                  <h2 className="mt-2 text-2xl md:text-3xl font-bold">
                    {reportModal.title}
                  </h2>
                  <p className="mt-2 text-sm text-blue-50">
                    Generated on {reportModal.generatedAt}
                  </p>
                </div>
                <button
                  onClick={() => setReportModal(null)}
                  className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-red-600 transition-colors"
                  aria-label="Close report"
                >
                  <FiX className="h-5 w-5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="rounded-2xl bg-blue-50 dark:bg-gray-700/60 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                  Report Summary
                </p>
                <p className="mt-3 text-lg text-gray-800 dark:text-gray-100">
                  {reportModal.report.summary}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Report date: {reportModal.report.date}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Adherence Rate</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {reportModal.report.adherenceRate}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Medications</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {reportModal.report.activeMedications}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Doses</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {reportModal.report.totalDoses}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Taken / Missed / Pending</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {reportModal.report.taken} / {reportModal.report.missed} / {reportModal.report.pending}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setReportModal(null)}
                  className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors"
                >
                  Close Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="mb-4 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white flex items-center"
              >
                <FiClock className="mr-2" /> Back to Dashboard
              </button>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center">
                <FaPills className="mr-3 text-blue-600" /> Medication Management Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Monitor and manage all your medication schedules and automated services
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PageDoodle type="schedule" className="hidden lg:block" />
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
              >
                <FiRefreshCw className="mr-2" /> Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-xl shadow-sm p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-200">Active Medications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.activeMedications}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full">
                <FaPills className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-green-100 dark:bg-green-900 rounded-xl shadow-sm p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-200">Today's Doses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.todayDoses}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-full">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-purple-100 dark:bg-purple-900 rounded-xl shadow-sm p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-200">Adherence Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.adherenceRate}%
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-full">
                <FiTrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold dark:text-white flex items-center">
                    <FaCalendarCheck className="mr-3 text-green-600" /> Dose Calendar
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Days with at least one taken dose are marked with a check.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalendarMonth((prev) => prev.subtract(1, "month"))}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                    aria-label="Previous month"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-[140px] text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {calendarMonth.format("MMMM YYYY")}
                  </div>
                  <button
                    onClick={() => setCalendarMonth((prev) => prev.add(1, "month"))}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                    aria-label="Next month"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {weekdayLabels.map((label) => (
                  <div key={label} className="py-2">
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarDays.map((date) => {
                  const dateKey = date.format("YYYY-MM-DD");
                  const isCurrentMonth = date.month() === calendarMonth.month();
                  const isToday = date.isSame(dayjs(), "day");
                  const isTaken = takenDoseDays.has(dateKey);

                  return (
                    <div
                      key={dateKey}
                      className={`min-h-[78px] rounded-xl border p-2 transition ${
                        isCurrentMonth
                          ? "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40"
                          : "border-gray-100 bg-gray-50/80 text-gray-400 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-500"
                      } ${isToday ? "ring-2 ring-blue-400/70" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-semibold">{date.date()}</span>
                        {isTaken ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                            <FiCheckCircle className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 text-[11px] font-medium">
                        {isTaken ? (
                          <span className="rounded-full bg-green-50 px-2 py-1 text-green-700 dark:bg-green-900/40 dark:text-green-200">
                            Dose taken
                          </span>
                        ) : isCurrentMonth ? (
                          <span className="text-gray-400 dark:text-gray-500">No taken dose</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold dark:text-white mb-6 flex items-center">
                <FiActivity className="mr-3 text-blue-600" /> Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  const isBusy = actionLoadingId === action.id;

                  return (
                    <motion.button
                      key={action.id}
                      whileHover={{ scale: isBusy ? 1 : 1.03 }}
                      whileTap={{ scale: isBusy ? 1 : 0.97 }}
                      onClick={action.action}
                      disabled={isBusy}
                      className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-left hover:border-blue-300 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center mb-3">
                        <div className={`${action.color} p-2 rounded-lg mr-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold dark:text-white text-gray-800">{action.title}</h3>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-gray-600">
                        {isBusy ? "Working..." : action.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold dark:text-white mb-6 flex items-center">
                <FiClock className="mr-3 text-blue-600" /> Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0"
                  >
                    <div
                      className={`p-2 rounded-lg mr-4 ${
                        activity.status === "success"
                          ? "bg-green-100 dark:bg-green-700"
                          : activity.status === "warning"
                          ? "bg-yellow-100 dark:bg-yellow-700"
                          : "bg-red-100 dark:bg-red-700"
                      }`}
                    >
                      {activity.type === "reminder" && (
                        <FiBell
                          className={`w-4 h-4 ${
                            activity.status === "success"
                              ? "text-green-600 dark:text-green-100"
                              : activity.status === "warning"
                              ? "text-yellow-600 dark:text-yellow-100"
                              : "text-red-600 dark:text-red-100"
                          }`}
                        />
                      )}
                      {activity.type === "dose" && (
                        <FaPills
                          className={`w-4 h-4 ${
                            activity.status === "success"
                              ? "text-green-600 dark:text-green-100"
                              : activity.status === "warning"
                              ? "text-yellow-600 dark:text-yellow-100"
                              : "text-red-600 dark:text-red-100"
                          }`}
                        />
                      )}
                      {activity.type === "missed" && (
                        <FiAlertTriangle
                          className={`w-4 h-4 ${
                            activity.status === "success"
                              ? "text-green-600 dark:text-green-100"
                              : activity.status === "warning"
                              ? "text-yellow-600 dark:text-yellow-100"
                              : "text-red-600 dark:text-red-100"
                          }`}
                        />
                      )}
                      {activity.type === "report" && (
                        <FiBarChart2
                          className={`w-4 h-4 ${
                            activity.status === "success"
                              ? "text-green-600 dark:text-green-100"
                              : activity.status === "warning"
                              ? "text-yellow-600 dark:text-yellow-100"
                              : "text-red-600 dark:text-red-100"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 dark:text-white">{activity.message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-300">{activity.time}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                          : activity.status === "warning"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
                          : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold dark:text-white mb-6 flex items-center">
                <FiPieChart className="mr-3 text-blue-600" /> System Health
              </h2>
              {Object.entries(systemHealth).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between mb-2">
                  <span className="capitalize text-gray-700 dark:text-gray-200">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value === "active" || value === "healthy"
                        ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                        : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
                    }`}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationSchedule;
