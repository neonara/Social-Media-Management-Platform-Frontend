"use client";

import { useThemedToast } from "@/hooks/useThemedToast";
import { analyzeMoodAndTone } from "@/services/aiService";
import { Loader, Sparkles } from "lucide-react";
import React, { useState } from "react";

interface AnalyzeMoodProps {
  caption: string;
}

const AnalyzeMood: React.FC<AnalyzeMoodProps> = ({ caption }) => {
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<string>("");
  const [tone, setTone] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const themedToast = useThemedToast();

  const handleAnalyzeMood = async () => {
    if (!caption.trim()) {
      themedToast.error("Please write a caption first");
      return;
    }

    setLoading(true);
    try {
      const response = await analyzeMoodAndTone(caption);

      if (response.mood && response.tone) {
        setMood(response.mood);
        setTone(response.tone);
        setConfidence(response.confidence || 0);
        setDescription(response.description || "");
        themedToast.success("Mood analyzed successfully!");
      } else {
        themedToast.error("Failed to analyze mood");
      }
    } catch (error) {
      console.error("Failed to analyze mood:", error);
      themedToast.error("Failed to analyze mood. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMood("");
    setTone("");
    setConfidence(0);
    setDescription("");
  };

  return (
    <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-900 dark:bg-opacity-20">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
          <Sparkles size={18} className="text-orange-500" />
          Analyze Mood & Tone
        </h3>
      </div>

      {!mood ? (
        <button
          onClick={handleAnalyzeMood}
          disabled={loading || !caption.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:bg-gray-400 dark:hover:bg-orange-600"
        >
          {loading ? (
            <>
              <Loader size={16} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Analyze Mood & Tone
            </>
          )}
        </button>
      ) : (
        <div className="">
          <div className="rounded-md bg-white p-3 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                  Mood
                </p>
                <p className="mt-1 text-lg font-semibold capitalize text-orange-600 dark:text-orange-400">
                  {mood}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                  Tone
                </p>
                <p className="mt-1 text-lg font-semibold capitalize text-orange-600 dark:text-orange-400">
                  {tone}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                Confidence
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="rounded-full bg-orange-500 py-1"
                    style={{ width: `${confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>

            {description && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                  Analysis
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {description}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleClear}
            className="w-full rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalyzeMood;
