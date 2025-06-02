"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { PersonalInfoForm } from "./_components/personal-info";
import { UploadPhotoForm } from "./_components/upload-photo";
import { SocialMediaConnections } from "./_components/social-media-connection";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { updateUserProfile, deleteProfileImage } from "@/services/userService";
import { useNotification } from "@/context/NotificationContext";
import { UpdateUser } from "@/types/user";

export default function SettingsPage() {
  const { role, userProfile, refreshUserProfile } = useUser();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });

  const [loading, setLoading] = useState(false);

  // Sync form data with user profile
  useEffect(() => {
    if (userProfile) {
      setFormData({
        email: userProfile.email || "",
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        phone_number: userProfile.phone_number || "",
      });
    }
  }, [userProfile]);

  const handleProfileUpdates = async (
    updatedData: Partial<UpdateUser>,
    imageFile?: File,
    deleteImage?: boolean,
  ) => {
    try {
      setLoading(true);

      // Handle image deletion using the delete service
      if (deleteImage) {
        const result = await deleteProfileImage();
        if (result && "error" in result) {
          throw new Error(result.error);
        }
        await refreshUserProfile();
        // showNotification(
        //   "Profile image deleted successfully!",
        //   "success",
        //   "Image Deleted",
        // );
        return;
      }

      // Filter out empty/undefined fields
      const filteredData: UpdateUser = {};
      if (updatedData.email && updatedData.email.trim()) {
        filteredData.email = updatedData.email.trim();
      }
      if (updatedData.first_name && updatedData.first_name.trim()) {
        filteredData.first_name = updatedData.first_name.trim();
      }
      if (updatedData.last_name && updatedData.last_name.trim()) {
        filteredData.last_name = updatedData.last_name.trim();
      }
      if (updatedData.phone_number && updatedData.phone_number.trim()) {
        filteredData.phone_number = updatedData.phone_number.trim();
      }

      // Use the unified updateUserProfile function that handles both data and images
      const result = await updateUserProfile(
        userProfile?.id || 0,
        filteredData,
        imageFile,
      );

      if (result && "error" in result) {
        throw new Error(result.error);
      }

      await refreshUserProfile();

      if (imageFile) {
        showNotification(
          "Profile image updated successfully!",
          "success",
          "Image Updated",
        );
      } else {
        showNotification(
          "Profile updated successfully!",
          "success",
          "Update Complete",
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification(
        "Failed to update profile. Please try again.",
        "error",
        "Update Failed",
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName="Settings" />

      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-5 xl:col-span-3">
          <PersonalInfoForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleProfileUpdates}
            loading={loading}
            role={role}
          />
        </div>
        <div className="col-span-5 xl:col-span-2">
          <UploadPhotoForm
            userImage={userProfile?.user_image}
            onSubmit={handleProfileUpdates}
            loading={loading}
          />
        </div>
      </div>
      {role === "client" && <SocialMediaConnections />}
    </div>
  );
}
