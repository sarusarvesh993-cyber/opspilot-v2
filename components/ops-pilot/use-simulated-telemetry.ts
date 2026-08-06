"use client";

import { useEffect, useState } from "react";
import type { Telemetry } from "./types";

const INITIAL_TELEMETRY: Telemetry = {
  cpu: 42,
  memory: 68,
  networkIn: 1.3,
  networkOut: 2.7,
};

function drift(value: number, variance: number, minimum: number, maximum: number) {
  const next = value + Math.random() * variance * 2 - variance;
  return Math.min(maximum, Math.max(minimum, Number(next.toFixed(1))));
}

export function useSimulatedTelemetry(): Telemetry {
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTelemetry((current) => ({
        cpu: drift(current.cpu, 3, 10, 100),
        memory: drift(current.memory, 1, 10, 100),
        networkIn: drift(current.networkIn, 0.2, 0.1, 10),
        networkOut: drift(current.networkOut, 0.2, 0.1, 10),
      }));
    }, 4_000);

    return () => window.clearInterval(interval);
  }, []);

  return telemetry;
}
