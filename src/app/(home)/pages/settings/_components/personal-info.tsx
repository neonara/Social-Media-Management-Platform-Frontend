"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useState, useEffect } from "react";
import { updateUserProfile, getUserById } from "@/services/userService";
import { getUserRole, UserRole } from "@/types/user";

export function PersonalInfoForm() {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role: "",
    user_image: "",
  });

  const [loading, setLoading] = useState(true);

  const id = 1;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(id);
        const role = getUserRole(userData);
        console.log("User data:", userData);
        setFormData({
          email: userData.email || "",
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          phone_number: userData.phone_number || "",
          role: role || "",
          user_image: userData.user_image || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // const handleRoleChange = (value: string) => {
  //   setFormData((prev) => ({ ...prev, role: value as UserRole }));
  // };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await updateUserProfile(id, {
        ...formData,
        role: formData.role as UserRole,
      });
      // Add success notification here
    } catch (error) {
      console.error("Error updating user profile:", error);
      // Add error notification here
    }
  };

  return (
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
            {/* <div className="w-full sm:w-1/2">
              <Select
                className="mb-2"
                label="Role"
                items={roles}
                value={formData.role}
                prefixIcon={<UserIcon />}
                placeholder="Select a role"
                onChange={(value) => handleRoleChange(value)} // Use the reusable function
              />
            </div> */}

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
                value={formData.role}
                placeholder="+990 3343 7865"
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
              <input
                type="number"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+990 3343 7865"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
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
              placeholder="devidjohn45@gmail.com"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  username: "",
                  full_name: "",
                  phone_number: "",
                  email: "",
                }))
              }
              className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </ShowcaseSection>
  );
}
