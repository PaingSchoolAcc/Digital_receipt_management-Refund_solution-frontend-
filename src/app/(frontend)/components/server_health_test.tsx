"use client";

import { useEffect } from "react";
import { env } from "@/config/env";
import { healthService } from "@/services/health.service";

export default function HealthCheck() {
  useEffect(() => {
    console.log("API base:", env.apiBaseUrl);
    healthService
      .check()
      .then((res) => console.log("HEALTH OK:", res))
      .catch((err) => console.error("HEALTH FAIL:", err));
  }, []);
  return null;
}