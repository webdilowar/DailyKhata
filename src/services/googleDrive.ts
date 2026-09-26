import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { BackupData, restoreBackup, validateBackupJson } from './backup';
import { Account, Category, Transaction, Budget, UserSettings } from '../types';

export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];
export const DRIVE_FOLDER_NAME = 'MoneyFlowData';
export const DEFAULT_SNAPSHOT_NAME = 'moneyflow-snapshot.json';

// In-memory token and folder cache - NEVER stored in localStorage/sessionStorage
let inMemoryAccessToken: string | null = null;
let lastSyncTimestamp: string | null = null;
let cachedFolderId: string | null = null;

export function setDriveAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (!token) {
    cachedFolderId = null;
  }
}

export function getDriveAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function getLastDriveSyncTime(): string | null {
  return lastSyncTimestamp;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  folderId?: string;
}

/**
 * Request Google Drive OAuth access token via popup
 */
export async function connectGoogleDrive(): Promise<string> {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken;
  }

  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Auth is not configured for Google Drive OAuth.');
  }

  const provider = new GoogleAuthProvider();
  DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error('Google Drive access was not granted or token is missing.');
  }

  inMemoryAccessToken = credential.accessToken;
  return inMemoryAccessToken;
}

/**
 * Finds or creates the dedicated 'MoneyFlowData' folder in the user's Google Drive
 */
export async function getOrCreateMoneyFlowFolder(token?: string): Promise<string> {
  const authToken = token || inMemoryAccessToken;
  if (!authToken) {
    throw new Error('Google Drive is not connected. Please authorize Google Drive.');
  }

  if (cachedFolderId) {
    return cachedFolderId;
  }

  // 1. Search for existing folder
  const query = encodeURIComponent(
    `name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`;

  const listRes = await fetch(listUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (listRes.ok) {
    const data = await listRes.json();
    if (data.files && data.files.length > 0) {
      cachedFolderId = data.files[0].id;
      return cachedFolderId!;
    }
  }

  // 2. Folder does not exist, create it
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Dedicated folder for MoneyFlow JSON database snapshots',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create '${DRIVE_FOLDER_NAME}' folder in Google Drive: ${errText}`);
  }

  const createdFolder = await createRes.json();
  cachedFolderId = createdFolder.id;
  return cachedFolderId!;
}

/**
 * Lists all JSON snapshots stored inside the 'MoneyFlowData' folder
 */
export async function listSnapshotsInFolder(token?: string): Promise<DriveFileInfo[]> {
  const authToken = token || inMemoryAccessToken;
  if (!authToken) {
    throw new Error('Google Drive is not connected. Please authorize Google Drive.');
  }

  const folderId = await getOrCreateMoneyFlowFolder(authToken);
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn(`Failed to list files in ${DRIVE_FOLDER_NAME}:`, err);
    return [];
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    ...f,
    folderId,
  }));
}

/**
 * Searches for a specific snapshot or the latest snapshot inside the 'MoneyFlowData' folder
 */
export async function findDriveBackupFile(
  token?: string,
  userEmail?: string
): Promise<DriveFileInfo | null> {
  const authToken = token || inMemoryAccessToken;
  if (!authToken) {
    throw new Error('Google Drive is not connected. Please authorize Google Drive.');
  }

  const folderId = await getOrCreateMoneyFlowFolder(authToken);
  const userSnapshotName = userEmail
    ? `moneyflow-snapshot-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    : DEFAULT_SNAPSHOT_NAME;

  // Search inside 'MoneyFlowData' folder first
  const query = encodeURIComponent(
    `'${folderId}' in parents and (name = '${userSnapshotName}' or name = '${DEFAULT_SNAPSHOT_NAME}') and trashed = false`
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (res.ok) {
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return { ...data.files[0], folderId };
    }
  }

  // Fallback: search root folder for legacy backups
  const legacyNames = [
    DEFAULT_SNAPSHOT_NAME,
    userEmail ? `moneyflow-backup-${userEmail}.json` : '',
    'moneyflow-backup.json',
  ].filter(Boolean);

  for (const legacyName of legacyNames) {
    const legacyQuery = encodeURIComponent(`name = '${legacyName}' and trashed = false`);
    const legacyUrl = `https://www.googleapis.com/drive/v3/files?q=${legacyQuery}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`;
    const legRes = await fetch(legacyUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (legRes.ok) {
      const legData = await legRes.json();
      if (legData.files && legData.files.length > 0) {
        return legData.files[0];
      }
    }
  }

  return null;
}

/**
 * Stores a JSON database snapshot into the user's dedicated 'MoneyFlowData' folder
 */
