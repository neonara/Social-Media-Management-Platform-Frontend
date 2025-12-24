/**
 * Engagement Prediction Card Component
 * Displays Gemini AI prediction for post engagement
 */

import React, { useState } from "react";

interface PredictionResponse {
  predicted_engagement_score: number;
  engagement_level: "HIGH" | "MEDIUM" | "LOW";
  confidence_score: number;
  reasoning: string;
  top_factors: string[];
  improvements: string[];
  best_time: string | null; // e.g., "18:00", "14:30"
}

interface EngagementPredictionCardProps {
  prediction: PredictionResponse;
  currentTime?: number; // 0-23 hour format
}

const EngagementPredictionCard: React.FC<EngagementPredictionCardProps> = ({
  prediction,
  currentTime = new Date().getHours(),
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Get emoji based on engagement level
  const getEngagementEmoji = (level: string) => {
    switch (level) {
      case "HIGH":
        return "🔥";
      case "MEDIUM":
        return "⚡";
      case "LOW":
        return "💤";
      default:
        return "📊";
    }
  };

  // Convert 24-hour format time string to readable format
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const min = parseInt(minutes || "0");

    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min.toString().padStart(2, "0")} ${period}`;
  };

  // Check if recommended time is different from current time
  const hasTimeSuggestion = prediction.best_time !== null;
  const recommendedHour = prediction.best_time
    ? parseInt(prediction.best_time.split(":")[0])
    : null;
  const isDifferentTime =
    recommendedHour !== null && recommendedHour !== currentTime;

  return (
    <div className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-lg">
      {/* Header with Engagement Level */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">
            {getEngagementEmoji(prediction.engagement_level)}
          </span>
          <div>
            <p className="text-sm text-gray-600">Engagement Level</p>
            <p className="text-2xl font-bold text-gray-800">
              {prediction.engagement_level}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Confidence</p>
          <p className="text-2xl font-bold text-blue-600">
            {prediction.confidence_score.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">
            Engagement Score
          </p>
          <p className="text-sm font-bold text-gray-800">
            {prediction.predicted_engagement_score.toFixed(0)}/100
          </p>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full transition-all ${
              prediction.predicted_engagement_score >= 70
                ? "bg-green-500"
                : prediction.predicted_engagement_score >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${prediction.predicted_engagement_score}%` }}
          />
        </div>
      </div>

      {/* Best Time Suggestion - HIGHLIGHTED */}
      {hasTimeSuggestion && isDifferentTime && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
            ⏰ Recommended Posting Time
          </p>
          <p className="mt-1 text-lg font-bold text-green-700">
            {formatTime(prediction.best_time)}
          </p>
          <p className="mt-1 text-xs text-green-600">
            Post at this time for better engagement
          </p>
        </div>
      )}

      {/* Reasoning */}
      <div className="mb-4 rounded-lg bg-blue-50 p-3">
        <p className="mb-1 text-sm font-semibold text-gray-700">
          Why this level?
        </p>
        <p className="text-sm text-gray-600">{prediction.reasoning}</p>
      </div>

      {/* Top Factors */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-semibold text-gray-700">Key Factors</p>
        <div className="flex flex-wrap gap-2">
          {prediction.top_factors.map((factor, idx) => (
            <span
              key={idx}
              className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
            >
              {factor}
            </span>
          ))}
        </div>
      </div>

      {/* Improvements Section */}
      {prediction.improvements && prediction.improvements.length > 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            📈 Improvements to Boost Engagement
          </p>
          <ul className="space-y-1">
            {prediction.improvements.map((improvement, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <span className="font-bold text-amber-600">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toggle Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
      >
        {showDetails ? "▼ Hide Details" : "▶ Show Details"}
      </button>

      {/* Full Response Details */}
      {showDetails && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <pre className="overflow-auto text-xs text-gray-600">
            {JSON.stringify(prediction, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EngagementPredictionCard;
