"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiType,
  FiMaximize2,
} from "react-icons/fi";

type FormatType =
  | "bold"
  | "italic"
  | "underline"
  | "fontName"
  | "fontSize"
  | "justifyLeft"
  | "justifyRight"
  | "justifyCenter";

interface SimpleWysiwygProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FONT_FAMILIES = [
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Helvetica", value: "Helvetica, sans-serif" },
  { name: "Times New Roman", value: "Times New Roman, serif" },
  { name: "Courier New", value: "Courier New, monospace" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Tahoma", value: "Tahoma, sans-serif" },
  { name: "Impact", value: "Impact, fantasy" },
  { name: "Comic Sans", value: "Comic Sans MS, cursive" },
  { name: "Lucida Console", value: "Lucida Console, monospace" },
];

const FONT_SIZES = [
  { name: "Tiny", value: "1" },
  { name: "Small", value: "2" },
  { name: "Normal", value: "3" },
  { name: "Medium", value: "4" },
  { name: "Large", value: "5" },
  { name: "Extra Large", value: "6" },
  { name: "Huge", value: "7" },
];

export const SimpleWysiwyg = ({
  value,
  onChange,
  placeholder = "Write your content here...",
}: SimpleWysiwygProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<FormatType>>(
    new Set(),
  );

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      onChange(newValue);
    }
    updateActiveFormats();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const toggleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateActiveFormats();
    editorRef.current?.focus();
  };

  const updateActiveFormats = () => {
    const newFormats = new Set<FormatType>();
    const commands: FormatType[] = [
      "bold",
      "italic",
      "underline",
      "justifyLeft",
      "justifyCenter",
      "justifyRight",
    ];

    commands.forEach((cmd) => {
      if (document.queryCommandState(cmd)) {
        newFormats.add(cmd as FormatType);
      }
    });

    setActiveFormats(newFormats);
  };

  return (
    <div className="overflow-hidden rounded-md border border-gray-300 dark:border-gray-600">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-800">
        {/* Font Family */}
        <div className="relative">
          <FiType className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500" />
          <select
            onChange={(e) => toggleFormat("fontName", e.target.value)}
            className="appearance-none rounded border border-gray-300 bg-white py-2 pl-10 pr-4 dark:border-gray-600 dark:bg-gray-700"
          >
            {FONT_FAMILIES.map((font) => (
              <option
                key={font.value}
                value={font.value}
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="relative">
          <FiMaximize2 className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500" />
          <select
            onChange={(e) => toggleFormat("fontSize", e.target.value)}
            className="appearance-none rounded border border-gray-300 bg-white py-2 pl-10 pr-4 dark:border-gray-600 dark:bg-gray-700"
          >
            {FONT_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bold */}
        <button
          type="button"
          onClick={() => toggleFormat("bold")}
          className={`rounded p-2 ${
            activeFormats.has("bold")
              ? "bg-gray-300 dark:bg-gray-700"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title="Bold"
        >
          <FiBold />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => toggleFormat("italic")}
          className={`rounded p-2 ${
            activeFormats.has("italic")
              ? "bg-gray-300 dark:bg-gray-700"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title="Italic"
        >
          <FiItalic />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => toggleFormat("underline")}
          className={`rounded p-2 ${
            activeFormats.has("underline")
              ? "bg-gray-300 dark:bg-gray-700"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title="Underline"
        >
          <FiUnderline />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-[200px] bg-white p-4 focus:outline-none dark:bg-gray-800 dark:text-white"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        spellCheck={true} // Enable browser's built-in spellcheck
      />
    </div>
  );
};
