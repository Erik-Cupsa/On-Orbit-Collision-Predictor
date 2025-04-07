"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  TimeScale,
  LogarithmicScale,
} from "chart.js";
import { Line } from "react-chartjs-2";
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  TimeScale,
  LogarithmicScale
);

// Mapping of space agency domains to their corresponding abbreviated organization names
const spaceAgencyMap: Record<string, string> = {
  "asc-csa.gc.ca": "CSA",
  "nasa.gov": "NASA",
  "esa.int": "ESA",
  "roscosmos.ru": "Roscosmos",
  "cnsa.gov.cn": "CNSA",
  "isro.gov.in": "ISRO",
  "jaxa.jp": "JAXA",
  "gov.uk/government/organisations/uk-space-agency": "UK Space Agency",
  "cnes.fr": "CNES",
  "dlr.de": "DLR",
  "asi.it": "ASI",
  "aeb.gov.br": "AEB",
  "kari.re.kr": "KARI",
  "space.gov.ae": "UAE Space Agency",
  "australianspaceagency.gov.au": "Australian Space Agency",
  "space.gov.il": "Israel Space Agency"
};

interface CDM {
  id: number;
  sat1_object_designator: string;
  sat2_object_designator: string;
  creation_date: string;
  miss_distance: number;
}

interface Collision {
  id: number;
  cdm: number;
  probability_of_collision: number;
}

interface CDMWithCollision extends CDM {
  probability_of_collision: number;
}

interface User {
  id: string;
  email: string;
  role: string; // e.g. "admin", "user", etc.
}

