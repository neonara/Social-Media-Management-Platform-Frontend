import { useRouter } from "next/navigation";
import React from "react";

interface SuccessDialogProps {
  isOpen: boolean;
  isDrafting: boolean;
  mode: "create" | "edit";
  onClose: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  isOpen,
  isDrafting,
  mode,
  onClose,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    if (!isDrafting) {
      router.push("/drafts");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-96 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Success
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {isDrafting
            ? "Draft saved successfully!"
            : `Post ${mode === "create" ? "created" : "updated"} successfully!`}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClose}
            className="hover:bg-primary-dark rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
