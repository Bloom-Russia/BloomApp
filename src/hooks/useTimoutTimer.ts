import clamp from "lodash/clamp";
import { useCallback, useEffect, useRef, useState } from "react";

const useTimer = (startValue: number) => {
  const [count, setCount] = useState(startValue);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current === null) {
      setCount(startValue);
      timerRef.current = setInterval(() => {
        setCount((prevCount) => Math.max(0, prevCount - 1));
      }, 1000);

      setIsTimerRunning(true);
    }
  }, [startValue]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsTimerRunning(false);
    }
  }, []);

  useEffect(() => {
    if (count <= 0) {
      stopTimer();
    }
  }, [count, stopTimer]);

  useEffect(
    () => () => {
      stopTimer();
    },
    [stopTimer],
  );

  return { count, stopTimer, startTimer, isTimerRunning };
};

export const useTimoutTimer = (startTimeInMillis: number, timeoutInSec: number) => {
  const time = Math.trunc(
    clamp(timeoutInSec - (Date.now() - startTimeInMillis) / 1000, 0, timeoutInSec),
  );

  const { count, startTimer, stopTimer } = useTimer(time);

  useEffect(() => {
    if (count !== 0) {
      startTimer();
    }

    return stopTimer;
  }, [count, startTimer, stopTimer]);

  useEffect(() => {
    startTimer();
  }, [startTimeInMillis, startTimer]);

  return count;
};
