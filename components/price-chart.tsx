"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { SeatPlan } from "@/types/seat-plan"
import { PricePoint } from "@/components/pricing-picker"

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value}`;
};

export function getSeatCountsByPrice(seatPlan: SeatPlan | null) {
    if (!seatPlan) return [];
    
    // 1) Build a simple counts map
    const counts: Record<number, number> = {};
  
    for (const section of seatPlan.sections) {
      for (const row of section.rows) {
        for (const seat of row.seats) {
          const price = seat.price ?? 0;         // null → 0
          counts[price] = (counts[price] || 0) + 1;
        }
      }
    }
  
    // 2) Transform into [{ price: 98, count: 100 }, …]
    return Object.entries(counts).map(([price, count]) => ({
      price: Number(price),
      totalValue: Number(price) * count,
      count,
    }));
  }

type ChartDataItem = {
    price: number;
    count: number;
    totalValue: number;
    color: string;
}

interface PriceChartProps {
    data: SeatPlan | null;
    pricePoints: PricePoint[];
}

export function PriceChart({ data, pricePoints }: PriceChartProps) {
    if (!data) return null;
    
    // Create a map of all possible prices from pricePoints
    const priceMap = new Map(pricePoints.map(p => [p.price, p.color]));
    
    // Get counts and ensure all prices are represented
    const counts = getSeatCountsByPrice(data);
    const allPrices = Array.from(new Set([
        ...counts.map(c => c.price),
        ...pricePoints.map(p => p.price)
    ])).sort((a, b) => a - b);

    const chartData = allPrices.map(price => {
        const count = counts.find(c => c.price === price)?.count || 0;
        return {
            price,
            count,
            totalValue: price * count,
            color: pricePoints.find(p => p.price === price)?.color || 'var(--color-desktop)'
        };
    }) as ChartDataItem[];

    const totalValue = chartData.reduce((acc, curr) => acc + curr.totalValue, 0);

    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        }
        return `$${value}`;
    };

    return (
    <Card>
      <CardHeader>
        <CardTitle>Price Distribution</CardTitle>
        <CardDescription>Total Value of Seats: {formatCurrency(Number(totalValue))}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="price"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: number) => `$${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white shadow-md p-2 border rounded-lg">
                    <p className="font-medium">${data.price} per seat</p>
                    <p className="text-sm text-muted-foreground">{data.count} seats</p>
                    <p className="font-medium">{formatCurrency(data.totalValue)} total</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="totalValue" radius={8}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey="totalValue"
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={formatCurrency}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
