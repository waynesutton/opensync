import { useMemo } from "react";
import { cn } from "../lib/utils";

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
