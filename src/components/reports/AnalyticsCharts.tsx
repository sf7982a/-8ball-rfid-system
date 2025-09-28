import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  Scatter
} from 'recharts'

interface AnalyticsChartsProps {
  type: 'revenue-trend' | 'theft-trend' | 'accuracy-trend' | 'tier-breakdown' | 'tier-performance' | 'location-comparison' | 'variance-scatter'
  data: any[]
  height?: number
  className?: string
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  premium: '#8b5cf6',
  midTier: '#3b82f6',
  well: '#10b981'
}

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info
]

const BRIGHT_PIE_COLORS = [
  '#ef4444', // bright red
  '#f97316', // bright orange
  '#eab308', // bright yellow
  '#22c55e', // bright green
  '#3b82f6', // bright blue
  '#8b5cf6', // bright purple
  '#ec4899', // bright pink
  '#06b6d4'  // bright cyan
]

export function AnalyticsCharts({ type, data, height = 300, className }: AnalyticsChartsProps) {
  const chartProps = {
    width: '100%',
    height,
    data
  }

  switch (type) {
    case 'revenue-trend':
      return (
        <div className={className}>
          <ResponsiveContainer {...chartProps}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis yAxisId="revenue" orientation="left" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="bottles" orientation="right" stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Bottles Sold'
                ]}
              />
              <Legend />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                fill={COLORS.primary}
                fillOpacity={0.2}
                stroke={COLORS.primary}
                strokeWidth={3}
                name="Revenue"
              />
              <Line
                yAxisId="bottles"
                type="monotone"
                dataKey="bottles"
                stroke={COLORS.success}
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Bottles Sold"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )

    case 'theft-trend':
      return (
        <div className={className}>
          <ResponsiveContainer {...chartProps}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis yAxisId="incidents" orientation="left" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="value" orientation="right" stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any, name: string) => [
                  name === 'value' ? `$${value.toFixed(0)}` : value,
                  name === 'incidents' ? 'Incidents' : 'Value Lost'
                ]}
              />
              <Legend />
              <Bar
                yAxisId="incidents"
                dataKey="incidents"
                fill={COLORS.danger}
                name="Theft Incidents"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="value"
                type="monotone"
                dataKey="value"
                stroke={COLORS.warning}
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Value Lost ($)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )

    case 'accuracy-trend':
      return (
        <div className={className}>
          <ResponsiveContainer {...chartProps}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                domain={[80, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Accuracy']}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke={COLORS.success}
                strokeWidth={3}
                fill={COLORS.success}
                fillOpacity={0.3}
              />
              {/* Target line at 95% */}
              <Line
                type="monotone"
                dataKey={() => 95}
                stroke={COLORS.warning}
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )

    case 'tier-breakdown':
      return (
        <div className={className}>
          <ResponsiveContainer {...chartProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={height * 0.35}
                innerRadius={height * 0.15}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={14}
                fontWeight="bold"
              >
                {data.map((entry, index) => {
                  const color = entry.color || BRIGHT_PIE_COLORS[index % BRIGHT_PIE_COLORS.length]
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={color}
                      stroke={color}
                    />
                  )
                })}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
                formatter={(value: any, name: string) => [
                  `$${value.toLocaleString()}`,
                  name
                ]}
              />
              <Legend
                wrapperStyle={{ color: '#f3f4f6', fontSize: '12px' }}
                formatter={(value, entry) => (
                  <span style={{ color: '#f3f4f6', fontWeight: 'bold' }}>
                    {value}: ${(entry.payload?.value || 0).toLocaleString()}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )

    case 'tier-performance':
      return (
        <div className={className}>
          <ResponsiveContainer {...chartProps}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="tier" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="revenue" orientation="left" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="bottles" orientation="right" stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Revenue') return [`$${value.toLocaleString()}`, name]
                  if (name === 'Revenue per Bottle') return [`$${value.toFixed(0)}`, name]
                  return [value, name]
                }}
              />
              <Legend />
              <Bar
                yAxisId="revenue"
                dataKey="revenue"
                fill={COLORS.primary}
                name="Revenue"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="bottles"
                dataKey="bottles"
                fill={COLORS.secondary}
                name="Bottles"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenuePerBottle"
                stroke={COLORS.success}
                strokeWidth={3}
                dot={{ r: 6 }}
                name="Revenue per Bottle"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )

    case 'location-comparison':
      return (
        <div className={className}>
          <ResponsiveContainer {...chartProps}>
            <BarChart data={data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                formatter={(value: any, name: string) => {
                  if (name.includes('Revenue')) return [`$${value.toLocaleString()}`, name]
                  if (name.includes('%')) return [`${value.toFixed(1)}%`, name]
                  return [value.toFixed(1), name]
                }}
              />
              <Legend />
              <Bar
                dataKey="accuracy"
                fill={COLORS.success}
                name="Accuracy %"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="efficiency"
                fill={COLORS.primary}
                name="Efficiency %"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )

    case 'variance-scatter':
      return (
        <div className={className}>
          <ResponsiveContainer {...chartProps}>
            <ScatterChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="varianceAmount"
                stroke="#9ca3af"
                fontSize={12}
                name="Variance Amount"
              />
              <YAxis
                dataKey="confidenceScore"
                stroke="#9ca3af"
                fontSize={12}
                name="Confidence Score"
                domain={[0, 1]}
                tickFormatter={(value) => (value * 100).toFixed(0)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Confidence Score') return [`${(value * 100).toFixed(1)}%`, name]
                  return [value.toFixed(2), name]
                }}
              />
              <Scatter
                dataKey="confidenceScore"
                fill={COLORS.primary}
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )

    default:
      return (
        <div className={`${className} flex items-center justify-center h-64 text-muted-foreground`}>
          <p>Chart type "{type}" not implemented</p>
        </div>
      )
  }
}

// Custom tooltip components for enhanced interactivity
interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (value: any, name: string, props: any) => [string, string]
}

export function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="text-gray-300 font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${formatter ? formatter(entry.value, entry.name, entry)[0] : entry.value}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Utility function to format chart data
export function formatChartData(
  data: any[],
  xKey: string,
  yKey: string,
  options?: {
    dateFormat?: boolean
    currencyFormat?: boolean
    percentageFormat?: boolean
  }
) {
  return data.map(item => ({
    ...item,
    [xKey]: options?.dateFormat ? new Date(item[xKey]).toLocaleDateString() : item[xKey],
    [yKey]: options?.currencyFormat
      ? `$${item[yKey].toLocaleString()}`
      : options?.percentageFormat
      ? `${item[yKey].toFixed(1)}%`
      : item[yKey]
  }))
}