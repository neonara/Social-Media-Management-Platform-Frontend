"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useCallback, useEffect, useState } from "react";

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
  // Parse the 24-hour time value into hour, minute, and period
  const parseTime = useCallback((timeValue?: string) => {
    if (!timeValue) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = Math.ceil(now.getMinutes() / 5) * 5; // Round to next 5-minute interval

      return {
        hour: currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour,
        minute: currentMinute >= 60 ? 0 : currentMinute,
        period: currentHour < 12 ? "AM" : "PM"
      };
    }

    const [hours, minutes] = timeValue.split(":").map(Number);
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours < 12 ? "AM" : "PM";

    return {
      hour: hour12,
      minute: minutes,
      period: period
    };
  }, []);

  // Convert 12-hour format back to 24-hour format
  const formatTo24Hour = useCallback((hour: number, minute: number, period: string): string => {
    let hour24 = hour;

    if (period === "AM" && hour === 12) {
      hour24 = 0;
    } else if (period === "PM" && hour !== 12) {
      hour24 = hour + 12;
    }

    return `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }, []);

  const { hour: initialHour, minute: initialMinute, period: initialPeriod } = parseTime(value);

  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);

  // Update internal state when value prop changes
  useEffect(() => {
    const { hour, minute, period } = parseTime(value);
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
  }, [value, parseTime]);

  // Handle changes and update parent component
  const handleTimeChange = useCallback((hour: number, minute: number, period: string) => {
    const time24Hour = formatTo24Hour(hour, minute, period);
    onChange(time24Hour);
  }, [onChange, formatTo24Hour]);

  const handleHourChange = useCallback((newHour: string) => {
    const hour = Number(newHour);
    setSelectedHour(hour);
    handleTimeChange(hour, selectedMinute, selectedPeriod);
  }, [selectedMinute, selectedPeriod, handleTimeChange]);

  const handleMinuteChange = useCallback((newMinute: string) => {
    const minute = Number(newMinute);
    setSelectedMinute(minute);
    handleTimeChange(selectedHour, minute, selectedPeriod);
  }, [selectedHour, selectedPeriod, handleTimeChange]);

  const handlePeriodChange = useCallback((newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    handleTimeChange(selectedHour, selectedMinute, newPeriod);
  }, [selectedHour, selectedMinute, handleTimeChange]);

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }));

  // Generate minute options (5-minute intervals)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i * 5).toString(),
    label: (i * 5).toString().padStart(2, "0")
  }));

  // Period options
  const periodOptions = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" }
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {isRequired && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className="flex gap-2">
        {/* Hour Selector */}
        <Select
          value={selectedHour.toString()}
          onValueChange={handleHourChange}
          disabled={isDisabled}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder="Hr" />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="flex items-center text-gray-500 dark:text-gray-400">:</span>

        {/* Minute Selector */}
        <Select
          value={selectedMinute.toString()}
          onValueChange={handleMinuteChange}
          disabled={isDisabled}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* AM/PM Selector */}
        <Select
          value={selectedPeriod}
          onValueChange={handlePeriodChange}
          disabled={isDisabled}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
