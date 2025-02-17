"use client"

import Navbar from "@/components/navbar/page";
import Footer from "@/components/footer/page";
import { useEffect, useState } from "react";

interface CDM {
    id: number;
    sat1_object_designator: string;
    sat2_object_designator: string;
    tca: string;
    miss_distance: number;
}

interface Collision {
    id: number;
    probability_of_collision: number;
}

interface CDMWithCollision extends CDM{
    probability_of_collision: number;
}

export default function Dashboard() {
    // const [cdms, setCdms] = useState<CDMWithCollision[]>([]);
    const [cdms, setCdms] = useState<CDMWithCollision[]>([
        {
            id: 0,
            sat1_object_designator: "SAT-123",
            sat2_object_designator: "SAT-456",
            tca: new Date().toISOString(),
            miss_distance: 1.234,
            probability_of_collision: 0.0023,
        },
        {
            id: 1,
            sat1_object_designator: "SAT-789",
            sat2_object_designator: "SAT-321",
            tca: new Date(Date.now() + 3600 * 1000).toISOString(), // +1 hour
            miss_distance: 2.567,
            probability_of_collision: 0.0045,
        },
        {
            id: 2,
            sat1_object_designator: "SAT-654",
            sat2_object_designator: "SAT-987",
            tca: new Date(Date.now() + 2 * 3600 * 1000).toISOString(), // +2 hours
            miss_distance: 0.982,
            probability_of_collision: 0.0089,
        },
        {
            id: 3,
            sat1_object_designator: "SAT-555",
            sat2_object_designator: "SAT-777",
            tca: new Date(Date.now() + 3 * 3600 * 1000).toISOString(), // +3 hours
            miss_distance: 3.124,
            probability_of_collision: 0.0012,
        },
        {
            id: 4,
            sat1_object_designator: "SAT-222",
            sat2_object_designator: "SAT-333",
            tca: new Date(Date.now() + 4 * 3600 * 1000).toISOString(), // +4 hours
            miss_distance: 1.753,
            probability_of_collision: 0.0067,
        },
    ]);


    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCDMs = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/cdms/");
            if (!response.ok) throw new Error("Failed to fetch CDMs");
            const cdmData: CDM[] = await response.json();

            
            // Fetch collision probabilities separately
            const collisionResponse = await fetch("http://localhost:8000/api/collisions/");
            if (!collisionResponse.ok) throw new Error("Failed to fetch collision probabilities");
            const collisionData: Collision[] = await collisionResponse.json();


            // Merge CDM data with collision probability
            const mergedData: CDMWithCollision[] = cdmData.map((cdm) => {
                const collisionInfo = collisionData.find((collision) => collision.id === cdm.id);
                return {
                    ...cdm,
                    probability_of_collision: collisionInfo?.probability_of_collision ?? 0, // Default to 0 if missing
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

    useEffect(() => {
        fetchCDMs();
    }, []);
    
    return (
        <div className="flex flex-col h-full bg-white min-h-screen w-screen">
            <Navbar />
            <div className="flex min-h-[calc(100svh-160px)] max-w-[80%] flex-col w-full mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Conjunction Data Messages (CDMs)</h1>
                {loading ? (
                    <p>Loading CDM data...</p>
                // ) : error ? (
                //     <p className="text-red-500">{error}</p>
                ) : (
                <table className="w-full border-collapse border h-auto border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">CDM ID</th>
                            <th className="border p-2">Primary Object (A)</th>
                            <th className="border p-2">Secondary Object (B)</th>
                            <th className="border p-2">TCA (UTC)</th>
                            <th className="border p-2">Miss Distance (km)</th>
                            <th className="border p-2">Collision Probability (%)</th>
                            <th className="border p-2">View in Cesium</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cdms.length > 0 ? (
                            cdms.map((cdm: CDMWithCollision) => (
                                <tr key={cdm.id} className="border">
                                    <td className="border p-2">{cdm.id}</td>
                                    <td className="border p-2">{cdm.sat1_object_designator}</td>
                                    <td className="border p-2">{cdm.sat2_object_designator}</td>
                                    <td className="border p-2">{new Date(cdm.tca).toUTCString()}</td>
                                    <td className="border p-2">{cdm.miss_distance.toFixed(3)}</td>
                                    <td className="border p-2">{(cdm.probability_of_collision * 100).toFixed(2)}%</td>
                                    <td className="border p-2 text-[#0000EE]">
                                        <a href={`/cesium-view/${cdm.id}`} target="_blank" rel="noopener noreferrer" className="flex gap-1 items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#0000EE"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
                                            View
                                        </a>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center p-4">No CDM data available.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                )}
            </div>
            <Footer />
        </div>
    );
}
