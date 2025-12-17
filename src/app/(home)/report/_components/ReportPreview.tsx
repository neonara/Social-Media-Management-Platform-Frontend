"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import {
  Eye,
  FileText,
  Heart,
  MessageSquare,
  Share2,
  TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import React from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ReportData {
  totalPosts: number;
  totalEngagement: number;
  totalReach: number;
  totalFollowers: number;
  avgEngagementRate: number;

  topPosts: {
    id: number;
    content: string;
    platform: string;
    likes: number;
    comments: number;
    shares: number;
    date: string;
  }[];
  engagementTrend: {
    date: string;
    engagement: number;
  }[];
}

interface Client {
  id: number;
  name: string;
  industry: string;
  logo: string;
  status: string;
  joinedDate: string;
  email?: string;
}

interface Page {
  id: number;
  clientId: number;
  name: string;
  platform: string;
  handle: string;
  followers: number;
  verified: boolean;
}

interface WeekOption {
  value: string;
  label: string;
}

interface MonthOption {
  value: string;
  label: string;
}

interface ReportPreviewProps {
  reportData: ReportData;
  reportType: "week" | "month";
  clients: Client[];
  pages: Page[];
  selectedClient: string;
  selectedPage: string;
  selectedWeek: string;
  selectedMonth: string;
  weekOptions: WeekOption[];
  monthOptions: MonthOption[];
  reportRef: React.RefObject<HTMLDivElement | null>;
}

