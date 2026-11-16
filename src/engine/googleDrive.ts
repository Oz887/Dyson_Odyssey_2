import { GameSnapshot, SaveSlot } from '../types/game';
import { invalidateAccessToken } from './googleAuth';

export interface DrivePermission {
  id: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  role: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  description?: string;
  webViewLink?: string;
  webContentLink?: string;
  shared?: boolean;
  permissions?: DrivePermission[];
  appProperties?: Record<string, string>;
}

export interface DriveActivityEntry {
  timestamp: string;
  actionSummary: string;
  actorName: string;
  targetTitle: string;
}

export class DriveAuthError extends Error {
  constructor(message = 'Google Drive authentication expired or required.') {
    super(message);
    this.name = 'DriveAuthError';
  }
}

async function driveFetch(
  url: string,
  token: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    invalidateAccessToken();
    throw new DriveAuthError('Google Drive session expired. Please sign in again.');
  }
  if (!res.ok) {
    let detail = `Drive API error (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.error?.message) {
        detail = errBody.error.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(detail);
  }
  return res;
}

function buildSaveSlotPayload(
  snapshot: GameSnapshot,
  position: { x: number; y: number },
  customName?: string
): SaveSlot {
  const slotId = `save_${snapshot.character}_${snapshot.planetPreset.id}`;
  return {
    id: slotId,
    name:
      customName ??
      `${snapshot.character === 'leo' ? 'Leo' : 'Nova'} · ${snapshot.planetPreset.nameEn}`,
    character: snapshot.character,
    savedAt: Date.now(),
    day: snapshot.day,
    missionClockSeconds: snapshot.missionClockSeconds,
    planetId: snapshot.planetPreset.id,
    visitedPlanets: snapshot.visitedPlanets,
    odometerKm: snapshot.odometerKm,
    stats: { ...snapshot.stats },
    suitEquipped: snapshot.suitEquipped,
    insideShip: snapshot.insideShip,
    position: { ...position },
    energyState: { ...snapshot.energyState },
    hooks: { ...snapshot.hooks },
    inventory: snapshot.inventory,
    storage: snapshot.storage,
    tools: snapshot.tools,
    upgradeTree: snapshot.upgradeTree,
    shipTier: snapshot.shipTier,
    agriculture: snapshot.agriculture,
    completedHardEnergyMission: snapshot.completedHardEnergyMission,
    missionsCompletedCount: snapshot.missionsCompletedCount,
    unlockedPets: snapshot.unlockedPets,
    activePet: snapshot.activePet,
    dysonSphereCompleted: snapshot.dysonSphereCompleted,
    illnessTimer: snapshot.illnessTimer,
    motivationTimer: snapshot.motivationTimer,
  };
}

function buildMultipartBody(
  metadata: Record<string, unknown>,
  content: string,
  contentType: string
): { body: string; boundary: string } {
  const boundary = `solar_odyssey_${Date.now().toString(36)}`;
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${contentType}; charset=UTF-8\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;
  return { body, boundary };
}

export async function listSolarCloudSaves(token: string): Promise<DriveFileItem[]> {
  const q = encodeURIComponent(
    "name contains 'solar_odyssey_' and mimeType = 'application/json' and trashed = false"
  );
  const fields = encodeURIComponent(
    'files(id,name,mimeType,modifiedTime,size,description,webViewLink,webContentLink,shared,permissions(id,type,role),appProperties)'
  );
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&pageSize=25&fields=${fields}`,
    token
  );
  const data = (await res.json()) as { files?: DriveFileItem[] };
  return data.files ?? [];
}

export async function listDriveFiles(
  token: string,
  searchQuery = '',
  pageToken?: string
): Promise<{ files: DriveFileItem[]; nextPageToken?: string }> {
  const cleanSearch = searchQuery.trim().replace(/'/g, "\\'");
  const qRaw = cleanSearch
    ? `name contains '${cleanSearch}' and trashed = false`
    : 'trashed = false';
  const params = new URLSearchParams({
    q: qRaw,
    orderBy: 'modifiedTime desc',
    pageSize: '20',
    fields:
      'nextPageToken,files(id,name,mimeType,modifiedTime,size,description,webViewLink,webContentLink,shared,permissions(id,type,role),appProperties)',
  });
  if (pageToken) {
    params.set('pageToken', pageToken);
  }
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    token
  );
  const data = (await res.json()) as {
    files?: DriveFileItem[];
    nextPageToken?: string;
  };
  return {
    files: data.files ?? [],
    nextPageToken: data.nextPageToken,
  };
}

