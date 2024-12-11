"use client"

import Navbar from "@/components/navbar/page";
import Footer from "@/components/footer/page";
import { useEffect, useState } from "react";

interface CDMDisplayDetails {
    id: string;
    message_id: string;
}

export default function Dashboard() {
    const [cdms, setCdms] = useState<CDMDisplayDetails[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const fetchCDMs = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/cdms/");
            if (!response.ok) {
                throw new Error("Failed to fetch CDMs");
            }
            const data = await response.json();
            setCdms(data);
            console.log(data);
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
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Navbar />
            <main className="container mx-auto p-4 flex-grow">
                <section className="my-8">
                    <h2 className="text-2xl font-bold mb-4 text-black">Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-2 text-black">User Information</h3>
                            <p className="text-gray-700">Name: John Doe</p>
                            <p className="text-gray-700">Email: john.doe@example.com</p>
                            {/* Add more user information as needed */}
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-2 text-black">View All CDMs</h3>
                            {loading ? (
                                <p className="text-gray-700">Loading...</p>
                            ) : error ? (
                                <p className="text-red-500">{error}</p>
                            ) : (
                                <ul>
                                    {cdms.map((cdm) => (
                                        <li key={cdm.id} className="text-gray-700">
                                            ID: {cdm.id}, Message ID: {cdm.message_id}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-2 text-black">Saved CDMs</h3>
                            <p className="text-gray-700">Placeholder for Saved CDMs</p>
                            {/* Add more placeholders as needed */}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}