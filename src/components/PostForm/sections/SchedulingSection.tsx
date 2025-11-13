"use client";

import React from "react";
import { DateSelector } from "../DateSelector";
import { TimeSelector } from "../TimeSelector";

interface SchedulingSectionProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

export const SchedulingSection: React.FC<SchedulingSectionProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        Schedule Post
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="date"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <DateSelector value={selectedDate} onChange={onDateChange} />
        </div>

        <div>
          <label
            htmlFor="time"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Time <span className="text-red-500">*</span>
          </label>
          <TimeSelector value={selectedTime} onChange={onTimeChange} />
        </div>
      </div>

      {selectedDate && selectedTime && (
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900">
          <p className="text-sm text-blue-800 dark:text-blue-100">
            📅 Scheduled for:{" "}
            <span className="font-semibold">
              {selectedDate} at {selectedTime}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
