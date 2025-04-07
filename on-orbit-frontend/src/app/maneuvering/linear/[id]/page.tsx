"use client";

import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useParams } from "next/navigation";
import Loading from "@/app/loading";

interface TrajectoryPoint {
  T_hours_before_TCA: number;
  delta_v_m_s: number;
  pc_value: number;
  miss_distance: number;
  sat1_position: number[];
  sat1_velocity: number[];
}

export default function ManeuveringDashboard() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchTradespace() {
      try {
        const accessToken = localStorage.getItem("token");
        if (!accessToken) {
          throw new Error("Please login to view this page");
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        };

        // Use the id from the URL as the cdm_id.
        const response = await fetch("http://localhost:8000/api/tradespace/linear/", {
          method: "POST",
          headers,
          body: JSON.stringify({ cdm_id: Number(id) }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch tradespace data");
        }
        const data = await response.json();
        // Backend returns an object with a "trajectory" field.
        setTrajectory(data.trajectory);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTradespace();
  }, [id]);

  // Sort trajectory by time (from 24 hr down to 0 hr)
  const sortedTrajectory = [...trajectory].sort(
    (a, b) => a.T_hours_before_TCA - b.T_hours_before_TCA
  );

  // Extract data for Highcharts
  const timeData = sortedTrajectory.map((pt) => pt.T_hours_before_TCA);
  const missDistanceData = sortedTrajectory.map((pt) => pt.miss_distance);
  const pcData = sortedTrajectory.map((pt) => pt.pc_value);

  const missDistanceOptions = {
    title: { text: "Miss Distance over Time" },
    xAxis: {
      title: { text: "Time Before TCA (hours)" },
      categories: timeData.map((t) => t.toFixed(2)),
    },
    yAxis: { title: { text: "Miss Distance" } },
    series: [{ name: "Miss Distance", data: missDistanceData }],
  };

  const pcOptions = {
    title: { text: "Collision Probability over Time" },
    xAxis: {
      title: { text: "Time Before TCA (hours)" },
      categories: timeData.map((t) => t.toFixed(2)),
    },
    yAxis: { title: { text: "Collision Probability" } },
    series: [{ name: "Collision Probability", data: pcData }],
  };

  if (loading) return <div><Loading/></div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tradespace Trajectory</h1>
      <div className="mb-8">
        <HighchartsReact highcharts={Highcharts} options={missDistanceOptions} />
      </div>
      <div>
        <HighchartsReact highcharts={Highcharts} options={pcOptions} />
      </div>
    </div>
  );
}