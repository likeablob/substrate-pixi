import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { $config, defaultConfig } from "@/lib/store";
import { PALETTES, type PaletteId } from "@/lib/substrate/palette";
import type {
  SubstrateEngineConfig,
  SubstrateUIConfig,
} from "@/lib/substrate/types";
import { getShareUrl } from "@/lib/substrate/url-sync";
import { cn } from "@/lib/utils";
import { useStore } from "@nanostores/react";
import {
  Check,
  Clock,
  Copy,
  Dices,
  Download,
  Loader2,
  Maximize,
  Minimize,
  RotateCcw,
  Settings,
  SquareKanban,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SubstrateControlsProps {
  initialOpen?: boolean;
}

export function SubstrateControls({
  initialOpen = false,
}: SubstrateControlsProps) {
  const config = useStore($config);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isVisible, setIsVisible] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const e = new CustomEvent("substrate:download");
    window.dispatchEvent(e);
  };

  useEffect(() => {
    const handleDownloadComplete = () => {
      setIsDownloading(false);
      setIsCopied(false); // Just to clear other states if needed
    };

    window.addEventListener(
      "substrate:download-complete",
      handleDownloadComplete,
    );
    return () => {
      window.removeEventListener(
        "substrate:download-complete",
        handleDownloadComplete,
      );
    };
  }, []);

  const handleCopyUrl = async () => {
    const url = getShareUrl($config.get());
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const resetFadeTimer = () => {
    setIsVisible(true);
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
    }
    // Fade out after 3 seconds of inactivity
    fadeTimerRef.current = setTimeout(() => {
      if (!isOpen) {
        setIsVisible(false);
      }
    }, 3000);
  };

  useEffect(() => {
    const handleActivity = () => {
      resetFadeTimer();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("touchstart", handleActivity, { passive: true });
    resetFadeTimer();

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [isOpen]);

  const updateEngineConfig = <K extends keyof SubstrateEngineConfig>(
    key: K,
    value: SubstrateEngineConfig[K],
  ) => {
    const current = $config.get();
    $config.set({
      ...current,
      engine: { ...current.engine, [key]: value },
    });
  };

  const updateUIConfig = <K extends keyof SubstrateUIConfig>(
    key: K,
    value: SubstrateUIConfig[K],
  ) => {
    const current = $config.get();
    $config.set({
      ...current,
      ui: { ...current.ui, [key]: value },
    });
  };

  return (
    <>
      {/* Settings Toggle Button */}
      <div
        className={cn(
          "fixed top-4 right-4 z-50 flex gap-2 transition-all duration-500",
          !isVisible && !isOpen && "pointer-events-none opacity-0",
          isOpen && "pointer-events-none opacity-0",
        )}
      >
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full border border-zinc-700/50 bg-zinc-900/80 text-white shadow-lg backdrop-blur-sm hover:bg-zinc-800"
          onClick={toggleFullscreen}
          onMouseEnter={() => setIsVisible(true)}
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full border border-zinc-700/50 bg-zinc-900/80 text-white shadow-lg backdrop-blur-sm hover:bg-zinc-800"
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsVisible(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Controls Panel */}
      <Card
        className={cn(
          "dark fixed top-4 right-4 z-50 w-[320px] transform border-zinc-800/40 bg-zinc-950/65 text-zinc-100 shadow-2xl backdrop-blur-xl transition-all duration-300",
          isOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-8 scale-95 opacity-0",
        )}
        onMouseEnter={() => {
          if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
          setIsVisible(true);
        }}
        onMouseLeave={() => {
          if (!isOpen) resetFadeTimer();
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between px-7 pt-2 pb-0">
          <div className="flex items-center gap-2">
            <SquareKanban className="h-3.5 w-3.5 text-zinc-100" />
            <CardTitle className="text-sm font-bold tracking-wider text-zinc-300 uppercase">
              SUBSTRATE | PIXI
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-zinc-800 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-3 overflow-hidden p-0">
          {/* Environment Group */}
          <div className="mx-4 mt-2 space-y-2 rounded-lg border border-zinc-800/30 bg-zinc-900/40 p-2.5">
            <div className="space-y-1.5">
              <Label
                htmlFor="canvasSize"
                className="text-xs text-zinc-300 uppercase"
              >
                Canvas Size
              </Label>
              <Select
                value={config.engine.canvasSize}
                onValueChange={(v) =>
                  updateEngineConfig("canvasSize", v as any)
                }
              >
                <SelectTrigger
                  id="canvasSize"
                  className="h-8 w-full border-zinc-800 bg-zinc-900 text-xs text-zinc-200"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="dark border-zinc-800 bg-zinc-900 text-zinc-100"
                >
                  <SelectItem value="viewport">Fullscreen (Dynamic)</SelectItem>
                  <SelectItem value="1000x1000">Small (1000x1000)</SelectItem>
                  <SelectItem value="2000x2000">Medium (2000x2000)</SelectItem>
                  <SelectItem value="4000x4000">Large (4000x4000)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="palette"
                className="text-xs text-zinc-300 uppercase"
              >
                Color Palette
              </Label>
              <Select
                value={config.engine.palette}
                onValueChange={(v) =>
                  updateEngineConfig("palette", v as PaletteId)
                }
              >
                <SelectTrigger
                  id="palette"
                  className="h-8 w-full border-zinc-800 bg-zinc-900 text-xs text-zinc-200"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="dark border-zinc-800 bg-zinc-900 text-zinc-100"
                >
                  {Object.values(PALETTES).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label
                  htmlFor="seed"
                  className="text-xs text-zinc-300 uppercase"
                >
                  Random Seed
                </Label>
                <span className="font-mono text-xs text-zinc-200">
                  #{config.engine.seed}
                </span>
              </div>
              <div className="flex gap-1.5">
                <Input
                  id="seed"
                  type="number"
                  value={config.engine.seed}
                  onChange={(e) =>
                    updateEngineConfig("seed", parseInt(e.target.value) || 0)
                  }
                  className="h-8 border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-200"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateEngineConfig(
                      "seed",
                      Math.floor(Math.random() * 1000000),
                    )
                  }
                  className="h-8 w-8 shrink-0 border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <Dices className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Growth Logic Group */}
          <div className="mx-7 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label
                  htmlFor="speed"
                  className="text-xs text-zinc-300 uppercase"
                >
                  Growth Speed
                </Label>
                <span className="font-mono text-xs text-zinc-200">
                  {config.engine.speed.toFixed(2)}
                </span>
              </div>
              <Slider
                id="speed"
                min={0.1}
                max={5}
                step={0.1}
                value={[config.engine.speed]}
                onValueChange={(v) => updateEngineConfig("speed", v[0])}
                className="py-1"
              />
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/50 py-1 pt-2">
              <Label
                htmlFor="straight-mode"
                className="text-xs text-zinc-300 uppercase"
              >
                Linear Growth
              </Label>
              <Switch
                id="straight-mode"
                checked={config.engine.isStraight}
                onCheckedChange={(v) => updateEngineConfig("isStraight", v)}
                className="scale-90"
              />
            </div>

            <div
              className={cn(
                "space-y-3 transition-opacity",
                config.engine.isStraight && "pointer-events-none opacity-25",
              )}
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label
                    htmlFor="curvature"
                    className="text-xs text-zinc-300 uppercase"
                  >
                    Curvature Range
                  </Label>
                  <span className="font-mono text-xs text-zinc-200">
                    {config.engine.minCurve.toFixed(4)} -{" "}
                    {config.engine.maxCurve.toFixed(4)}
                  </span>
                </div>
                <Slider
                  id="curvature"
                  min={0}
                  max={1}
                  step={0.001}
                  value={[
                    Math.pow(config.engine.minCurve / 0.5, 1 / 3),
                    Math.pow(config.engine.maxCurve / 0.5, 1 / 3),
                  ]}
                  onValueChange={(v) => {
                    const min = Math.pow(v[0], 3) * 0.5;
                    const max = Math.pow(v[1], 3) * 0.5;
                    const current = $config.get();
                    $config.set({
                      ...current,
                      engine: {
                        ...current.engine,
                        minCurve: min,
                        maxCurve: max,
                      },
                    });
                  }}
                  disabled={config.engine.isStraight}
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] font-bold tracking-tighter text-zinc-200 uppercase">
                  <span>Subtle</span>
                  <span>Drastic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visuals Group */}
          <div className="mx-7 space-y-3 border-t border-zinc-800/50 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label
                  htmlFor="density"
                  className="text-xs text-zinc-300 uppercase"
                >
                  Point Density
                </Label>
                <span className="font-mono text-xs text-zinc-200">
                  {config.engine.density}
                </span>
              </div>
              <Slider
                id="density"
                min={10}
                max={500}
                step={10}
                value={[config.engine.density]}
                onValueChange={(v) => updateEngineConfig("density", v[0])}
                className="py-1"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label
                  htmlFor="resetInterval"
                  className="text-xs text-zinc-300 uppercase"
                >
                  Auto-reset Interval
                </Label>
                <span className="font-mono text-xs text-zinc-200">
                  {config.engine.resetInterval}s
                </span>
              </div>
              <Slider
                id="resetInterval"
                min={30}
                max={1800}
                step={30}
                value={[config.engine.resetInterval]}
                onValueChange={(v) => updateEngineConfig("resetInterval", v[0])}
                className="py-1"
              />
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/50 py-1 pt-2">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                <Label
                  htmlFor="show-clock"
                  className="text-xs text-zinc-300 uppercase"
                >
                  Display Clock
                </Label>
              </div>
              <Switch
                id="show-clock"
                checked={config.ui.showClock}
                onCheckedChange={(v) => updateUIConfig("showClock", v)}
                className="scale-90"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mx-7 mt-2 space-y-4 border-t border-zinc-800/80 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const e = new CustomEvent("substrate:reset");
                  window.dispatchEvent(e);
                }}
                className="h-7 border-zinc-800 bg-transparent text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <Trash2 className="mr-1.5 h-3 w-3" />
                Reset Canvas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  $config.set(defaultConfig);
                }}
                className="h-7 border-zinc-800 bg-transparent text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <RotateCcw className="mr-1.5 h-3 w-3" />
                Default Config
              </Button>
            </div>

            {/* Separator */}
            <div className="h-px w-full bg-zinc-800/60" />

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyUrl}
                className="h-8 bg-zinc-800 text-xs text-zinc-100 hover:bg-zinc-700"
              >
                {isCopied ? (
                  <Check className="mr-1.5 h-3 w-3" />
                ) : (
                  <Copy className="mr-1.5 h-3 w-3" />
                )}
                Share URL
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="h-8 bg-zinc-800 text-xs text-zinc-100 hover:bg-zinc-700"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-1.5 h-3 w-3" />
                    Export JPEG
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* GitHub Link */}
          <div className="flex flex-col items-center gap-2 pt-1 pb-0">
            <a
              href="https://github.com/likeablob/substrate-pixi"
              target="_blank"
              rel="noreferrer"
              className="group flex flex-row items-center gap-1.5 pt-2 text-zinc-300 transition-colors hover:text-zinc-100"
            >
              <div className="flex items-center gap-2">
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 fill-current"
                >
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span className="text-xs font-medium tracking-wider uppercase">
                  GitHub
                </span>
              </div>
              <div className="h-3 w-px bg-zinc-200/50" />
              <span className="font-mono text-xs opacity-40">
                {import.meta.env.PUBLIC_COMMIT_HASH}
              </span>
            </a>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
