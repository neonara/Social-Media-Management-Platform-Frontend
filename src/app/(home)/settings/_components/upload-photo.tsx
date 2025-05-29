"use client";

import { UploadIcon } from "@/assets/icons";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import { useEffect, useState } from "react";
import { updateProfileImage, deleteProfileImage } from "@/services/userService";
import { getImageUrl } from "@/utils/image-url";

export function UploadPhotoForm() {
  const { userProfile, refreshUserProfile } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Clear preview when userProfile changes
    if (userProfile?.user_image) {
      setPreviewImage(null);
    }
  }, [userProfile]);

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

      console.log("Starting profile photo upload with file:", selectedFile);

      const result = await updateProfileImage(selectedFile);
      console.log("Upload profile image result:", result);

      if (result && "error" in result) {
        throw new Error(result.error);
      }

      // Refresh user profile to get updated image
      console.log("Upload successful, refreshing user profile...");
      await refreshUserProfile();
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

      const result = await deleteProfileImage();

      if (result && "error" in result) {
        throw new Error(result.error);
      }

      // Refresh user profile to update the UI
      await refreshUserProfile();
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
            src={previewImage || getImageUrl(userProfile?.user_image)}
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
                disabled={isDeletingPhoto || !userProfile?.user_image}
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
            disabled={isUploading || !selectedFile}
          >
            Cancel
          </button>
          <button
            className="flex items-center justify-center rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90 disabled:opacity-50"
            type="submit"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </ShowcaseSection>
  );
}
