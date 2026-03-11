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
    let initialPinchDistance = 0;
    let initialScale = 1;

    const getDistance = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (t1: Touch, t2: Touch) => {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    };

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

    const handleTouchStart = (e: TouchEvent) => {
      if (!options.enabled) return;

      if (e.touches.length === 1 && options.enablePan) {
        isDragging = true;
        lastPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && options.enableZoom) {
        isDragging = false; // Disable pan while zooming
        initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
        if (engineRef.current) {
          initialScale = engineRef.current.getWorld().scale.x;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!options.enabled || !engineRef.current) return;

      if (e.touches.length === 1 && isDragging && options.enablePan) {
        const world = engineRef.current.getWorld();
        world.x += e.touches[0].clientX - lastPos.x;
        world.y += e.touches[0].clientY - lastPos.y;
        lastPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        e.preventDefault();
      } else if (e.touches.length === 2 && options.enableZoom) {
        const engine = engineRef.current;
        const world = engine.getWorld();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scaleFactor = currentDistance / initialPinchDistance;

        const rect = canvas.getBoundingClientRect();
        const center = getCenter(e.touches[0], e.touches[1]);
        const centerX = center.x - rect.left;
        const centerY = center.y - rect.top;

        const screenPos = new Point(centerX, centerY);
        const worldPos = world.toLocal(screenPos);

        const newScale = initialScale * scaleFactor;
        world.scale.set(newScale);

        const newScreenPos = world.toGlobal(worldPos);
        world.x -= newScreenPos.x - centerX;
        world.y -= newScreenPos.y - centerY;
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    options.enabled,
    options.enableZoom,
    options.enablePan,
    canvasRef,
    engineRef,
  ]);
}
