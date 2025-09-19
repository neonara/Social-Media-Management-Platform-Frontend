"use client";

import React from "react";
import { Search } from "lucide-react";

type Props = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export default function ListSearchBar({
  placeholder = "Search by Name",
  value,
  onChange,
  className = "",
}: Props) {
  return (
    <div
      className={`ml-4 flex items-center rounded-md border border-gray-300 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 ${className}`}
    >
      <Search className="ml-2 text-gray-500 dark:text-gray-400" size={16} />
      <input
        type="text"
        placeholder={placeholder}
        className="block w-48 bg-transparent p-3 text-gray-900 placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400 sm:text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
