import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Projection } from '../types';
import { useSettings } from '../contexts/SettingsContext'; // Import useSettings

interface ProjectionChartProps {
  data: Projection[];
}

const ProjectionChart: React.FC<ProjectionChartProps> = ({ data }) => {
  const { settings } = useSettings(); // Get chart settings
  const { revenueColor, profitColor, lineType, showGrid } = settings;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">Données de projection non disponibles.</p>
      </div>
    );
  }

  const formatYAxis = (tickItem: number) => {
    return `${tickItem}M`;
  };

  const axisColor = '#9ca3af';
  const gridColor = '#374151';
  const tooltipBg = '#1f2937';
  const tooltipBorder = '#4b5563';
  const legendColor = '#d1d5db';

  return (
    <div style={{width: '100%', height: 384}} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">Projections Financières (en millions)</h3>
        {isClient && (
            <ResponsiveContainer width="100%" height="85%">
                <ComposedChart
                    data={data}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
                    <XAxis dataKey="year" stroke={axisColor} />
                    <YAxis stroke={axisColor} tickFormatter={formatYAxis} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                        }}
                        itemStyle={{ color: legendColor }}
                        formatter={(value: number, name: string) => [`${value}M`, name.charAt(0).toUpperCase() + name.slice(1)]}
                    />
                    <Legend wrapperStyle={{ color: legendColor }} />
                    <Bar dataKey="revenue" name="Revenu" fill={revenueColor} />
                    <Line type={lineType} dataKey="profit" name="Bénéfice" stroke={profitColor} strokeWidth={2} activeDot={{ r: 6 }} />
                </ComposedChart>
            </ResponsiveContainer>
        )}
    </div>
  );
};

export default ProjectionChart;