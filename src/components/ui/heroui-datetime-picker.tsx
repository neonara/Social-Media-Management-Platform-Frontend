"use client";

import React from "react";
import { DatePicker } from "@heroui/react";
import {
  now,
  getLocalTimeZone,
  parseDateTime,
  DateValue,
} from "@internationalized/date";

interface HeroUIDateTimePickerProps {
  value?: string; // ISO string format
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
}

export const HeroUIDateTimePicker: React.FC<HeroUIDateTimePickerProps> = ({
  value,
  onChange,
  className = "",
  label,
  isDisabled = false,
  isRequired = false,
}) => {
  // Parse the ISO string into DateValue format
  const parseValue = (isoString?: string) => {
    if (!isoString) return now(getLocalTimeZone());

    try {
      // Parse the ISO string directly using @internationalized/date
      return parseDateTime(isoString);
    } catch (error) {
      console.error("Error parsing datetime:", error);
      return now(getLocalTimeZone());
    }
  };

  const currentValue = parseValue(value);

  const handleChange = (newValue: DateValue | null) => {
    if (newValue) {
      try {
        // Check if it's a DateTime object with time properties
        const hasTime = "hour" in newValue && "minute" in newValue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hour = hasTime ? (newValue as any).hour : 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const minute = hasTime ? (newValue as any).minute : 0;

        // Convert DateValue to ISO string
        const dateObj = new Date(
          newValue.year,
          newValue.month - 1,
          newValue.day,
          hour,
          minute,
        );
        onChange(dateObj.toISOString());
      } catch (error) {
        console.error("Error converting datetime:", error);
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {isRequired && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <DatePicker
        value={currentValue}
        onChange={handleChange}
        hideTimeZone
        showMonthAndYearPickers
        label="Select Date & Time"
        variant="faded"
        isDisabled={isDisabled}
        isRequired={isRequired}
        className="w-full"
        size="md"
        radius="md"
      />
    </div>
  );
};
