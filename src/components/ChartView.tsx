import React, { useMemo } from 'react';
import { 
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
  ResponsiveContainer 
} from 'recharts';
import type { DailyStat, MonthlyStat } from '../types';
import styles from './ChartView.module.css';

interface ChartViewProps {
  data: DailyStat[] | MonthlyStat[];
  type: 'pie' | 'bar';
  title: string;
  dataKey: 'totalOrders' | 'totalRevenue';
  timeKey: 'date' | 'month';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const ChartView: React.FC<ChartViewProps> = ({ 
  data, 
  type, 
  title, 
  dataKey,
  timeKey
}) => {

  const formatTooltipValue = (value: number | string | Array<number | string> | undefined, name: string | number | undefined) => {
    if (value === undefined) return ['0', name];
    
    // Always treat value as a number for our specific use cases
    const numValue = Number(value);

    if (name === 'Total Revenue' || dataKey === 'totalRevenue') {
      return [`$${numValue.toFixed(2)}`, 'Revenue'];
    }
    return [numValue, 'Orders'];
  };

  const chartData = useMemo(() => {
    return data.map(item => ({
      name: item[timeKey as keyof typeof item],
      value: Number(item[dataKey as keyof typeof item])
    }));
  }, [data, dataKey, timeKey]);

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
              <Bar dataKey="value" name={dataKey === 'totalRevenue' ? 'Total Revenue' : 'Total Orders'} fill="#8884d8" />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
