"use client";

import { useThemedToast } from "@/hooks/useThemedToast";
import { analyzeMoodAndTone, improveCaption } from "@/services/aiService";
import { formatCaptionWithHashtags } from "@/utils/captionFormatter";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Link2, List, Loader, Sparkles } from "lucide-react";
import React, { useState } from "react";

interface SimpleWysiwygProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  caption?: string;
}

const MenuBar = ({
  editor,
  onImproveCaption,
  onAnalyzeMood,
  caption,
  improvingCaption,
  analyzingMood,
}: {
  editor: ReturnType<typeof useEditor>;
  onImproveCaption?: () => void;
  onAnalyzeMood?: () => void;
  caption: string;
  improvingCaption?: boolean;
  analyzingMood?: boolean;
}) => {
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
        <Bold size={16} />
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
        <Italic size={16} />
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
        <List size={16} />
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
        <Link2 size={16} />
      </button>

      <div className="ml-auto flex gap-2">
        {/* Improve Caption */}
        {onImproveCaption && (
          <button
            type="button"
            onClick={onImproveCaption}
            disabled={improvingCaption || !caption.trim()}
            className="flex items-center justify-center gap-2 rounded-md bg-green-500 px-3 py-2 font-medium text-white hover:bg-green-600 disabled:bg-gray-400 dark:hover:bg-green-600"
          >
            {improvingCaption ? (
              <>
                <Loader size={16} className="animate-spin" />
                Improving...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Improve Caption
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export const SimpleWysiwyg = ({
  value,
  onChange,
  caption = value,
}: SimpleWysiwygProps) => {
  const [improvingCaption, setImprovingCaption] = useState(false);
  const [analyzingMood, setAnalyzingMood] = useState(false);
  const editor = useEditor({
    immediatelyRender: false, // Prevent SSR hydration mismatches
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

  const themedToast = useThemedToast();

  const handleImproveCaption = async () => {
    if (!caption.trim()) {
      themedToast.error("Please write a caption first");
      return;
    }

    setImprovingCaption(true);
    try {
      const response = await improveCaption(caption, "instagram");
      if (response.improved_caption) {
        const formattedCaption = formatCaptionWithHashtags(
          response.improved_caption,
        );
        onChange(formattedCaption);
        themedToast.success("Caption improved successfully!");
      } else {
        themedToast.error("Failed to improve caption");
      }
    } catch (error) {
      console.error("Failed to improve caption:", error);
      themedToast.error("Failed to improve caption. Please try again.");
    } finally {
      setImprovingCaption(false);
    }
  };

  const handleAnalyzeMood = async () => {
    if (!caption.trim()) {
      themedToast.error("Please write a caption first");
      return;
    }

    setAnalyzingMood(true);
    try {
      const response = await analyzeMoodAndTone(caption);
      themedToast.success(
        `Mood: ${response.mood} | Tone: ${response.tone} (${Math.round(response.confidence * 100)}% confident)`,
      );
    } catch (error) {
      console.error("Failed to analyze mood:", error);
      themedToast.error("Failed to analyze mood. Please try again.");
    } finally {
      setAnalyzingMood(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-gray-300 dark:border-gray-600">
      <MenuBar
        editor={editor}
        caption={caption}
        onImproveCaption={handleImproveCaption}
        onAnalyzeMood={handleAnalyzeMood}
        improvingCaption={improvingCaption}
        analyzingMood={analyzingMood}
      />
      <EditorContent editor={editor} className="min-h-[120px]" />
    </div>
  );
};