interface Organization {
  id: number;
  name: string;
  alert_threshold: number;
  // other organization fields if needed
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [cdms, setCdms] = useState<CDMWithCollision[]>([]);
  // This state will hold the final CDM IDs determined by the selected satellites.
  const [selectedCdms, setSelectedCdms] = useState<number[]>([]);
  // State to track selected satellite designators (e.g., "SAT-001")
  const [selectedSatellites, setSelectedSatellites] = useState<string[]>([]);
  // For satellite search filtering
  const [satelliteSearchTerm, setSatelliteSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Retain the old search term for filtering CDMs (only used for non-agency users)
  const [searchTerm, setSearchTerm] = useState<string>("");
  // For filtering by object ID in the charts (unchanged)
  const [searchObjectId, setSearchObjectId] = useState<string>("");
  // State for organization details (from the organizations endpoint)
  const [organization, setOrganization] = useState<Organization | null>(null);
  // For editing the alert threshold (as text)
  const [alertThreshold, setAlertThreshold] = useState<string>("");

  const router = useRouter();

  // Determine if the current user is an agency user (i.e. email domain in our map)
  const isAgencyUser = user
    ? (user.email.split("@").pop() || "").toLowerCase() in spaceAgencyMap
    : false;

  // -----------------------------
  // Fetch current signed-in user
  // -----------------------------
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to access this page.");
        router.push("/login");
        return;
      }
      try {
        const response = await fetch("http://localhost:8000/api/users/current_user/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch user info.");
        }
        const data = await response.json();
        setUser(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      }
    };
    fetchUser();
  }, [router]);

  // -----------------------------------
  // Fetch CDMs and merge collision data
  // -----------------------------------
  useEffect(() => {
    const fetchCDMs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Failed to fetch CDMs: Please login to view this page");
        }
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        let cdmsData: CDM[] = [];

        if (user && user.email) {
          const domain = user.email.split("@").pop()?.toLowerCase() || "";
          if (domain in spaceAgencyMap) {
            const orgName = spaceAgencyMap[domain];
            const orgResponse = await fetch(`http://localhost:8000/api/organizations/?search=${orgName}`, { headers });
            if (!orgResponse.ok) {
              if (orgResponse.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
              }
              throw new Error("Failed to fetch organizations");
            }
            const orgData = await orgResponse.json();
            if (orgData.length > 0) {
              // Use the first matching organization
              setOrganization(orgData[0]);
              setAlertThreshold(orgData[0].alert_threshold.toString());
              cdmsData = orgData[0].cdms;
            } else {
              // Fallback to default endpoint if no matching organization found
              const response = await fetch("http://localhost:8000/api/cdms/", { headers });
              if (!response.ok) {
                if (response.status === 401) {
                  localStorage.removeItem("token");
                  router.push("/login");
                  return;
                }
                throw new Error("Failed to fetch CDMs");
              }
              cdmsData = await response.json();
            }
          } else {
            const response = await fetch("http://localhost:8000/api/cdms/", { headers });
            if (!response.ok) {
              if (response.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
              }
              throw new Error("Failed to fetch CDMs");
            }
            cdmsData = await response.json();
          }
        } else {
          const response = await fetch("http://localhost:8000/api/cdms/", { headers });
          if (!response.ok) {
            if (response.status === 401) {
              localStorage.removeItem("token");
              router.push("/login");
              return;
            }
            throw new Error("Failed to fetch CDMs");
          }
          cdmsData = await response.json();
        }

        // Fetch collision probabilities
        const collisionResponse = await fetch("http://localhost:8000/api/collisions/", { headers });
        if (!collisionResponse.ok) {
          if (collisionResponse.status === 401) throw new Error("Unauthorized: Invalid or expired token");
          throw new Error("Failed to fetch collision probabilities");
        }
        const collisionData: Collision[] = await collisionResponse.json();

        // Merge collision info into CDM data
        const mergedData: CDMWithCollision[] = cdmsData.map((cdm) => {
          const collisionInfo = collisionData.find((collision) => collision.cdm === cdm.id);
          return {
            ...cdm,
            probability_of_collision: collisionInfo?.probability_of_collision ?? 0,
          };
        });

        setCdms(mergedData);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCDMs();
    }
  }, [user, router]);

  // ------------------------------------------------------------------
  // Update selected CDM IDs whenever selected satellites or cdms change
  // ------------------------------------------------------------------
  useEffect(() => {
    const newSelectedCdms = cdms
      .filter(
        (cdm) =>
          selectedSatellites.includes(cdm.sat1_object_designator) ||
          selectedSatellites.includes(cdm.sat2_object_designator)
      )
      .map((cdm) => cdm.id);
    setSelectedCdms(newSelectedCdms);
  }, [selectedSatellites, cdms]);

  // Handler for updating satellite selection (from the filter bar)
  const handleSatelliteCheckboxChange = (satellite: string, checked: boolean) => {
    setSelectedSatellites((prev) => {
      if (checked) {
        return [...prev, satellite];
      } else {
        return prev.filter((s) => s !== satellite);
      }
    });
  };

  // Handler for updating the alert threshold (admin only)
  const handleUpdateAlertThreshold = async () => {
    if (!organization) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    // Parse the alert threshold from the text input
    const parsedThreshold = parseFloat(alertThreshold);
    if (isNaN(parsedThreshold)) {
      alert("Please enter a valid number for the alert threshold.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/organizations/${organization.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ alert_threshold: parsedThreshold })
      });
      if (!response.ok) {
        throw new Error("Failed to update alert threshold");
      }
      alert("Alert threshold updated successfully");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  // For non-agency users: filter CDMs using the existing search term
  const filteredCdms = cdms.filter((cdm) =>
    cdm.id.toString().includes(searchTerm) ||
    cdm.sat1_object_designator.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cdm.sat2_object_designator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // -------------------------
  // Derive unique satellites
  // -------------------------
  const allSatellites = Array.from(
    new Set(cdms.flatMap((cdm) => [cdm.sat1_object_designator, cdm.sat2_object_designator]))
  );
  const filteredSatellites = allSatellites.filter((sat) =>
    sat.toLowerCase().includes(satelliteSearchTerm.toLowerCase())
  );

  // --------------------------------------------------------
  // Prepare chart datasets for the charts (unchanged)
  // --------------------------------------------------------
  const filteredByObjectId = cdms.filter(
    (cdm) =>
      searchObjectId &&
      (cdm.sat1_object_designator === searchObjectId || cdm.sat2_object_designator === searchObjectId)
  );
  const groupedByConjunction: Record<string, CDMWithCollision[]> = {};
  filteredByObjectId.forEach((cdm) => {
    const otherObject =
      cdm.sat1_object_designator === searchObjectId ? cdm.sat2_object_designator : cdm.sat1_object_designator;
    if (!groupedByConjunction[otherObject]) {
      groupedByConjunction[otherObject] = [];
    }
    groupedByConjunction[otherObject].push(cdm);
  });
  const chartDatasets = Object.entries(groupedByConjunction).map(([otherObject, cdmsInGroup], index) => {
    const sortedCdms = [...cdmsInGroup].sort(
      (a, b) => new Date(a.creation_date).getTime() - new Date(b.creation_date).getTime()
    );
    return {
      label: `With ${otherObject}`,
      data: sortedCdms.map((cdm) => ({
        x: new Date(cdm.creation_date),
        y: cdm.miss_distance,
      })),
      borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
      backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%, 0.5)`,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
    };
  });

  // For non-agency users, sort and limit results for table display
  const sortedCdms = [...filteredCdms]
    .sort((a, b) => new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime())
    .slice(0, 20);

  return (
    <div className="pl-[250px] flex flex-1 flex-col h-full bg-white w-screen m-10 gap-5">
      <section>
        <span>
          <span className="text-gray-400">Dashboards&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp; </span>
          <span className="text-black">Overview</span>
        </span>
      </section>

      {isAgencyUser ? (
        <>
          {/* Satellite Filtering as a Filter Bar */}
          <section className="flex flex-col bg-[#f9f9fa] rounded-3xl w-full px-8 py-4 mb-4">
            <h1 className="text-[16px] font-medium mb-2">Filter by Satellite</h1>
            <div className="mb-2">
              <Input
                type="text"
                placeholder="Search satellites..."
                value={satelliteSearchTerm}
                onChange={(e) => setSatelliteSearchTerm(e.target.value)}
                className="w-[300px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredSatellites.length > 0 ? (
                filteredSatellites.map((satellite) => (
                  <label key={satellite} className="flex items-center gap-1 px-2 py-1 bg-white rounded shadow">
                    <input
                      type="checkbox"
                      checked={selectedSatellites.includes(satellite)}
                      onChange={(e) => handleSatelliteCheckboxChange(satellite, e.target.checked)}
                    />
                    <span className="text-sm">{satellite}</span>
                  </label>
                ))
              ) : (
                <div className="text-gray-500 text-sm">No satellites match your search.</div>
              )}
            </div>
          </section>

          {/* Top Section: Show only the currently selected CDMs */}
          <section className="flex rounded-3xl bg-[#f9f9fa] flex-col w-full px-8 py-8">
            <h1 className="text-[16px] font-medium mb-4">Your Selected CDMs</h1>
            {loading ? (
              <p>Loading CDM data...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <div className="w-full">
                <div className="flex justify-between px-4 py-0 text-gray-600 font-normal text-[12px]">
                  <div className="w-16 p-2">ID</div>
                  <div className="w-32 p-2">Sat 1</div>
                  <div className="w-32 p-2">Sat 2</div>
                  <div className="w-72 p-2">Created</div>
                  <div className="w-32 p-2">Miss Distance</div>
                  <div className="w-40 p-2">Collision Probability</div>
                  <div className="w-28 p-2">Visualization Link</div>
                  <div className="w-28 p-2">Maneuver</div>
                </div>
                <div className="overflow-y-auto max-h-48">
                  <div className="flex flex-col gap-1">
                    {cdms.filter((cdm) => selectedCdms.includes(cdm.id)).length > 0 ? (
                      cdms
                        .filter((cdm) => selectedCdms.includes(cdm.id))
                        .map((cdm, index) => (
                          <div
                            key={cdm.id}
                            className={`flex items-center justify-between px-4 py-1 font-normal text-[14px] rounded-xl shadow-sm ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <div className="w-16 p-2">{cdm.id}</div>
                            <div className="w-32 p-2">{cdm.sat1_object_designator}</div>
                            <div className="w-32 p-2">{cdm.sat2_object_designator}</div>
                            <div className="w-72 p-2">{new Date(cdm.creation_date).toUTCString()}</div>
                            <div className="w-32 p-2">{cdm.miss_distance.toFixed(3)}</div>
                            {cdm.probability_of_collision > 0
                              ? (() => {
                                  const p = cdm.probability_of_collision;
                                  const exp = Math.floor(Math.log10(p));
                                  const mantissa = p / Math.pow(10, exp);
                                  return `${mantissa.toFixed(2)}e${exp}`;
                                })()
                              : "0.0000"}
                            <div className="w-28 p-2 text-[#0000EE]">
                              <a href={`/cesium-view/${cdm.id}`} className="flex gap-1 items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#0000EE">
                                  <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                                </svg>
                                View
                              </a>
                            </div>
                            <div className="w-28 p-2 text-[#0000EE]">
                              <a href={`/maneuvering/heatmap/${cdm.id}`} className="flex gap-1 items-center">
                                Maneuver
                              </a>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">No CDMs selected.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Admin Alert Threshold Section (moved below the Selected CDMs) */}
          {user?.role === "admin" && organization && (
            <section className="flex flex-col bg-[#f9f9fa] rounded-3xl w-full px-8 py-4 mb-4">
              <h1 className="text-[16px] font-medium mb-2">Update Alert Threshold</h1>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Enter alert threshold"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-[200px]"
                />
                <button
                  onClick={handleUpdateAlertThreshold}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Update
                </button>
              </div>
            </section>
          )}

          {/* Confirm Button (Commented Out) */}
          {/*
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleConfirmInterest}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirm Interested CDMs
            </button>
          </div>
          */}
        </>
      ) : (
        // For normal users: show the original CDM table without selection
        <section className="flex rounded-3xl bg-[#f9f9fa] flex-col w-full px-8 py-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-[16px] font-medium">Conjunction Data Messages (CDMs)</h1>
            <Input
              type="text"
              placeholder="Search by CDM ID or Object ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
          </div>
          {loading ? (
            <p>Loading CDM data...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="w-full">
              <div className="flex justify-between px-4 py-0 text-gray-600 font-normal text-[12px]">
                <div className="w-16 p-2">ID</div>
                <div className="w-32 p-2">Sat 1</div>
                <div className="w-32 p-2">Sat 2</div>
                <div className="w-72 p-2">Created</div>
                <div className="w-32 p-2">Miss Distance</div>
                <div className="w-40 p-2">Collision Probability</div>
                <div className="w-28 p-2">Visualization Link</div>
                <div className="w-28 p-2">Maneuver</div>
              </div>
              <div className="overflow-y-auto max-h-48">
                <div className="flex flex-col gap-1">
                  {sortedCdms.length > 0 ? (
                    sortedCdms.map((cdm, index) => (
                      <div
                        key={cdm.id}
                        className={`flex items-center justify-between px-4 py-1 font-normal text-[14px] rounded-xl shadow-sm ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <div className="w-16 p-2">{cdm.id}</div>
                        <div className="w-32 p-2">{cdm.sat1_object_designator}</div>
                        <div className="w-32 p-2">{cdm.sat2_object_designator}</div>
                        <div className="w-72 p-2">{new Date(cdm.creation_date).toUTCString()}</div>
                        <div className="w-32 p-2">{cdm.miss_distance.toFixed(3)}</div>
                        {cdm.probability_of_collision > 0
                          ? (() => {
                              const p = cdm.probability_of_collision;
                              const exp = Math.floor(Math.log10(p));
                              const mantissa = p / Math.pow(10, exp);
                              return `${mantissa.toFixed(2)}e${exp}`;
                            })()
                          : "0.0000"}
                        <div className="w-28 p-2 text-[#0000EE]">
                          <a href={`/cesium-view/${cdm.id}`} className="flex gap-1 items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#0000EE">
                              <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                            </svg>
                            View
                          </a>
                        </div>
                        <div className="w-28 p-2 text-[#0000EE]">
                          <a href={`/maneuvering/heatmap/${cdm.id}`} className="flex gap-1 items-center">
                            Maneuver
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No data available.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Graphs Section (unchanged) */}
      <div className="grid sm:grid-cols-2 grid-cols-1 gap-5">
        <section className="flex rounded-3xl bg-[#f9f9fa] flex-col w-full px-8 py-8">
          <div className="w-full flex justify-between gap-2">
            <h1 className="text-[16px] font-medium mb-4">Miss Distance Over Time</h1>
            <Input
              type="text"
              placeholder="Enter Object ID"
              value={searchObjectId}
              onChange={(e) => setSearchObjectId(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="w-full h-[350px] relative">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading data...
              </div>
            ) : chartDatasets.length > 0 ? (
              <Line
                data={{ datasets: chartDatasets }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: "time",
                      time: {
                        unit: "day",
                        tooltipFormat: "MMM d, yyyy HH:mm",
                        displayFormats: { day: "MMM d" },
                      },
                      title: { display: true, text: "Creation Date" },
                    },
                    y: {
                      title: { display: true, text: "Miss Distance (km)" },
                      beginAtZero: false,
                    },
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.dataset.label || "";
                          const value =
                            context.parsed.y !== null ? context.parsed.y.toFixed(3) + " km" : "";
                          return `${label}: ${value}`;
                        },
                      },
                    },
                    legend: {
                      position: "bottom",
                      labels: { boxWidth: 12, usePointStyle: true, pointStyle: "circle" },
                    },
                  },
                  interaction: { mode: "nearest", axis: "x", intersect: false },
                }}
              />
            ) : searchObjectId ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No conjunction data found for object ID: {searchObjectId}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Enter an object ID to view miss distance data
              </div>
            )}
          </div>
        </section>

        <section className="flex rounded-3xl bg-[#f9f9fa] flex-col w-full px-8 py-8">
          <div className="w-full flex justify-between gap-2">
            <h1 className="text-[16px] font-medium mb-4">Probability of Collision Over Time</h1>
            <Input
              type="text"
              placeholder="Enter Object ID"
              value={searchObjectId}
              onChange={(e) => setSearchObjectId(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="w-full h-[350px] relative">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading data...
              </div>
            ) : chartDatasets.length > 0 ? (
              <Line
                data={{
                  datasets: Object.entries(groupedByConjunction).map(([otherObject, cdmsInGroup], index) => {
                    const sortedCdms = [...cdmsInGroup].sort(
                      (a, b) => new Date(a.creation_date).getTime() - new Date(b.creation_date).getTime()
                    );
                    return {
                      label: `With ${otherObject}`,
                      data: sortedCdms.map((cdm) => {
                        const originalValue = cdm.probability_of_collision;
                        const scientificStr = originalValue.toExponential();
                        const exponentMatch = scientificStr.match(/e([+-]\d+)$/);
                        const exponent = exponentMatch ? parseInt(exponentMatch[1]) : 0;
                        return {
                          x: new Date(cdm.creation_date),
                          y: -exponent,
                          _originalValue: originalValue,
                        };
                      }),
                      borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                      backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%, 0.5)`,
                      tension: 0.3,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    };
                  }),
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: "time",
                      time: {
                        unit: "day",
                        tooltipFormat: "MMM d, yyyy HH:mm",
                        displayFormats: { day: "MMM d" },
                      },
                      title: { display: true, text: "Creation Date" },
                    },
                    y: {
                      type: "linear",
                      title: { display: true, text: "Probability Exponent (-10^x)" },
                      ticks: { callback: (value) => `10^-${value}` },
                      reverse: true,
                    },
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.dataset.label || "";
                          const dataPoint = context.raw as { x: Date; y: number; _originalValue: number };
                          const originalValue = dataPoint._originalValue;
                          const scientificStr = originalValue.toExponential(6);
                          return `${label}: ${scientificStr}`;
                        },
                      },
                    },
                    legend: {
                      position: "bottom",
                      labels: { boxWidth: 12, usePointStyle: true, pointStyle: "circle" },
                    },
                    title: { display: true, text: "Higher = Higher Probability", position: "top" },
                  },
                  interaction: { mode: "nearest", axis: "x", intersect: false },
                }}
              />
            ) : searchObjectId ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No conjunction data found for object ID: {searchObjectId}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Enter an object ID to view collision probability data
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
