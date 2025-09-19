"use client";

import React from "react";
import { DatePicker } from "@heroui/date-picker";
import {
  today,
  getLocalTimeZone,
  parseDate,
  DateValue,
} from "@internationalized/date";

interface DateSelectorProps {
  value?: string; // Date in YYYY-MM-DD format or ISO string
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  value,
  onChange,
  className = "",
  label = "Date",
  isDisabled = false,
  isRequired = false,
}) => {
  // Parse the value into DateValue format
  const parseValue = (dateValue?: string): DateValue => {
    if (!dateValue) return today(getLocalTimeZone());

    try {
      // Handle both ISO strings and date-only strings
      const date = new Date(dateValue);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      return parseDate(
        `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
      );
    } catch (error) {
      console.error("Error parsing date:", error);
      return today(getLocalTimeZone());
    }
  };

  const currentValue = parseValue(value);

  const handleChange = (newValue: DateValue | null) => {
    if (newValue) {
      try {
        // Return date in YYYY-MM-DD format
        const dateString = `${newValue.year}-${newValue.month.toString().padStart(2, "0")}-${newValue.day.toString().padStart(2, "0")}`;
        onChange(dateString);
      } catch (error) {
        console.error("Error converting date:", error);
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {isRequired && <span className="ml-1 text-red-500">*</span>}
      </label>

      <DatePicker
        value={currentValue}
        onChange={handleChange}
        showMonthAndYearPickers
        label={`Select ${label}`}
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
