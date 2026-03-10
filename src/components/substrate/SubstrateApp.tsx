import { $config } from "@/lib/store";
import { decodeConfig } from "@/lib/substrate/url-sync";
import { useStore } from "@nanostores/react";
import { useEffect } from "react";
import { SubstrateCanvas } from "./SubstrateCanvas";
import { SubstrateClock } from "./SubstrateClock";
import { SubstrateControls } from "./SubstrateControls";

export function SubstrateApp() {
  const config = useStore($config);

  useEffect(() => {
    // Load config from URL on mount
    const params = new URLSearchParams(window.location.search);
    const configBase64 = params.get("config");
    if (configBase64) {
      const decoded = decodeConfig(configBase64);
      if (decoded) {
        $config.set(decoded);
        // Clean up URL without refreshing
        const url = new URL(window.location.href);
        url.searchParams.delete("config");
        window.history.replaceState({}, "", url.toString());
      }
    }

    const handleReset = () => {
      const newSeed = Math.floor(Math.random() * 1000000);
      const current = $config.get();
      $config.set({
        ...current,
        engine: { ...current.engine, seed: newSeed },
      });
    };

    window.addEventListener("substrate:reset", handleReset);
    return () => {
      window.removeEventListener("substrate:reset", handleReset);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <SubstrateCanvas engineConfig={config.engine} />
      <SubstrateClock show={config.ui.showClock} />
      <SubstrateControls />
    </div>
  );
}