export async function createCloudSave(
  token: string,
  slot: SaveSlot
): Promise<DriveFileItem> {
  const safeChar = slot.character;
  const safePlanet = slot.planetId;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `solar_odyssey_${safeChar}_${safePlanet}_day${slot.day}_${stamp}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `Solar Odyssey Save · ${slot.name} · Day ${slot.day}`,
    appProperties: {
      game: 'solar_odyssey',
      character: slot.character,
      planetId: slot.planetId,
      day: String(slot.day),
    },
  };

  const { body, boundary } = buildMultipartBody(
    metadata,
    JSON.stringify(slot, null, 2),
    'application/json'
  );

  const res = await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,description,appProperties',
    token,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  return (await res.json()) as DriveFileItem;
}

export async function createCloudSaveFromSnapshot(
  token: string,
  snapshot: GameSnapshot,
  position: { x: number; y: number }
): Promise<DriveFileItem> {
  const slot = buildSaveSlotPayload(snapshot, position);
  return createCloudSave(token, slot);
}

/**
 * Overwrites an existing Google Drive save file.
 * UI MUST obtain explicit user confirmation before calling this function.
 */
export async function overwriteCloudSave(
  token: string,
  fileId: string,
  slot: SaveSlot
): Promise<DriveFileItem> {
  const metadata = {
    description: `Solar Odyssey Save · ${slot.name} · Day ${slot.day}`,
    appProperties: {
      game: 'solar_odyssey',
      character: slot.character,
      planetId: slot.planetId,
      day: String(slot.day),
    },
  };

  const { body, boundary } = buildMultipartBody(
    metadata,
    JSON.stringify(slot, null, 2),
    'application/json'
  );

  const res = await driveFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
      fileId
    )}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,description,appProperties`,
    token,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  return (await res.json()) as DriveFileItem;
}

export async function overwriteCloudSaveFromSnapshot(
  token: string,
  fileId: string,
  snapshot: GameSnapshot,
  position: { x: number; y: number }
): Promise<DriveFileItem> {
  const slot = buildSaveSlotPayload(snapshot, position);
  return overwriteCloudSave(token, fileId, slot);
}

export async function downloadCloudSave(
  token: string,
  fileId: string
): Promise<SaveSlot> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    token
  );
  const raw = (await res.json()) as Partial<SaveSlot>;
  if (!raw || !raw.character || !raw.stats || !raw.planetId) {
    throw new Error('This file is not a valid Solar Odyssey save snapshot.');
  }
  return raw as SaveSlot;
}

/**
 * Renames an existing Google Drive file.
 * UI MUST obtain explicit user confirmation before calling this function.
 */
export async function renameDriveFile(
  token: string,
  fileId: string,
  newName: string
): Promise<DriveFileItem> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}?fields=id,name,mimeType,modifiedTime,size,description,appProperties`,
    token,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    }
  );
  return (await res.json()) as DriveFileItem;
}

/**
 * Deletes a file from Google Drive.
 * UI MUST obtain explicit user confirmation before calling this function.
 */
export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    token,
    { method: 'DELETE' }
  );
}

const SHARE_FIELDS = encodeURIComponent(
  'id,name,mimeType,modifiedTime,size,description,webViewLink,webContentLink,shared,permissions(id,type,role),appProperties'
);

export function getPublicPermission(file: DriveFileItem): DrivePermission | undefined {
  return file.permissions?.find((p) => p.type === 'anyone');
}

export function getShareableUrl(file: DriveFileItem): string {
  if (file.webViewLink) return file.webViewLink;
  return `https://drive.google.com/file/d/${encodeURIComponent(file.id)}/view?usp=sharing`;
}

export async function getDriveFileSharing(
  token: string,
  fileId: string
): Promise<DriveFileItem> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=${SHARE_FIELDS}`,
    token
  );
  return (await res.json()) as DriveFileItem;
}

/**
 * Grants public read-only access ("anyone with the link") to a Google Drive file.
 * UI MUST obtain explicit user confirmation before calling this function.
 */
export async function enablePublicLinkAccess(
  token: string,
  fileId: string
): Promise<DriveFileItem> {
  await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`,
    token,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    }
  );
  return getDriveFileSharing(token, fileId);
}

