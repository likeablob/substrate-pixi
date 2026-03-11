import { SubstrateEngine } from "@/lib/substrate/engine";
import type { SubstrateEngineConfig } from "@/lib/substrate/types";
import { useSubstrateInteractions } from "@/lib/substrate/useSubstrateInteractions";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface SubstrateCanvasProps {
  engineConfig: SubstrateEngineConfig;
  interactive?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
}

export function SubstrateCanvas({
  engineConfig,
  interactive = true,
  enableZoom = true,
  enablePan = true,
}: SubstrateCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SubstrateEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useSubstrateInteractions(canvasRef, engineRef, {
    enabled: interactive,
    enableZoom,
    enablePan,
  });

  useEffect(() => {
    const engine = new SubstrateEngine(engineConfig);
    engineRef.current = engine;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const app = engine.getApp();
      if (app) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        app.renderer.resize(width, height);
        // Recenter world
        engine.getWorld().x = width / 2;
        engine.getWorld().y = height / 2;
      }
    };

    window.addEventListener("resize", handleResize);

    const handleDownload = async () => {
      if (engineRef.current) {
        const dataUrl = await engineRef.current.exportImage();
        const link = document.createElement("a");
        link.download = `substrate-${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
        window.dispatchEvent(new CustomEvent("substrate:download-complete"));
      }
    };

    window.addEventListener("substrate:download", handleDownload);

    engine.init(canvas).then(() => {
      setIsInitialized(true);
      handleResize(); // Initial resize
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("substrate:download", handleDownload);
      engine.destroy();
      engineRef.current = null;
    };
  }, []); // Initialize only once

  useEffect(() => {
    if (engineRef.current && isInitialized) {
      engineRef.current.updateConfig(engineConfig);
    }
  }, [engineConfig, isInitialized]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#f8f6f0" }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "block transition-opacity duration-1000",
          isInitialized ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
