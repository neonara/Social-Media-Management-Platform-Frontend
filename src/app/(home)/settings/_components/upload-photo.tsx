"use client";

import { UploadIcon } from "@/assets/icons";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import Image from "next/image";
import { useState } from "react";
import { getImageUrl } from "@/utils/image-url";
import { UpdateUser } from "@/types/user";

interface UploadPhotoFormProps {
  userImage?: string | null;
  onSubmit: (
    updatedData: Partial<UpdateUser>,
    imageFile?: File,
    deleteImage?: boolean,
  ) => Promise<void>;
  loading: boolean;
}

export function UploadPhotoForm({
  userImage,
  onSubmit,
  loading,
}: UploadPhotoFormProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setErrorMessage(
          "Please select a valid image file (PNG, JPG, JPEG or GIF)",
        );
        return;
      }

      // Validate file size (1500KB max)
      if (file.size > 1500 * 1024) {
        setErrorMessage("Image size should be less than 1500KB");
        return;
      }

      setSelectedFile(file);

      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePhoto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      // Use the centralized function
      await onSubmit({}, selectedFile);

      // Clear the preview and selected file on success
      setPreviewImage(null);
      setSelectedFile(null);

      // Reset the file input
      const fileInput = document.getElementById(
        "profilePhoto",
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload photo",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const deleteProfilePhoto = async () => {
    try {
      setIsDeletingPhoto(true);
      setErrorMessage(null);

      // Use the centralized function
      await onSubmit({}, undefined, true);
    } catch (error) {
      console.error("Error deleting profile photo:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete photo",
      );
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleCancel = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setErrorMessage(null);

    // Reset the file input
    const fileInput = document.getElementById(
      "profilePhoto",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <ShowcaseSection title="Your Photo" className="!p-7">
      <form onSubmit={uploadProfilePhoto}>
        <div className="mb-4 flex items-center gap-3">
          <Image
            src={previewImage || getImageUrl(userImage)}
            width={55}
            height={55}
            alt="User"
            className="size-14 rounded-full object-cover"
            quality={90}
            onError={(e) => {
              console.error("Error loading image in UploadPhotoForm:", e);
              // Fallback to default image if there's a loading error
              e.currentTarget.src = "/images/user/user-03.png";
            }}
          />

          <div>
            <span className="mb-1.5 font-medium text-dark dark:text-white">
              Edit your photo
            </span>
            <span className="flex gap-3">
              <button
                type="button"
                className="text-body-sm hover:text-red disabled:opacity-50"
                onClick={deleteProfilePhoto}
                disabled={isDeletingPhoto || loading || !userImage}
              >
                {isDeletingPhoto ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                className="text-body-sm hover:text-primary"
                onClick={() => document.getElementById("profilePhoto")?.click()}
              >
                Update
              </button>
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 text-sm text-red">{errorMessage}</div>
        )}

        <div className="relative mb-5.5 block w-full rounded-xl border border-dashed border-gray-4 bg-gray-2 hover:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-primary">
          <input
            type="file"
            name="profilePhoto"
            id="profilePhoto"
            accept="image/png, image/jpg, image/jpeg, image/gif"
            hidden
            onChange={handleFileSelect}
          />

          <label
            htmlFor="profilePhoto"
            className="flex cursor-pointer flex-col items-center justify-center p-4 sm:py-7.5"
          >
            <div className="flex size-13.5 items-center justify-center rounded-full border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark">
              <UploadIcon />
            </div>

            <p className="mt-2.5 text-body-sm font-medium">
              <span className="text-primary">Click to upload</span> or drag and
              drop
            </p>

            <p className="mt-1 text-body-xs">
              SVG, PNG, JPG or GIF (max 1500KB)
            </p>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            className="flex justify-center rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 disabled:opacity-50 dark:border-dark-3 dark:text-white"
            type="button"
            onClick={handleCancel}
            disabled={isUploading || loading || !selectedFile}
          >
            Cancel
          </button>
          <button
            className="flex items-center justify-center rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90 disabled:opacity-50"
            type="submit"
            disabled={isUploading || loading || !selectedFile}
          >
            {isUploading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </ShowcaseSection>
  );
}
