"use server";

import { API_BASE_URL } from "@/config/api";
import { cookies } from "next/headers";

async function getAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) {
    throw new Error("Authentication required");
  }
  return token;
}

// Type definitions for AI responses
export interface HashtagsResponse {
  hashtags: string[];
  industry: string;
  platform: string;
  reasoning: string;
  count: number;
}

export interface MoodAnalysisResponse {
  mood: string;
  tone: string;
  confidence: number;
  description: string;
}

export interface CaptionImprovementResponse {
  improved_caption: string;
  improvements: string[];
  reasoning: string;
}

export interface GenerateByMoodResponse {
  captions:
    | Array<{
        text?: string;
        mood: string;
        tone: string;
      }>
    | string[];
  mood: string;
  tone: string;
  count: number;
  platform?: string;
}

export interface RewriteByMoodResponse {
  original: string;
  rewritten: string;
  mood: string;
  tone: string;
  explanation: string;
  platform?: string;
}

export interface CampaignThemeResponse {
  main_theme: string;
  sub_themes: string[];
  target_audience: string;
  content_style: string;
  recommendations: string[];
}

// Suggest hashtags for a caption
export async function suggestHashtags(
  caption: string,
  platform: "instagram" | "facebook" | "linkedin" = "instagram",
  count: number = 10,
  industry?: string,
): Promise<HashtagsResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/ai/hashtags/suggest/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      caption,
      platform,
      count,
      ...(industry && { industry }),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to suggest hashtags: ${response.statusText}`);
  }

  return response.json();
}

// Analyze mood and tone of a caption
export async function analyzeMoodAndTone(
  caption: string,
): Promise<MoodAnalysisResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/ai/caption/analyze-mood/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ caption }),
  });

  if (!response.ok) {
    throw new Error(`Failed to analyze mood: ${response.statusText}`);
  }

  return response.json();
}

// Improve a caption
export async function improveCaption(
  caption: string,
  platform: "instagram" | "facebook" | "linkedin" = "instagram",
): Promise<CaptionImprovementResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/ai/caption/improve/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ caption, platform }),
  });

  if (!response.ok) {
    throw new Error(`Failed to improve caption: ${response.statusText}`);
  }

  return response.json();
}

// Generate captions by mood (from topic)
export async function generateContentByMood(
  topic: string,
  mood: string,
  tone: string,
  platform: "instagram" | "facebook" | "linkedin" = "instagram",
  count: number = 3,
): Promise<GenerateByMoodResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/ai/caption/generate-by-mood/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      topic,
      mood,
      tone,
      platform,
      count,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate content: ${response.statusText}`);
  }

  return response.json();
}

// Rewrite caption by mood (modify existing)
export async function rewriteCaptionByMood(
  caption: string,
  mood: string,
  tone: string,
  platform: "instagram" | "facebook" | "linkedin" = "instagram",
): Promise<RewriteByMoodResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/ai/caption/rewrite-by-mood/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      caption,
      mood,
      tone,
      platform,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(
      "Rewrite caption error response:",
      response.status,
      errorData,
    );
    throw new Error(
      `Failed to rewrite caption: ${response.statusText} - ${JSON.stringify(errorData)}`,
    );
  }

  return response.json();
}

// Detect campaign theme from multiple captions
export async function detectCampaignTheme(
  captions: string[],
): Promise<CampaignThemeResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/ai/campaign/detect-theme/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ captions }),
  });

  if (!response.ok) {
    throw new Error(`Failed to detect campaign theme: ${response.statusText}`);
  }

  return response.json();
}
