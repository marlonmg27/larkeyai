/**
 * Almacenamiento de las llaves de conexión de conectores (app users).
 *
 * Ya NO se usa la tabla `public.app_user_connections` de esta base de datos:
 * las conexiones viven en la base de datos del backend de Python y se leen /
 * escriben con los endpoints internos de `backendConnections.server.ts`.
 *
 * Se envían las dos formas de la llave (en claro y cifrada con AES-256-GCM)
 * para que el backend pueda decidir más adelante dónde queda el cifrado. Al
 * leer, se prefiere la llave en claro y, si no viene, se descifra la cifrada.
 */
import { decryptConnectionKey, encryptConnectionKey } from "@/server/connectionKeyCrypto";
import {
  fetchConnection,
  putConnection,
  removeConnection,
} from "@/server/backendConnections.server";

export async function saveConnectionKeyForUser(
  userId: string,
  connectorId: string,
  connectionAPIKey: string,
): Promise<void> {
  await putConnection({
    userId,
    connectorId,
    connectionKey: connectionAPIKey,
    connectionKeyCiphertext: encryptConnectionKey(connectionAPIKey),
  });
}

export async function getConnectionKeyForUser(
  userId: string,
  connectorId: string,
): Promise<string | null> {
  const connection = await fetchConnection(userId, connectorId);
  if (!connection) return null;

  const plain = connection.connection_key;
  if (typeof plain === "string" && plain.length > 0) return plain;

  const cipher = connection.connection_key_ciphertext;
  if (typeof cipher === "string" && cipher.length > 0) return decryptConnectionKey(cipher);

  return null;
}

export async function deleteConnectionKeyForUser(
  userId: string,
  connectorId: string,
): Promise<void> {
  await removeConnection(userId, connectorId);
}
