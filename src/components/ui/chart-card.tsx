'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  type?: 'area' | 'bar';
  dataKey: string;
  xKey?: string;
  color?: string;
  /** Bar charts only — cycles through these colors per bar/category instead of one flat color. */
  colors?: string[];
  secondaryKey?: string;
  secondaryColor?: string;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  data,
  type = 'area',
  dataKey,
  xKey = 'name',
  color = 'hsl(var(--chart-color))',
  colors,
  secondaryKey,
  secondaryColor = 'hsl(var(--chart-color) / 0.5)',
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const gridStroke = 'hsl(var(--border))';
  const tickFill = 'hsl(var(--muted-foreground))';

  return (
    <Card className={`border-border/60 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full min-h-[180px] min-w-0">
          {mounted ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {type === 'area' ? (
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey={xKey} tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                {secondaryKey && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#gradient-${dataKey})`}
                />
                {secondaryKey && (
                  <Area
                    type="monotone"
                    dataKey={secondaryKey}
                    stroke={secondaryColor}
                    strokeWidth={2}
                    fill="transparent"
                  />
                )}
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey={xKey} tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {colors && data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
                {secondaryKey && (
                  <Bar dataKey={secondaryKey} fill={secondaryColor} radius={[4, 4, 0, 0]} maxBarSize={48} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-lg bg-muted/30 animate-skeleton" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
