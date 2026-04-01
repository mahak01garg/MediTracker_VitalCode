const API_URL = import.meta.env.VITE_API_URL;

const authHeader = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Add a reusable fetch wrapper
const fetchWithAuth = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeader(),
        ...options.headers,
      },
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'include', // Important for cookies/auth
    });

    console.log(`API Response for ${url}:`, response.status, response.statusText);

    // Handle HTTP error status
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Check backend success flag
    if (data.success === false) {
      throw new Error(data.message || "Request failed");
    }
    
    return data;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error.message);
    throw error;
  }
};

// Update all API functions to use fetchWithAuth
export const fetchDashboardAnalytics = async ({ startDate, endDate }) => {
 const params = new URLSearchParams({
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
});

  const data = await fetchWithAuth(`${API_URL}/analytics/dashboard?${params.toString()}`);
  console.log("Dashboard fetch response:", data);
  return data.data || {};
};

export const fetchAdherenceAnalytics = async ({ startDate, endDate }) => {
  const params = new URLSearchParams({
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
});

  const data = await fetchWithAuth(`${API_URL}/analytics/adherence?${params.toString()}`);
  return data.data || {};
};

export const fetchConsumptionTrends = async ({ startDate, endDate }) => {
  const params = new URLSearchParams({
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
});

  const data = await fetchWithAuth(`${API_URL}/analytics/trends?${params.toString()}`);
  return data.data || {};
};

export const fetchSideEffectsAnalytics = async ({ startDate, endDate }) => {
  const params = new URLSearchParams({
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
});

  const data = await fetchWithAuth(`${API_URL}/analytics/side-effects?${params.toString()}`);
  return data.data || {};
};

export const fetchComparisonAnalytics = async ({ period = "month", medications = [] }) => {
  const params = new URLSearchParams({
    period,
    medications: medications.join(","),
  });
  const data = await fetchWithAuth(`${API_URL}/analytics/comparison?${params.toString()}`);
  return data.data || {};
};

export const fetchPredictiveInsights = async () => {
  const data = await fetchWithAuth(`${API_URL}/analytics/insights`);
  return data.data || {};
};