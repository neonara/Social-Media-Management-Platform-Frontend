import { useThemedToast } from "@/hooks/useThemedToast";
import { getPostById } from "@/services/postService";
import { DraftPost, ScheduledPost } from "@/types/post";
import { useEffect, useState } from "react";

interface MediaFile {
  id?: number | string;
  preview: string;
  file?: File;
  name?: string;
}

interface FormData {
  title: string;
  caption: string;
  scheduledTime: string;
  selectedPlatforms: string[];
  hashtags: string[];
  mediaFiles: MediaFile[];
}

export const usePostData = (mode: "create" | "edit", postId?: string) => {
  const themedToast = useThemedToast();
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [originalPost, setOriginalPost] = useState<
    ScheduledPost | DraftPost | null
  >(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    caption: "",
    scheduledTime: "",
    selectedPlatforms: [],
    hashtags: [],
    mediaFiles: [],
  });
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [postClientInfo, setPostClientInfo] = useState<{
    id: number;
    full_name: string;
    email: string;
  } | null>(null);

  // Helper function to parse ISO string into separate date and time
  const parseDateTime = (isoString: string) => {
    if (!isoString) return { date: "", time: "" };
    try {
      const date = new Date(isoString);
      const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeString = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`; // HH:MM
      return { date: dateString, time: timeString };
    } catch (err) {
      console.error("Error parsing date time:", err);
      return { date: "", time: "" };
    }
  };

  // Fetch post data for edit mode
  useEffect(() => {
    const fetchPostData = async () => {
      if (mode === "edit" && postId) {
        try {
          setLoading(true);
          const post = await getPostById(parseInt(postId));

          if (!post) {
            setError("Post not found");
            return;
          }

          // Store the original post data for workflow decisions
          setOriginalPost(post);

          let formattedHashtags: string[] = [];
          if (post.hashtags && typeof post.hashtags === "string") {
            formattedHashtags = (post.hashtags as string).split(",");
          } else if (Array.isArray(post.hashtags)) {
            formattedHashtags = post.hashtags;
          }

          // Handle date formatting
          let formattedScheduledTime = "";
          if (post.scheduled_for) {
            try {
              const dateObj = new Date(post.scheduled_for);
              if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                const day = String(dateObj.getDate()).padStart(2, "0");
                const hours = String(dateObj.getHours()).padStart(2, "0");
                const minutes = String(dateObj.getMinutes()).padStart(2, "0");
                formattedScheduledTime = `${year}-${month}-${day}T${hours}:${minutes}`;
              }
            } catch (err) {
              console.error("Error formatting date:", err);
            }
          }

          setFormData({
            title: post.title,
            caption: post.description || "",
            scheduledTime: formattedScheduledTime,
            selectedPlatforms: Array.isArray(post.platforms)
              ? post.platforms
              : [],
            hashtags: formattedHashtags,
            mediaFiles:
              post.media?.map((media) => ({
                id: Number(media.id),
                preview: String(media.file),
                name: String(media.name || ""),
              })) || [],
          });

          // Set separate date and time states
          if (formattedScheduledTime) {
            const { date, time } = parseDateTime(formattedScheduledTime);
            setSelectedDate(date);
            setSelectedTime(time);
          }

          // Set client info for edit mode
          if (post.client_id) {
            setSelectedClientId(post.client_id.toString());
            if (post.client) {
              setPostClientInfo({
                id: Number(post.client.id),
                full_name: String(post.client.full_name || ""),
                email: String(post.client.email || ""),
              });
            }
          } else if (post.client) {
            // Handle case where client exists but client_id might not be set
            setSelectedClientId(post.client.id.toString());
            setPostClientInfo({
              id: Number(post.client.id),
              full_name: String(post.client.full_name || ""),
              email: String(post.client.email || ""),
            });
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load post");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPostData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, postId]);

  return {
    loading,
    error,
    setError,
    originalPost,
    formData,
    setFormData,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    selectedClientId,
    setSelectedClientId,
    postClientInfo,
    setPostClientInfo,
    parseDateTime,
  };
};
