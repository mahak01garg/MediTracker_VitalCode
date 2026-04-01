import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { Insights, Timeline, BarChart } from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as ComparisonChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import {
  fetchDashboardAnalytics,
  fetchConsumptionTrends,
  fetchComparisonAnalytics,
} from "../api/analytics";
import PageDoodle from "../components/common/PageDoodle";

const DEFAULT_DASHBOARD = {
  totalMedications: 0,
  todayDoses: { total: 0 },
  adherenceRate: 0,
  streakInfo: { currentStreak: 0 },
};

const normalizeDashboard = (data) => data?.overview || DEFAULT_DASHBOARD;

const normalizeTrends = (data) =>
  Array.isArray(data?.trends)
    ? data.trends.map((item) => ({
        date: dayjs(item.date).format("DD MMM"),
        taken: item.takenCount ?? 0,
        missed: item.missedCount ?? 0,
      }))
    : [];

const normalizeComparison = (data) =>
  Array.isArray(data?.comparisonData)
    ? data.comparisonData.map((item) => ({
        medication: item.name || "Unknown",
        taken: item.takenDoses ?? 0,
        missed: item.missedDoses ?? 0,
      }))
    : [];

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
  const [trends, setTrends] = useState([]);
  const [comparison, setComparison] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const startDate = dayjs().subtract(30, "day").toDate();
        const endDate = dayjs().toDate();

        const [dashboardData, trendsData, comparisonData] = await Promise.all([
          fetchDashboardAnalytics({ startDate, endDate }),
          fetchConsumptionTrends({ startDate, endDate }),
          fetchComparisonAnalytics({ period: "month" }),
        ]);

        setDashboard(normalizeDashboard(dashboardData));
        setTrends(normalizeTrends(trendsData));
        setComparison(normalizeComparison(comparisonData));
      } catch (err) {
        console.error("Error loading analytics:", err);
        setDashboard(DEFAULT_DASHBOARD);
        setTrends([]);
        setComparison([]);
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={1}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Analytics Dashboard
        </Typography>
        <PageDoodle type="analytics" className="hidden md:block" />
      </Box>

      {error ? (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      ) : null}

      <Tabs
        value={activeTab}
        onChange={(event, value) => setActiveTab(value)}
        variant="scrollable"
      >
        <Tab icon={<Insights />} label="Overview" />
        <Tab icon={<Timeline />} label="Trends" />
        <Tab icon={<BarChart />} label="Comparison" />
      </Tabs>

      <Box mt={3}>
        {activeTab === 0 && <OverviewTab data={dashboard} />}
        {activeTab === 1 && <TrendsTab data={trends} />}
        {activeTab === 2 && <ComparisonTab data={comparison} />}
      </Box>
    </Box>
  );
};

const StatCard = ({ title, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    style={{ height: "100%" }}
  >
    <Card
      sx={{
        height: "100%",
        background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
        color: "#fff",
      }}
    >
      <CardContent>
        <Typography variant="body2">{title}</Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  </motion.div>
);

const OverviewTab = ({ data }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6} md={3}>
      <StatCard title="Total Medications" value={data?.totalMedications ?? 0} />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <StatCard title="Today Doses" value={data?.todayDoses?.total ?? 0} />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <StatCard title="Adherence Rate" value={`${data?.adherenceRate ?? 0}%`} />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <StatCard title="Current Streak" value={data?.streakInfo?.currentStreak ?? 0} />
    </Grid>
  </Grid>
);

const TrendsTab = ({ data }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
    <Box mt={2} height={300}>
      {data.length === 0 ? (
        <Typography>No trends data</Typography>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="taken"
              name="Taken"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="missed"
              name="Missed"
              stroke="#ef4444"
              strokeWidth={3}
              strokeDasharray="6 6"
              dot={{ r: 4, fill: "#ef4444", stroke: "#ffffff", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  </motion.div>
);

const ComparisonTab = ({ data }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
    <Box mt={2} height={300}>
      {data.length === 0 ? (
        <Typography>No comparison data</Typography>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComparisonChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="medication" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="taken" fill="#3b82f6" />
            <Bar dataKey="missed" fill="#ef4444" />
          </ComparisonChart>
        </ResponsiveContainer>
      )}
    </Box>
  </motion.div>
);

export default AnalyticsDashboard;
