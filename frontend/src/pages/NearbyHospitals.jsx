import React, { useEffect, useMemo, useState } from "react";
import { FiMapPin, FiNavigation, FiRefreshCw, FiSearch } from "react-icons/fi";
import { FaCar, FaMotorcycle, FaWalking } from "react-icons/fa";
import PageDoodle from "../components/common/PageDoodle";

const toRad = (value) => (value * Math.PI) / 180;
const distanceKm = (aLat, aLng, bLat, bLng) => {
  const r = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const avgSpeeds = {
  walk: 4.5,
  bike: 28,
  car: 22,
};

const formatEta = (minutes) => {
  if (minutes < 1) return "1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
};

const estimateTravelTimes = (straightLineKm) => {
  // Road distance is usually higher than straight-line distance.
  const roadDistanceKm = Math.max(0.4, straightLineKm * 1.35);
  return {
    walking: formatEta((roadDistanceKm / avgSpeeds.walk) * 60),
    bike: formatEta((roadDistanceKm / avgSpeeds.bike) * 60),
    car: formatEta((roadDistanceKm / avgSpeeds.car) * 60),
  };
};

const NearbyHospitals = () => {
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("Detecting your location...");
  const [cityQuery, setCityQuery] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [error, setError] = useState("");
  const [hospitals, setHospitals] = useState([]);

  const mapUrl = useMemo(() => {
    if (!location) return "";
    return `https://www.google.com/maps?q=hospitals+near+${location.lat},${location.lng}&z=14&output=embed`;
  }, [location]);

  const fetchNearbyHospitals = async (lat, lng) => {
    try {
      setLoadingHospitals(true);
      setError("");

      const latDelta = 0.12;
      const lngDelta = 0.12;
      const left = lng - lngDelta;
      const right = lng + lngDelta;
      const top = lat + latDelta;
      const bottom = lat - latDelta;

      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&amenity=hospital&limit=20&bounded=1&viewbox=${left},${top},${right},${bottom}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch nearby hospitals");

      const data = await response.json();
      const mapped = (Array.isArray(data) ? data : [])
        .map((item) => {
          const itemLat = Number(item.lat);
          const itemLng = Number(item.lon);
          return {
            id: item.place_id,
            name: item.name || item.display_name?.split(",")[0] || "Hospital",
            address: item.display_name || "Address unavailable",
            lat: itemLat,
            lng: itemLng,
            distance: distanceKm(lat, lng, itemLat, itemLng),
          };
        })
        .sort((a, b) => a.distance - b.distance);

      setHospitals(mapped);
    } catch (err) {
      setError(err.message || "Could not load nearby hospitals");
      setHospitals([]);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const resolveCity = async () => {
    if (!cityQuery.trim()) return;
    try {
      setLoadingLocation(true);
      setError("");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(cityQuery.trim())}`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) throw new Error("City lookup failed");
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("City not found");
      const first = data[0];
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      setLocation({ lat, lng });
      setLocationLabel(first.display_name || cityQuery.trim());
      fetchNearbyHospitals(lat, lng);
    } catch (err) {
      setError(err.message || "Could not find this location");
    } finally {
      setLoadingLocation(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      setLoadingLocation(false);
      return;
    }

    setLoadingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        setLocationLabel("Your current location");
        setLoadingLocation(false);
        fetchNearbyHospitals(lat, lng);
      },
      () => {
        setError("Location permission denied. Search by city instead.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-700 to-blue-700 p-6 text-white shadow-lg">
        <PageDoodle type="support" className="absolute right-4 top-3 hidden md:block" />
        <h1 className="text-3xl font-extrabold">Nearby Hospitals Map</h1>
        <p className="mt-2 text-cyan-100">Find hospitals around you with live map support.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Current location:</span> {locationLabel}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center rounded-xl border border-slate-300 px-2 dark:border-slate-600">
              <FiSearch className="text-slate-500" />
              <input
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Search city (e.g. Lucknow)"
                className="border-0 bg-transparent px-2 py-2 text-sm text-slate-900 focus:outline-none dark:text-slate-100"
              />
            </div>
            <button
              onClick={resolveCity}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              Search
            </button>
            <button
              onClick={detectLocation}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiNavigation className="mr-2" />
              Use My Location
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-600/40 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {!location || loadingLocation ? (
              <div className="flex h-[520px] items-center justify-center text-slate-500 dark:text-slate-300">
                Detecting location...
              </div>
            ) : (
              <iframe
                title="Nearby Hospitals Map"
                src={mapUrl}
                className="h-[520px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Nearby Hospitals</h2>
              <button
                onClick={() => location && fetchNearbyHospitals(location.lat, location.lng)}
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FiRefreshCw className="mr-1" />
                Refresh
              </button>
            </div>

            {loadingHospitals ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-300">Loading nearby hospitals...</div>
            ) : hospitals.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-300">No hospitals found in this area.</div>
            ) : (
              <div className="max-h-[450px] space-y-3 overflow-y-auto pr-1">
                {hospitals.slice(0, 15).map((hospital) => (
                  <div key={hospital.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{hospital.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{hospital.address}</p>
                    {(() => {
                      const eta = estimateTravelTimes(hospital.distance);
                      return (
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                          <div className="rounded-md bg-slate-100 px-2 py-1 text-center text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <span className="inline-flex items-center justify-center gap-1">
                              <FaWalking />
                              {eta.walking}
                            </span>
                          </div>
                          <div className="rounded-md bg-slate-100 px-2 py-1 text-center text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <span className="inline-flex items-center justify-center gap-1">
                              <FaMotorcycle />
                              {eta.bike}
                            </span>
                          </div>
                          <div className="rounded-md bg-slate-100 px-2 py-1 text-center text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <span className="inline-flex items-center justify-center gap-1">
                              <FaCar />
                              {eta.car}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                        <FiMapPin className="mr-1" />
                        {hospital.distance.toFixed(1)} km
                      </span>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
                      >
                        Get Directions
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyHospitals;
