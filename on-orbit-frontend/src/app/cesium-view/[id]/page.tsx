/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import * as satellite from "satellite.js";
import * as d3 from "d3";
import { feature } from "topojson-client";

// Define interfaces for our data
interface CDM {
  id: number;
  sat1_object_designator: string;
  sat2_object_designator: string;
  tca: string; // Time of Closest Approach
  creation_date: string;
  miss_distance: number;
}

interface TleData {
  sat1: string;
  sat2: string;
}

interface SatellitePosition {
  longitude: number;
  latitude: number;
  height: number; // In kilometers
  time: Date;
}

export default function OrbitVisualizationPage() {
  const { id } = useParams();
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [cdmData, setCdmData] = useState<CDM | null>(null);
  const [, setTleData] = useState<TleData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sat1Positions, setSat1Positions] = useState<SatellitePosition[]>([]);
  const [sat2Positions, setSat2Positions] = useState<SatellitePosition[]>([]);
  const [tcaPositions, setTcaPositions] = useState<{
    sat1: SatellitePosition | null;
    sat2: SatellitePosition | null;
  }>({ sat1: null, sat2: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [worldData, setWorldData] = useState<any>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [simRunning, setSimRunning] = useState<boolean>(false);

  // Mutable refs (do not trigger re-renders)
  const idRef = useRef<string>();
  const rotationRef = useRef<[number, number, number]>([0, 0, 0]);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const pathGeneratorRef = useRef<d3.GeoPath | null>(null);
  const animationRef = useRef<number | null>(null);
  const simulationRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);

  // Initialize the ID ref using the dynamic route parameter
  useEffect(() => {
    if (id) {
      idRef.current = typeof id === 'string' ? id : id[0];
    }
  }, [id]);

  // Function to fetch TLE data from CelesTrak
  const fetchTleFromCelesTrak = async (
    objectDesignator: string
  ): Promise<string[]> => {
    try {
      const response = await fetch(
        `https://celestrak.org/NORAD/elements/gp.php?CATNR=${objectDesignator}&FORMAT=TLE`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch TLE data for object ${objectDesignator}`
        );
      }

      const text = await response.text();
      // Parse the TLE text into lines, filtering out empty lines
      const lines = text.split("\n").filter((line) => line.trim() !== "");

      if (lines.length < 2) {
        throw new Error(
          `Invalid TLE data received for object ${objectDesignator}`
        );
      }

      // Return the TLE set (name and two lines of TLE data)
      return lines.slice(0, 3);
    } catch (error) {
      console.error(`Error fetching TLE data for ${objectDesignator}:`, error);
      throw error;
    }
  };

  // Function to propagate orbit using satellite.js with orbit limiting
  const propagateOrbit = (
    tleLine1: string,
    tleLine2: string,
    tleTitle: string,
    startTime: Date,
    endTime: Date,
    stepMinutes: number = 5
  ): SatellitePosition[] => {
    const positions: SatellitePosition[] = [];
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const totalMinutes =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const steps = Math.ceil(totalMinutes / stepMinutes);

    // Track longitude changes to detect a full orbit
    let orbitCompleted = false;
    let prevLongitude: number | null = null;
    let crossings = 0;

    for (let i = 0; i <= steps && !orbitCompleted; i++) {
      const time = new Date(startTime.getTime() + i * stepMinutes * 60 * 1000);
      const positionAndVelocity = satellite.propagate(satrec, time);
      const positionEci = positionAndVelocity.position;

      if (!positionEci || typeof positionEci === 'boolean') continue;

      const gmst = satellite.gstime(time);
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);
      const longitude = satellite.degreesLong(positionGd.longitude);

      if (prevLongitude !== null) {
        if (
          (prevLongitude < -90 && longitude > 90) ||
          (prevLongitude > 90 && longitude < -90)
        ) {
          crossings++;
          if (crossings >= 2) {
            orbitCompleted = true;
          }
        }
      }
      prevLongitude = longitude;

      const position: SatellitePosition = {
        longitude: longitude,
        latitude: satellite.degreesLat(positionGd.latitude),
        height: positionGd.height,
        time: time,
      };

      positions.push(position);
    }

    return positions;
  };

  // Find the position closest to a target time
  const findPositionAtTime = (
    positions: SatellitePosition[],
    targetTime: Date
  ): SatellitePosition | null => {
    if (positions.length === 0) return null;
    const targetTimestamp = targetTime.getTime();
    let closestPosition = positions[0];
    let minDiff = Math.abs(positions[0].time.getTime() - targetTimestamp);

    for (let i = 1; i < positions.length; i++) {
      const diff = Math.abs(positions[i].time.getTime() - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestPosition = positions[i];
      }
    }

    return closestPosition;
  };

  // Get the satellite position corresponding to a progress value (0-1)
  const getPositionAtProgress = (
    positions: SatellitePosition[],
    progress: number
  ): SatellitePosition | null => {
    if (positions.length === 0) return null;
    if (progress <= 0) return positions[0];
    if (progress >= 1) return positions[positions.length - 1];
    const index = Math.floor(progress * (positions.length - 1));
    return positions[index];
  };

  // Fetch world map data
  useEffect(() => {
    const fetchWorldData = async () => {
      try {
        const response = await fetch("/world-110m.json");
        if (!response.ok) {
          throw new Error("Failed to load world map data");
        }
        const data = await response.json();
        const land = feature(data, data.objects.land);
        setWorldData(land);
      } catch (error) {
        console.error("Error loading world map:", error);
        setError("Failed to load world map. Please try again.");
      }
    };

    fetchWorldData();
  }, []);

  // Fetch CDM and TLE data on mount
  useEffect(() => {
    if (!idRef.current) return;

    const fetchCdmAndTleData = async () => {
      try {
        setLoading(true);
        setError(null);

        const accessToken = localStorage.getItem("token");
        if (!accessToken) {
          setError("Please login to view this page");
          setLoading(false);
          router.push("/login");
          return;
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        };

        const cdmResponse = await fetch(
          `http://localhost:8000/api/cdms/${idRef.current}/`,
          { headers }
        );
        if (!cdmResponse.ok) {
          if (cdmResponse.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch CDM data");
        }

        const cdmData: CDM = await cdmResponse.json();
        setCdmData(cdmData);

        // Fetch TLE data for both satellites
        const sat1TleData = await fetchTleFromCelesTrak(
          cdmData.sat1_object_designator
        );
        const sat2TleData = await fetchTleFromCelesTrak(
          cdmData.sat2_object_designator
        );

        setTleData({
          sat1: sat1TleData.join("\n"),
          sat2: sat2TleData.join("\n"),
        });

        const tcaDate = new Date(cdmData.tca);
        const startTime = new Date(tcaDate.getTime() - 3 * 60 * 60 * 1000);
        const endTime = new Date(tcaDate.getTime() + 3 * 60 * 60 * 1000);

        const sat1OrbitPositions = propagateOrbit(
          sat1TleData[1],
          sat1TleData[2],
          sat1TleData[0],
          startTime,
          endTime,
          1
        );
        const sat2OrbitPositions = propagateOrbit(
          sat2TleData[1],
          sat2TleData[2],
          sat2TleData[0],
          startTime,
          endTime,
          1
        );

        const sat1TcaPosition = findPositionAtTime(sat1OrbitPositions, tcaDate);
        const sat2TcaPosition = findPositionAtTime(sat2OrbitPositions, tcaDate);

        const sat1TcaIndex = sat1OrbitPositions.findIndex(
          (pos) => pos.time.getTime() === sat1TcaPosition?.time.getTime()
        );
        const sat2TcaIndex = sat2OrbitPositions.findIndex(
          (pos) => pos.time.getTime() === sat2TcaPosition?.time.getTime()
        );

        const sat1ReorderedPositions = sat1OrbitPositions.slice(0, sat1TcaIndex + 1);
        const sat2ReorderedPositions = sat2OrbitPositions.slice(0, sat2TcaIndex + 1);

        setSat1Positions(sat1ReorderedPositions);
        setSat2Positions(sat2ReorderedPositions);
        setTcaPositions({
          sat1: sat1TcaPosition,
          sat2: sat2TcaPosition,
        });
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

    fetchCdmAndTleData();
  }, [router]);

  // Initialize D3 visualization (once available)
  useEffect(() => {
    if (
      !svgRef.current ||
      !worldData ||
      !sat1Positions.length ||
      !sat2Positions.length
    )
      return;

    const container = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const scale = Math.min(width, height) / 2;

    const projection = d3
      .geoOrthographic()
      .scale(scale * 0.9)
      .translate([width / 2, height / 2])
      .rotate(rotationRef.current);

    projectionRef.current = projection;
    pathGeneratorRef.current = d3.geoPath().projection(projection);

    createBaseVisualization(container, width, height, scale);
    setupDragBehavior(container);
    updateVisualization();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      if (simulationRef.current !== null) {
        cancelAnimationFrame(simulationRef.current);
      }
    };
  }, [worldData, sat1Positions, sat2Positions, tcaPositions.sat1, tcaPositions.sat2]);

  // Create base visualization elements
  const createBaseVisualization = (
    container: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number,
    height: number,
    scale: number
  ) => {
    container.selectAll("*").remove();

    const defs = container.append("defs");

    const radialGradient = defs
      .append("radialGradient")
      .attr("id", "earth-glow")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");

    radialGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4a83ce")
      .attr("stop-opacity", 0.1);
    radialGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#1a1a2e")
      .attr("stop-opacity", 0);

    const filter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter.append("feGaussianBlur").attr("stdDeviation", "5").attr("result", "blur");
    filter
      .append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");

    const starsGroup = container.append("g").attr("id", "stars-group");
    const numStars = 100;
    const starData = Array.from({ length: numStars }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5,
    }));

    starsGroup
      .selectAll("circle")
      .data(starData)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", "white")
      .attr("opacity", () => Math.random() * 0.8 + 0.2);

    container
      .append("circle")
      .attr("id", "earth-atmosphere")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", scale * 0.93)
      .attr("fill", "url(#earth-glow)")
      .attr("opacity", 0.8);

    container
      .append("circle")
      .attr("id", "ocean")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", scale * 0.9)
      .attr("fill", "#04153b")
      .attr("stroke", "#1E40AF")
      .attr("stroke-width", 0.5);

    container.append("g").attr("id", "land-group");

    defs
      .append("clipPath")
      .attr("id", "earth-clip")
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", scale * 0.9);

    container.append("g").attr("id", "sat1-path-group");
    container.append("g").attr("id", "sat2-path-group");
    container.append("g").attr("id", "sat-markers-group");
    container.append("g").attr("id", "tca-markers-group");
  };

  // Setup drag behavior for globe rotation
  const setupDragBehavior = (
    container: d3.Selection<SVGSVGElement, unknown, null, undefined>
  ) => {
    const drag = d3
      .drag<SVGSVGElement, unknown>()
      .on("start", () => {
        if (isAnimating) {
          setIsAnimating(false);
          if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
        }
      })
      .on("drag", (event) => {
        rotationRef.current = [
          rotationRef.current[0] - event.dy / 4,
          rotationRef.current[1] + event.dx / 4,
          rotationRef.current[2],
        ];
        rotationRef.current[0] = Math.max(-90, Math.min(90, rotationRef.current[0]));
        if (projectionRef.current) {
          projectionRef.current.rotate(rotationRef.current);
          updateVisualization();
        }
      })
      .on("end", () => {
        setRotation([...rotationRef.current]);
      });
    container.call(drag);
  };

  // Determine if a point is visible on the front side of the globe
  const isPointVisible = (lon: number, lat: number): boolean => {
    if (!projectionRef.current) return false;
    const r = rotationRef.current;
    const lambda = (r[1] * Math.PI) / 180;
    const phi = (r[0] * Math.PI) / 180;
    const pointLambda = (lon * Math.PI) / 180;
    const pointPhi = (lat * Math.PI) / 180;
    const dotProduct =
      Math.cos(pointPhi) * Math.cos(phi) * Math.cos(pointLambda - lambda) +
      Math.sin(pointPhi) * Math.sin(phi);
    return dotProduct > 0;
  };

  // Update the visualization based on rotation and animation progress
  const updateVisualization = (currentProgress: number = progressRef.current) => {
    if (!svgRef.current || !projectionRef.current || !pathGeneratorRef.current) return;
    const svg = d3.select(svgRef.current);
    const projection = projectionRef.current;
    const path = pathGeneratorRef.current;

    // Update land rendering
    svg.select("#land-group").selectAll("*").remove();
    svg.select("#land-group")
      .append("path")
      .datum(worldData)
      .attr("d", path)
      .attr("fill", "#193366")
      .attr("stroke", "#334b85")
      .attr("stroke-width", 0.5);

    // Helper to project a satellite position with height scaling
    const projectSatellite = (position: SatellitePosition) => {
      if (!isPointVisible(position.longitude, position.latitude)) return null;
      const heightScale = 1 + (position.height / 6371) * 0.15;
      const coords = projection([position.longitude, position.latitude]);
      if (coords) {
        const width = svgRef.current!.clientWidth;
        const height = svgRef.current!.clientHeight;
        const dx = coords[0] - width / 2;
        const dy = coords[1] - height / 2;
        return [width / 2 + dx * heightScale, height / 2 + dy * heightScale];
      }
      return null;
    };

    const isVisible = (position: SatellitePosition) => isPointVisible(position.longitude, position.latitude);

    // Split orbit path into visible segments
    const splitIntoSegments = (positions: SatellitePosition[]) => {
      const segments: SatellitePosition[][] = [];
      let currentSegment: SatellitePosition[] = [];
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        if (isVisible(pos)) {
          currentSegment.push(pos);
        } else if (currentSegment.length > 0) {
          segments.push([...currentSegment]);
          currentSegment = [];
        }
      }
      if (currentSegment.length > 0) segments.push(currentSegment);
      return segments;
    };

    // Draw orbit path for satellite 1
    const sat1Segments = splitIntoSegments(sat1Positions);
    svg.select("#sat1-path-group").selectAll("*").remove();
    for (const segment of sat1Segments) {
      if (segment.length > 1) {
        const lineGenerator = d3
          .line<SatellitePosition>()
          .x((d) => {
            const proj = projectSatellite(d);
            return proj ? proj[0] : 0;
          })
          .y((d) => {
            const proj = projectSatellite(d);
            return proj ? proj[1] : 0;
          })
          .curve(d3.curveLinear);
        svg.select("#sat1-path-group")
          .append("path")
          .datum(segment)
          .attr("d", lineGenerator)
          .attr("fill", "none")
          .attr("stroke", "#ef4444")
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.7);
      }
    }

    // Draw orbit path for satellite 2
    const sat2Segments = splitIntoSegments(sat2Positions);
    svg.select("#sat2-path-group").selectAll("*").remove();
    for (const segment of sat2Segments) {
      if (segment.length > 1) {
        const lineGenerator = d3
          .line<SatellitePosition>()
          .x((d) => {
            const proj = projectSatellite(d);
            return proj ? proj[0] : 0;
          })
          .y((d) => {
            const proj = projectSatellite(d);
            return proj ? proj[1] : 0;
          })
          .curve(d3.curveLinear);
        svg.select("#sat2-path-group")
          .append("path")
          .datum(segment)
          .attr("d", lineGenerator)
          .attr("fill", "none")
          .attr("stroke", "#3b82f6")
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.7);
      }
    }

    // Update satellite markers based on simulation progress
    svg.select("#sat-markers-group").selectAll("*").remove();
    if (simRunning) {
      const sat1CurrentPos = getPositionAtProgress(sat1Positions, currentProgress);
      const sat2CurrentPos = getPositionAtProgress(sat2Positions, currentProgress);

      // Satellite 1 marker
      if (sat1CurrentPos) {
        const pos = projectSatellite(sat1CurrentPos);
        if (pos) {
          svg.select("#sat-markers-group")
            .append("circle")
            .attr("cx", pos[0])
            .attr("cy", pos[1])
            .attr("r", 8)
            .attr("fill", "#ef4444")
            .attr("filter", "url(#glow)")
            .attr("opacity", 0.8);
          svg.select("#sat-markers-group")
            .append("circle")
            .attr("cx", pos[0])
            .attr("cy", pos[1])
            .attr("r", 4)
            .attr("fill", "#fecaca")
            .attr("stroke", "#f87171")
            .attr("stroke-width", 1);
          svg.select("#sat-markers-group")
            .append("text")
            .attr("x", pos[0] + 12)
            .attr("y", pos[1])
            .attr("fill", "#ffffff")
            .attr("font-size", "10px")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .text(cdmData?.sat1_object_designator || "");
        } else {
          const width = svgRef.current!.clientWidth;
          const height = svgRef.current!.clientHeight;
          const center = [width / 2, height / 2];
          const theta = ((90 - sat1CurrentPos.latitude) * Math.PI) / 180;
          const phi = ((sat1CurrentPos.longitude + 180) * Math.PI) / 180;
          const x = Math.sin(theta) * Math.cos(phi);
          const y = Math.sin(theta) * Math.sin(phi);
          const z = Math.cos(theta);
          const r = rotationRef.current.map((angle) => (angle * Math.PI) / 180) as [number, number, number];
          const xRotated = x * Math.cos(r[1]) - z * Math.sin(r[1]);
          const zRotated = x * Math.sin(r[1]) + z * Math.cos(r[1]);
          if (zRotated < 0) {
            const scale = projectionRef.current!.scale();
            const angle = Math.atan2(y, xRotated);
            const edgeX = center[0] + Math.cos(angle) * scale * 0.9;
            const edgeY = center[1] + Math.sin(angle) * scale * 0.9;
            svg.select("#sat-markers-group")
              .append("circle")
              .attr("cx", edgeX)
              .attr("cy", edgeY)
              .attr("r", 4)
              .attr("fill", "none")
              .attr("stroke", "#ef4444")
              .attr("stroke-width", 2)
              .attr("stroke-dasharray", "2,2");
            svg.select("#sat-markers-group")
              .append("text")
              .attr("x", edgeX + 10)
              .attr("y", edgeY)
              .attr("fill", "#ef4444")
              .attr("font-size", "9px")
              .attr("text-anchor", "start")
              .attr("dominant-baseline", "middle")
              .text(`${cdmData?.sat1_object_designator} (far side)`);
          }
        }
      }

      // Satellite 2 marker
      if (sat2CurrentPos) {
        const pos = projectSatellite(sat2CurrentPos);
        if (pos) {
          svg.select("#sat-markers-group")
            .append("circle")
            .attr("cx", pos[0])
            .attr("cy", pos[1])
            .attr("r", 8)
            .attr("fill", "#3b82f6")
            .attr("filter", "url(#glow)")
            .attr("opacity", 0.8);
          svg.select("#sat-markers-group")
            .append("circle")
            .attr("cx", pos[0])
            .attr("cy", pos[1])
            .attr("r", 4)
            .attr("fill", "#bfdbfe")
            .attr("stroke", "#60a5fa")
            .attr("stroke-width", 1);
          svg.select("#sat-markers-group")
            .append("text")
            .attr("x", pos[0] + 12)
            .attr("y", pos[1])
            .attr("fill", "#ffffff")
            .attr("font-size", "10px")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .text(cdmData?.sat2_object_designator || "");
        } else {
          const width = svgRef.current!.clientWidth;
          const height = svgRef.current!.clientHeight;
          const center = [width / 2, height / 2];
          const theta = ((90 - sat2CurrentPos.latitude) * Math.PI) / 180;
          const phi = ((sat2CurrentPos.longitude + 180) * Math.PI) / 180;
          const x = Math.sin(theta) * Math.cos(phi);
          const y = Math.sin(theta) * Math.sin(phi);
          const z = Math.cos(theta);
          const r = rotationRef.current.map((angle) => (angle * Math.PI) / 180) as [number, number, number];
          const xRotated = x * Math.cos(r[1]) - z * Math.sin(r[1]);
          const zRotated = x * Math.sin(r[1]) + z * Math.cos(r[1]);
          if (zRotated < 0) {
            const scale = projectionRef.current!.scale();
            const angle = Math.atan2(y, xRotated);
            const edgeX = center[0] + Math.cos(angle) * scale * 0.9;
            const edgeY = center[1] + Math.sin(angle) * scale * 0.9;
            svg.select("#sat-markers-group")
              .append("circle")
              .attr("cx", edgeX)
              .attr("cy", edgeY)
              .attr("r", 4)
              .attr("fill", "none")
              .attr("stroke", "#3b82f6")
              .attr("stroke-width", 2)
              .attr("stroke-dasharray", "2,2");
            svg.select("#sat-markers-group")
              .append("text")
              .attr("x", edgeX + 10)
              .attr("y", edgeY)
              .attr("fill", "#3b82f6")
              .attr("font-size", "9px")
              .attr("text-anchor", "start")
              .attr("dominant-baseline", "middle")
              .text(`${cdmData?.sat2_object_designator} (far side)`);
          }
        }
      }

      // Draw line between satellites if both are visible
      if (sat1CurrentPos && sat2CurrentPos) {
        const pos1 = projectSatellite(sat1CurrentPos);
        const pos2 = projectSatellite(sat2CurrentPos);
        if (pos1 && pos2) {
          const earthRadius = 6371;
          const x1 =
            (earthRadius + sat1CurrentPos.height) *
            Math.cos((sat1CurrentPos.latitude * Math.PI) / 180) *
            Math.cos((sat1CurrentPos.longitude * Math.PI) / 180);
          const y1 =
            (earthRadius + sat1CurrentPos.height) *
            Math.cos((sat1CurrentPos.latitude * Math.PI) / 180) *
            Math.sin((sat1CurrentPos.longitude * Math.PI) / 180);
          const z1 =
            (earthRadius + sat1CurrentPos.height) *
            Math.sin((sat1CurrentPos.latitude * Math.PI) / 180);
          const x2 =
            (earthRadius + sat2CurrentPos.height) *
            Math.cos((sat2CurrentPos.latitude * Math.PI) / 180) *
            Math.cos((sat2CurrentPos.longitude * Math.PI) / 180);
          const y2 =
            (earthRadius + sat2CurrentPos.height) *
            Math.cos((sat2CurrentPos.latitude * Math.PI) / 180) *
            Math.sin((sat2CurrentPos.longitude * Math.PI) / 180);
          const z2 =
            (earthRadius + sat2CurrentPos.height) *
            Math.sin((sat2CurrentPos.latitude * Math.PI) / 180);
          const distance = Math.sqrt(
            Math.pow(x2 - x1, 2) +
              Math.pow(y2 - y1, 2) +
              Math.pow(z2 - z1, 2)
          );

          svg.select("#sat-markers-group")
            .append("line")
            .attr("x1", pos1[0])
            .attr("y1", pos1[1])
            .attr("x2", pos2[0])
            .attr("y2", pos2[1])
            .attr("stroke", "#fcd34d")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4")
            .attr("stroke-opacity", 0.8);

          const midX = (pos1[0] + pos2[0]) / 2;
          const midY = (pos1[1] + pos2[1]) / 2;
          svg.select("#sat-markers-group")
            .append("text")
            .attr("x", midX)
            .attr("y", midY - 10)
            .attr("fill", "#fcd34d")
            .attr("font-size", "11px")
            .attr("text-anchor", "middle")
            .text(`${distance.toFixed(2)} km`);
        }
      }
    }

    // Update TCA markers (only when simulation is not running)
    svg.select("#tca-markers-group").selectAll("*").remove();
    if (!simRunning && tcaPositions.sat1 && tcaPositions.sat2) {
      const tcaGroup = svg.select("#tca-markers-group");
      const sat1Pos = projectSatellite(tcaPositions.sat1);
      const sat2Pos = projectSatellite(tcaPositions.sat2);

      if (sat1Pos) {
        tcaGroup.append("circle")
          .attr("cx", sat1Pos[0])
          .attr("cy", sat1Pos[1])
          .attr("r", 6)
          .attr("fill", "#ef4444")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5);
        tcaGroup.append("text")
          .attr("x", sat1Pos[0] + 10)
          .attr("y", sat1Pos[1] - 10)
          .attr("fill", "#ffffff")
          .attr("font-size", "12px")
          .text(cdmData?.sat1_object_designator || "");
      }

      if (sat2Pos) {
        tcaGroup.append("circle")
          .attr("cx", sat2Pos[0])
          .attr("cy", sat2Pos[1])
          .attr("r", 6)
          .attr("fill", "#3b82f6")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5);
        tcaGroup.append("text")
          .attr("x", sat2Pos[0] + 10)
          .attr("y", sat2Pos[1] - 10)
          .attr("fill", "#ffffff")
          .attr("font-size", "12px")
          .text(cdmData?.sat2_object_designator || "");
      }

      if (sat1Pos && sat2Pos) {
        tcaGroup.append("line")
          .attr("x1", sat1Pos[0])
          .attr("y1", sat1Pos[1])
          .attr("x2", sat2Pos[0])
          .attr("y2", sat2Pos[1])
          .attr("stroke", "#fcd34d")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,4")
          .attr("stroke-opacity", 0.8);
        const midX = (sat1Pos[0] + sat2Pos[0]) / 2;
        const midY = (sat1Pos[1] + sat2Pos[1]) / 2;
        tcaGroup.append("text")
          .attr("x", midX)
          .attr("y", midY - 10)
          .attr("fill", "#fcd34d")
          .attr("font-size", "11px")
          .attr("text-anchor", "middle")
          .text(`${cdmData?.miss_distance.toFixed(2)} km`);
      }
    }
  };

  // Automatic globe rotation animation
  useEffect(() => {
    if (!isAnimating) return;
    const animate = () => {
      rotationRef.current = [
        rotationRef.current[0],
        rotationRef.current[1] + 0.2,
        rotationRef.current[2],
      ];
      if (projectionRef.current) {
        projectionRef.current.rotate(rotationRef.current);
        updateVisualization();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  // Satellite simulation animation
  useEffect(() => {
    if (!simRunning) return;
    let lastTime = performance.now();
    const duration = 30000; // 30 seconds
    const animateSatellites = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      progressRef.current += (deltaTime / duration) * playbackSpeed;
      if (progressRef.current > 1) {
        progressRef.current = 1;
      }
      if (Math.abs(progressRef.current - animationProgress) > 0.01) {
        setAnimationProgress(progressRef.current);
      }
      updateVisualization(progressRef.current);
      if (progressRef.current < 1) {
        simulationRef.current = requestAnimationFrame(animateSatellites);
      }
    };
    simulationRef.current = requestAnimationFrame(animateSatellites);
    return () => {
      if (simulationRef.current !== null) {
        cancelAnimationFrame(simulationRef.current);
      }
    };
  }, [simRunning, playbackSpeed]);

  // Sync rotation ref when state changes
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  const toggleAnimation = () => setIsAnimating((prev) => !prev);
  const toggleSimulation = () => setSimRunning((prev) => !prev);
  const resetSimulation = () => {
    progressRef.current = 0;
    setAnimationProgress(0);
    updateVisualization(0);
  };
  const changePlaybackSpeed = (speed: number) => setPlaybackSpeed(speed);

  if (loading) {
    return (
      <div className="pl-[250px] flex flex-col items-center justify-center min-h-screen bg-black p-10 w-screen">
        <div className="text-center">
          <div className="mb-4 text-xl font-medium text-white">Loading orbit data...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pl-[250px] flex flex-col items-center justify-center min-h-screen bg-black p-10 w-screen">
        <div className="text-center text-red-500 max-w-lg">
          <div className="mb-4 text-xl font-medium">Error</div>
          <p>{error}</p>
          <div className="mt-4 space-x-4">
            <button
              onClick={() => router.push("/cesium-view")}
              className="px-4 py-2 bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700"
            >
              Back to Selection
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-[250px] flex flex-col h-screen bg-black w-screen">
      <div className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-gray-400">Orbit&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;</span>
            <span className="text-white">Visualization</span>
          </div>
          {cdmData && (
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-gray-400 text-sm">Time of Closest Approach:</span>
                <span className="ml-2 font-medium text-white">
                  {new Date(cdmData.tca).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Miss Distance:</span>
                <span className="ml-2 font-medium text-white">
                  {cdmData.miss_distance.toFixed(3)} km
                </span>
              </div>
              <button
                onClick={() => router.push("/cesium-view")}
                className="px-4 py-2 bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700"
              >
                Back to Selection
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <svg ref={svgRef} className="absolute inset-0 w-full h-full"></svg>
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={toggleAnimation}
            className={`px-3 py-2 rounded-md ${
              isAnimating ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"
            }`}
          >
            {isAnimating ? "Pause Globe Rotation" : "Auto Rotate Globe"}
          </button>

          <div className="bg-gray-800 bg-opacity-80 p-4 rounded-md flex flex-col space-y-3 min-w-[240px]">
            <div className="text-white text-sm font-medium">Satellite Animation</div>
            <div className="flex items-center justify-between">
              <button
                onClick={toggleSimulation}
                className={`px-3 py-2 rounded-md ${
                  simRunning ? "bg-red-600 text-white" : "bg-green-600 text-white"
                } flex-grow mr-2`}
              >
                {simRunning ? "Pause" : "Start Animation"}
              </button>
              <button
                onClick={resetSimulation}
                className={`px-3 py-2 rounded-md ${
                  !simRunning && animationProgress === 0
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gray-600 text-white hover:bg-gray-500"
                }`}
                disabled={!simRunning && animationProgress === 0}
              >
                Reset
              </button>
            </div>
            <div className="flex flex-col space-y-1">
              <div className="text-gray-300 text-xs">Playback Speed</div>
              <div className="flex space-x-2">
                {[0.5, 1, 2, 5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changePlaybackSpeed(speed)}
                    className={`px-2 py-1 text-sm rounded-md ${
                      playbackSpeed === speed
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-200"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-300">
                  {animationProgress >= 1 ? "Time of Closest Approach" : "Progress to TCA"}
                </div>
                <div className="text-xs text-gray-300">
                  {(animationProgress * 100).toFixed(0)}%
                </div>
              </div>
              <div className="overflow-hidden h-2 mt-1 text-xs flex rounded bg-gray-700">
                <div
                  style={{ width: `${animationProgress * 100}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    animationProgress >= 1 ? "bg-yellow-500" : "bg-blue-500"
                  }`}
                ></div>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span className="text-white text-xs">{cdmData?.sat1_object_designator}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span className="text-white text-xs">{cdmData?.sat2_object_designator}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-300 mr-1"></div>
                <span className="text-white text-xs">Closest Approach</span>
              </div>
              <div className="flex items-center mt-1">
                <div className="w-3 h-3 rounded-full border border-white mr-1" style={{ background: "transparent" }}></div>
                <span className="text-white text-xs">Far side (not visible)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {tcaPositions.sat1 && tcaPositions.sat2 && (
        <div className="p-4 border-t border-gray-800 text-white bg-gray-900 bg-opacity-90">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span>Satellite {cdmData?.sat1_object_designator}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span>Satellite {cdmData?.sat2_object_designator}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-300 mr-2"></div>
                <span>Closest Approach: {cdmData?.miss_distance.toFixed(3)} km</span>
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">TCA Positions:</span>
              <span className="ml-2">
                Sat1: {tcaPositions.sat1.latitude.toFixed(2)}°N, {tcaPositions.sat1.longitude.toFixed(2)}°E, {tcaPositions.sat1.height.toFixed(2)} km
              </span>
              <span className="mx-2">|</span>
              <span>
                Sat2: {tcaPositions.sat2.latitude.toFixed(2)}°N, {tcaPositions.sat2.longitude.toFixed(2)}°E, {tcaPositions.sat2.height.toFixed(2)} km
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
