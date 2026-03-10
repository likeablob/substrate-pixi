import { Point } from "pixi.js";
import { useEffect, type RefObject } from "react";
import type { SubstrateEngine } from "./engine";

interface InteractionOptions {
  enabled: boolean;
  enableZoom: boolean;
  enablePan: boolean;
}

export function useSubstrateInteractions(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  engineRef: RefObject<SubstrateEngine | null>,
  options: InteractionOptions = {
    enabled: true,
    enableZoom: true,
    enablePan: true,
  },
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !options.enabled) return;

    const handleWheel = (e: WheelEvent) => {
      if (!options.enableZoom || !engineRef.current) return;
      e.preventDefault();

      const engine = engineRef.current;
      const world = engine.getWorld();
      const scale = e.deltaY > 0 ? 0.9 : 1.1;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const screenPos = new Point(mouseX, mouseY);
      const worldPos = world.toLocal(screenPos);
      world.scale.x *= scale;
      world.scale.y *= scale;
      const newScreenPos = world.toGlobal(worldPos);
      world.x -= newScreenPos.x - mouseX;
      world.y -= newScreenPos.y - mouseY;
    };

    let isDragging = false;
    let lastPos = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      if (!options.enablePan) return;
      isDragging = true;
      lastPos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !engineRef.current) return;
      const world = engineRef.current.getWorld();
      world.x += e.clientX - lastPos.x;
      world.y += e.clientY - lastPos.y;
      lastPos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    canvas.addEventListener("wheel", handleWheel);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    options.enabled,
    options.enableZoom,
    options.enablePan,
    canvasRef,
    engineRef,
  ]);
}
