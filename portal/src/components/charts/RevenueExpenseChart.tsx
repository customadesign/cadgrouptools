'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

interface RevenueExpenseChartProps {
  data: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
}

export default function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E5E7EB'} />
        <XAxis 
          dataKey="month" 
          stroke={isDark ? '#94A3B8' : '#6B7280'}
          style={{ fontSize: 12 }}
        />
        <YAxis 
          stroke={isDark ? '#94A3B8' : '#6B7280'}
          style={{ fontSize: 12 }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
        />
        <Tooltip
          contentStyle={{
            background: isDark ? '#1E293B' : '#FFFFFF',
            border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
            borderRadius: '8px',
            color: isDark ? '#F1F5F9' : '#1F2937',
          }}
          formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#10B981"
          fillOpacity={1}
          fill="url(#colorRevenue)"
          strokeWidth={2}
          name="Revenue"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#EF4444"
          fillOpacity={1}
          fill="url(#colorExpenses)"
          strokeWidth={2}
          name="Expenses"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

