"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { FiBold, FiItalic, FiList, FiLink } from "react-icons/fi";

interface SimpleWysiwygProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-800">
      {/* Bold */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded p-2 ${
          editor.isActive("bold")
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
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded p-2 ${
          editor.isActive("italic")
            ? "bg-gray-300 dark:bg-gray-700"
            : "hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        title="Italic"
      >
        <FiItalic />
      </button>

      {/* Bullet List */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded p-2 ${
          editor.isActive("bulletList")
            ? "bg-gray-300 dark:bg-gray-700"
            : "hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        title="Bullet List"
      >
        <FiList />
      </button>

      {/* Link */}
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("Enter URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`rounded p-2 ${
          editor.isActive("link")
            ? "bg-gray-300 dark:bg-gray-700"
            : "hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        title="Add Link"
      >
        <FiLink />
      </button>
    </div>
  );
};

export const SimpleWysiwyg = ({ value, onChange }: SimpleWysiwygProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading since it's not needed for captions
        heading: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 hover:text-blue-700 underline",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] bg-white p-4 focus:outline-none dark:bg-gray-800 dark:text-white",
      },
    },
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <div className="overflow-hidden rounded-md border border-gray-300 dark:border-gray-600">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="min-h-[120px]" />
    </div>
  );
};
