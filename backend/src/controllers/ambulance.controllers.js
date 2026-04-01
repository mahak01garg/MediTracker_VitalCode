const getHospitalsWithAmbulances = async (req, res) => {
  try {
    const hospitals = [
      {
        id: "city-hospital",
        name: "City Hospital",
        location: "Sector 12, Downtown",
        availableAmbulances: 5,
        totalAmbulances: 8,
        estimatedArrivalMinutes: 12,
        emergencyContact: "+91-9999000001",
      },
      {
        id: "regency-hospital",
        name: "Regency Hospital",
        location: "MG Road",
        availableAmbulances: 3,
        totalAmbulances: 6,
        estimatedArrivalMinutes: 15,
        emergencyContact: "+91-9999000002",
      },
      {
        id: "apollo-hospital",
        name: "Apollo Hospital",
        location: "Civil Lines",
        availableAmbulances: 6,
        totalAmbulances: 10,
        estimatedArrivalMinutes: 10,
        emergencyContact: "+91-9999000003",
      },
      {
        id: "healthcare-hospital",
        name: "Healthcare Hospital",
        location: "Ring Road",
        availableAmbulances: 2,
        totalAmbulances: 5,
        estimatedArrivalMinutes: 18,
        emergencyContact: "+91-9999000004",
      },
      {
        id: "sunrise-hospital",
        name: "Sunrise Hospital",
        location: "Green Park",
        availableAmbulances: 4,
        totalAmbulances: 7,
        estimatedArrivalMinutes: 14,
        emergencyContact: "+91-9999000005",
      },
      {
        id: "lifecare-hospital",
        name: "LifeCare Hospital",
        location: "Airport Road",
        availableAmbulances: 1,
        totalAmbulances: 4,
        estimatedArrivalMinutes: 20,
        emergencyContact: "+91-9999000006",
      },
    ];

    return res.status(200).json({
      success: true,
      data: {
        hospitals,
        totalHospitals: hospitals.length,
        totalAvailableAmbulances: hospitals.reduce(
          (sum, hospital) => sum + hospital.availableAmbulances,
          0
        ),
      },
      message: "Hospitals with ambulance availability fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospitals",
      error: error.message,
    });
  }
};

module.exports = { getHospitalsWithAmbulances };
