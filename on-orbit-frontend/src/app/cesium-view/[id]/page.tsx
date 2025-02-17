"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface CDM {
    id: number;
    sat1_object_designator: string;
    sat2_object_designator: string;
    tca: string;
    miss_distance: number;
}

interface TLEData {
    name: string;
    line1: string;
    line2: string;
}

export default function CesiumView(){
    const router = useRouter();
    const { id } = router.query; // Get ID from URL
    const [cdm, setCdm] = useState<CDM | null>(null);
    const [tleSat1, setTleSat1] = useState<TLEData | null>(null);
    const [tleSat2, setTleSat2] = useState<TLEData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!id) return;

        // Fetch CDM Data from Backend
        const fetchCDM = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/cdms/${id}/`);
                if (!response.ok) throw new Error("Failed to fetch CDM data");
                const data: CDM = await response.json();
                setCdm(data);

                // Fetch TLE data for both satellites
                fetchTLE(data.sat1_object_designator, setTleSat1);
                fetchTLE(data.sat2_object_designator, setTleSat2);
            } catch (error) {
                console.error("Error fetching CDM:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCDM();
    }, [id]);

    const fetchTLE = async (satelliteId: string, setTle: (tle: TLEData) => void) => {
        try {
            const response = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${satelliteId}&FORMAT=TLE`);
            if (!response.ok) throw new Error(`Failed to fetch TLE for ${satelliteId}`);
            const textData = await response.text();
            const tleLines = textData.split("\n").map(line => line.trim());

            if (tleLines.length >= 3) {
                setTle({
                    name: tleLines[0],
                    line1: tleLines[1],
                    line2: tleLines[2],
                });
            }
        } catch (error) {
            console.error(`Error fetching TLE for ${satelliteId}:`, error);
        }
    };

    if (loading) return <div>Loading CDM & TLE data...</div>;
    if (!cdm) return <div>CDM not found.</div>;

    return (
        <div>
            <h1>Cesium View for CDM {cdm.id}</h1>
            <p>Satellite 1: {cdm.sat1_object_designator}</p>
            <p>Satellite 2: {cdm.sat2_object_designator}</p>

            <h2>TLE Data:</h2>
            <pre>{tleSat1 ? `${tleSat1.name}\n${tleSat1.line1}\n${tleSat1.line2}` : "Loading TLE for Sat 1..."}</pre>
            <pre>{tleSat2 ? `${tleSat2.name}\n${tleSat2.line1}\n${tleSat2.line2}` : "Loading TLE for Sat 2..."}</pre>

            {/* ✅ NEXT STEP: Pass TLE to a Cesium Component */}
        </div>
    );
}