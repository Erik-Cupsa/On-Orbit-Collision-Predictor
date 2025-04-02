"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CDM {
  id: number;
  sat1_object_designator: string;
  sat2_object_designator: string;
  tca: string;
  creation_date: string;
  miss_distance: number;
}

export default function CesiumViewSelectionPage() {
  const [cdms, setCdms] = useState<CDM[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection states
  const [uniqueSatellites, setUniqueSatellites] = useState<string[]>([]);
  const [selectedSat1, setSelectedSat1] = useState<string>("");
  const [availableSat2Options, setAvailableSat2Options] = useState<string[]>([]);
  const [selectedSat2, setSelectedSat2] = useState<string>("");
  const [matchingCdm, setMatchingCdm] = useState<CDM | null>(null);
  
  const router = useRouter();

  // Fetch all CDM data
  useEffect(() => {
    const fetchCDMs = async () => {
      try {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) {
          setError("Please login to view this page");
          setLoading(false);
          return;
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        };

        const response = await fetch("http://localhost:8000/api/cdms/", { headers });
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
            return;
          }
          throw new Error("Failed to fetch CDMs");
        }
        
        const cdmData: CDM[] = await response.json();
        setCdms(cdmData);
        
        // Extract unique satellite designators
        const allSats = new Set<string>();
        cdmData.forEach(cdm => {
          allSats.add(cdm.sat1_object_designator);
          allSats.add(cdm.sat2_object_designator);
        });
        
        setUniqueSatellites(Array.from(allSats).sort());
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

    fetchCDMs();
  }, [router]);

  // Update available second satellites based on first selection
  useEffect(() => {
    if (!selectedSat1) {
      setAvailableSat2Options([]);
      return;
    }
    
    // Find all CDMs involving the first satellite
    const relevantCdms = cdms.filter(
      cdm => cdm.sat1_object_designator === selectedSat1 || cdm.sat2_object_designator === selectedSat1
    );
    
    // Extract all unique partner satellites
    const partners = new Set<string>();
    relevantCdms.forEach(cdm => {
      if (cdm.sat1_object_designator === selectedSat1) {
        partners.add(cdm.sat2_object_designator);
      } else {
        partners.add(cdm.sat1_object_designator);
      }
    });
    
    setAvailableSat2Options(Array.from(partners).sort());
    setSelectedSat2(""); // Reset second selection
  }, [selectedSat1, cdms]);

  // Find matching CDM when both satellites are selected
  useEffect(() => {
    if (!selectedSat1 || !selectedSat2) {
      setMatchingCdm(null);
      return;
    }
    
    // Find the CDM that involves both satellites
    const match = cdms.find(
      cdm => (cdm.sat1_object_designator === selectedSat1 && cdm.sat2_object_designator === selectedSat2) ||
             (cdm.sat1_object_designator === selectedSat2 && cdm.sat2_object_designator === selectedSat1)
    ) || null;
    
    setMatchingCdm(match);
  }, [selectedSat1, selectedSat2, cdms]);

  // Handle form submission
  const handleViewOrbits = () => {
    if (matchingCdm) {
      router.push(`/cesium-view/${matchingCdm.id}`);
    }
  };

  if (loading) {
    return (
      <div className="pl-[250px] flex flex-col items-center justify-center min-h-screen bg-white p-10 w-screen">
        <div className="text-center">
          <div className="mb-4 text-xl font-medium">Loading CDM data...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pl-[250px] flex flex-col items-center justify-center min-h-screen bg-white p-10 w-screen">
        <div className="text-center text-red-500 max-w-lg">
          <div className="mb-4 text-xl font-medium">Error</div>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-[250px] flex flex-1 flex-col h-screen w-full ml-10 p-10 gap-20">
      <section>
        <span><span className="text-gray-400">Cesium&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp; </span><span className="text-black">Orbit Visualization</span></span>
      </section>

      <div className="max-w-4xl mx-auto w-full ">
        <div className="rounded-3xl bg-[#f9f9fa] flex flex-col w-full px-8 py-10">
          <h1 className="text-2xl font-medium mb-8 text-center">Satellite Orbit Visualization</h1>
          
          <div className="flex flex-col gap-8">
            {/* Step 1: Select first satellite */}
            <div className="flex flex-col gap-2">
              <label className="text-[16px] font-medium">Step 1: Select First Satellite</label>
              <div className="relative">
                <select
                  value={selectedSat1}
                  onChange={(e) => setSelectedSat1(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">-- Select a satellite --</option>
                  {uniqueSatellites.map((sat) => (
                    <option key={sat} value={sat}>
                      {sat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Step 2: Select second satellite */}
            <div className="flex flex-col gap-2">
              <label className={`text-[16px] font-medium ${!selectedSat1 ? "text-gray-400" : ""}`}>
                Step 2: Select Second Satellite
              </label>
              <div className="relative">
                <select
                  value={selectedSat2}
                  onChange={(e) => setSelectedSat2(e.target.value)}
                  disabled={!selectedSat1 || availableSat2Options.length === 0}
                  className={`w-full p-3 border border-gray-300 rounded-xl 
                              ${!selectedSat1 ? "bg-gray-100 cursor-not-allowed" : "bg-white cursor-pointer"} 
                              focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none`}
                >
                  <option value="">-- Select a satellite --</option>
                  {availableSat2Options.map((sat) => (
                    <option key={sat} value={sat}>
                      {sat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              
              {selectedSat1 && availableSat2Options.length === 0 && (
                <p className="text-amber-600 text-sm mt-1">
                  No conjunction data found for this satellite. Please select a different one.
                </p>
              )}
            </div>

            {/* CDM information and visualization button */}
            {matchingCdm && (
              <div className="mt-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium mb-3">Conjunction Details:</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-gray-500 text-sm">CDM ID</p>
                    <p className="font-medium">{matchingCdm.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Miss Distance</p>
                    <p className="font-medium">{matchingCdm.miss_distance.toFixed(3)} km</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Time of Closest Approach</p>
                    <p className="font-medium">{new Date(matchingCdm.tca).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">CDM Creation Date</p>
                    <p className="font-medium">{new Date(matchingCdm.creation_date).toLocaleString()}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleViewOrbits}
                  className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="white">
                    <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                  </svg>
                  View Orbital Trajectories
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}