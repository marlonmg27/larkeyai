import {
  appUserReconnectRequired,
  callAsAppUser,
  disconnectAppUser,
} from "@/integrations/lovable/appUserConnector";
import { createNangoSession } from "@/server/backendConnections.server";
import {
  deleteConnectionKeyForUser,
  getConnectionKeyForUser,
} from "@/server/appUserConnections.server";

export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export const CONNECTOR_ID = "google_calendar";
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export interface CalendarEvent {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  allDay: boolean;
  htmlLink: string | null;
}

export type EventsResult =
  | { connected: false; reconnectRequired?: boolean }
  | { connected: true; events: CalendarEvent[] };

export async function createConnectSession(userId: string): Promise<{ sessionToken: string }> {
  return createNangoSession({ userId, connectorId: CONNECTOR_ID });
}

interface GoogleEvent {
  id?: string;
  summary?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export async function listUpcoming(userId: string): Promise<EventsResult> {
  const connectionAPIKey = await getConnectionKeyForUser(userId, CONNECTOR_ID);
  if (!connectionAPIKey) return { connected: false };

  const params = new URLSearchParams({
    maxResults: "10",
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: new Date().toISOString(),
  });

  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: CONNECTOR_ID,
    path: `/calendar/v3/calendars/primary/events?${params.toString()}`,
    requiredScopes: GOOGLE_CALENDAR_SCOPES,
  });

  if (await appUserReconnectRequired(res)) return { connected: false, reconnectRequired: true };
  if (!res.ok) {
    const body = await res.text();
    console.error(`[google_calendar] events list failed [${res.status}]: ${body}`);
    throw new Error(`No pudimos leer tu calendario (${res.status}).`);
  }

  const data = (await res.json()) as { items?: GoogleEvent[] };
  const events: CalendarEvent[] = (data.items ?? []).map((item, index) => ({
    id: item.id ?? `event-${index}`,
    title: item.summary?.trim() || "(Sin título)",
    start: item.start?.dateTime ?? item.start?.date ?? null,
    end: item.end?.dateTime ?? item.end?.date ?? null,
    allDay: Boolean(item.start?.date && !item.start?.dateTime),
    htmlLink: item.htmlLink ?? null,
  }));
  return { connected: true, events };
}

export async function createTestEvent(
  userId: string,
): Promise<{ connected: boolean; reconnectRequired?: boolean; created?: boolean }> {
  const connectionAPIKey = await getConnectionKeyForUser(userId, CONNECTOR_ID);
  if (!connectionAPIKey) return { connected: false };

  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + (30 - (start.getMinutes() % 30)));
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: CONNECTOR_ID,
    path: "/calendar/v3/calendars/primary/events",
    requiredScopes: GOOGLE_CALENDAR_SCOPES,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: "Evento de prueba de Larkey",
        description: "Evento creado desde Larkey para probar la conexión con Google Calendar.",
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      }),
    },
  });

  if (await appUserReconnectRequired(res)) return { connected: false, reconnectRequired: true };
  if (!res.ok) {
    const body = await res.text();
    console.error(`[google_calendar] event create failed [${res.status}]: ${body}`);
    throw new Error(`No pudimos crear el evento (${res.status}).`);
  }
  return { connected: true, created: true };
}

export async function disconnect(userId: string): Promise<{ ok: true }> {
  const connectionAPIKey = await getConnectionKeyForUser(userId, CONNECTOR_ID);
  if (connectionAPIKey) {
    try {
      await disconnectAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey,
        connectorId: CONNECTOR_ID,
      });
    } catch (error) {
      console.error("[google_calendar] gateway disconnect failed", error);
    }
    await deleteConnectionKeyForUser(userId, CONNECTOR_ID);
  }
  return { ok: true };
}
