"use client";

import React from "react";

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
  // Parse the value into YYYY-MM-DD format for input
  const parseValue = (dateValue?: string): string => {
    if (!dateValue) return "";

    try {
      // Handle both ISO strings and date-only strings
      const date = new Date(dateValue);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "";
      }

      // Return date in YYYY-MM-DD format for input
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error parsing date:", error);
      return "";
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    onChange(dateValue);
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date();
  const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {isRequired && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type="date"
        value={parseValue(value)}
        onChange={handleDateChange}
        disabled={isDisabled}
        required={isRequired}
        min={todayString}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-100"
      />
    </div>
  );
};
