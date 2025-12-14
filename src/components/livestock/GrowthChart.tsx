import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface GrowthData {
    measurement_date: string
    weight_kg: number
}

interface GrowthChartProps {
    data: GrowthData[]
}

export function GrowthChart({ data }: GrowthChartProps) {
    const chartData = data
        .map((item) => ({
            date: format(new Date(item.measurement_date), 'dd/MM'),
            weight: item.weight_kg,
        }))
        .reverse() // Oldest first for chart

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                Belum ada data pertumbuhan
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                <YAxis
                    label={{ value: 'Berat (kg)', angle: -90, position: 'insideLeft' }}
                    style={{ fontSize: '12px' }}
                />
                <Tooltip
                    formatter={(value: number) => [`${value} kg`, 'Berat']}
                    labelStyle={{ color: '#000' }}
                />
                <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ fill: '#16a34a', r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
