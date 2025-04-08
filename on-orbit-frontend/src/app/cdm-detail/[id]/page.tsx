"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface CDM {
  id: number;
  ccsds_cdm_version: string;
  creation_date: string;
  originator: string;
  message_id: string;
  tca: string; // time of closest approach
  miss_distance: number;
  sat1_object: string;
  sat1_object_designator: string;
  sat1_maneuverable: string;
  sat1_x: number;
  sat1_y: number;
  sat1_z: number;
  sat1_x_dot: number;
  sat1_y_dot: number;
  sat1_z_dot: number;
  sat1_cov_rr: number;
  sat1_cov_rt: number;
  sat1_cov_rn: number;
  sat1_cov_tr: number;
  sat1_cov_tt: number;
  sat1_cov_tn: number;
  sat1_cov_nr: number;
  sat1_cov_nt: number;
  sat1_cov_nn: number;
  sat1_catalog_name?: string;
  sat1_object_name?: string;
  sat1_international_designator?: string;
  sat1_object_type?: string;
  sat1_operator_organization?: string;
  sat1_covariance_method?: string;
  sat1_reference_frame?: string;

  sat2_object: string;
  sat2_object_designator: string;
  sat2_maneuverable: string;
  sat2_x: number;
  sat2_y: number;
  sat2_z: number;
  sat2_x_dot: number;
  sat2_y_dot: number;
  sat2_z_dot: number;
  sat2_catalog_name?: string;
  sat2_object_name?: string;
  sat2_international_designator?: string;
  sat2_object_type?: string;
  sat2_operator_organization?: string;
  sat2_covariance_method?: string;
  sat2_reference_frame?: string;
  sat2_cov_rr: number;
  sat2_cov_rt: number;
  sat2_cov_rn: number;
  sat2_cov_tr: number;
  sat2_cov_tt: number;
  sat2_cov_tn: number;
  sat2_cov_nr: number;
  sat2_cov_nt: number;
  sat2_cov_nn: number;

  hard_body_radius: number;
  // Omitting the privacy field from display
}

