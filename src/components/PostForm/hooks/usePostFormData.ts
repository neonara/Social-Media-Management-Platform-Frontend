import { useState } from "react";

export interface MediaFile {
  id?: number | string;
  preview: string;
  file?: File;
  name?: string;
}

export interface FormData {
  title: string;
  caption: string;
  scheduledTime: string;
  selectedPlatforms: string[];
  hashtags: string[];
  mediaFiles: MediaFile[];
}

export const usePostFormData = (initialData?: Partial<FormData>) => {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    caption: "",
    scheduledTime: "",
    selectedPlatforms: [],
    hashtags: [],
    mediaFiles: [],
    ...initialData,
  });

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const combineDateTime = (date: string, time: string): string => {
    if (!date || !time) return "";
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const dateObj = new Date(date);
      dateObj.setHours(hours, minutes, 0, 0);
      return dateObj.toISOString();
    } catch (error) {
      console.error("Error combining date and time:", error);
      return "";
    }
  };

  const parseDateTime = (isoString: string) => {
    if (!isoString) return { date: "", time: "" };
    try {
      const date = new Date(isoString);
      const dateString = date.toISOString().split("T")[0];
      const timeString = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      return { date: dateString, time: timeString };
    } catch (error) {
      console.error("Error parsing date time:", error);
      return { date: "", time: "" };
    }
  };

  return {
    formData,
    setFormData,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    error,
    setError,
    combineDateTime,
    parseDateTime,
  };
};
