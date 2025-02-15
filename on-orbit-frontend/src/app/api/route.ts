import { supabase } from "@/lib/supabaseClient"; // Use absolute import (Recommended)

interface CDM {
    id: number;
    sat1_object_designator: string;
    sat2_object_designator: string;
    tca: string;
    miss_distance: number;
    probability_of_collision?: number;
}

export async function GET() {
    try {
        // Fetch CDM data
        const { data: cdmData, error: cdmError } = await supabase
            .from("api_cdm")
            .select("id, sat1_object_designator, sat2_object_designator, tca, miss_distance");

        if (cdmError) {
            return new Response(JSON.stringify({ error: cdmError.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch collision probability
        const { data: collisionData, error: collisionError } = await supabase
            .from("api_collision")
            .select("probability_of_collision");

        if (collisionError) {
            return new Response(JSON.stringify({ error: collisionError.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Merge probability data into CDM list
        const mergedData: CDM[] = cdmData.map((cdm, index) => ({
            ...cdm,
            probability_of_collision: collisionData[index]?.probability_of_collision || 0,
        }));

        return new Response(JSON.stringify(mergedData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching CDM data:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch CDM data" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}