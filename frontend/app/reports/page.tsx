'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useReportsData } from '@/hooks/queries/useReportsData';
import { useAuthStore } from '@/stores/auth.store';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState(30);
  const currentHouseholdId = useAuthStore((state) => state.currentHouseholdId);
  const { data: reportsData, isLoading, error } = useReportsData(dateRange);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading reports...</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center min-h-[400px] flex items-center justify-center">
          <div>
            <p className="text-red-500 mb-2">Failed to load reports</p>
            <p className="text-gray-600 text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle no household state
  if (!currentHouseholdId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center min-h-[400px] flex items-center justify-center">
          <p className="text-gray-600">Please select a household to view reports</p>
        </div>
      </div>
    );
  }

  // Use data from the hook, with fallback to empty values
  const wasteData = reportsData?.wasteTracking || {
    currentMonth: 0,
    percentageChange: 0,
    weeklyData: [],
  };

  const categoryData = reportsData?.categoryBreakdown || [];
  const expiryPatterns = reportsData?.expiryPatterns || [];
  const inventoryValue = reportsData?.inventoryValue || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex items-center gap-4">
          <Select value={dateRange.toString()} onValueChange={(value) => setDateRange(parseInt(value))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Food Waste Tracking */}
      <Card data-testid="waste-tracking-card">
        <CardHeader>
          <CardTitle>Food Waste Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary */}
            <div className="text-center p-4 bg-gray-50 rounded-lg" data-testid="waste-statistics">
              <p className="text-2xl font-bold" data-testid="waste-value">
                ${wasteData.currentMonth} wasted this month
              </p>
              <p className="text-sm text-gray-600">
                ({wasteData.percentageChange > 0 ? '↑' : '↓'} {Math.abs(wasteData.percentageChange)}% from last month)
              </p>
            </div>

            {/* Weekly Waste Tracking Chart */}
            <div className="h-64">
              <Line
                data={{
                  labels: wasteData.weeklyData.map((w: { week: string }) => w.week),
                  datasets: [
                    {
                      label: 'Food Waste ($)',
                      data: wasteData.weeklyData.map((w: { value: number }) => w.value),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => `$${context.parsed.y.toFixed(2)}`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => `$${value}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Categories and Expiry Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Categories */}
        <Card data-testid="categories-card">
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={{
                  labels: categoryData.map((item: { category: string }) => item.category),
                  datasets: [
                    {
                      label: 'Percentage',
                      data: categoryData.map((item: { percentage: number }) => item.percentage),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(147, 51, 234, 0.8)',
                      ],
                      borderColor: [
                        'rgb(59, 130, 246)',
                        'rgb(34, 197, 94)',
                        'rgb(245, 158, 11)',
                        'rgb(239, 68, 68)',
                        'rgb(147, 51, 234)',
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.y}%`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: (value) => `${value}%`,
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Expiry Patterns */}
        <Card data-testid="expiry-patterns-card">
          <CardHeader>
            <CardTitle>Expiry Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={{
                  labels: expiryPatterns.map((item: { day: string }) => item.day),
                  datasets: [
                    {
                      label: 'Items Expiring',
                      data: expiryPatterns.map((item: { count: number }) => item.count),
                      backgroundColor: 'rgba(34, 197, 94, 0.8)',
                      borderColor: 'rgb(34, 197, 94)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y' as const,
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.x} items`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer with Inventory Value and Export */}
      <div className="flex justify-between items-center pt-4">
        <div className="text-lg">
          <span className="font-semibold">Inventory Value:</span> ${inventoryValue}
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
};

export default ReportsPage;