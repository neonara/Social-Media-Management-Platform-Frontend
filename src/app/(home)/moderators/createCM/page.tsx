"use client";
import { EmailIcon } from "@/assets/icons";
import { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { Alert } from "@/components/ui-elements/alert/index";
import { createCM } from "@/services/moderatorsService";
import { useRouter } from "next/navigation";
import { FormEvent, ChangeEvent } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

export default function CreateCM() {
  const [formData, setFormData] = useState({ email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await createCM({
        email: formData.email,
        role: "community_manager",
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setAlertMessage("Community Manager created successfully!");
        setShowAlert(true);
        setFormData({ email: "" });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <Breadcrumb pageName="Create CM" />
      {/* Your Create CM UI */}
      <div className="m-auto w-5/6 max-w-150 rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <form onSubmit={handleSubmit} className="w-full p-4 sm:p-8 xl:p-10">
          <h2 className="sm:text-title-xl2 mb-9 text-2xl font-bold text-black dark:text-white">
            Create a new Community Manager
          </h2>
          <InputGroup
            type="email"
            label="Email"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter email address"
            name="email"
            handleChange={handleChange}
            value={formData.email}
            icon={<EmailIcon />}
          />
          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
          <div className="mb-4.5">
            <button
              type="submit"
              disabled={loading}
              className="mb-2.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-80"
            >
              Submit
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
              )}
            </button>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-300 p-4 font-medium text-gray-700 transition hover:bg-gray-400 disabled:opacity-80"
              onClick={() => router.back()}
            >
              Go Back
            </button>
          </div>
        </form>
      </div>
      {showAlert && (
        <div className="animate-fade-in fixed bottom-4 right-4 z-50">
          <Alert variant="success" title="Success" description={alertMessage} />
        </div>
      )}
    </>
  );
}
