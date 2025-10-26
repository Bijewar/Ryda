"use client"

import * as React from "react"
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  TooltipProps,
  Legend as RechartsLegend,
  LegendProps,
} from "recharts"

import { cn } from "../../lib/utils"

// Chart theme
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within <ChartContainer />")
  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ReactNode
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn("flex aspect-video justify-center text-xs", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

// Chart style helper
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([_, cfg]) => cfg.theme || cfg.color)
  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, cfg]) => {
    const color = cfg.theme?.[theme as keyof typeof cfg.theme] || cfg.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`)
          .join("\n"),
      }}
    />
  )
}

// Custom tooltip content
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipProps<any, any> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    labelKey?: string
  }
>((props, ref) => {
  const { config } = useChart()
  const {
    active,
    payload,
    label,
    className,
    hideLabel = false,
    hideIndicator = false,
    indicator = "dot",
    labelKey,
    labelFormatter,
    labelClassName,
    formatter,
    color,
  } = props as any

  if (!active || !payload?.length) return null

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {payload.map((item, index) => {
        const key = `${labelKey || item.dataKey || item.name || "value"}`
        const itemConfig = config[key]
        const indicatorColor = color || item.color || item.payload?.fill

        return (
          <div
            key={key + index}
            className={cn(
              "flex w-full flex-wrap items-center gap-2",
              indicator === "dot" && "items-center"
            )}
          >
            {!hideIndicator && (
              <div
                className={cn(
                  "shrink-0 rounded-[2px]",
                  indicator === "dot" ? "h-2.5 w-2.5" : "w-1"
                )}
                style={{ backgroundColor: indicatorColor } as React.CSSProperties}
              />
            )}
            <div className="flex flex-1 justify-between">
              <span>{itemConfig?.label || item.name}</span>
              {item.value && (
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {item.value.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartTooltip = RechartsTooltip
const ChartLegend = RechartsLegend

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartStyle }
