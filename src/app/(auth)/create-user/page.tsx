// app/create-user/page.tsx
"use client";
import { EmailIcon, UserIcon } from "@/assets/icons";
import { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";
import { Alert } from "@/components/ui-elements/alert/index";
import { handleCreateUser } from "@/actions/createUser";
import { roles } from "@/types/user";

export default function CreateUser() {
  const [formData, setFormData] = useState({
    email: "",
    role: "client", // Set default value
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formDataObj = new FormData();
    formDataObj.append("email", formData.email);
    formDataObj.append("role", formData.role);

    const result = await handleCreateUser(formDataObj);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setAlertMessage(result.success);
      setShowAlert(true);
      setFormData({ email: "", role: "client" });
    }

    setLoading(false);
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
    setError("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
            handleChange={handleChange}
            value={formData.email}
            icon={<EmailIcon />}
          />

          <Select
            className="mb-8"
            label="Select Role"
            items={roles}
            value={formData.role}
            prefixIcon={<UserIcon />}
            placeholder="Select a role"
            onChange={(value) => handleRoleChange(value)}
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

      {showAlert && (
        <div className="animate-fade-in fixed bottom-4 right-4 z-50">
          <Alert variant="success" title="Success" description={alertMessage} />
        </div>
      )}
    </>
  );
}
