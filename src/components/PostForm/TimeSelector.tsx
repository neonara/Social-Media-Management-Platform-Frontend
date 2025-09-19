"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeSelectorProps {
  value?: string; // Time in HH:MM format (24-hour)
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  value,
  onChange,
  className = "",
  label = "Time",
  isDisabled = false,
  isRequired = false,
}) => {
  // Generate time options with 5-minute intervals starting from current time
  const generateTimeOptions = () => {
    const now = new Date();
    const options: { value: string; label: string }[] = [];

    // Start from current time rounded to next 5-minute interval
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const roundedMinutes = Math.ceil(currentMinutes / 5) * 5;

    let startHours = currentHours;
    let startMinutes = roundedMinutes;

    // Handle minute overflow
    if (startMinutes >= 60) {
      startHours += 1;
      startMinutes = 0;
    }

    // Generate 288 time slots (24 hours worth of 5-minute intervals)
    for (let i = 0; i < 288; i++) {
      // 288 = 24 * 60 / 5
      const hours = (startHours + Math.floor((startMinutes + i * 5) / 60)) % 24;
      const minutes = (startMinutes + i * 5) % 60;

      // Only show times with minutes ending in 0 or 5
      if (minutes % 5 === 0) {
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours < 12 ? "am" : "pm";
        const timeString = `${hour12}:${minutes.toString().padStart(2, "0")}${ampm}`;
        const valueString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

        options.push({
          value: valueString,
          label: timeString,
        });
      }
    }

    return options;
  };

  const timeOptions = generateTimeOptions();

  // Get current value or default to first available time
  const currentValue = value || timeOptions[0]?.value || "00:00";

  const handleChange = (newTime: string) => {
    onChange(newTime);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {isRequired && <span className="ml-1 text-red-500">*</span>}
      </label>

      <Select
        value={currentValue}
        onValueChange={handleChange}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {timeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
