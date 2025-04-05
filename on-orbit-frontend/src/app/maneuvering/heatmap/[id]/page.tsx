"use client";

import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useParams } from "next/navigation";
import Link from "next/link";

interface HeatmapDataPoint {
  T_hours: number;
  dv: number;
  miss_distance: number;
  pc: number;
}

interface BackendResponse {
  original: {
    sat1_initial_position: number[];
    sat1_initial_velocity: number[];
    sat2_initial_position: number[];
    sat2_initial_velocity: number[];
    miss_distance: number;
    pc_value: number;
  };
  best_maneuver: {
    T_hours_before_TCA: number;
    delta_v_m_s: number;
    pc_value: number;
    miss_distance: number;
    sat1_final_position: number[];
    sat1_final_velocity: number[];
  };
  heatmap_data: HeatmapDataPoint[];
}

export default function ManeuveringHeatmapPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    import("highcharts/modules/heatmap").then(({ default: HeatmapModule }) => {
        try {
          // Force the module call and ignore any errors it might throw.
          (HeatmapModule as any)(Highcharts);
        } catch (e) {
          // Ignore the error
          console.warn("Ignoring heatmap module error:", e);
        }
      });
  }, []);

  useEffect(() => {
    async function fetchHeatmap() {
      try {
        const accessToken = localStorage.getItem("token");
        if (!accessToken) {
          throw new Error("Failed to fetch CDMs: Please login to view this page");
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        };

        const response = await fetch("http://localhost:8000/api/tradespace/", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ cdm_id: Number(id) }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch tradespace data");
        }
        const data: BackendResponse = await response.json();
        setHeatmapData(data.heatmap_data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchHeatmap();
    }
  }, [id]);

  // Prepare the data for the heatmap.
  // 1. Get unique sorted time (T_hours) and Δv (dv) values.
  const uniqueT = Array.from(new Set(heatmapData.map((pt) => pt.T_hours))).sort(
    (a, b) => a - b
  );
  const uniqueDv = Array.from(new Set(heatmapData.map((pt) => pt.dv))).sort(
    (a, b) => a - b
  );

  // 2. Map each heatmap_data point to the [x, y, value] format.
  // x: index in uniqueT, y: index in uniqueDv, value: collision probability (pc)
  const chartData = heatmapData.map((pt) => {
    const x = uniqueT.indexOf(pt.T_hours);
    const y = uniqueDv.indexOf(pt.dv);
    return [x, y, pt.pc];
  });

  const options: Highcharts.Options = {
    chart: {
      type: "heatmap"
    },
    title: { text: "Tradespace Heatmap (Collision Probability)" },
    xAxis: {
      categories: uniqueT.map((t) => `${t.toFixed(2)} hr`),
      title: { text: "Time Before TCA" }
    },
    yAxis: {
      categories: uniqueDv.map((dv) => `${dv.toFixed(2)} m/s`),
      title: { text: "Δv" },
      reversed: true
    },
    colorAxis: {
      min: 0,
      max: Math.max(...chartData.map((d) => d[2])),
      stops: [
        [0, "#ffffff"],
        [0.5, "#fdae61"],
        [1, "#d73027"]
      ]
    },
    tooltip: {
      formatter: function () {
        // @ts-ignore
        const timeLabel = this.series.xAxis.categories[this.point.x];
        // @ts-ignore
        const dvLabel = this.series.yAxis.categories[this.point.y];
        return `<b>Time:</b> ${timeLabel}<br/><b>Δv:</b> ${dvLabel}<br/><b>PC:</b> ${this.point.value.toExponential(3)}`;
      }
    },
    series: [
      {
        type: "heatmap",
        name: "Collision Probability",
        borderWidth: 1,
        data: chartData,
        dataLabels: {
          enabled: false
        }
      }
    ]
  };

  if (loading) return <div>Loading heatmap data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Maneuvering Heatmap</h1>
      <HighchartsReact highcharts={Highcharts} options={options} />
      {id && (
        <div className="mt-4 flex justify-center">
          <Link href={`/maneuvering/linear/${id}`}>
            <button className="bg-black hover:bg-gray-800 text-white py-2 px-4 rounded">
              View linear plot with best ΔV every time
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}