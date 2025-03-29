"use client";
import { EmailIcon, UserIcon } from "@/assets/icons";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // For navigation
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";
// import Dropdown from "@/components/FormElements/Dropdown"; // Assuming a Dropdown component exists

export default function CreateUser() {
  const [data, setData] = useState({ email: "", role: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false); // Authorization state
  const router = useRouter();

  useEffect(() => {
    // Simulate fetching user data
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/auth/me", {
          method: "GET",
          credentials: "include", // Include cookies for authentication
        });

        if (response.ok) {
          const user = await response.json();
          if (user.role === "admin") {
            setIsAuthorized(true);
          } else {
            setError("You are not authorized to create accounts.");
          }
        } else {
          router.push("/login"); // Redirect to login if not authenticated
        }
      } catch {
        router.push("/login"); // Redirect to login on error
      }
    };

    fetchUser();
  }, [router]);

  const roles = [
    { value: "client", label: "Client" },
    { value: "moderator", label: "Moderator" },
    { value: "community_manager", label: "Community Manager" },
    { value: "administrator", label: "Administrator" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, email: e.target.value });
    setError(""); // Clear error on input change
    setSuccess(""); // Clear success message on input change
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!data.role) {
      setError("Please select a role.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/create-user/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create user.");
      } else {
        setSuccess("User created successfully!");
        setData({ email: "", role: "" }); // Clear input fields
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="w-5/6 max-w-150 rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card sm:p-8 xl:p-10">
        <p className="text-center text-red-500">{error || "Loading..."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-5/6 max-w-150 rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <form onSubmit={handleSubmit} className="w-full p-4 sm:p-8 xl:p-10">
          <h2 className="sm:text-title-xl2 mb-9 text-2xl font-bold text-black dark:text-white">
            Create a new user account
          </h2>
          <InputGroup
            type="email"
            label="Email"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter email address"
            name="email"
            handleChange={handleChange}
            value={data.email}
            icon={<EmailIcon />}
          />
          <Select
            className="mb-8"
            label="Select Role"
            items={roles}
            defaultValue={roles[0].value}
            prefixIcon={<UserIcon />}
            placeholder="Select a role"
          />
          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
          {success && <p className="mb-4 text-sm text-green-500">{success}</p>}

          <div className="mb-4.5">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
            >
              Submit
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
