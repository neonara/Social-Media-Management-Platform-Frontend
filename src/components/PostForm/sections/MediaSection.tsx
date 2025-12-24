"use client";

import { Button } from "@/components/ui-elements/button";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import React from "react";

interface MediaFile {
  id?: number | string;
  preview: string;
  file?: File;
  name?: string;
}

interface MediaSectionProps {
  mediaFiles: MediaFile[];
  uploadProgress: number | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveMedia: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  videoInputRef: React.RefObject<HTMLInputElement>;
}

// Draggable item component
const DraggableMediaItem: React.FC<{
  id: string;
  media: MediaFile;
  index: number;
  onRemove: () => void;
}> = ({ id, media, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative cursor-move overflow-hidden rounded-lg bg-gray-200 transition-opacity hover:opacity-75 dark:bg-gray-700"
      {...attributes}
      {...listeners}
    >
      <Image
        src={media.preview}
        alt={`Media ${index}`}
        width={120}
        height={120}
        className="h-32 w-full object-cover"
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
        style={{ pointerEvents: "auto" }}
      >
        <X size={16} />
      </button>
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-center text-xs text-white">
        {index + 1}
      </div>
    </div>
  );
};

export const MediaSection: React.FC<MediaSectionProps> = ({
  mediaFiles,
  uploadProgress,
  onFileChange,
  onRemoveMedia,
  onDragEnd,
  fileInputRef,
  videoInputRef,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        Media Files
      </h3>

      <div className="flex gap-2">
        <Button
          label={
            uploadProgress !== null
              ? `Uploading... ${uploadProgress}%`
              : "Upload Images"
          }
          icon={<Upload size={18} />}
          onClick={() => fileInputRef.current?.click()}
          variant="outlinePrimary"
          disabled={uploadProgress !== null}
        />
        <Button
          label="Upload Videos"
          icon={<Upload size={18} />}
          onClick={() => videoInputRef.current?.click()}
          variant="outlinePrimary"
          disabled={uploadProgress !== null}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        aria-label="Upload images"
      />
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={onFileChange}
        className="hidden"
        aria-label="Upload videos"
      />

      {mediaFiles.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Media Preview ({mediaFiles.length})
          </label>
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={mediaFiles.map((_, i) => `media-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {mediaFiles.map((media, index) => (
                  <DraggableMediaItem
                    key={`media-${index}`}
                    id={`media-${index}`}
                    media={media}
                    index={index}
                    onRemove={() => onRemoveMedia(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {mediaFiles.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-600 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No media files yet</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Upload images or videos to preview them here
          </p>
        </div>
      )}
    </div>
  );
};
