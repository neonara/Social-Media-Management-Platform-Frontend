"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchClientsAndPages,
  filterPagesByClient,
  flattenPages,
  generateReport,
  hasReportData,
  type Client,
  type Page,
  type ReportData,
} from "@/services/reportService";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { useEffect, useRef, useState } from "react";
import ReportControls from "./_components/ReportControls";
import ReportPreview from "./_components/ReportPreview";

// Remove local interface definitions - now imported from service
// API URL is also in the service

export default function ReportPage() {
  const [reportType, setReportType] = useState<"week" | "month">("week");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [clients, setClients] = useState<Client[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  // Generate week options (last 12 weeks)
  const weekOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i * 7);
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return {
      value: format(start, "yyyy-MM-dd"),
      label: `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`,
    };
  });

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    };
  });

  // Initialize with current period
  useEffect(() => {
    setSelectedWeek(weekOptions[0].value);
    setSelectedMonth(monthOptions[0].value);
  }, []);

  // Fetch clients and pages on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 [CLIENT] Fetching clients and pages...");
        const data = await fetchClientsAndPages();
        console.log("📦 [CLIENT] Received data:", data);
        console.log("📊 [CLIENT] Clients array:", data.clients);
        console.log(
          "📊 [CLIENT] Number of clients:",
          data.clients?.length || 0,
        );

        if (!data.clients || data.clients.length === 0) {
          console.warn("⚠️ [CLIENT] No clients received from server!");
        }

        setClients(data.clients);

        // Flatten all pages from all clients
        const allPages = await flattenPages(data.clients);
        console.log("📄 [CLIENT] All pages:", allPages);
        setPages(allPages);
      } catch (error) {
        console.error("❌ [CLIENT] Error fetching clients and pages:", error);
      }
    };

    fetchData();
  }, []);

  // Filter pages when client changes
  useEffect(() => {
    const filterPages = async () => {
      if (selectedClient) {
        const filtered = await filterPagesByClient(pages, selectedClient);
        setFilteredPages(filtered);
        // Automatically select first page if available
        if (filtered.length > 0) {
          setSelectedPage(filtered[0].id.toString());
        } else {
          setSelectedPage("");
        }
      } else {
        setFilteredPages([]);
        setSelectedPage("");
      }
    };

    filterPages();
  }, [selectedClient, pages]);

  // Generate report data from backend using service
  const generateReportData = async () => {
    if (!selectedClient || !selectedPage) {
      return;
    }

    setLoading(true);
    try {
      // Determine period parameter
      let period = "";
      if (reportType === "week" && selectedWeek) {
        period = selectedWeek; // Format: YYYY-MM-DD
      } else if (reportType === "month" && selectedMonth) {
        period = selectedMonth; // Format: YYYY-MM
      } else {
        setLoading(false);
        return;
      }

      const data = await generateReport(
        selectedClient,
        selectedPage,
        reportType,
        period,
      );

      const hasData = await hasReportData(data);
      if (!hasData) {
        console.log("No published posts found for selected period");
        setReportData(null);
        setLoading(false);
        return;
      }

      setReportData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error generating report:", error);
      setReportData(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      selectedClient &&
      selectedPage &&
      ((reportType === "week" && selectedWeek) ||
        (reportType === "month" && selectedMonth))
    ) {
      generateReportData();
    } else {
      setReportData(null);
    }
  }, [reportType, selectedWeek, selectedMonth, selectedClient, selectedPage]);

  // Download as PDF
  const downloadPDF = async () => {
    // Using browser print as PDF functionality
    // For production, consider using libraries like jsPDF or react-to-pdf
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      <Breadcrumb pageName="Reports" />

      <div className="space-y-6">
        {/* Report Controls */}
        <ReportControls
          clients={clients}
          filteredPages={filteredPages}
          selectedClient={selectedClient}
          selectedPage={selectedPage}
          reportType={reportType}
          selectedWeek={selectedWeek}
          selectedMonth={selectedMonth}
          weekOptions={weekOptions}
          monthOptions={monthOptions}
          loading={loading}
          hasReportData={!!reportData}
          onClientChange={setSelectedClient}
          onPageChange={setSelectedPage}
          onReportTypeChange={setReportType}
          onWeekChange={setSelectedWeek}
          onMonthChange={setSelectedMonth}
          onDownloadPDF={downloadPDF}
        />

        {/* Report Preview */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
                <p className="text-muted-foreground text-sm">
                  Generating report...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : reportData ? (
          <ReportPreview
            reportData={reportData}
            reportType={reportType}
            clients={clients}
            pages={pages}
            selectedClient={selectedClient}
            selectedPage={selectedPage}
            selectedWeek={selectedWeek}
            selectedMonth={selectedMonth}
            weekOptions={weekOptions}
            monthOptions={monthOptions}
            reportRef={reportRef}
          />
        ) : null}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content,
          #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
