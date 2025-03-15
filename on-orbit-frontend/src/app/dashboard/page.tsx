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
    const [cdms, setCdms] = useState<CDMWithCollision[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Sort by most recent TCA and limit to 20 results
    const sortedCdms = [...cdms]
        .sort((a, b) => new Date(b.tca).getTime() - new Date(a.tca).getTime())
        .slice(0, 20);

    // Filter CDMs by ID (if a search term is entered)
    const filteredCdms = sortedCdms.filter((cdm) =>
        cdm.id.toString().includes(searchTerm)
    );


    const fetchCDMs = async () => {
        try {
            // Use a hardcoded access token for now
            const accessToken = localStorage.getItem('token');

            console.log('accessToken', accessToken);

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            };
    
            // Fetch CDMs
            const response = await fetch("http://localhost:8000/api/cdms/", { headers });
            if (!response.ok) {
                if (response.status === 401) throw new Error("Unauthorized: Invalid or expired token");
                throw new Error("Failed to fetch CDMs");
            }
            const cdmData: CDM[] = await response.json();
    
            // Fetch collision probabilities
            const collisionResponse = await fetch("http://localhost:8000/api/collisions/", { headers });
            if (!collisionResponse.ok) {
                if (collisionResponse.status === 401) throw new Error("Unauthorized: Invalid or expired token");
                throw new Error("Failed to fetch collision probabilities");
            }
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
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Conjunction Data Messages (CDMs)</h1>
                    <input
                        type="text"
                        placeholder="Search by ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input input-bordered input-ghost focus:bg-white text-black focus:text-black"
                    />
                </div>
                {loading ? (
                    <p>Loading CDM data...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                <div className="border">
                    {/* Table Header (Fixed) */}
                    <table className="w-full border-collapse border border-gray-300">
                        <thead className="bg-gray-200 sticky top-0 z-10">
                            <tr>
                                <th className="border p-2 w-16">CDM ID</th>
                                <th className="border p-2 w-32">Primary Object (A)</th>
                                <th className="border p-2 w-32">Secondary Object (B)</th>
                                <th className="border p-2 w-48">TCA (UTC)</th>
                                <th className="border p-2 w-32">Miss Distance (km)</th>
                                <th className="border p-2 w-40">Collision Probability (%)</th>
                                <th className="border p-2 w-28">View in Cesium</th>
                            </tr>
                        </thead>
                    </table>
                
                    {/* Scrollable Table Body */}
                    <div className="overflow-y-auto max-h-80">
                        <table className="w-full border-collapse border border-gray-300">
                            <tbody>
                                {filteredCdms.length > 0 ? (
                                    filteredCdms.map((cdm: CDMWithCollision) => (
                                        <tr key={cdm.id} className="border">
                                            <td className="border p-2 w-16">{cdm.id}</td>
                                            <td className="border p-2 w-32">{cdm.sat1_object_designator}</td>
                                            <td className="border p-2 w-32">{cdm.sat2_object_designator}</td>
                                            <td className="border p-2 w-48">{new Date(cdm.tca).toUTCString()}</td>
                                            <td className="border p-2 w-32">{cdm.miss_distance.toFixed(3)}</td>
                                            <td className="border p-2 w-40">{(cdm.probability_of_collision * 100).toFixed(2)}%</td>
                                            <td className="border p-2 w-28 text-[#0000EE]">
                                                <a href={`/cesium-view/${cdm.id}`} target="_blank" rel="noopener noreferrer" className="flex gap-1 items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#0000EE">
                                                        <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
                                                    </svg>
                                                    View
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center p-4">No CDM data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
