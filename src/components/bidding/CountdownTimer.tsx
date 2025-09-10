import React from "react";

interface CountdownTimerProps {
  seconds: number;
}

const formatTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({ seconds }) => {
  const [time, setTime] = React.useState(seconds);

  React.useEffect(() => {
    if (time <= 0) return;
    const interval = setInterval(() => setTime(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [time]);

  return <span className="font-mono text-sm text-red-600">{formatTime(time)}</span>;
};

export default CountdownTimer;
