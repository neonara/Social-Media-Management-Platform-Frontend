"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/UserContext";
import { generateReport, type ReportData } from "@/services/reportService";
import { getAllPages } from "@/services/socialMedia";
import type { SocialPage } from "@/types/social-page";
import { Eye, FileText, Heart, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

type WeekOption = { value: string; label: string };
type MonthOption = { value: string; label: string };

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ClientStats = () => {
  const { userProfile } = useUser();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [pages, setPages] = useState<SocialPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"week" | "month">("week");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([]);
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);

  useEffect(() => {
    async function fetchPages() {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch current user's pages (works for clients)
        const clientPagesResult = await getAllPages();

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
      } catch (err) {
        console.error("Error fetching pages:", err);
        setError(
          `Failed to load pages: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setLoading(false);
      }
    }

    // initialize period options
    const genWeekOptions = (count = 12) => {
      const options: WeekOption[] = [];
      const today = new Date();
      // start from this week's Sunday
      const startOfThisWeek = new Date(today);
      startOfThisWeek.setDate(today.getDate() - today.getDay());

      for (let i = 0; i < count; i++) {
        const d = new Date(startOfThisWeek);
        d.setDate(startOfThisWeek.getDate() - i * 7);
        const value = d.toISOString().split("T")[0];
        const label = `Week of ${d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
        options.push({ value, label });
      }
      return options;
    };

    const genMonthOptions = (count = 12) => {
      const options: MonthOption[] = [];
      const today = new Date();
      for (let i = 0; i < count; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
        const label = d.toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        });
        options.push({ value, label });
      }
      return options;
    };

    setWeekOptions(genWeekOptions(12));
    setMonthOptions(genMonthOptions(12));
    // set sensible defaults
    const weeks = genWeekOptions(12);
    const months = genMonthOptions(12);
    if (!selectedWeek && weeks.length > 0) setSelectedWeek(weeks[0].value);
    if (!selectedMonth && months.length > 0) setSelectedMonth(months[0].value);

    fetchPages();
  }, [userProfile]);

  // Fetch report when pages or period change
  useEffect(() => {
    async function fetchReportForSelection() {
      if (!userProfile?.id) return;
      if (!pages || pages.length === 0) return;

      const firstPage = pages[0];
      let period = "";
      let type: "week" | "month" = reportType;

      if (reportType === "week") {
        period = selectedWeek;
      } else {
        period = selectedMonth;
      }

      if (!period) return;

      try {
        setLoading(true);
        setError(null);
        const data = await generateReport(
          userProfile.id,
          firstPage.id,
          type,
          period,
        );
        setReportData(data);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError(
          `Failed to load statistics: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setLoading(false);
      }
    }

    fetchReportForSelection();
  }, [pages, reportType, selectedWeek, selectedMonth, userProfile]);

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
      {/* Controls: Report Type + Period Selection */}
      <div className="mt-0 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label className="font-medium">Period Type</label>
          <Tabs
            value={reportType}
            onValueChange={(value) => setReportType(value as "week" | "month")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 gap-2">
              <TabsTrigger
                value="week"
                className="border border-purple-200 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Weekly
              </TabsTrigger>
              <TabsTrigger
                value="month"
                className="border border-purple-200 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 space-y-2">
          <label className="font-medium">Select Period</label>
          {reportType === "week" ? (
            <Select
              value={selectedWeek}
              onValueChange={(v) => setSelectedWeek(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={selectedMonth}
              onValueChange={(v) => setSelectedMonth(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

            <p className="text-muted-foreground">
              {reportType === "week" ? "This week" : "This month"}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-l-4 border-gray-200 border-l-red-500 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
                <Heart className="h-4 w-4 text-red-600 dark:text-red-300" />
              </div>
              <CardTitle className="text-lg font-medium">
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
