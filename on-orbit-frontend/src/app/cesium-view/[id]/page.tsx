"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Viewer, Entity } from "cesium";
import * as Cesium from "cesium";

interface CDM {
    id: number;
    sat1_object_designator: string;
    sat2_object_designator: string;
}

interface TLEData {
    sat1: string;
    sat2: string;
}

const CesiumView = () => {
    const { id } = useParams();
    const [cdm, setCdm] = useState<CDM | null>(null);
    const [tleData, setTleData] = useState<TLEData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCdmAndTleData = async () => {
            try {
                // Use a hardcoded access token for now
                const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjMzNzU5ZDUtODMxMC00NzJhLTk2NWMtNGYzNmYwMmQzZTVlIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzM5OTEzMjU0LCJpYXQiOjE3Mzk4MjY4NTR9.f8-v5GLOtkFItNPwE6k6ojTia2kJI5oAN8BRA4iI2DU";
        
                const headers = {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                };

                // Fetch CDM details
                const cdmResponse = await fetch(`http://localhost:8000/api/cdms/${id}/`, { headers });
                if (!cdmResponse.ok) throw new Error("Failed to fetch CDM details.");
                const cdmData: CDM = await cdmResponse.json();
                setCdm(cdmData);


                // Fetch TLE Data for both satellites from CelesTrak
                const tleSat1 = await fetchTleFromCelesTrak(cdmData.sat1_object_designator);
                const tleSat2 = await fetchTleFromCelesTrak(cdmData.sat2_object_designator);

                if (!tleSat1 || !tleSat2) throw new Error("Failed to fetch TLE data.");

                setTleData({ sat1: tleSat1, sat2: tleSat2 });

            } catch (err) {
                if (err instanceof Error) setError(err.message);
                else setError("An unknown error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchCdmAndTleData();
    }, [id]);

    if (loading) return <div className="min-h-screen w-screen flex justify-center items-center"><p>Loading...</p></div>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!cdm || !tleData) return <p>No data available.</p>;

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-2xl font-bold mb-4">TLE Data for CDM ID: {id}</h1>
            
            <div className="mb-4">
                <h2 className="text-xl font-semibold">Satellite A ({cdm.sat1_object_designator})</h2>
                <pre className="bg-gray-200 p-4 rounded-md">{tleData.sat1.join("\n")}</pre>
            </div>

            <div>
                <h2 className="text-xl font-semibold">Satellite B ({cdm.sat2_object_designator})</h2>
                <pre className="bg-gray-200 p-4 rounded-md">{tleData.sat2.join("\n")}</pre>
            </div>
        </div>
    );
};


// ✅ Fetch TLE Data from CelesTrak API
const fetchTleFromCelesTrak = async (satelliteId: string): Promise<string[] | null> => {
    try {
        const response = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${satelliteId}&FORMAT=TLE`);
        if (!response.ok) throw new Error(`Failed to fetch TLE for satellite ${satelliteId}`);

        const tleText = await response.text();
        const tleLines = tleText.split("\n").filter(line => line.trim() !== "");

        return tleLines.length >= 2 ? tleLines.slice(0, 2) : null;
    } catch (error) {
        console.error("Error fetching TLE:", error);
        return null;
    }
};

export default CesiumView;