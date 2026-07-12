"use client";

import { HologramEarth } from "@/components/hologram-earth/HologramEarth";

type WorldGlobeProps = {
  compact?: boolean;
  label?: string;
  showStatus?: boolean;
};

export function WorldGlobe({ compact = false, label = "Private connection" }: WorldGlobeProps) {
  return <HologramEarth compact={compact} label={label.toUpperCase()} interactive showTelemetry />;
}
