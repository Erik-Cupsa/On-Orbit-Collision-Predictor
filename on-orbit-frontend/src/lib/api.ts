export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000/api";

export async function fetchCdms() {
    try {
        const response = await fetch(`${API_BASE_URL}/cdms/`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.map((cdm: any) => ({
            id: cdm.id,
            sat1_object_designator: cdm.sat1_object_designator,
            sat2_object_designator: cdm.sat2_object_designator,
            tca: cdm.tca,
            miss_distance: cdm.miss_distance,
            probability_of_collision: cdm.probability_of_collision || 0, // Default to 0 if missing
        }));
    } catch (error) {
        console.error("Failed to fetch CDMs:", error);
        return [];
    }
}