import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { Client } from "../hooks/useClientData";

interface ClientSelectionSectionProps {
  mode: "create" | "edit";
  clientId?: string | null;
  role?: string;
  selectedClientId: string | null;
  isLoadingClients: boolean;
  clients: Client[];
  onClientChange: (clientId: string | null) => void;
}

export const ClientSelectionSection: React.FC<ClientSelectionSectionProps> = ({
  mode,
  clientId,
  role,
  selectedClientId,
  isLoadingClients,
  clients,
  onClientChange,
}) => {
  if (mode !== "create" || clientId) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        {role === "administrator" || role === "super_administrator"
          ? "Client Selection"
          : "Client Selection (Optional)"}
      </h2>

      <Select
        value={selectedClientId || "no-client"}
        disabled={isLoadingClients}
        onValueChange={(value) =>
          onClientChange(value === "no-client" ? null : value)
        }
      >
        <SelectTrigger className="w-full max-w-md">
          <SelectValue
            placeholder={
              isLoadingClients
                ? "Loading..."
                : role === "administrator" || role === "super_administrator"
                  ? "Select a Client"
                  : "Select a Client (Optional)"
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-client">
            {isLoadingClients
              ? "Loading..."
              : role === "administrator" || role === "super_administrator"
                ? "Select a Client"
                : "Create Personal Post"}
          </SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id.toString()}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
