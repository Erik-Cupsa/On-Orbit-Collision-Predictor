"use client";

import "cesium/Build/Cesium/Widgets/widgets.css";
import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import * as satellite from "satellite.js";
import { computeOrbit, satrec1, satrec2 } from "./tleUtils";
import Navbar from "@/components/navbar/page";
import Footer from "@/components/footer/page";

export default function TestPage() {
    const cesiumRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!cesiumRef.current) {
            console.error("Cesium container (cesiumRef.current) is null. Skipping initialization.");
            return;
        }
        
        const tempCanvas = document.createElement("canvas");
        if (!tempCanvas.getContext("webgl2")) {
            console.error("WebGL2 is not supported on this browser. Cesium will not load.");
            return;
        }
        
        try {
            // Initialize Cesium Viewer
            Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMjYyOWZlMi0wYzA5LTRmMjMtYTg1YS0xNDI0YTMzZTM1MGYiLCJpZCI6Mjc4NDUxLCJpYXQiOjE3NDAzMzYyNzh9.Ycq4r8Pfq8FjCkUpbbuMZ_GqFRXWQsnKBK5rGGPXDFg";
            Cesium.buildModuleUrl.setBaseUrl('/Cesium/');

            console.log("Initializing Cesium...");

            const viewer = new Cesium.Viewer(cesiumRef.current as Element, {
                shouldAnimate: true,
                baseLayerPicker: false,
                geocoder: false,
                homeButton: false,
                timeline: false,
                fullscreenButton: false,
                navigationHelpButton: false,
            });

            console.log("Cesium initialized successfully.");


            // Compute positions for the satellites
            const positions1 = computeOrbit(satrec1, 0, 6000, 30);
            const positions2 = computeOrbit(satrec2, 0, 6000, 30);

            if (!positions1.length || !positions2.length) {
                console.error("Satellite positions could not be computed.");
                return;
            }
            
            // Add orbit paths
            viewer.entities.add({
                name: "Satellite 1 Orbit",
                polyline: {
                    positions: positions1,
                    width: 2,
                    material: Cesium.Color.RED,
                },
            });

            viewer.entities.add({
                name: "Satellite 2 Orbit",
                polyline: {
                    positions: positions2,
                    width: 2,
                    material: Cesium.Color.BLUE,
                },
            });

            // Add moving satellites
            const satelliteEntity1 = viewer.entities.add({
                name: "Satellite 1",
                position: new Cesium.SampledPositionProperty(),
                billboard: {
                    image: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Satellite_icon.png",
                    scale: 0.5,
                },
            });

            const satelliteEntity2 = viewer.entities.add({
                name: "Satellite 2",
                position: new Cesium.SampledPositionProperty(),
                billboard: {
                    image: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Satellite_icon.png",
                    scale: 0.5,
                },
            });

            // Function to update satellite position in real-time
            function updateSatellitePosition(entity: Cesium.Entity, satrec: satellite.SatRec) {
                const sampledPosition = entity.position as Cesium.SampledPositionProperty;

                setInterval(() => {
                    const date = new Date();
                    const gmst = satellite.gstime(date);
                    const positionAndVelocity = satellite.propagate(satrec, date);
                    
                    if (!positionAndVelocity.position || typeof positionAndVelocity.position !== "object") return;
                    
                    const positionEci = positionAndVelocity.position;
                    const positionGd = satellite.eciToGeodetic(positionEci, gmst);
                    const longitude = satellite.degreesLong(positionGd.longitude);
                    const latitude = satellite.degreesLat(positionGd.latitude);
                    const height = positionGd.height * 1000; // Convert km to meters


                    const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
                    sampledPosition.addSample(Cesium.JulianDate.now(), position);
                }, 1000);
            }

            // Start updating satellite positions
            updateSatellitePosition(satelliteEntity1, satrec1);
            updateSatellitePosition(satelliteEntity2, satrec2);

            // Fly camera to initial view
            viewer.zoomTo(viewer.entities);

            return () => {
                if (!viewer.isDestroyed()) {
                    viewer.destroy();
                    console.log("Cesium viewer destroyed.");
                }      
            };
        } catch (error) {
            console.error("Cesium failed to load:", error);
        }
    }, []);

    return (
        <div className="w-screen h-screen">
            <Navbar/>
            <div ref={cesiumRef} className="w-full h-[calc(100svh-160px)]"/>
            <Footer/>
        </div>
    );
}
