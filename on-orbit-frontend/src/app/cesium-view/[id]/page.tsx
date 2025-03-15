"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar/page";
import Footer from "@/components/footer/page";
import Csa from "@/components/csa/csa";

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
    const router = useRouter();

    const [cdm, setCdm] = useState<CDM | null>(null);
    const [tleData, setTleData] = useState<TLEData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCdmAndTleData = async () => {
            try {
                const accessToken = localStorage.getItem('token');
                const headers = {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                };

                const cdmResponse = await fetch(`http://localhost:8000/api/cdms/${id}/`, { headers });
                if (!cdmResponse.ok) throw new Error("Failed to fetch CDM details.");
                const cdmData: CDM = await cdmResponse.json();
                setCdm(cdmData);

                const tleSat1 = await fetchTleFromCelesTrak(cdmData.sat1_object_designator);
                const tleSat2 = await fetchTleFromCelesTrak(cdmData.sat2_object_designator);

                if (tleSat1 && tleSat2) {
                    setTleData({ sat1: tleSat1.join("\n"), sat2: tleSat2.join("\n") });
                } else {
                    setError("Failed to fetch TLE data for one or both satellites.");
                }
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
            <button
                onClick={() => router.push("/dashboard")}
                className="mb-4 p-2 bg-gray-300 text-black rounded hover:bg-gray-400"
            >
                &larr; Back to CDMs
            </button>
            <h1 className="text-2xl font-bold mb-4">TLE Data for CDM ID: {id}</h1>
            
            <div className="mb-4">
                <h2 className="text-xl font-semibold">Satellite A ({cdm.sat1_object_designator})</h2>
                <pre className="bg-gray-200 p-4 rounded-md">{tleData.sat1}</pre>
            </div>

            <div>
                <h2 className="text-xl font-semibold">Satellite B ({cdm.sat2_object_designator})</h2>
                <pre className="bg-gray-200 p-4 rounded-md">{tleData.sat2}</pre>
            </div>
        </div>
    );
};

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