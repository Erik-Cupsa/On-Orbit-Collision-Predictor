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

interface CDM {
    id: number;
    sat1_object_designator: string;
    sat2_object_designator: string;
    creation_date:string;
    // tca: string;
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
    const [searchObjectId, setSearchObjectId] = useState<string>("");

    const router = useRouter();

    // First, filter all CDMs
    const filteredCdms = cdms.filter((cdm) =>
        cdm.id.toString().includes(searchTerm) ||
        cdm.sat1_object_designator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cdm.sat2_object_designator.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredByObjectId = cdms.filter(
        cdm =>
            searchObjectId &&
            (cdm.sat1_object_designator === searchObjectId || cdm.sat2_object_designator === searchObjectId)
    );

    // Group CDMs by the other object involved in conjunction with the searched object
    const groupedByConjunction: Record<string, CDMWithCollision[]> = {};
    
    filteredByObjectId.forEach(cdm => {
        // Determine the other object involved in the conjunction
        const otherObject = cdm.sat1_object_designator === searchObjectId 
            ? cdm.sat2_object_designator 
            : cdm.sat1_object_designator;
        
        const key = otherObject;
        
        if (!groupedByConjunction[key]) {
            groupedByConjunction[key] = [];
        }
        
        groupedByConjunction[key].push(cdm);
    });

    // Prepare chart datasets
    const chartDatasets = Object.entries(groupedByConjunction).map(([otherObject, cdmsInGroup], index) => {
        // Sort by creation date
        const sortedCdms = [...cdmsInGroup].sort(
            (a, b) => new Date(a.creation_date).getTime() - new Date(b.creation_date).getTime()
        );
        
        return {
            label: `With ${otherObject}`,
            data: sortedCdms.map(cdm => ({
                x: new Date(cdm.creation_date),
                y: cdm.miss_distance
            })),
            borderColor: `hsl(${index * 60 % 360}, 70%, 50%)`,
            backgroundColor: `hsl(${index * 60 % 360}, 70%, 50%, 0.5)`,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
        };
    });

    // Then, sort and limit to 20 results
    const sortedCdms = [...filteredCdms]
        .sort((a, b) => new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime())
        // .sort((a, b) => new Date(b.tca).getTime() - new Date(a.tca).getTime())
        .slice(0, 20);
    
    const fetchCDMs = async () => {
        try {
            const accessToken = localStorage.getItem('token');
            if (!accessToken) {
                throw new Error("Failed to fetch CDMs: Please login to view this page")
            }

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            };
    
            // Fetch CDMs
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
        <div className="pl-[250px] flex flex-1 flex-col h-full bg-white w-screen m-10 gap-5">
            <section>
                <span><span className="text-gray-400">Dashboards&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp; </span><span className="text-black">Overview</span></span>
            </section>

            {/* list of cdms */}
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
                    {/* Table Header */}
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
                
                    {/* Scrollable Table Body */}
                    <div className="overflow-y-auto max-h-48">
                    <div className="flex flex-col gap-1"> {/* gap between rows */}
                        {sortedCdms.length > 0 ? (
                        sortedCdms.map((cdm: CDMWithCollision, index: number) => (
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
                            <div className="w-40 p-2">{(cdm.probability_of_collision * 100).toFixed(2)}%</div>
                            <div className="w-28 p-2 text-[#0000EE]">
                                <a
                                href={`/cesium-view/${cdm.id}`}
                                // target="_blank"
                                // rel="noopener noreferrer"
                                className="flex gap-1 items-center"
                                >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="20px"
                                    viewBox="0 -960 960 960"
                                    width="20px"
                                    fill="#0000EE"
                                >
                                    <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                                </svg>
                                View
                                </a>
                            </div>
                            <div className="w-28 p-2 text-[#0000EE]">
                                <a
                                    href={`/maneuvering/heatmap/${cdm.id}`}
                                    className="flex gap-1 items-center"
                                >
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

            {/* graph section */}
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
                    
                    {/* Miss Distance Over Time Chart */}
                    <div className="w-full h-[350px] relative">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Loading data...
                            </div>
                        ) : chartDatasets.length > 0 ? (
                            <Line
                                data={{
                                    datasets: chartDatasets
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        x: {
                                            type: 'time',
                                            time: {
                                                unit: 'day',
                                                tooltipFormat: 'MMM d, yyyy HH:mm',
                                                displayFormats: {
                                                    day: 'MMM d'
                                                }
                                            },
                                            title: {
                                                display: true,
                                                text: 'Creation Date'
                                            }
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Miss Distance (km)'
                                            },
                                            beginAtZero: false
                                        }
                                    },
                                    plugins: {
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    const label = context.dataset.label || '';
                                                    const value = context.parsed.y !== null 
                                                        ? context.parsed.y.toFixed(3) + ' km' 
                                                        : '';
                                                    return `${label}: ${value}`;
                                                }
                                            }
                                        },
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                boxWidth: 12,
                                                usePointStyle: true,
                                                pointStyle: 'circle'
                                            }
                                        }
                                    },
                                    interaction: {
                                        mode: 'nearest',
                                        axis: 'x',
                                        intersect: false
                                    }
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
                    
                    {/* Probability of Collision Over Time Chart */}
                    <div className="w-full h-[350px] relative">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Loading data...
                            </div>
                        ) : chartDatasets.length > 0 ? (
                            <Line
                                data={{
                                    datasets: Object.entries(groupedByConjunction).map(([otherObject, cdmsInGroup], index) => {
                                        // Sort by creation date
                                        const sortedCdms = [...cdmsInGroup].sort(
                                            (a, b) => new Date(a.creation_date).getTime() - new Date(b.creation_date).getTime()
                                        );
                                        
                                        // Extract the exponent part for each value to use for visualization
                                        return {
                                            label: `With ${otherObject}`,
                                            data: sortedCdms.map(cdm => {
                                                // Store the original value for tooltips
                                                const originalValue = cdm.probability_of_collision;
                                                
                                                // Convert to scientific notation string and extract exponent
                                                const scientificStr = originalValue.toExponential();
                                                const exponentMatch = scientificStr.match(/e([+-]\d+)$/);
                                                const exponent = exponentMatch ? parseInt(exponentMatch[1]) : 0;
                                                
                                                // Use negative exponent as y value (higher = less negative = higher probability)
                                                return {
                                                    x: new Date(cdm.creation_date),
                                                    y: -exponent, // Negative because exponents are negative
                                                    _originalValue: originalValue // Store for tooltip
                                                };
                                            }),
                                            borderColor: `hsl(${index * 60 % 360}, 70%, 50%)`,
                                            backgroundColor: `hsl(${index * 60 % 360}, 70%, 50%, 0.5)`,
                                            tension: 0.3,
                                            pointRadius: 4,
                                            pointHoverRadius: 6,
                                        };
                                    })
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        x: {
                                            type: 'time',
                                            time: {
                                                unit: 'day',
                                                tooltipFormat: 'MMM d, yyyy HH:mm',
                                                displayFormats: {
                                                    day: 'MMM d'
                                                }
                                            },
                                            title: {
                                                display: true,
                                                text: 'Creation Date'
                                            }
                                        },
                                        y: {
                                            type: 'linear', // Using linear scale for exponents
                                            title: {
                                                display: true,
                                                text: 'Probability Exponent (-10^x)'
                                            },
                                            ticks: {
                                                callback: function(value) {
                                                    return `10^-${value}`;
                                                }
                                            },
                                            // Reverse axis so higher on chart = higher probability
                                            reverse: true
                                        }
                                    },
                                    plugins: {
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    const label = context.dataset.label || '';
                                                    const dataPoint = context.raw;
                                                    const originalValue = dataPoint._originalValue;
                                                    
                                                    // Show original value in scientific notation
                                                    const scientificStr = originalValue.toExponential(6);
                                                    
                                                    return `${label}: ${scientificStr}`;
                                                }
                                            }
                                        },
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                boxWidth: 12,
                                                usePointStyle: true,
                                                pointStyle: 'circle'
                                            }
                                        },
                                        title: {
                                            display: true,
                                            text: 'Higher = Higher Probability',
                                            position: 'top'
                                        }
                                    },
                                    interaction: {
                                        mode: 'nearest',
                                        axis: 'x',
                                        intersect: false
                                    }
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
