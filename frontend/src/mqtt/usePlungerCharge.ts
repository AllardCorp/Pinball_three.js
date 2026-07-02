import { useRef } from "react";

export function usePlungerCharge(
  onUpdate: (value: number) => void,
  onRelease: (force: number) => void,
  chargeDurationMs: number,
) {
  const onUpdateRef = useRef(onUpdate);
  const onReleaseRef = useRef(onRelease);
  onUpdateRef.current = onUpdate;
  onReleaseRef.current = onRelease;

  const charging = useRef(false);
  const startTime = useRef(0);
  const currentValue = useRef(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    if (charging.current) return;
    charging.current = true;
    startTime.current = Date.now();
    currentValue.current = 0;
    interval.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      currentValue.current = Math.min(1.0, elapsed / chargeDurationMs);
      onUpdateRef.current(currentValue.current);
    }, 50);
  }

  function release() {
    if (!charging.current) return;
    charging.current = false;
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
    onReleaseRef.current(currentValue.current);
  }

  function cleanup() {
    charging.current = false;
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  }

  return { start, release, cleanup };
}
