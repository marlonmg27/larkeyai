import { createNangoSession } from "@/server/backendConnections.server";

export const CONNECTOR_ID = "google_calendar";

export async function createConnectSession(input: {
  userId: string;
  email: string;
}): Promise<{ sessionToken: string }> {
  return createNangoSession({
    userId: input.userId,
    connectorId: CONNECTOR_ID,
    email: input.email,
  });
}
