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
            {/* <main className="w-full max-w-[70%] mx-auto p-4 flex-grow">
                <section className="my-8">
                    <h2 className="text-2xl font-bold mb-4 text-black">Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-2 text-black">User Information</h3>
                            <p className="text-gray-700">Name: John Doe</p>
                            <p className="text-gray-700">Email: john.doe@example.com</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-2 text-black">Recently Viewed CDMs</h3>
                            <p className="text-gray-700">CDM 1</p>
                            <p className="text-gray-700">CDM 2</p>
                            <p className="text-gray-700">CDM 3</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-2 text-black">Saved CDMs</h3>
                            <p className="text-gray-700">Placeholder for Saved CDMs</p>

                        </div>
                    </div>
                </section>
            </main> */}
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Conjunction Data Messages (CDMs)</h1>
                {loading ? (
                    <p>Loading CDM data...</p>
                // ) : error ? (
                //     <p className="text-red-500">{error}</p>
                ) : (
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">CDM ID</th>
                                <th className="border p-2">Sat 1</th>
                                <th className="border p-2">Sat 2</th>
                                <th className="border p-2">TCA (UTC)</th>
                                <th className="border p-2">Miss Distance (km)</th>
                                <th className="border p-2">Collision Probability (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cdms.length > 0 ? (
                                cdms.map((cdm: CDMWithCollision) => (
                                    <tr key={cdm.id ?? Math.random()} className="border">
                                        <td className="border p-2">{cdm.id ?? "N/A"}</td>
                                        <td className="border p-2">{cdm.sat1_object_designator ?? "Unknown Sat 1"}</td>
                                        <td className="border p-2">{cdm.sat2_object_designator ?? "Unknown Sat 1"}</td>
                                        <td className="border p-2">{cdm.tca ? new Date(cdm.tca).toUTCString() : "Pending"}</td>
                                        <td className="border p-2">{cdm.miss_distance.toFixed(3) ?? "0.000"}</td>
                                        <td className="border p-2">{(cdm.probability_of_collision * 100).toFixed(2)}%</td>
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