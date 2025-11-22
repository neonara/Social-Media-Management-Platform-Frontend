"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { generateReport, type ReportData } from "@/services/reportService";
import { getAllPages } from "@/services/socialMedia";
import type { SocialPage } from "@/types/social-page";
import { Eye, FileText, Heart, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ClientStats = () => {
  const { userProfile } = useUser();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [pages, setPages] = useState<SocialPage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching pages for client ID:", userProfile.id);

        // Fetch current user's pages (works for clients)
        const clientPagesResult = await getAllPages();

        console.log("Pages result:", clientPagesResult);

        // Check if result is an error object
        if (
          clientPagesResult &&
          typeof clientPagesResult === "object" &&
          "error" in clientPagesResult
        ) {
          setError(clientPagesResult.error as string);
          setLoading(false);
          return;
        }

        // Check if result is empty array
        if (
          !clientPagesResult ||
          !Array.isArray(clientPagesResult) ||
          clientPagesResult.length === 0
        ) {
          setError(
            "No social media pages found. Please connect your social media accounts to see your stats.",
          );
          setLoading(false);
          return;
        }

        const clientPages = clientPagesResult as SocialPage[];
        setPages(clientPages);

        console.log("Found pages:", clientPages.length);

        // Get stats for the first page
        if (clientPages.length > 0) {
          const firstPage = clientPages[0];

          console.log("First page:", firstPage);

          // Get current week period (format: YYYY-MM-DD for the start of week)
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday
          const period = startOfWeek.toISOString().split("T")[0];

          console.log(
            `Generating report for client ${userProfile.id}, page ${firstPage.id}, period ${period}`,
          );

          const data = await generateReport(
            userProfile.id,
            firstPage.id,
            "week",
            period,
          );

          console.log("Report data received:", data);
          setReportData(data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(
          `Failed to load statistics: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userProfile]);

  console.log("Component state:", {
    loading,
    error,
    hasReportData: !!reportData,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">Loading your stats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-300">
          No data available yet. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-l-4 border-gray-200 border-l-blue-500 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {reportData.totalPosts}
            </div>
            <p className="text-muted-foreground text-xs">This week</p>
          </CardContent>
        </Card>

        <Card className="border border-l-4 border-gray-200 border-l-red-500 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
                <Heart className="h-4 w-4 text-red-600 dark:text-red-300" />
              </div>
              <CardTitle className="text-sm font-medium">
                Total Engagement
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {reportData.totalEngagement.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              Likes, comments & shares
            </p>
          </CardContent>
        </Card>

        <Card className="border border-l-4 border-gray-200 border-l-purple-500 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Eye className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              </div>
              <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {reportData.totalReach.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">People reached</p>
          </CardContent>
        </Card>

        <Card className="border border-l-4 border-gray-200 border-l-green-500 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-300" />
              </div>
              <CardTitle className="text-sm font-medium">
                Engagement Rate
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {reportData.avgEngagementRate}%
            </div>
            <p className="text-muted-foreground text-xs">Average rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Trend Chart */}
      {reportData.engagementTrend && reportData.engagementTrend.length > 0 && (
        <Card className="border border-gray-200 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
            <CardTitle>Engagement Trend</CardTitle>
            <CardDescription>
              Cumulative engagement growth over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {typeof window !== "undefined" &&
              (() => {
                // Calculate cumulative engagement
                let cumulative = 0;
                const cumulativeData = reportData.engagementTrend.map(
                  (item) => {
                    cumulative += item.engagement;
                    return cumulative;
                  },
                );

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
      )}
    </div>
  );
};

export default ClientStats;
