"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import axios from "axios";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export function PersonalInfoForm() {
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    phone_number: "",
    email: "" as string | undefined, // Allow email to be undefined
  });
  
  const [loading, setLoading] = useState(true);
  
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/users/", 
          { withCredentials: true }
        );
        const user = response.data;
        setFormData({
          username: user.username,
          full_name: user.full_name,
          phone_number: user.phone_number,
          email: user.email,
        });
        setLoading(false); 
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Failed to fetch user data.");
        setLoading(false); 
      }
    };
  
    fetchUserData();
  }, []); 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const updatedData = { ...formData };
  
   
    if (formData.email === formData.email) {  
      delete updatedData.email;
    }
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1];
    console.log("CSRF Token:", csrfToken); 
  
    try {
      const response = await axios.put(
        "http://localhost:8000/api/users/update-profile/",  
        updatedData,
        {
          withCredentials: true,  
          headers: {
            'X-CSRFToken': csrfToken, 
          }
        }
      );
      
      toast.success("Profile updated successfully!");
      console.log("Update success:", response.data);
    } catch (error: unknown) {
      const errMsg =
        axios.isAxiosError(error) && error.response
          ? error.response.data?.message || "Update failed!"
          : "An unexpected error occurred.";
  
      console.error("Update failed:", error);
      toast.error(errMsg);
    }
  };
  
  
  return (
    <ShowcaseSection title="Personal Information" className="!p-7">
      <form onSubmit={handleSubmit}>
        <div className="mb-5.5">
          <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="your_username"
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
        </div>

        <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
          <div className="w-full sm:w-1/2">
            <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="David Jhon"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div className="w-full sm:w-1/2">
            <label htmlFor="phone_number" className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
              Phone Number
            </label>
            <input
              type="text"
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
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email ?? ""}
            onChange={handleChange}
            placeholder="devidjond45@gmail.com"
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setFormData({ username: "", full_name: "", phone_number: "", email: undefined })}
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
    </ShowcaseSection>
  );
}
