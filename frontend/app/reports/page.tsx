'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useReportsData } from '@/hooks/queries/useReportsData';
import { useAuthStore } from '@/stores/auth.store';

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

            {/* Weekly Chart Placeholder */}
            <div className="h-48 bg-gray-100 rounded-lg p-4">
              <div className="h-full flex items-end justify-around gap-2">
                {wasteData.weeklyData.map((week, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${(week.value / 40) * 100}%` }}
                      data-testid={`week-${index + 1}-bar`}
                    />
                    <span className="text-xs text-gray-600">{week.week}</span>
                  </div>
                ))}
              </div>
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
            <div className="space-y-3">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-24 text-sm">{item.category}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-blue-500 flex items-center justify-end pr-2"
                      style={{ width: `${item.percentage}%` }}
                    >
                      <span className="text-xs text-white font-semibold">{item.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expiry Patterns */}
        <Card data-testid="expiry-patterns-card">
          <CardHeader>
            <CardTitle>Expiry Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiryPatterns.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-12 text-sm font-medium">{item.day}</span>
                  <div className="flex-1 bg-gray-200 rounded h-5 relative overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-green-500"
                      style={{ width: `${(item.count / 12) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-8 text-right">{item.count}</span>
                </div>
              ))}
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