// app/create-user/page.tsx
"use client";
import { EmailIcon, UserIcon } from "@/assets/icons";
import { useEffect, useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";
import { Alert } from "@/components/ui-elements/alert/index";
import { handleCreateUser } from "@/actions/createUser";
// import { roles } from "@/types/user";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUser } from "@/context/UserContext";

export default function CreateUser() {
  const [formData, setFormData] = useState({
    email: "",
    role: "client",
  });
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

  const { role } = useUser();

  const roles = [
    { value: "client", label: "Client" },
    { value: "community_manager", label: "Community Manager" },
    { value: "moderator", label: "Moderator" },
    { value: "administrator", label: "Administrator" },
  ];

  // Check if the user is an administrator or moderator
  if (
    role !== "administrator" &&
    role !== "moderator" &&
    role !== "super_administrator"
  ) {
    router.push("/");
    return null;
  }

  if (role === "administrator") {
    roles.splice(3, 1); // Remove Client role
  }

  if (role === "moderator") {
    roles.splice(0, 1); // Remove Client role
    roles.splice(1, 3); // Remove Rest of the roles
  }

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
      <Breadcrumb pageName="Create New User" />
      <div className="m-auto w-5/6 max-w-150 rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
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
              onClick={() => router.push("/")}
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
