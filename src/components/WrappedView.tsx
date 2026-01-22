import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { WrappedTemplate } from "./WrappedTemplates";
// import { TEMPLATE_COUNT } from "./WrappedTemplates"; // Uncomment when re-enabling rotate button
import { useTheme, getThemeClasses } from "../lib/theme";
import { cn } from "../lib/utils";
import {
  Download,
  // RotateCcw, // Uncomment when re-enabling rotate design button
  Clock,
  Loader2,
} from "lucide-react";

// Countdown timer hook
function useCountdown(targetTime: number) {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(targetTime - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const hours = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
  const seconds = Math.max(0, Math.floor((timeLeft % (1000 * 60)) / 1000));

  return { hours, minutes, seconds, isExpired: timeLeft <= 0 };
}

// Format countdown display
function formatCountdown(hours: number, minutes: number, seconds: number): string {
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function WrappedView() {
  const { theme } = useTheme();
  const t = getThemeClasses(theme);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [testDesignIndex] = useState<number | null>(null); // setTestDesignIndex commented out - uncomment when re-enabling rotate button

  // Fetch wrapped data and stats
  const todayWrapped = useQuery(api.wrapped.getTodayWrapped);
  const fallbackStats = useQuery(api.wrapped.getWrappedStats);
  const countdownInfo = useQuery(api.wrapped.getCountdownInfo);

  // Determine what to display
  const hasAIImage = todayWrapped?.imageUrl;
  const stats = todayWrapped?.stats || fallbackStats;
  const designIndex = testDesignIndex ?? todayWrapped?.designIndex ?? new Date().getDate() % 10;
  const date = todayWrapped?.date || countdownInfo?.currentDate || new Date().toISOString().split("T")[0];

  // Countdown to next generation
  const nextGenTime = todayWrapped?.nextGenerationAt || countdownInfo?.nextGenerationAt || Date.now() + 24 * 60 * 60 * 1000;
  const countdown = useCountdown(nextGenTime);

  // Rotate design for testing - uncomment when re-enabling rotate button
  // const handleRotate = useCallback(() => {
  //   setTestDesignIndex((prev) => ((prev ?? designIndex) + 1) % TEMPLATE_COUNT);
  // }, [designIndex]);

  // Download as PNG using html2canvas (9:16 portrait: 675x1200)
  const handleDownload = useCallback(async () => {
    if (!exportRef.current) return;

    setIsExporting(true);
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;

      // Capture the hidden export container (no transforms)
      const canvas = await html2canvas(exportRef.current, {
        scale: 1,
        useCORS: true,
        backgroundColor: null,
        width: 675,
        height: 1200,
        logging: false,
      });

      // Create download link
      const link = document.createElement("a");
      link.download = `opensync-wrapped-${date}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to export:", error);
    } finally {
      setIsExporting(false);
    }
  }, [date]);

  // Loading state
  if (stats === undefined) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className={cn("w-8 h-8 animate-spin", t.textMuted)} />
      </div>
    );
  }

  // No data state
  if (!stats || (stats.totalTokens === 0 && stats.totalMessages === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center px-4">
        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", t.bgSecondary)}>
          <Clock className={cn("w-8 h-8", t.textMuted)} />
        </div>
        <h3 className={cn("text-lg font-semibold mb-2", t.textPrimary)}>
          No Activity Yet
        </h3>
        <p className={cn("max-w-md", t.textMuted)}>
          Start syncing your coding sessions to see your Daily Wrapped. Activity from the last 24 hours will appear here.
        </p>
        <div className={cn("mt-6 text-sm", t.textSubtle)}>
          Next generation at 9:30 AM PT
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 lg:p-8">
      {/* Hidden export container - positioned off-screen, no transforms */}
      <div
        ref={exportRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: "675px",
          height: "1200px",
          overflow: "hidden",
        }}
      >
        <WrappedTemplate
          designIndex={designIndex}
          stats={stats}
          date={date}
        />
      </div>

      {/* Wrapped Preview */}
      <div className="flex-1 flex flex-col items-center">
        {/* Countdown */}
        <div className={cn("flex items-center gap-2 mb-4 text-sm", t.textMuted)}>
          <Clock className="w-4 h-4" />
          <span>
            Next wrapped in{" "}
            <span className={cn("font-mono font-medium", t.textPrimary)}>
              {formatCountdown(countdown.hours, countdown.minutes, countdown.seconds)}
            </span>
          </span>
        </div>

        {/* Wrapped Image Container - 9:16 portrait aspect ratio (675x1200) */}
        <div
          className={cn("relative rounded-2xl overflow-hidden shadow-2xl", t.bgSecondary)}
          style={{ width: "min(100%, 337px)", aspectRatio: "9/16" }}
        >
          {/* AI Generated Image */}
          {hasAIImage && testDesignIndex === null ? (
            <img
              src={todayWrapped.imageUrl!}
              alt="Daily Sync Wrapped"
              className="w-full h-full object-cover"
            />
          ) : (
            /* CSS Fallback Template - 675x1200 rendered at 0.5 scale for preview */
            <div
              style={{
                width: "675px",
                height: "1200px",
                transform: "scale(0.5)",
                transformOrigin: "top left",
              }}
            >
              <WrappedTemplate
                designIndex={designIndex}
                stats={stats}
                date={date}
              />
            </div>
          )}

          {/* Exporting overlay */}
          {isExporting && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Design info - hidden for production
        <div className={cn("mt-4 text-xs", t.textSubtle)}>
          Design {designIndex + 1} of {TEMPLATE_COUNT}
          {testDesignIndex !== null && " (testing)"}
        </div>
        */}
      </div>

      {/* Controls */}
      <div className="lg:w-80 space-y-6">
        {/* Stats Summary */}
        <div className={cn("rounded-xl p-6 shadow-sm border", t.bgCard, t.border)}>
          <h3 className={cn("text-sm font-medium mb-4", t.textMuted)}>
            Past 24 Hours
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={t.textMuted}>Total Tokens</span>
              <span className={cn("font-semibold", t.textPrimary)}>
                {stats.totalTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>Prompt</span>
              <span className={cn("font-medium", t.textSecondary)}>
                {stats.promptTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>Completion</span>
              <span className={cn("font-medium", t.textSecondary)}>
                {stats.completionTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>Messages</span>
              <span className={cn("font-semibold", t.textPrimary)}>
                {stats.totalMessages}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={t.textMuted}>Sessions</span>
              <span className={cn("font-semibold", t.textPrimary)}>
                {(stats as { sessionCount?: number }).sessionCount ?? 0}
              </span>
            </div>
          </div>

          {/* Top Models */}
          {stats.topModels.length > 0 && (
            <div className={cn("mt-4 pt-4 border-t", t.border)}>
              <h4 className={cn("text-xs font-medium mb-2", t.textMuted)}>
                Top Models
              </h4>
              <div className="space-y-1">
                {stats.topModels.slice(0, 3).map((m: { model: string; tokens: number }) => (
                  <div key={m.model} className="flex justify-between text-sm">
                    <span className={cn("truncate max-w-[60%]", t.textMuted)}>
                      {m.model}
                    </span>
                    <span className={t.textSubtle}>
                      {((m.tokens / stats.totalTokens) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Providers */}
          {stats.topProviders.length > 0 && (
            <div className={cn("mt-4 pt-4 border-t", t.border)}>
              <h4 className={cn("text-xs font-medium mb-2", t.textMuted)}>
                Providers
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats.topProviders.map((p: { provider: string; tokens: number }) => (
                  <span
                    key={p.provider}
                    className={cn("px-2 py-1 text-xs rounded-full capitalize", t.bgSecondary, t.textMuted)}
                  >
                    {p.provider}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50",
              theme === "dark"
                ? "bg-white text-zinc-900 hover:bg-zinc-100"
                : "bg-[#1a1a1a] text-white hover:bg-[#333]"
            )}
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            Download PNG
          </button>

          {/* 
            ROTATE DESIGN BUTTON - Commented out for production
            Uncomment to test all 10 design templates during development.
          <button
            onClick={handleRotate}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-xl font-medium transition-colors",
              t.border,
              t.textMuted,
              t.bgHover
            )}
          >
            <RotateCcw className="w-5 h-5" />
            Rotate Design ({(testDesignIndex ?? designIndex) + 1}/{TEMPLATE_COUNT})
          </button>
          */}
        </div>

        {/* Info */}
        <div className={cn("text-xs text-center", t.textSubtle)}>
          Wrapped images are generated daily at 9:30 AM PT
          <br />
          and show your past 24 hours of activity.
        </div>
      </div>
    </div>
  );
}