export default function CDMDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [cdm, setCdm] = useState<CDM | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCDM = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8000/api/cdms/${id}/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch CDM data.");
        }
        const data = await response.json();
        setCdm(data);
      } catch (err: any) {
        setError(err.message || "Unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchCDM();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 ml-[250px]">
        <div>Loading CDM data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 ml-[250px] text-red-500">
        <div>Error: {error}</div>
      </div>
    );
  }

  if (!cdm) {
    return (
      <div className="p-10 ml-[250px]">
        <div>No CDM data found.</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-10 w-full flex flex-col items-center">
        <Link href="/dashboard">
          <button className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-4 rounded flex items-center gap-2 mb-6">
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
        </Link>
        <div className="max-w-4xl w-full bg-white shadow-md rounded-3xl p-8">
          <h1 className="text-2xl font-bold mb-4">CDM Detail - {cdm.message_id}</h1>
          <div className="space-y-3">
            <p>
              <strong>CCSDS CDM Version:</strong> {cdm.ccsds_cdm_version}
            </p>
            <p>
              <strong>Creation Date:</strong>{" "}
              {new Date(cdm.creation_date).toLocaleString()}
            </p>
            <p>
              <strong>Originator:</strong> {cdm.originator}
            </p>
            <p>
              <strong>Time of Closest Approach (TCA):</strong>{" "}
              {new Date(cdm.tca).toLocaleString()}
            </p>
            <p>
              <strong>Miss Distance:</strong> {cdm.miss_distance}
            </p>
            <hr className="my-4" />

            <h2 className="text-xl font-semibold">Satellite 1 Details</h2>
            {cdm.sat1_object && (
              <p>
                <strong>Object:</strong> {cdm.sat1_object}
              </p>
            )}
            {cdm.sat1_object_designator && (
              <p>
                <strong>Object Designator:</strong> {cdm.sat1_object_designator}
              </p>
            )}
            {cdm.sat1_maneuverable && (
              <p>
                <strong>Maneuverable:</strong> {cdm.sat1_maneuverable}
              </p>
            )}
            <p>
              <strong>Position (X, Y, Z):</strong>{" "}
              {cdm.sat1_x}, {cdm.sat1_y}, {cdm.sat1_z}
            </p>
            <p>
              <strong>Velocity (X, Y, Z):</strong>{" "}
              {cdm.sat1_x_dot}, {cdm.sat1_y_dot}, {cdm.sat1_z_dot}
            </p>
            {cdm.sat1_catalog_name && (
              <p>
                <strong>Catalog Name:</strong> {cdm.sat1_catalog_name}
              </p>
            )}
            {cdm.sat1_object_name && (
              <p>
                <strong>Object Name:</strong> {cdm.sat1_object_name}
              </p>
            )}
            {cdm.sat1_international_designator && (
              <p>
                <strong>International Designator:</strong>{" "}
                {cdm.sat1_international_designator}
              </p>
            )}
            {cdm.sat1_object_type && (
              <p>
                <strong>Object Type:</strong> {cdm.sat1_object_type}
              </p>
            )}
            {cdm.sat1_operator_organization && (
              <p>
                <strong>Operator Organization:</strong>{" "}
                {cdm.sat1_operator_organization}
              </p>
            )}
            {cdm.sat1_covariance_method && (
              <p>
                <strong>Covariance Method:</strong> {cdm.sat1_covariance_method}
              </p>
            )}
            {cdm.sat1_reference_frame && (
              <p>
                <strong>Reference Frame:</strong> {cdm.sat1_reference_frame}
              </p>
            )}
            <hr className="my-4" />

            <h2 className="text-xl font-semibold">Satellite 2 Details</h2>
            {cdm.sat2_object && (
              <p>
                <strong>Object:</strong> {cdm.sat2_object}
              </p>
            )}
            {cdm.sat2_object_designator && (
              <p>
                <strong>Object Designator:</strong> {cdm.sat2_object_designator}
              </p>
            )}
            {cdm.sat2_maneuverable && (
              <p>
                <strong>Maneuverable:</strong> {cdm.sat2_maneuverable}
              </p>
            )}
            <p>
              <strong>Position (X, Y, Z):</strong>{" "}
              {cdm.sat2_x}, {cdm.sat2_y}, {cdm.sat2_z}
            </p>
            <p>
              <strong>Velocity (X, Y, Z):</strong>{" "}
              {cdm.sat2_x_dot}, {cdm.sat2_y_dot}, {cdm.sat2_z_dot}
            </p>
            {cdm.sat2_catalog_name && (
              <p>
                <strong>Catalog Name:</strong> {cdm.sat2_catalog_name}
              </p>
            )}
            {cdm.sat2_object_name && (
              <p>
                <strong>Object Name:</strong> {cdm.sat2_object_name}
              </p>
            )}
            {cdm.sat2_international_designator && (
              <p>
                <strong>International Designator:</strong>{" "}
                {cdm.sat2_international_designator}
              </p>
            )}
            {cdm.sat2_object_type && (
              <p>
                <strong>Object Type:</strong> {cdm.sat2_object_type}
              </p>
            )}
            {cdm.sat2_operator_organization && (
              <p>
                <strong>Operator Organization:</strong>{" "}
                {cdm.sat2_operator_organization}
              </p>
            )}
            {cdm.sat2_covariance_method && (
              <p>
                <strong>Covariance Method:</strong> {cdm.sat2_covariance_method}
              </p>
            )}
            {cdm.sat2_reference_frame && (
              <p>
                <strong>Reference Frame:</strong> {cdm.sat2_reference_frame}
              </p>
            )}
            <hr className="my-4" />
            <p>
              <strong>Hard Body Radius:</strong> {cdm.hard_body_radius}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}