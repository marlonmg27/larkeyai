import { createNangoSession } from "@/server/backendConnections.server";

export const CONNECTOR_ID = "google_calendar";

export async function createConnectSession(userId: string): Promise<{ sessionToken: string }> {
  return createNangoSession({ userId, connectorId: CONNECTOR_ID });
}
