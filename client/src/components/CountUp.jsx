import React, { useEffect, useState } from "react";

function CountUp({ value }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const from = display;
    const duration = 500;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + (target - from) * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // target changes should restart from the currently displayed value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <>{display}</>;
}

export default CountUp;