/**
 * Revokes public "anyone with the link" access from a Google Drive file.
 * UI MUST obtain explicit user confirmation before calling this function.
 */
export async function revokePublicLinkAccess(
  token: string,
  fileId: string,
  permissionId: string
): Promise<DriveFileItem> {
  await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}/permissions/${encodeURIComponent(permissionId)}`,
    token,
    { method: 'DELETE' }
  );
  return getDriveFileSharing(token, fileId);
}

export async function exportExpeditionReport(
  token: string,
  snapshot: GameSnapshot
): Promise<DriveFileItem> {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const fileName = `Solar_Odyssey_Log_Day${snapshot.day}_${snapshot.planetPreset.id}_${stamp}.txt`;
  const lines = [
    '========================================',
    'SOLAR ODYSSEY · EXPEDITION TELEMETRY LOG',
    '========================================',
    `Explorer: ${snapshot.character === 'leo' ? 'Leo' : 'Nova'}`,
    `Current World: ${snapshot.planetPreset.nameEn} (${snapshot.planetPreset.nameEs})`,
    `Mission Day: ${snapshot.day}`,
    `Odometer: ${snapshot.odometerKm.toLocaleString()} km`,
    `Ship Tier: ${snapshot.shipTier.toUpperCase()}`,
    `Visited Worlds (${snapshot.visitedPlanets.length}): ${snapshot.visitedPlanets.join(', ')}`,
    '',
    '--- VITALS ---',
    `Health: ${Math.round(snapshot.stats.health)}%`,
    `Oxygen: ${Math.round(snapshot.stats.oxygen)}%`,
    `Energy: ${Math.round(snapshot.stats.energy)}%`,
    `Hunger: ${Math.round(snapshot.stats.hunger)}%`,
    `Hydration: ${Math.round(snapshot.stats.hydration)}%`,
    `Fuel: ${Math.round(snapshot.stats.fuel)}%`,
    `Temperature: ${Math.round(snapshot.stats.temperature)}°C`,
    '',
    '--- PROGRESSION ---',
    `Missions Completed: ${snapshot.missionsCompletedCount}`,
    `Unlocked Pets: ${snapshot.unlockedPets.length > 0 ? snapshot.unlockedPets.join(', ') : 'None yet'}`,
    `Dyson Sphere Completed: ${snapshot.dysonSphereCompleted ? 'YES' : 'NO'}`,
    `Generated: ${new Date().toUTCString()}`,
  ];

  const metadata = {
    name: fileName,
    mimeType: 'text/plain',
    description: `Solar Odyssey Expedition Log · Day ${snapshot.day}`,
  };

  const { body, boundary } = buildMultipartBody(
    metadata,
    lines.join('\n'),
    'text/plain'
  );

  const res = await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,description',
    token,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  return (await res.json()) as DriveFileItem;
}

export async function fetchDriveActivity(
  token: string,
  fileId?: string
): Promise<DriveActivityEntry[]> {
  const payload: Record<string, unknown> = {
    pageSize: 10,
  };
  if (fileId) {
    payload.itemName = `items/${fileId}`;
  }

  const res = await driveFetch(
    'https://driveactivity.googleapis.com/v2/activity:query',
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const data = (await res.json()) as {
    activities?: Array<{
      timestamp?: string;
      timeRange?: { endTime?: string };
      primaryActionDetail?: Record<string, unknown>;
      actors?: Array<{ user?: { knownUser?: { personName?: string } } }>;
      targets?: Array<{ driveItem?: { title?: string } }>;
    }>;
  };

  return (data.activities ?? []).map((act) => {
    const actionKey = Object.keys(act.primaryActionDetail ?? {})[0] ?? 'updated';
    const targetTitle = act.targets?.[0]?.driveItem?.title ?? 'Drive File';
    const actorRaw = act.actors?.[0]?.user?.knownUser?.personName;
    const timestamp =
      act.timestamp ?? act.timeRange?.endTime ?? new Date().toISOString();

    return {
      timestamp,
      actionSummary: actionKey,
      actorName: actorRaw ? actorRaw.replace('people/', 'User ') : 'Account User',
      targetTitle,
    };
  });
}
