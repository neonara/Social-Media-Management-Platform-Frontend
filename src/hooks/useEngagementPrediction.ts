/**
 * Hook to fetch engagement predictions from the backend API
 */

import { API_BASE_URL } from "@/config/api";
import { useCallback, useState } from "react";

export interface EngagementPredictionRequest {
  caption?: string;
  caption_length: number;
  hashtag_count: number;
  time_of_day: string; // 0-23
  day_of_week: number; // 0-6 (Mon-Sun)
  platform: "instagram" | "facebook" | "linkedin";
  media_type: "image" | "video" | "carousel" | "text";
  brand_sentiment: number; // 0.0-1.0
  post_id?: number;
}

export interface PredictionResponse {
  predicted_engagement_score: number;
  engagement_level: "HIGH" | "MEDIUM" | "LOW";
  confidence_score: number;
  reasoning: string;
  top_factors: string[];
  improvements: string[];
  best_time: string | null; // "14:00", "18:30", etc.
  model: string;
  score: number;
  level: string;
  confidence: number;
}

export const useEngagementPrediction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

  const predictEngagement = useCallback(
    async (data: EngagementPredictionRequest) => {
      setLoading(true);
      setError(null);

      try {
        // Try to get token from cookies (if available client-side)
        const getCookie = (name: string): string | null => {
          if (typeof document === "undefined") return null;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2)
            return parts.pop()?.split(";").shift() || null;
          return null;
        };

        const token = getCookie("access_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        // Add token to Authorization header if available
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/ai/predict-engagement/`, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
          credentials: "include", // Important: include cookies in the request
        });

        console.debug(
          "Engagement prediction response status:",
          response.status,
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "Engagement prediction error response:",
            response.status,
            errorData,
          );
          throw new Error(
            errorData.error ||
              errorData.detail ||
              "Failed to predict engagement",
          );
        }

        const result: PredictionResponse = await response.json();
        console.debug("Engagement prediction result:", result);
        setPrediction(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Engagement prediction error:", err, errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    prediction,
    loading,
    error,
    predictEngagement,
  };
};

/**
 * Helper function to determine if you should reschedule the post
 * @param currentHour - Current hour (0-23)
 * @param recommendedTime - Recommended time from API (e.g., "18:00")
 * @returns boolean - true if recommended time is significantly different
 */
export const shouldReschedulePost = (
  currentHour: number,
  recommendedTime: string | null,
): boolean => {
  if (!recommendedTime) return false;

  const [recHour] = recommendedTime.split(":").map(Number);
  const hourDiff = Math.abs(recHour - currentHour);

  // Reschedule if difference is more than 2 hours
  return hourDiff >= 2;
};

/**
 * Format time from 24-hour format to 12-hour with AM/PM
 */
export const formatTimeForDisplay = (timeStr: string | null): string | null => {
  if (!timeStr) return null;

  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${(minutes || 0).toString().padStart(2, "0")} ${period}`;
};
