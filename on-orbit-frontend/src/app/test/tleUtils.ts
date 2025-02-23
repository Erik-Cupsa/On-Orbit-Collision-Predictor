"use client";
import * as satellite from "satellite.js";
import * as Cesium from "cesium";

// Example TLE Data
const tle1 = [
    "1 25544U 98067A   24052.54791667  .00016717  00000-0  10270-3 0  9991",
    "2 25544  51.6440 241.4476 0002713  94.3818 265.7458 15.49533613446507"
];

const tle2 = [
    "1 25544U 98067A   24052.54791667  .00016717  00000-0  10270-3 0  9991",
    "2 25544  51.6440 241.4476 0002713  94.3818 265.7458 15.49533613446507"
];

const satrec1: satellite.SatRec = satellite.twoline2satrec(tle1[0], tle1[1]);
const satrec2: satellite.SatRec = satellite.twoline2satrec(tle2[0], tle2[1]);

/**
 * Computes the orbit of a satellite using TLE data.
 * @param satrec - The satellite record from satellite.js.
 * @param startTime - Start time offset in seconds.
 * @param endTime - End time offset in seconds.
 * @param timeStep - Time step in seconds.
 * @returns Array of Cesium.Cartesian3 positions.
 */
export function computeOrbit(
    satrec: satellite.SatRec,
    startTime: number, 
    endTime: number, 
    timeStep: number
):Cesium.Cartesian3[] {
    const positions: Cesium.Cartesian3[] = [];
    
    for (let i = startTime; i < endTime; i += timeStep) {
        const date = new Date(Date.now() + i * 1000);
        const gmst = satellite.gstime(date);
        const positionAndVelocity = satellite.propagate(satrec, date);

        // Ensure position exists before proceeding
        if (!positionAndVelocity.position || typeof positionAndVelocity.position !== "object") {
            continue;
        }

        const positionEci = positionAndVelocity.position;
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        const longitude = satellite.degreesLong(positionGd.longitude);
        const latitude = satellite.degreesLat(positionGd.latitude);
        const height = positionGd.height * 1000; // Convert km to meters

        positions.push(Cesium.Cartesian3.fromDegrees(longitude, latitude, height));
    }
    return positions;
}

export { satrec1, satrec2 };
