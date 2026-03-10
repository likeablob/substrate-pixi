import { useEffect, useState } from "react";

interface SubstrateClockProps {
  show: boolean;
}

export function SubstrateClock({ show }: SubstrateClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!show) return;

    const timer = setInterval(() => {
      setTime(new Date());
    }, 500);

    return () => clearInterval(timer);
  }, [show]);

  if (!show) return null;

  const formattedTime = time.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="pointer-events-none fixed right-8 bottom-8 z-10 select-none">
      <div
        className="font-mono text-[8rem] leading-none font-bold tracking-tighter md:text-[12rem]"
        style={{
          color: "#f8f6f0",
          WebkitTextStroke: "0.5px #27272a", // 縁取りをより細く
        }}
      >
        {formattedTime}
      </div>
    </div>
  );
}
