import { useThemedToast } from "@/hooks/useThemedToast";
import {
  getAllClientsForAdmin,
  getAssignedClients,
} from "@/services/postService";
import { useEffect, useState } from "react";

export interface Client {
  id: number;
  name: string;
  email: string;
}

export const useClientData = (
  mode: "create" | "edit",
  clientId: string | null | undefined,
  role: string | undefined,
) => {
  const themedToast = useThemedToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      if (mode === "create" && !clientId) {
        setIsLoadingClients(true);
        try {
          let clientsArray: Client[] = [];

          if (role === "administrator" || role === "super_administrator") {
            const adminResponse = await getAllClientsForAdmin();
            clientsArray = adminResponse.clients.map((client) => ({
              id: client.id,
              name: client.full_name || client.email.split("@")[0],
              email: client.email,
            }));
          } else {
            const response = await getAssignedClients();
            clientsArray = Array.isArray(response) ? response : [];
          }

          setClients(clientsArray);
        } catch (error) {
          console.error("Failed to fetch clients:", error);
          themedToast.error("Failed to load client list");
          setClients([]);
        } finally {
          setIsLoadingClients(false);
        }
      }
    };

    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, clientId, role]);

  return { clients, isLoadingClients };
};
