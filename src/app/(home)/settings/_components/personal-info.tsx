"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useState } from "react";
import { UpdateUser } from "@/types/user";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PersonalInfoFormProps {
  formData: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      email: string;
      first_name: string;
      last_name: string;
      phone_number: string;
    }>
  >;
  onSubmit: (data: UpdateUser) => Promise<void>;
  loading: boolean;
  role: string;
}

export function PersonalInfoForm({
  formData,
  setFormData,
  onSubmit,
  loading,
  role,
}: PersonalInfoFormProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    try {
      console.log("Submitting profile update with data:", {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
      });

      await onSubmit({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
      });

      setShowConfirmModal(false);
    } catch (error) {
      console.error("Error in confirmSubmit:", error);
    }
  };

  return (
    <>
      <ShowcaseSection title="Personal Information" className="!p-7">
        {loading ? (
          <div className="flex justify-center py-4">Loading user data...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <label
                  htmlFor="first_name"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div className="w-full sm:w-1/2">
                <label
                  htmlFor="last_name"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>
            <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  Role
                </label>
                <input
                  disabled
                  type="text"
                  id="role"
                  name="role"
                  value={role}
                  placeholder="Your role"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label
                  htmlFor="phone_number"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  Phone Number
                </label>
                <PhoneInput
                  country={"us"}
                  value={formData.phone_number}
                  onChange={(phone) =>
                    setFormData((prev) => ({ ...prev, phone_number: phone }))
                  }
                  inputClass="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>

            <div className="mb-5.5">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@email.com"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    first_name: "",
                    last_name: "",
                    phone_number: "",
                    email: "",
                  }))
                }
                className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </ShowcaseSection>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition">
          <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm Changes
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to save these changes?
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                disabled={loading}
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
