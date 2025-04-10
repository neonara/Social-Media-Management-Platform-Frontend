"use client";
import { EmailIcon, UserIcon } from "@/assets/icons";
import React, { useState, useEffect } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";
import { createUser } from "@/services/authService";
import { Alert } from "@/components/ui-elements/alert/index";

export default function CreateUser() {
  const [data, setData] = useState({ email: "", role: "client" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const roles = [
    { value: "client", label: "Client" },
    { value: "moderator", label: "Moderator" },
    { value: "community_manager", label: "Community Manager" },
    { value: "administrator", label: "Administrator" },
  ];

  // Auto-dismiss alert after 3 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const showSuccessAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, email: e.target.value });
    setError("");
  };

  const handleRoleChange = (value: string) => {
    setData({ ...data, role: value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await createUser(data);

      if (response.error) {
        setError(response.error);
      } else {
        showSuccessAlert(
          `Successfully created ${data.role} account for ${data.email}`,
        );
        setData({ email: "", role: "client" }); // Reset form
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

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
            handleChange={handleEmailChange}
            value={data.email}
            icon={<EmailIcon />}
          />

          <Select
            className="mb-8"
            label="Select Role"
            items={roles}
            value={data.role}
            prefixIcon={<UserIcon />}
            placeholder="Select a role"
            onChange={handleRoleChange}
          />

          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

          <div className="mb-4.5">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-80"
            >
              Submit
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Alert */}
      {showAlert && (
        <div className="animate-fade-in fixed bottom-4 right-4 z-50">
          <Alert variant="success" title="Success" description={alertMessage} />
        </div>
      )}
    </>
  );
}
