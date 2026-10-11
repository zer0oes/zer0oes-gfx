"use client";

import { useEffect, useRef, useState } from "react";

// Les coordonnées SVG suivent les pixels de la carte : les textes restent à taille fixe.
export function useChartSize() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 720, height: 240 });
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width <= 0 || height <= 0) return;
      setSize((previous) => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  return { svgRef, ...size };
}