export default function ReportPreview({
  reportData,
  reportType,
  clients,
  pages,
  selectedClient,
  selectedPage,
  selectedWeek,
  selectedMonth,
  weekOptions,
  monthOptions,
  reportRef,
}: ReportPreviewProps) {
  return (
    <div
      id="report-content"
      ref={reportRef}
      className="space-y-6 print:space-y-4"
    >
      {/* Report Header for Print */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">
          {reportType === "week" ? "Weekly" : "Monthly"} Performance Report
        </h1>
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          <p>
            <strong>Client:</strong>{" "}
            {clients.find((c) => c.id === parseInt(selectedClient))?.name}
          </p>
          <p>
            <strong>Page:</strong>{" "}
            {pages.find((p) => p.id === parseInt(selectedPage))?.name} (
            {pages.find((p) => p.id === parseInt(selectedPage))?.platform})
          </p>
          <p>
            <strong>Period:</strong>{" "}
            {reportType === "week"
              ? weekOptions.find((w) => w.value === selectedWeek)?.label
              : monthOptions.find((m) => m.value === selectedMonth)?.label}
          </p>
          <p>
            <strong>Generated:</strong>{" "}
            {format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}
          </p>
        </div>
        <hr className="my-4" />
      </div>

      {/* Client & Page Info Card (for screen view) */}
      <Card className="border border-t-4 border-gray-200 border-t-primary shadow-sm dark:border-gray-700 print:hidden">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-900 dark:from-blue-950 dark:to-indigo-950">
              <p className="text-muted-foreground text-sm font-medium">
                Client
              </p>
              <p className="mt-1 text-lg font-semibold">
                {clients.find((c) => c.id === parseInt(selectedClient))?.name}
              </p>
              <p className="text-muted-foreground text-sm">
                {clients.find((c) => c.id === parseInt(selectedClient))?.email}
              </p>
            </div>
            <div className="rounded-lg border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:border-purple-900 dark:from-purple-950 dark:to-pink-950">
              <p className="text-muted-foreground text-sm font-medium">Page</p>
              <p className="mt-1 text-lg font-semibold">
                {pages.find((p) => p.id === parseInt(selectedPage))?.name}
              </p>
              <p className="text-muted-foreground text-sm">
                {pages.find((p) => p.id === parseInt(selectedPage))?.platform}
              </p>
            </div>
            <div className="rounded-lg border border-green-100 bg-gradient-to-br from-green-50 to-teal-50 p-4 dark:border-green-900 dark:from-green-950 dark:to-teal-950">
              <p className="text-muted-foreground text-sm font-medium">
                Report Period
              </p>
              <p className="mt-1 text-lg font-semibold">
                {reportType === "week" ? "Weekly" : "Monthly"}
              </p>
              <p className="text-muted-foreground text-sm">
                {reportType === "week"
                  ? weekOptions.find((w) => w.value === selectedWeek)?.label
                  : monthOptions.find((m) => m.value === selectedMonth)?.label}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border border-l-4 border-gray-200 border-l-blue-500 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <CardTitle className="text-lg font-medium">Total Posts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {reportData.totalPosts}
            </div>
            <p className="text-muted-foreground">Published this {reportType}</p>
          </CardContent>
        </Card>

        <Card className="border border-l-4 border-gray-200 border-l-red-500 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="w-fit rounded-full bg-red-100 p-2 dark:bg-red-900">
                <Heart className="h-4 w-4 text-red-600 dark:text-red-300" />
              </div>
              <CardTitle className="w-fit text-lg font-medium">
                Total Engagement
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {reportData.totalEngagement.toLocaleString()}
            </div>
            <p className="text-muted-foreground">Likes, comments & shares</p>
          </CardContent>
        </Card>

        <Card className="border border-l-4 border-gray-200 border-l-purple-500 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Eye className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              </div>
              <CardTitle className="text-lg font-medium">Total Reach</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {reportData.totalReach.toLocaleString()}
            </div>
            <p className="text-muted-foreground">People reached</p>
          </CardContent>
        </Card>

        <Card className="border border-l-4 border-gray-200 border-l-green-500 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-300" />
              </div>
              <CardTitle className="text-lg font-medium">
                Engagement Rate
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {reportData.avgEngagementRate}%
            </div>
            <p className="text-muted-foreground">Average rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Trend */}
      <Card className="border border-gray-200 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          <CardTitle>Cumulative Engagement Trend</CardTitle>
          <CardDescription>
            Total accumulated engagement over time
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {typeof window !== "undefined" &&
            (() => {
              // Calculate cumulative engagement
              let cumulative = 0;
              const cumulativeData = reportData.engagementTrend.map((item) => {
                cumulative += item.engagement;
                return cumulative;
              });

              return (
                <Chart
                  options={{
                    chart: {
                      id: "engagement-trend",
                      toolbar: {
                        show: false,
                      },
                      zoom: {
                        enabled: false,
                      },
                    },
                    stroke: {
                      curve: "smooth",
                      width: 3,
                    },
                    fill: {
                      type: "gradient",
                      gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.7,
                        opacityTo: 0.2,
                        stops: [0, 90, 100],
                      },
                    },
                    colors: ["#10b981"],
                    dataLabels: {
                      enabled: false,
                    },
                    xaxis: {
                      categories: reportData.engagementTrend.map(
                        (item) => item.date,
                      ),
                      labels: {
                        style: {
                          fontSize: "12px",
                        },
                      },
                    },
                    yaxis: {
                      labels: {
                        style: {
                          fontSize: "12px",
                        },
                        formatter: function (val) {
                          return Math.round(val).toString();
                        },
                      },
                    },
                    grid: {
                      borderColor: "#f1f1f1",
                      strokeDashArray: 4,
                    },
                    tooltip: {
                      theme: "light",
                      y: {
                        formatter: function (val) {
                          return val + " total engagements";
                        },
                      },
                    },
                  }}
                  series={[
                    {
                      name: "Cumulative Engagement",
                      data: cumulativeData,
                    },
                  ]}
                  type="area"
                  height={300}
                />
              );
            })()}
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      <Card className="border border-gray-200 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950 dark:to-pink-950">
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>Best posts from this {reportType}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {reportData.topPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-gray-800 dark:to-gray-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-xs font-bold text-white shadow-md">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground text-sm font-medium">
                        {post.platform}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(post.date), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 dark:bg-red-900/20">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 dark:bg-blue-900/20">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{post.comments}</span>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 dark:bg-green-900/20">
                    <Share2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{post.shares}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
