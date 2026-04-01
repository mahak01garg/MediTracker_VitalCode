import { createContext, useContext, useState, useCallback } from "react";
import axios from "../api/axiosConfig";

const MedicationContext = createContext(null);

export const MedicationProvider = ({ children }) => {
  // Ensure medications is always initialized as an array
  const [medications, setMedications] = useState(() => []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FETCH MEDICATIONS
  const fetchMedications = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await axios.get("/medications");
 console.log("Medications API Response:", JSON.stringify(res.data,null,2)); // Debug log
    
if (!res || !Array.isArray(res.data)) {
  throw new Error("No medications returned from server");
}

setMedications(res.data);

  } catch (err) {
    console.error("Fetch medications error:", err);
    setError(
      err?.response?.data?.message ||
      err.message ||
      "Failed to fetch medications"
    );
    setMedications([]);
  } finally {
    setLoading(false);
  }
}, []);


  
  const addMedication = useCallback(async (payload) => {
  setLoading(true);
  setError(null);

  try {
    await axios.post("/medications", payload);

    // 🔥 IMPORTANT
    await fetchMedications();

    return { success: true };
  } catch (err) {
    setError(err?.response?.data?.message || err.message);
    return { success: false };
  } finally {
    setLoading(false);
  }
}, [fetchMedications]);

   const getMedicationById = useCallback(
    (id) => medications.find((med) => med._id === id || med.id === id) || null,
    [medications]
  );
  // UPDATE MEDICATION
const updateMedication = useCallback(async (id, payload) => {
  setLoading(true);
  setError(null);

  try {
  const res = await axios.put(`/medications/${id}`, payload);
  console.log("Update response:", res.data); // 🔍 Inspect this

  if (!res || !res.data) {
    throw new Error("Failed to update medication");
  }

  // Update state assuming the API returns the medication object directly
  const updatedMed = res.data.medication || res.data;

  setMedications((prev) =>
    prev.map((med) => (med._id === id || med.id === id ? updatedMed : med))
  );

  return { success: true };
} catch (err) {
  console.error("Update medication error:", err);
  setError(
    err?.response?.data?.message || err.message || "Something went wrong"
  );
  return { success: false };
}

}, []);

const deleteMedication=async(id)=>{
  try{
    const response=await axios.delete(`/medications/${id}`,{
      headers:{
        Authorization:`Bearer ${localStorage.getItem('token')}`

      }
    });
    setMedications((prev)=>
    prev.filter((med)=>med._id!==id));
    return response.data;
  }catch(error){
    console.log('Delete medication error:',error);
    throw error;
  }
}

const getMedicationStats = () => {
  const now = new Date();

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return {
    total: medications.length,

    active: medications.filter(m => m?.isActive).length,

    inactive: medications.filter(m => !m?.isActive).length,

    today: medications.filter(med =>
      Array.isArray(med.upcomingDoses) &&
      med.upcomingDoses.some(dose =>
        dose?.scheduledTime &&
        isSameDay(new Date(dose.scheduledTime), now)
      )
    ).length
  };
};




  return (
    <MedicationContext.Provider
      value={{
        medications,
        fetchMedications,
        addMedication,
        loading,
         updateMedication, 
         getMedicationById,
         getMedicationStats,
         deleteMedication,
        error,
        // Optional: Add a clear function for debugging
        clearError: useCallback(() => setError(null), []),
        // Optional: Reset medications
        resetMedications: useCallback(() => setMedications([]), [])
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedications = () => {
  const ctx = useContext(MedicationContext);
  if (!ctx) {
    throw new Error("useMedications must be used inside MedicationProvider");
  }
  return ctx;
};