"use client";

import { Button } from "@/components/ui/button";
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
import { Download, Facebook, Instagram, Linkedin } from "lucide-react";

interface Client {
  id: number;
  name: string;
  industry: string;
  logo: string;
  status: string;
  joinedDate: string;
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

interface ReportControlsProps {
  clients: Client[];
  filteredPages: Page[];
  selectedClient: string;
  selectedPage: string;
  reportType: "week" | "month";
  selectedWeek: string;
  selectedMonth: string;
  weekOptions: WeekOption[];
  monthOptions: MonthOption[];
  loading: boolean;
  hasReportData: boolean;
  onClientChange: (value: string) => void;
  onPageChange: (value: string) => void;
  onReportTypeChange: (value: "week" | "month") => void;
  onWeekChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onDownloadPDF: () => void;
}

// Helper function to get platform icon
const getPlatformIcon = (platform: string) => {
  const iconClass = "h-4 w-4";
  switch (platform.toLowerCase()) {
    case "facebook":
      return <Facebook className={iconClass} />;
    case "instagram":
      return <Instagram className={iconClass} />;
    case "linkedin":
      return <Linkedin className={iconClass} />;
    default:
      return null;
  }
};

export default function ReportControls({
  clients,
  filteredPages,
  selectedClient,
  selectedPage,
  reportType,
  selectedWeek,
  selectedMonth,
  weekOptions,
  monthOptions,
  loading,
  hasReportData,
  onClientChange,
  onPageChange,
  onReportTypeChange,
  onWeekChange,
  onMonthChange,
  onDownloadPDF,
}: ReportControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
        <CardDescription>
          Select the report type and time period to view analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {/* Client Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select Client <span className="text-red-500">*</span>
            </label>
            <Select value={selectedClient} onValueChange={onClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{client.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({client.industry})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select Page <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedPage}
              onValueChange={onPageChange}
              disabled={!selectedClient || filteredPages.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a page" />
              </SelectTrigger>
              <SelectContent>
                {filteredPages.map((page) => (
                  <SelectItem key={page.id} value={page.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{page.name}</span>
                      {getPlatformIcon(page.platform)}
                      <span className="text-muted-foreground text-xs">
                        {page.platform} • {page.followers.toLocaleString()}{" "}
                        followers
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClient && filteredPages.length === 0 && (
              <p className="text-muted-foreground text-xs">
                No pages found for this client
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Report Type */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Tabs
              value={reportType}
              onValueChange={(value) =>
                onReportTypeChange(value as "week" | "month")
              }
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
          {/* Period Selection */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Select Period</label>
            {reportType === "week" ? (
              <Select value={selectedWeek} onValueChange={onWeekChange}>
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
              <Select value={selectedMonth} onValueChange={onMonthChange}>
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

          <Button
            onClick={onDownloadPDF}
            variant="default"
            className="flex items-center gap-2 text-white"
            disabled={loading || !hasReportData}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Info message */}
        {(!selectedClient || !selectedPage) && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Please select a client and page to generate a report
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
