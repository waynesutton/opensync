import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { useTheme } from "../lib/theme";
import {
  Sun,
  Moon,
  MessagesSquare,
  Zap,
  Play,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";

// Helper to format large numbers
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(0) + "k";
  }
  return num.toString();
}

// TEMP: Calculate next milestone based on current count
function getNextMilestone(count: number): { target: number; previous: number } {
  if (count < 500_000) {
    return { target: 500_000, previous: 0 };
  }
  if (count < 1_000_000) {
    // 100k increments: 500k -> 600k -> 700k -> etc.
    const next = Math.ceil(count / 100_000) * 100_000;
    const target = count === next ? next + 100_000 : next;
    const prev = target - 100_000;
    return { target, previous: prev };
  }
  // 500k increments for 1M+
  const next = Math.ceil(count / 500_000) * 500_000;
  const target = count === next ? next + 500_000 : next;
  const prev = target - 500_000;
  return { target, previous: prev };
}

// Message milestone counter component
function MessageMilestoneCounter({ isDark }: { isDark: boolean }) {
  const messageCount = useQuery(api.analytics.publicMessageCount);

  // Calculate milestone targets
  const count = messageCount ?? 0;
  const { target, previous } = getNextMilestone(count);

  // Calculate progress percentage within current milestone range
  const range = target - previous;
  const progress = range > 0 ? ((count - previous) / range) * 100 : 0;

  return (
    <div
      className={`rounded-lg border p-5 ${
        isDark
          ? "border-zinc-800 bg-[#161616]"
          : "border-[#e6e4e1] bg-[#f5f3f0]"
      }`}
    >
      <h3
        className={`text-sm font-medium mb-4 flex items-center gap-2 ${
          isDark ? "text-zinc-300" : "text-[#1a1a1a]"
        }`}
      >
        <MessagesSquare
          className={`h-4 w-4 ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
        />
        Messages Synced
        <span
          className={`ml-auto text-[10px] font-normal ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}
        >
          real-time
        </span>
      </h3>

      {/* Count display */}
      <div className="mb-3">
        <span
          className={`text-2xl font-bold tabular-nums ${
            isDark ? "text-zinc-100" : "text-[#1a1a1a]"
          }`}
        >
          {count.toLocaleString()}
        </span>
        <span
          className={`text-sm ml-2 ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
        >
          / {formatNumber(target)}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className={`h-2 rounded-full overflow-hidden ${
          isDark ? "bg-zinc-800" : "bg-[#e6e4e1]"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDark ? "bg-emerald-500" : "bg-emerald-600"
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Percentage */}
      <p
        className={`text-xs mt-2 ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
      >
        {progress.toFixed(1)}% to {formatNumber(target)}
      </p>
    </div>
  );
}

// Animated growth chart component
function AnimatedGrowthChart({ isDark }: { isDark: boolean }) {
  const growthData = useQuery(api.analytics.publicMessageGrowth);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Get data points - limit to last 60 days for readability
  const dataPoints = growthData?.slice(-60) ?? [];
  const maxCumulative = dataPoints.length > 0
    ? Math.max(...dataPoints.map(d => d.cumulative))
    : 100;

  // Calculate Y-axis scale
  const getNiceMax = (value: number): number => {
    if (value <= 100) return 100;
    if (value <= 500) return 500;
    if (value <= 1000) return 1000;
    if (value <= 5000) return 5000;
    if (value <= 10000) return 10000;
    if (value <= 50000) return 50000;
    if (value <= 100000) return 100000;
    if (value <= 500000) return 500000;
    return Math.ceil(value / 100000) * 100000;
  };

  const yAxisMax = getNiceMax(maxCumulative * 1.1);

  const handlePlay = () => {
    setAnimationKey(prev => prev + 1);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAnimationKey(prev => prev + 1);
  };

  // Fallback timeout to stop animation
  useEffect(() => {
    if (!isPlaying) return;
    const timeout = setTimeout(() => {
      setIsPlaying(false);
    }, 3500);
    return () => clearTimeout(timeout);
  }, [isPlaying, animationKey]);

  // Build SVG path
  const chartHeight = 120;
  const chartWidth = 100;
  const padding = { top: 10, bottom: 20, left: 0, right: 0 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const pathData = dataPoints.length >= 1
    ? dataPoints.map((d, i) => {
        const x = padding.left + (dataPoints.length === 1 ? innerWidth : (i / (dataPoints.length - 1)) * innerWidth);
        const y = padding.top + innerHeight - (d.cumulative / yAxisMax) * innerHeight;
        return i === 0 ? `M ${padding.left} ${padding.top + innerHeight} L ${x} ${y}` : `L ${x} ${y}`;
      }).join(' ')
    : '';

  const areaPath = pathData && dataPoints.length >= 1
    ? `M ${padding.left} ${padding.top + innerHeight} ` +
      dataPoints.map((d, i) => {
        const x = padding.left + (dataPoints.length === 1 ? innerWidth : (i / (dataPoints.length - 1)) * innerWidth);
        const y = padding.top + innerHeight - (d.cumulative / yAxisMax) * innerHeight;
        return `L ${x} ${y}`;
      }).join(' ') +
      ` L ${padding.left + (dataPoints.length === 1 ? innerWidth : innerWidth)} ${padding.top + innerHeight} Z`
    : '';

  const formatDateLabel = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const xLabels = dataPoints.length >= 1
    ? dataPoints.length === 1
      ? [formatDateLabel(dataPoints[0].date)]
      : dataPoints.length === 2
        ? [formatDateLabel(dataPoints[0].date), formatDateLabel(dataPoints[1].date)]
        : [
            formatDateLabel(dataPoints[0].date),
            formatDateLabel(dataPoints[Math.floor(dataPoints.length / 2)].date),
            formatDateLabel(dataPoints[dataPoints.length - 1].date),
          ]
    : [];

  return (
    <div
      className={`rounded-lg border p-5 ${
        isDark
          ? "border-zinc-800 bg-[#161616]"
          : "border-[#e6e4e1] bg-[#f5f3f0]"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-sm font-medium flex items-center gap-2 ${
            isDark ? "text-zinc-300" : "text-[#1a1a1a]"
          }`}
        >
          <Zap
            className={`h-4 w-4 ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
          />
          Message Growth
        </h3>

        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={dataPoints.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDark
                  ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
                  : "bg-[#ebe9e6] text-[#1a1a1a] hover:bg-[#e6e4e1] disabled:opacity-50"
              }`}
            >
              <Play className="h-3 w-3" />
              Play
            </button>
          ) : (
            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDark
                  ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  : "bg-[#ebe9e6] text-[#1a1a1a] hover:bg-[#e6e4e1]"
              }`}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="relative" style={{ height: chartHeight + 20 }}>
        {dataPoints.length === 0 ? (
          <div
            className={`flex items-center justify-center h-full text-sm ${
              isDark ? "text-zinc-600" : "text-[#8b7355]"
            }`}
          >
            Loading growth data...
          </div>
        ) : (
          <>
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-right pr-2" style={{ height: chartHeight }}>
              <span className={`text-[9px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>
                {formatNumber(yAxisMax)}
              </span>
              <span className={`text-[9px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>
                {formatNumber(yAxisMax / 2)}
              </span>
              <span className={`text-[9px] ${isDark ? "text-zinc-600" : "text-[#8b7355]"}`}>
                0
              </span>
            </div>

            <svg
              key={animationKey}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              className="w-full ml-6"
              style={{ height: chartHeight }}
            >
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isDark ? "#10b981" : "#059669"}
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor={isDark ? "#10b981" : "#059669"}
                    stopOpacity="0"
                  />
                </linearGradient>
                <clipPath id={`clipPath-${animationKey}`}>
                  <rect x="0" y="0" width={chartWidth} height={chartHeight}>
                    {isPlaying && (
                      <animate
                        attributeName="width"
                        from="0"
                        to={chartWidth}
                        dur="3s"
                        fill="freeze"
                      />
                    )}
                  </rect>
                </clipPath>
              </defs>

              <line
                x1={padding.left}
                y1={padding.top + innerHeight / 2}
                x2={padding.left + innerWidth}
                y2={padding.top + innerHeight / 2}
                stroke={isDark ? "#27272a" : "#e6e4e1"}
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />

              <path
                d={areaPath}
                fill="url(#growthGradient)"
                clipPath={isPlaying ? `url(#clipPath-${animationKey})` : undefined}
              />

              <path
                d={pathData}
                fill="none"
                stroke={isDark ? "#10b981" : "#059669"}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                clipPath={isPlaying ? `url(#clipPath-${animationKey})` : undefined}
              />

              {dataPoints.length > 0 && !isPlaying && (
                <circle
                  cx={padding.left + innerWidth}
                  cy={padding.top + innerHeight - (dataPoints[dataPoints.length - 1].cumulative / yAxisMax) * innerHeight}
                  r="3"
                  fill={isDark ? "#10b981" : "#059669"}
                />
              )}
            </svg>

            <div className="flex justify-between mt-2 ml-6 pr-1">
              {xLabels.map((label, i) => (
                <span
                  key={i}
                  className={`text-[10px] ${isDark ? "text-zinc-500" : "text-[#8b7355]"}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {dataPoints.length > 0 && (
        <div
          className={`mt-3 pt-3 border-t flex justify-between text-xs ${
            isDark ? "border-zinc-800 text-zinc-500" : "border-[#e6e4e1] text-[#8b7355]"
          }`}
        >
          <span>
            Total: <span className={isDark ? "text-zinc-300" : "text-[#1a1a1a]"}>
              {dataPoints[dataPoints.length - 1].cumulative.toLocaleString()}
            </span>
          </span>
          <span>
            Target: <span className={isDark ? "text-zinc-300" : "text-[#1a1a1a]"}>500k</span>
          </span>
        </div>
      )}
    </div>
  );
}

// Main Stats page component
export function StatsPage() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-[#0a0a0a] text-zinc-100" : "bg-[#f8f6f3] text-[#1a1a1a]"
      }`}
    >
      {/* Header */}
      <header
        className={`border-b ${
          isDark ? "border-zinc-800 bg-[#0a0a0a]" : "border-[#e6e4e1] bg-[#f8f6f3]"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className={`flex items-center gap-2 text-sm ${
                isDark
                  ? "text-zinc-400 hover:text-zinc-200"
                  : "text-[#8b7355] hover:text-[#1a1a1a]"
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <h1
              className={`text-lg font-semibold ${
                isDark ? "text-zinc-100" : "text-[#1a1a1a]"
              }`}
            >
              Platform Stats
            </h1>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? "tan" : "dark")}
            className={`p-2 rounded-md ${
              isDark
                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                : "text-[#8b7355] hover:text-[#1a1a1a] hover:bg-[#e6e4e1]"
            }`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Message milestone counter */}
          <MessageMilestoneCounter isDark={isDark} />

          {/* Growth chart */}
          <AnimatedGrowthChart isDark={isDark} />
        </div>

        {/* Info text */}
        <p
          className={`mt-8 text-center text-sm ${
            isDark ? "text-zinc-600" : "text-[#8b7355]"
          }`}
        >
          Real-time statistics from the OpenSync platform. Data updates automatically.
        </p>
      </main>
    </div>
  );
}
