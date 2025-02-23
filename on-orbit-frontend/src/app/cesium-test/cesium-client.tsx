import * as satellite from 'satellite.js';

export const cesiumIonAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMjYyOWZlMi0wYzA5LTRmMjMtYTg1YS0xNDI0YTMzZTM1MGYiLCJpZCI6Mjc4NDUxLCJpYXQiOjE3NDAzMzYyNzh9.Ycq4r8Pfq8FjCkUpbbuMZ_GqFRXWQsnKBK5rGGPXDFg";

// Define the TLE data for the satellites
const tleData = [
    {
        id:"satelliteA",
        name: "M3MSAT",
        tle1: "1 41605U 16040G   25054.02767748  .00036761  00000+0  58282-3 0  9994",
        tle2: "2 41605  98.1813  67.3965 0012313 263.0975  96.8458 14.71812345678901",
        color: [255, 0, 0, 255], // Red
    },
    {
        id: "satelliteB",
        name: "FENGYUN 1C DEB",
        tle1: "1 29733U 99025X   25053.76545590  .00002525  00000+0  42442-2 0  9996",
        tle2: "2 29733  98.7423  43.1234 0015123 123.4321 236.5432 14.32145678901234",
        color: [0, 255, 0, 255], // Green
    }
];

// Function to generate CZML for Cesium
export const generateCzml = () => {
    const czml = [
        {
            "id": "document",
            "name": "Satellite Trajectories",
            "version": "1.0",
        }
    ];

    tleData.forEach(({ id, name, tle1, tle2, color }) => {
        const satrec = satellite.twoline2satrec(tle1, tle2);
        const startTime = new Date("2025-01-01T00:00:00Z");
        const endTime = new Date("2025-01-02T00:00:00Z");

        const positions = [];
        let time = new Date(startTime);

        while (time <= endTime) {
            const j = satellite.jday(
                time.getUTCFullYear(),
                time.getUTCMonth() + 1,
                time.getUTCDate(),
                time.getUTCHours(),
                time.getUTCMinutes(),
                time.getUTCSeconds()
            );

            const posVel = satellite.propagate(satrec, j);
            if (posVel.position) {
                const gmst = satellite.gstime(j);
                const geodetic = satellite.eciToGeodetic(posVel.position, gmst);

                const longitude = satellite.degreesLong(geodetic.longitude);
                const latitude = satellite.degreesLat(geodetic.latitude);
                const altitude = geodetic.height * 1000; // Convert km to meters

                positions.push(time.toISOString(), longitude, latitude, altitude);
            }

            // Increment time by 5 minutes
            time = new Date(time.getTime() + 5 * 60 * 1000);
        }

        czml.push({
            "id": id,
            "name": name,
            "availability": "2025-01-01T00:00:00Z/2025-01-02T00:00:00Z",
            "position": {
                "epoch": "2025-01-01T00:00:00Z",
                "cartographicDegrees": positions,
            },
            "path": {
                "material": {
                    "solidColor": {
                        "color": {
                            "rgba": color
                        }
                    }
                },
                "width": 2,
                "leadTime": 0,
                "trailTime": 86400 // 1 day in seconds
            }
        });
    });

    return czml;
};