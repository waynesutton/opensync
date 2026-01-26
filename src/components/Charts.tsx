import { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { ChevronDown } from "lucide-react";

// Simple bar chart for usage data
interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

export function BarChart({
  data,
  height = 120,
  showLabels = true,
  formatValue = (v) => v.toLocaleString(),
  className,
}: BarChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-zinc-600 text-sm", className)} style={{ height }}>
        No data
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((item, i) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div
                className={cn(
                  "w-full rounded-t transition-all duration-200 group-hover:opacity-80",
                  item.color || "bg-zinc-700"
                )}
                style={{ height: `${barHeight}%`, minHeight: item.value > 0 ? 2 : 0 }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {item.label}: {formatValue(item.value)}
              </div>
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex gap-1 mt-2">
          {data.map((item, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[10px] text-zinc-600 truncate block">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Area/line chart for time series
interface AreaChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  showDots?: boolean;
  className?: string;
}

export function AreaChart({
  data,
  height = 100,
  color = "#3b82f6",
  showDots = false,
  className,
}: AreaChartProps) {
  const { points, areaPath } = useMemo(() => {
    if (data.length === 0) return { points: [], areaPath: "" };

    const max = Math.max(...data.map((d) => d.value), 1);
    const width = 100;
    const h = height - 20;
    const step = width / Math.max(data.length - 1, 1);

    const pts = data.map((d, i) => ({
      x: i * step,
      y: h - (d.value / max) * h,
      value: d.value,
      label: d.label,
    }));

    // Create smooth area path
    const linePath = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
    const area = `${linePath} L ${pts[pts.length - 1]?.x || 0} ${h} L 0 ${h} Z`;

    return { points: pts, areaPath: area };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-zinc-600 text-sm", className)} style={{ height }}>
        No data
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#gradient-${color.replace("#", "")})`}
        />
        {/* Line */}
        <path
          d={points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {/* Dots */}
        {showDots && points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />
        ))}
      </svg>
    </div>
  );
}

// Mini sparkline for inline usage
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = "#3b82f6",
  className,
}: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return "";
    const max = Math.max(...data, 1);
    const step = width / (data.length - 1);
    return data
      .map((v, i) => {
        const x = i * step;
        const y = height - (v / max) * height;
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" ");
  }, [data, width, height]);

  return (
    <svg width={width} height={height} className={className}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// Progress bar
interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  color = "bg-blue-500",
  showPercentage = true,
  className,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className={cn("space-y-1", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-xs">
          {label && <span className="text-zinc-400">{label}</span>}
          {showPercentage && <span className="text-zinc-500">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Donut/ring chart for distribution
interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  thickness?: number;
  className?: string;
}

export function DonutChart({
  data,
  size = 100,
  thickness = 12,
  className,
}: DonutChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  
  const segments = useMemo(() => {
    if (total === 0) return [];
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return data.map((item) => {
      const percentage = item.value / total;
      const length = circumference * percentage;
      const segment = {
        ...item,
        percentage,
        dashArray: `${length} ${circumference - length}`,
        dashOffset: -offset,
        radius,
      };
      offset += length;
      return segment;
    });
  }, [data, total, size, thickness]);

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-zinc-600 text-sm", className)} style={{ width: size, height: size }}>
        No data
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        {segments.map((segment, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={segment.radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={thickness}
            strokeDasharray={segment.dashArray}
            strokeDashoffset={segment.dashOffset}
            className="transition-all duration-300"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-light text-zinc-300">{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

// Stat card with optional sparkline
interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number[];
  trendColor?: string;
  icon?: React.ReactNode;
  className?: string;
  theme?: "dark" | "tan";
}

export function StatCard({
  label,
  value,
  subValue,
  trend,
  trendColor = "#3b82f6",
  icon,
  className,
  theme = "dark",
}: StatCardProps) {
  const isDark = theme === "dark";
  return (
    <div className={cn(
      "p-4 rounded-lg border",
      isDark ? "bg-zinc-900/50 border-zinc-800/50" : "bg-[#f5f3f0] border-[#e6e4e1]",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn("text-xs font-normal", isDark ? "text-zinc-500" : "text-[#6b6b6b]")}>{label}</p>
          <p className={cn("text-xl font-light", isDark ? "text-zinc-100" : "text-[#1a1a1a]")}>{value}</p>
          {subValue && <p className={cn("text-xs", isDark ? "text-zinc-600" : "text-[#8b7355]")}>{subValue}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon && <div className={isDark ? "text-zinc-600" : "text-[#8b7355]"}>{icon}</div>}
          {trend && trend.length > 1 && <Sparkline data={trend} color={trendColor} />}
        </div>
      </div>
    </div>
  );
}

// Data table for session list
interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedId?: string;
  getRowId: (item: T) => string;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  selectedId,
  getRowId,
  className,
  emptyMessage = "No data",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12 text-zinc-600 text-sm", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800/50">
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-[10px] font-normal text-zinc-500 uppercase tracking-wider"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const id = getRowId(item);
            return (
              <tr
                key={id}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "border-b border-zinc-800/30 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-zinc-800/30",
                  selectedId === id && "bg-zinc-800/50"
                )}
              >
                {columns.map((col, i) => (
                  <td key={i} className="px-3 py-2.5 text-sm text-zinc-300">
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Filter pill component
interface FilterPillProps {
  label: string;
  value?: string;
  onClear?: () => void;
  active?: boolean;
  className?: string;
}

export function FilterPill({ label, value, onClear, active, className }: FilterPillProps) {
  return (
    <button
      onClick={onClear}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
        active
          ? "bg-zinc-700 text-zinc-200"
          : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400",
        className
      )}
    >
      <span className="font-normal">{label}</span>
      {value && <span className="text-zinc-400">{value}</span>}
      {active && onClear && (
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      )}
    </button>
  );
}

// Stacked bar chart for consumption breakdown
interface StackedBarChartProps {
  data: Array<{
    label: string;
    segments: Array<{ value: number; color: string; label: string }>;
  }>;
  height?: number;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
  theme?: "dark" | "tan";
  className?: string;
}

export function StackedBarChart({
  data,
  height = 200,
  showLabels = true,
  formatValue = (v) => v.toLocaleString(),
  theme = "dark",
  className,
}: StackedBarChartProps) {
  const isDark = theme === "dark";
  const maxValue = useMemo(() => {
    return Math.max(
      ...data.map((d) => d.segments.reduce((sum, s) => sum + s.value, 0)),
      1
    );
  }, [data]);

  if (data.length === 0) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center text-sm",
          isDark ? "text-zinc-600" : "text-[#8b7355]",
          className
        )} 
        style={{ height }}
      >
        No data
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((item, i) => {
          const total = item.segments.reduce((sum, s) => sum + s.value, 0);
          const barHeight = Math.max((total / maxValue) * 100, total > 0 ? 5 : 0);
          
          return (
            <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
              <div
                className="w-full flex flex-col-reverse rounded-t overflow-hidden"
                style={{ height: `${barHeight}%`, minHeight: total > 0 ? 8 : 0 }}
              >
                {item.segments.map((segment, j) => {
                  const segmentHeight = total > 0 ? (segment.value / total) * 100 : 0;
                  return (
                    <div
                      key={j}
                      className={cn("w-full transition-opacity group-hover:opacity-80")}
                      style={{ 
                        height: `${segmentHeight}%`, 
                        backgroundColor: segment.color,
                        minHeight: segment.value > 0 ? 4 : 0,
                      }}
                    />
                  );
                })}
              </div>
              {/* Tooltip */}
              <div className={cn(
                "absolute bottom-full mb-2 px-3 py-2 rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg",
                isDark ? "bg-zinc-800 border border-zinc-700 text-zinc-200" : "bg-[#f5f3f0] border border-[#e6e4e1] text-[#1a1a1a]"
              )}>
                <div className={cn("font-medium mb-1", isDark ? "text-zinc-100" : "text-[#1a1a1a]")}>{item.label}</div>
                {item.segments.map((seg, j) => (
                  <div key={j} className="flex items-center gap-2 py-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className={isDark ? "text-zinc-400" : "text-[#6b6b6b]"}>{seg.label}:</span>
                    <span className={isDark ? "text-zinc-200" : "text-[#1a1a1a]"}>{formatValue(seg.value)}</span>
                  </div>
                ))}
                <div className={cn("border-t mt-1 pt-1", isDark ? "border-zinc-700" : "border-[#e6e4e1]")}>
                  <span className={isDark ? "text-zinc-300" : "text-[#1a1a1a]"}>Total: {formatValue(total)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex gap-1 mt-2">
          {data.map((item, i) => (
            <div key={i} className="flex-1 text-center">
              <span className={cn("text-[10px] truncate block", isDark ? "text-zinc-600" : "text-[#8b7355]")}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Usage credit bar component
interface UsageCreditBarProps {
  included: number;
  used: number;
  onDemand: number;
  theme?: "dark" | "tan";
  className?: string;
}

export function UsageCreditBar({
  included,
  used,
  onDemand,
  theme = "dark",
  className,
}: UsageCreditBarProps) {
  const isDark = theme === "dark";
  const total = included + onDemand;
  const includedPercent = total > 0 ? (Math.min(used, included) / total) * 100 : 0;
  const onDemandPercent = total > 0 ? (onDemand / total) * 100 : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isDark ? "bg-blue-500/20" : "bg-[#EB5601]/20"
          )}>
            <svg className={cn("w-4 h-4", isDark ? "text-blue-400" : "text-[#EB5601]")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-[#6b6b6b]")}>Included Credit</p>
            <p className={cn("text-sm font-medium", isDark ? "text-zinc-200" : "text-[#1a1a1a]")}>
              ${used.toFixed(2)} / ${included.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-[#6b6b6b]")}>On-Demand Charges</p>
          <div className="flex items-center gap-2">
            <p className={cn("text-sm font-medium", isDark ? "text-zinc-200" : "text-[#1a1a1a]")}>
              ${onDemand.toFixed(2)}
            </p>
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
              isDark ? "bg-zinc-700 text-zinc-300" : "bg-[#ebe9e6] text-[#6b6b6b]"
            )}>
              $
            </div>
          </div>
        </div>
      </div>
      <div className={cn("h-2 rounded-full overflow-hidden flex", isDark ? "bg-zinc-800" : "bg-[#e6e4e1]")}>
        <div 
          className={cn("h-full transition-all", isDark ? "bg-blue-500" : "bg-[#EB5601]")}
          style={{ width: `${includedPercent}%` }}
        />
        <div 
          className={cn("h-full transition-all", isDark ? "bg-purple-500" : "bg-[#8b7355]")}
          style={{ width: `${onDemandPercent}%` }}
        />
      </div>
    </div>
  );
}

// Chart dropdown component for consistent styling
interface ChartDropdownProps {
  value?: string | number;
  onChange: (v?: string | number) => void;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  theme?: "dark" | "tan";
  className?: string;
}

function ChartDropdown({
  value,
  onChange,
  options,
  placeholder = "All",
  theme = "dark",
  className,
}: ChartDropdownProps) {
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const displayValue = options.find((opt) => opt.value === value)?.label || placeholder;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors min-w-[100px] justify-between",
          isDark
            ? "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 text-zinc-300"
            : "bg-[#ebe9e6] border-[#e6e4e1] hover:border-[#c9c5bf] text-[#1a1a1a]"
        )}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1 min-w-full max-h-[200px] overflow-y-auto rounded-md border shadow-lg z-50 py-0.5",
            isDark
              ? "bg-[#161616] border-zinc-800"
              : "bg-[#faf8f5] border-[#e6e4e1]"
          )}
        >
          {/* All/placeholder option */}
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              setIsOpen(false);
            }}
            className={cn(
              "w-full px-3 py-1.5 text-left text-xs transition-colors",
              !value
                ? isDark
                  ? "bg-zinc-800 text-zinc-100"
                  : "bg-[#ebe9e6] text-[#1a1a1a]"
                : isDark
                  ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  : "text-[#6b6b6b] hover:bg-[#ebe9e6]/50 hover:text-[#1a1a1a]"
            )}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-1.5 text-left text-xs transition-colors truncate",
                opt.value === value
                  ? isDark
                    ? "bg-zinc-800 text-zinc-100"
                    : "bg-[#ebe9e6] text-[#1a1a1a]"
                  : isDark
                    ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    : "text-[#6b6b6b] hover:bg-[#ebe9e6]/50 hover:text-[#1a1a1a]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Consumption breakdown component (main export for dashboard)
interface ConsumptionBreakdownProps {
  dailyStats: Array<{
    date: string;
    sessions: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    durationMs: number;
  }>;
  modelStats: Array<{
    model: string;
    sessions: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  }>;
  projectStats: Array<{
    project: string;
    sessions: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  }>;
  summaryStats: {
    totalCost: number;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    totalSessions: number;
  } | null;
  theme?: "dark" | "tan";
  className?: string;
}

export function ConsumptionBreakdown({
  dailyStats,
  modelStats,
  projectStats,
  summaryStats,
  theme = "dark",
  className,
}: ConsumptionBreakdownProps) {
  const isDark = theme === "dark";
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [isCumulative, setIsCumulative] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [selectedModel, setSelectedModel] = useState<string | undefined>();
  const [chartType, setChartType] = useState<"tokens" | "cost">("tokens");
  const [dateRangeDays, setDateRangeDays] = useState<number>(30);

  // Color palette for stacked bars
  const colors = isDark
    ? ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]
    : ["#EB5601", "#8b7355", "#d14a01", "#6b6b6b", "#a67c52", "#4a4a4a", "#c9744a", "#5c5c5c"];

  // Filter daily stats by selected date range
  const filteredDailyStats = useMemo(() => {
    if (dailyStats.length === 0) return [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRangeDays);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];
    return dailyStats.filter((d) => d.date >= cutoffStr);
  }, [dailyStats, dateRangeDays]);

  // Filter model/project stats based on selection
  const filteredModelStats = useMemo(() => {
    if (!selectedModel) return modelStats;
    return modelStats.filter((m) => m.model === selectedModel);
  }, [modelStats, selectedModel]);

  const filteredProjectStats = useMemo(() => {
    if (!selectedProject) return projectStats;
    return projectStats.filter((p) => p.project === selectedProject);
  }, [projectStats, selectedProject]);

  // Calculate filtered summary based on selections
  const filteredSummary = useMemo(() => {
    // If both filters applied, use the intersection logic
    if (selectedModel && selectedProject) {
      // Use the more restrictive filter (model stats)
      const model = modelStats.find((m) => m.model === selectedModel);
      if (model) {
        return {
          totalTokens: model.totalTokens,
          promptTokens: model.promptTokens || 0,
          completionTokens: model.completionTokens || 0,
          totalCost: model.cost,
          sessions: model.sessions,
        };
      }
    }
    if (selectedModel) {
      const model = modelStats.find((m) => m.model === selectedModel);
      if (model) {
        return {
          totalTokens: model.totalTokens,
          promptTokens: model.promptTokens || 0,
          completionTokens: model.completionTokens || 0,
          totalCost: model.cost,
          sessions: model.sessions,
        };
      }
    }
    if (selectedProject) {
      const project = projectStats.find((p) => p.project === selectedProject);
      if (project) {
        return {
          totalTokens: project.totalTokens,
          promptTokens: project.promptTokens || 0,
          completionTokens: project.completionTokens || 0,
          totalCost: project.cost,
          sessions: project.sessions,
        };
      }
    }
    return summaryStats;
  }, [summaryStats, modelStats, projectStats, selectedModel, selectedProject]);

  // Process data based on view mode
  const processedData = useMemo(() => {
    if (filteredDailyStats.length === 0) return [];

    // Group by period
    const grouped: Record<string, typeof filteredDailyStats> = {};
    
    filteredDailyStats.forEach((d) => {
      let key = d.date;
      if (viewMode === "weekly") {
        const date = new Date(d.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else if (viewMode === "monthly") {
        key = d.date.substring(0, 7);
      }
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(d);
    });

    // Aggregate each period
    const aggregated = Object.entries(grouped).map(([period, items]) => {
      const totals = items.reduce(
        (acc, item) => ({
          sessions: acc.sessions + item.sessions,
          promptTokens: acc.promptTokens + item.promptTokens,
          completionTokens: acc.completionTokens + item.completionTokens,
          totalTokens: acc.totalTokens + item.totalTokens,
          cost: acc.cost + item.cost,
          durationMs: acc.durationMs + item.durationMs,
        }),
        { sessions: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, durationMs: 0 }
      );
      return { period, ...totals };
    });

    // Sort by period
    aggregated.sort((a, b) => a.period.localeCompare(b.period));

    // Apply cumulative if needed
    if (isCumulative) {
      let cumSessions = 0;
      let cumPrompt = 0;
      let cumCompletion = 0;
      let cumTokens = 0;
      let cumCost = 0;
      let cumDuration = 0;
      
      return aggregated.map((d) => {
        cumSessions += d.sessions;
        cumPrompt += d.promptTokens;
        cumCompletion += d.completionTokens;
        cumTokens += d.totalTokens;
        cumCost += d.cost;
        cumDuration += d.durationMs;
        return {
          ...d,
          sessions: cumSessions,
          promptTokens: cumPrompt,
          completionTokens: cumCompletion,
          totalTokens: cumTokens,
          cost: cumCost,
          durationMs: cumDuration,
        };
      });
    }

    return aggregated;
  }, [filteredDailyStats, viewMode, isCumulative]);

  // Format period label
  const formatPeriodLabel = (period: string) => {
    if (viewMode === "monthly") {
      const [year, month] = period.split("-");
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en", { month: "short" });
    }
    const date = new Date(period);
    if (viewMode === "weekly") {
      return `${date.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
    }
    return date.toLocaleDateString("en", { month: "short", day: "numeric" });
  };

  // Build chart data - either tokens or cost, filtered by selection
  const chartData = useMemo(() => {
    const statsToUse = selectedProject ? filteredProjectStats : filteredModelStats;
    const dataSlice = processedData.slice(-30);
    
    if (chartType === "tokens") {
      // Token usage chart - show prompt vs completion tokens
      return dataSlice.map((d) => ({
        label: formatPeriodLabel(d.period),
        segments: [
          {
            label: "Prompt Tokens",
            value: d.promptTokens,
            color: isDark ? "#3b82f6" : "#EB5601",
          },
          {
            label: "Completion Tokens",
            value: d.completionTokens,
            color: isDark ? "#22c55e" : "#8b7355",
          },
        ],
      }));
    }
    
    // Cost breakdown by model/project
    return dataSlice.map((d) => ({
      label: formatPeriodLabel(d.period),
      segments: statsToUse.slice(0, 6).map((s, i) => {
        const key = "model" in s ? s.model : s.project;
        const statCost = s.cost;
        const totalStat = filteredSummary?.totalCost || summaryStats?.totalCost || 1;
        return {
          label: key,
          value: totalStat > 0 ? (d.cost * statCost / totalStat) : d.cost / statsToUse.length,
          color: colors[i % colors.length],
        };
      }),
    }));
  }, [processedData, filteredModelStats, filteredProjectStats, selectedProject, chartType, filteredSummary, summaryStats, colors, isDark]);

  // Date range display based on filtered data
  const dateRange = useMemo(() => {
    if (filteredDailyStats.length === 0) return "No data";
    const dates = filteredDailyStats.map((d) => d.date).sort();
    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    return `${start.toLocaleDateString("en", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
  }, [filteredDailyStats]);

  // Date range options
  const dateRangeOptions = [
    { value: 7, label: "Last 7 days" },
    { value: 14, label: "Last 14 days" },
    { value: 30, label: "Last 30 days" },
    { value: 60, label: "Last 60 days" },
    { value: 90, label: "Last 90 days" },
  ];

  // Calculate usage metrics using filtered summary
  const includedCredit = 20.0;
  const totalCost = filteredSummary?.totalCost || 0;
  const usedCredit = Math.min(totalCost, includedCredit);
  const onDemandCharges = Math.max(totalCost - includedCredit, 0);

  // Stats to display in table based on selection
  const tableStats = selectedProject ? filteredProjectStats : filteredModelStats;

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden",
      isDark ? "bg-zinc-900/30 border-zinc-800/50" : "bg-[#f5f3f0] border-[#e6e4e1]",
      className
    )}>
      {/* Header */}
      <div className={cn("px-4 py-3 border-b", isDark ? "border-zinc-800/50" : "border-[#e6e4e1]")}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className={cn("text-sm font-medium", isDark ? "text-zinc-100" : "text-[#1a1a1a]")}>
            Usage Overview
          </h3>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date range selector */}
            <ChartDropdown
              value={dateRangeDays}
              onChange={(v) => setDateRangeDays(Number(v) || 30)}
              options={dateRangeOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
              placeholder="Last 30 days"
              theme={theme}
            />
            
            {/* Date range display */}
            <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-[#8b7355]")}>
              {dateRange}
            </span>
            
            {/* Project filter */}
            <ChartDropdown
              value={selectedProject}
              onChange={(v) => setSelectedProject(v as string | undefined)}
              options={projectStats.slice(0, 10).map((p) => ({ value: p.project, label: p.project }))}
              placeholder="All Projects"
              theme={theme}
            />
            
            {/* Model filter */}
            <ChartDropdown
              value={selectedModel}
              onChange={(v) => setSelectedModel(v as string | undefined)}
              options={modelStats.slice(0, 10).map((m) => ({ value: m.model, label: m.model }))}
              placeholder="All Models"
              theme={theme}
            />
          </div>
        </div>
      </div>

      {/* Credit usage bar */}
      <div className={cn("px-4 py-4 border-b", isDark ? "border-zinc-800/50" : "border-[#e6e4e1]")}>
        <UsageCreditBar
          included={includedCredit}
          used={usedCredit}
          onDemand={onDemandCharges}
          theme={theme}
        />
      </div>

      {/* Chart section */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h4 className={cn("text-xs font-normal", isDark ? "text-zinc-500" : "text-[#6b6b6b]")}>
              Consumption Breakdown
            </h4>
            
            {/* Chart type toggle */}
            <div className={cn(
              "flex items-center rounded-md p-0.5 border",
              isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-[#ebe9e6] border-[#e6e4e1]"
            )}>
              <button
                onClick={() => setChartType("tokens")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  chartType === "tokens"
                    ? isDark ? "bg-zinc-700 text-zinc-100" : "bg-white text-[#1a1a1a] shadow-sm"
                    : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-[#6b6b6b] hover:text-[#1a1a1a]"
                )}
              >
                Tokens
              </button>
              <button
                onClick={() => setChartType("cost")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  chartType === "cost"
                    ? isDark ? "bg-zinc-700 text-zinc-100" : "bg-white text-[#1a1a1a] shadow-sm"
                    : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-[#6b6b6b] hover:text-[#1a1a1a]"
                )}
              >
                Cost
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className={cn(
              "flex items-center rounded-md p-0.5 border",
              isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-[#ebe9e6] border-[#e6e4e1]"
            )}>
              {(["daily", "weekly", "monthly"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-colors capitalize",
                    viewMode === mode
                      ? isDark ? "bg-zinc-700 text-zinc-100" : "bg-white text-[#1a1a1a] shadow-sm"
                      : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-[#6b6b6b] hover:text-[#1a1a1a]"
                  )}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Cumulative toggle */}
            <label className={cn(
              "flex items-center gap-2 text-xs cursor-pointer",
              isDark ? "text-zinc-400" : "text-[#6b6b6b]"
            )}>
              <input
                type="checkbox"
                checked={isCumulative}
                onChange={(e) => setIsCumulative(e.target.checked)}
                className={cn(
                  "w-4 h-4 rounded border focus:ring-offset-0",
                  isDark ? "bg-zinc-800 border-zinc-600" : "bg-white border-[#e6e4e1]"
                )}
              />
              Cumulative
            </label>
          </div>
        </div>

        {/* Stacked bar chart */}
        <StackedBarChart
          data={chartData}
          height={180}
          formatValue={chartType === "tokens" ? (v) => `${(v / 1000).toFixed(1)}K` : (v) => `$${v.toFixed(2)}`}
          theme={theme}
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {chartType === "tokens" ? (
            <>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: isDark ? "#3b82f6" : "#EB5601" }} />
                <span className={isDark ? "text-zinc-400" : "text-[#6b6b6b]"}>Prompt Tokens</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: isDark ? "#22c55e" : "#8b7355" }} />
                <span className={isDark ? "text-zinc-400" : "text-[#6b6b6b]"}>Completion Tokens</span>
              </div>
            </>
          ) : (
            tableStats.slice(0, 6).map((s, i) => (
              <div key={"model" in s ? s.model : s.project} className="flex items-center gap-1.5 text-xs">
                <span 
                  className="w-2.5 h-2.5 rounded-sm" 
                  style={{ backgroundColor: colors[i % colors.length] }} 
                />
                <span className={isDark ? "text-zinc-400" : "text-[#6b6b6b]"}>{"model" in s ? s.model : s.project}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Usage table */}
      <div className={cn("border-t", isDark ? "border-zinc-800/50" : "border-[#e6e4e1]")}>
        <table className="w-full">
          <thead>
            <tr className={cn("border-b text-[10px] uppercase tracking-wider", isDark ? "border-zinc-800/30 text-zinc-600" : "border-[#e6e4e1] text-[#8b7355]")}>
              <th className="px-4 py-2 text-left font-normal">{selectedProject ? "Project" : "Model"}</th>
              <th className="px-4 py-2 text-right font-normal">Prompt</th>
              <th className="px-4 py-2 text-right font-normal">Completion</th>
              <th className="px-4 py-2 text-right font-normal">Total</th>
              <th className="px-4 py-2 text-right font-normal">Cost</th>
            </tr>
          </thead>
          <tbody>
            {tableStats.slice(0, 5).map((s, i) => {
              const key = "model" in s ? s.model : s.project;
              const promptTokens = (s as any).promptTokens || 0;
              const completionTokens = (s as any).completionTokens || 0;
              return (
                <tr key={key} className={cn("border-b transition-colors", isDark ? "border-zinc-800/30 hover:bg-zinc-800/30" : "border-[#e6e4e1] hover:bg-[#ebe9e6]")}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: colors[i % colors.length] }} 
                      />
                      <span className={cn("text-sm truncate max-w-[150px]", isDark ? "text-zinc-300" : "text-[#1a1a1a]")}>{key}</span>
                    </div>
                  </td>
                  <td className={cn("px-4 py-2.5 text-sm text-right", isDark ? "text-zinc-400" : "text-[#6b6b6b]")}>
                    {(promptTokens / 1000).toFixed(1)}K
                  </td>
                  <td className={cn("px-4 py-2.5 text-sm text-right", isDark ? "text-zinc-400" : "text-[#6b6b6b]")}>
                    {(completionTokens / 1000).toFixed(1)}K
                  </td>
                  <td className={cn("px-4 py-2.5 text-sm text-right", isDark ? "text-zinc-400" : "text-[#6b6b6b]")}>
                    {(s.totalTokens / 1000).toFixed(1)}K
                  </td>
                  <td className={cn("px-4 py-2.5 text-sm text-right font-medium", isDark ? "text-zinc-200" : "text-[#1a1a1a]")}>
                    ${s.cost.toFixed(4)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className={isDark ? "bg-zinc-800/20" : "bg-[#ebe9e6]/50"}>
              <td className={cn("px-4 py-2.5 text-sm font-medium", isDark ? "text-zinc-200" : "text-[#1a1a1a]")}>
                Total
              </td>
              <td className={cn("px-4 py-2.5 text-sm text-right", isDark ? "text-zinc-400" : "text-[#6b6b6b]")}>
                {((filteredSummary?.promptTokens || 0) / 1000).toFixed(1)}K
              </td>
              <td className={cn("px-4 py-2.5 text-sm text-right", isDark ? "text-zinc-400" : "text-[#6b6b6b]")}>
                {((filteredSummary?.completionTokens || 0) / 1000).toFixed(1)}K
              </td>
              <td className={cn("px-4 py-2.5 text-sm text-right", isDark ? "text-zinc-400" : "text-[#6b6b6b]")}>
                {((filteredSummary?.totalTokens || 0) / 1000).toFixed(1)}K
              </td>
              <td className={cn("px-4 py-2.5 text-sm text-right font-medium", isDark ? "text-zinc-100" : "text-[#1a1a1a]")}>
                ${(filteredSummary?.totalCost || 0).toFixed(4)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
