/**
 * Example: How to use the Engagement Prediction in a post scheduler
 */

import EngagementPredictionCard from "@/components/EngagementPredictionCard";
import {
  formatTimeForDisplay,
  shouldReschedulePost,
  useEngagementPrediction,
} from "@/hooks/useEngagementPrediction";
import React, { useState } from "react";

interface PostSchedulerProps {
  token: string;
}

export const PostSchedulerWithPrediction: React.FC<PostSchedulerProps> = ({
  token,
}) => {
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState<
    "instagram" | "facebook" | "linkedin"
  >("instagram");
  const [mediaType, setMediaType] = useState<
    "image" | "video" | "carousel" | "text"
  >("image");
  const [scheduledTime, setScheduledTime] = useState("14:00");

  const { prediction, loading, error, predictEngagement } =
    useEngagementPrediction();

  const handleCheckEngagement = async () => {
    const now = new Date();
    const [hourStr, minStr] = scheduledTime.split(":");
    const scheduledHour = parseInt(hourStr);

    try {
      await predictEngagement({
        caption,
        caption_length: caption.length,
        hashtag_count: (caption.match(/#/g) || []).length,
        time_of_day: scheduledHour.toString(),
        day_of_week: now.getDay(),
        platform,
        media_type: mediaType,
        brand_sentiment: 0.7, // Default, you can add UI control
      });
    } catch (err) {
      console.error("Failed to get prediction:", err);
    }
  };

  const recommendedTime = prediction?.best_time
    ? formatTimeForDisplay(prediction.best_time)
    : null;

  const shouldReschedule = prediction?.best_time
    ? shouldReschedulePost(
        parseInt(scheduledTime.split(":")[0]),
        prediction.best_time,
      )
    : false;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Schedule Post with AI Predictions
      </h1>

      {/* Input Section */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Post Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Write your post caption..."
          />
          <p className="mt-1 text-xs text-gray-500">
            {caption.length} characters | {(caption.match(/#/g) || []).length}{" "}
            hashtags
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 p-2"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Media Type
            </label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 p-2"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="carousel">Carousel</option>
              <option value="text">Text Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Scheduled Time (24-hour format)
          </label>
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2"
          />
        </div>

        <button
          onClick={handleCheckEngagement}
          disabled={loading || !caption}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Analyzing..." : "Check Engagement Prediction"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Prediction Results */}
      {prediction && (
        <>
          {/* Reschedule Alert */}
          {shouldReschedule && recommendedTime && (
            <div className="mb-6 rounded-lg border-2 border-orange-300 bg-orange-50 p-4">
              <p className="text-lg font-bold text-orange-800">
                ⚠️ Consider Rescheduling
              </p>
              <p className="mt-2 text-orange-700">
                Your current scheduled time <strong>{scheduledTime}</strong> may
                not be optimal.
                <br />
                Try posting at <strong>{recommendedTime}</strong> instead for
                potentially higher engagement.
              </p>
              <button
                onClick={() =>
                  setScheduledTime(prediction.best_time || scheduledTime)
                }
                className="mt-3 rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
              >
                Update Scheduled Time to {recommendedTime}
              </button>
            </div>
          )}

          {/* Prediction Card */}
          <EngagementPredictionCard
            prediction={prediction}
            currentTime={parseInt(scheduledTime.split(":")[0])}
          />

          {/* Quick Summary */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-gray-600">Engagement Score</p>
              <p className="text-2xl font-bold text-green-600">
                {prediction.predicted_engagement_score.toFixed(0)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-600">Confidence</p>
              <p className="text-2xl font-bold text-blue-600">
                {prediction.confidence_score.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm text-gray-600">Level</p>
              <p className="text-2xl font-bold text-purple-600">
                {prediction.engagement_level}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PostSchedulerWithPrediction;
