'use client';

import { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
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
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4', '#f44336', '#3f51b5'];

interface ReportChartProps {
  data: any[];
  reportType: 'SUMMARY' | 'MATRIX';
  groupings: string[];
  columns: string[];
}

export default function ReportChart({ data, reportType, groupings, columns }: ReportChartProps) {
  const groupField = groupings[0];

  const chartData = useMemo(() => {
    if (!groupField || !data.length) return [];

    // Group data by the grouping field
    const groups: Record<string, any[]> = {};
    data.forEach((row) => {
      const key = String(row[groupField] ?? 'Unknown');
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    return Object.entries(groups).map(([name, rows]) => {
      const entry: any = { name, count: rows.length };
      // For numeric columns, calculate sum
      columns.forEach((col) => {
        const values = rows.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
        if (values.length > 0) {
          entry[col] = values.reduce((a, b) => a + b, 0);
        }
      });
      return entry;
    });
  }, [data, groupField, columns]);

  if (!groupField || chartData.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Add a grouping field to see chart visualizations
        </Typography>
      </Paper>
    );
  }

  // Find numeric columns for the bar chart
  const numericColumns = columns.filter((col) => {
    const sample = data.find((row) => row[col] !== null && row[col] !== undefined);
    return sample && !isNaN(parseFloat(sample[col]));
  });

  return (
    <Box>
      {/* Bar Chart */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Distribution by {groupField}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            {numericColumns.length > 0 ? (
              numericColumns.slice(0, 3).map((col, idx) => (
                <Bar key={col} dataKey={col} fill={COLORS[idx % COLORS.length]} name={col} />
              ))
            ) : (
              <Bar dataKey="count" fill={COLORS[0]} name="Count" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Pie Chart */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Breakdown by {groupField}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey={numericColumns[0] || 'count'}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* Matrix: Pivot Table */}
      {reportType === 'MATRIX' && groupings.length >= 2 && (
        <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Pivot Table
          </Typography>
          <MatrixTable data={data} rowField={groupings[0]} colField={groupings[1]} />
        </Paper>
      )}
    </Box>
  );
}

function MatrixTable({ data, rowField, colField }: { data: any[]; rowField: string; colField: string }) {
  const { rows, cols, matrix } = useMemo(() => {
    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    const m: Record<string, Record<string, number>> = {};

    data.forEach((row) => {
      const r = String(row[rowField] ?? 'Unknown');
      const c = String(row[colField] ?? 'Unknown');
      rowSet.add(r);
      colSet.add(c);
      if (!m[r]) m[r] = {};
      m[r][c] = (m[r][c] || 0) + 1;
    });

    return { rows: [...rowSet], cols: [...colSet], matrix: m };
  }, [data, rowField, colField]);

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: 8, borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              {rowField} / {colField}
            </th>
            {cols.map((col) => (
              <th key={col} style={{ padding: 8, borderBottom: '2px solid #ddd', textAlign: 'center' }}>
                {col}
              </th>
            ))}
            <th style={{ padding: 8, borderBottom: '2px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td style={{ padding: 8, borderBottom: '1px solid #eee', fontWeight: 500 }}>{row}</td>
              {cols.map((col) => (
                <td key={col} style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  {matrix[row]?.[col] || 0}
                </td>
              ))}
              <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 'bold' }}>
                {cols.reduce((sum, col) => sum + (matrix[row]?.[col] || 0), 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}