export async function saveUserDataToDrive(
  data: BackupData,
  userEmail?: string,
  token?: string
): Promise<{ success: boolean; fileId: string; fileName: string; modifiedTime: string; folderId: string }> {
  let authToken = token || inMemoryAccessToken;
  if (!authToken) {
    authToken = await connectGoogleDrive();
  }

  const folderId = await getOrCreateMoneyFlowFolder(authToken);
  const fileName = userEmail
    ? `moneyflow-snapshot-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    : DEFAULT_SNAPSHOT_NAME;

  if (userEmail && !data.ownerEmail) {
    data.ownerEmail = userEmail;
  }
  const jsonContent = JSON.stringify(data, null, 2);

  // Check if file already exists inside the MoneyFlowData folder
  const existingFile = await findDriveBackupFile(authToken, userEmail);

  if (existingFile && existingFile.id) {
    // Update existing snapshot content
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
    const res = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update snapshot in '${DRIVE_FOLDER_NAME}': ${err}`);
    }

    const updated = await res.json();
    lastSyncTimestamp = new Date().toISOString();
    return {
      success: true,
      fileId: updated.id || existingFile.id,
      fileName,
      modifiedTime: lastSyncTimestamp,
      folderId,
    };
  }

  // Create new snapshot file with parent set to MoneyFlowData folder
  const boundary = '-------moneyflow_snapshot_boundary_' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
    description: `MoneyFlow Database Snapshot for ${userEmail || 'User'} inside ${DRIVE_FOLDER_NAME}`,
  };

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    jsonContent +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create snapshot in '${DRIVE_FOLDER_NAME}': ${err}`);
  }

  const created = await res.json();
  lastSyncTimestamp = new Date().toISOString();
  return {
    success: true,
    fileId: created.id,
    fileName,
    modifiedTime: lastSyncTimestamp,
    folderId,
  };
}

/**
 * Downloads and restores a JSON database snapshot from 'MoneyFlowData' folder
 */
export async function restoreUserDataFromDrive(
  userId: string,
  userEmail?: string,
  token?: string,
  mode: 'replace' | 'merge' = 'replace',
  targetFileId?: string
): Promise<{ success: boolean; data: BackupData; message: string; fileName: string }> {
  let authToken = token || inMemoryAccessToken;
  if (!authToken) {
    authToken = await connectGoogleDrive();
  }

  let fileIdToDownload = targetFileId;
  let snapshotFileName = DEFAULT_SNAPSHOT_NAME;

  if (!fileIdToDownload) {
    const driveFile = await findDriveBackupFile(authToken, userEmail);
    if (!driveFile) {
      throw new Error(
        `No database snapshot found in Google Drive ('${DRIVE_FOLDER_NAME}' folder). Please save a snapshot first.`
      );
    }
    fileIdToDownload = driveFile.id;
    snapshotFileName = driveFile.name;
  }

  // Download file content
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileIdToDownload}?alt=media`;
  const res = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to download snapshot from Google Drive '${DRIVE_FOLDER_NAME}': ${err}`);
  }

  const contentText = await res.text();
  const validation = validateBackupJson(contentText);

  if (!validation.valid || !validation.data) {
    throw new Error(validation.error || 'Invalid JSON snapshot received from Google Drive.');
  }

  // Restore into active database / local storage with strict user isolation check
  await restoreBackup(userId, validation.data, mode, userEmail);
  lastSyncTimestamp = new Date().toISOString();

  const msg = `Successfully restored snapshot from '${DRIVE_FOLDER_NAME}/${snapshotFileName}' (${validation.data.accounts.length} accounts, ${validation.data.categories.length} categories, ${validation.data.transactions.length} transactions, and ${validation.data.budgets?.length || 0} budgets)!`;
  return {
    success: true,
    data: validation.data,
    message: msg,
    fileName: snapshotFileName,
  };
}

/**
 * Permanently deletes a snapshot file from Google Drive (with explicit safety)
 */
export async function deleteSnapshotFromDrive(fileId: string, token?: string): Promise<void> {
  const authToken = token || inMemoryAccessToken;
  if (!authToken) {
    throw new Error('Google Drive is not connected.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete snapshot file from Google Drive: ${err}`);
  }
}

/**
 * Helper to build backup payload from active financial context collections
 */
export function buildBackupPayload(
  accounts: Account[],
  categories: Category[],
  transactions: Transaction[],
  budgets: Budget[],
  settings?: UserSettings,
  ownerEmail?: string,
  ownerUid?: string
): BackupData {
  return {
    version: '1.0',
    appName: 'MoneyFlow',
    exportedAt: new Date().toISOString(),
    ownerEmail: ownerEmail || undefined,
    ownerUid: ownerUid || undefined,
    accounts,
    categories,
    transactions,
    budgets,
    settings,
  };
}
