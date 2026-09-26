import React, { useState, useRef, useEffect } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { useAuth } from '../contexts/AuthContext';
import { generateBackupJson, downloadJsonFile, validateBackupJson, restoreBackup } from '../services/backup';
import {
  getDriveAccessToken,
  listSnapshotsInFolder,
  DRIVE_FOLDER_NAME,
  DriveFileInfo,
} from '../services/googleDrive';
import {
  X,
  HardDriveDownload,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Cloud,
  RefreshCw,
  Folder,
  FileJson,
  Calendar,
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    transactions,
    accounts,
    categories,
    budgets,
    settings,
    refreshData,
    saveToGoogleDrive,
    restoreFromGoogleDrive,
    lastDriveSyncTime,
  } = useFinancial();

  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDriveProcessing, setIsDriveProcessing] = useState(false);
  const [showDriveConfirm, setShowDriveConfirm] = useState<'save' | 'restore' | null>(null);
  const [snapshots, setSnapshots] = useState<DriveFileInfo[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isDriveLinked = Boolean(getDriveAccessToken());

  const loadFolderSnapshots = async () => {
    if (!getDriveAccessToken()) return;
    setIsLoadingSnapshots(true);
    try {
      const list = await listSnapshotsInFolder();
      setSnapshots(list);
      if (list.length > 0 && !selectedSnapshotId) {
        setSelectedSnapshotId(list[0].id);
      }
    } catch (err) {
      console.warn('Could not load snapshots from folder:', err);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    if (isOpen && isDriveLinked) {
      loadFolderSnapshots();
    }
  }, [isOpen, isDriveLinked]);

  const handleDriveSave = async () => {
    setIsDriveProcessing(true);
    setStatusMessage(null);
    setShowDriveConfirm(null);
    try {
      const res = await saveToGoogleDrive();
      setStatusMessage({ text: res.message });
      await loadFolderSnapshots();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: err.message || 'Failed to save to Google Drive.', isError: true });
    } finally {
      setIsDriveProcessing(false);
    }
  };

  const handleDriveRestore = async (fileIdToRestore?: string) => {
    setIsDriveProcessing(true);
    setStatusMessage(null);
    setShowDriveConfirm(null);
    try {
      const targetId = fileIdToRestore || selectedSnapshotId || undefined;
      const res = await restoreFromGoogleDrive(restoreMode, targetId);
      setStatusMessage({ text: res.message });
      await loadFolderSnapshots();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: err.message || 'Failed to restore from Google Drive.', isError: true });
    } finally {
      setIsDriveProcessing(false);
    }
  };

  const handleDownloadBackup = () => {
    try {
      const jsonString = generateBackupJson(
        accounts,
        categories,
        transactions,
        budgets,
        settings
      );
      downloadJsonFile(jsonString, `moneyflow-backup-${new Date().toISOString().split('T')[0]}.json`);
      setStatusMessage({ text: 'Backup JSON downloaded successfully.' });
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Failed to create backup file.', isError: true });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const text = await file.text();
      const validation = validateBackupJson(text);

      if (!validation.valid || !validation.data) {
        setStatusMessage({
          text: validation.error || 'Invalid MoneyFlow backup format. Please select a valid JSON backup.',
          isError: true,
        });
        setIsProcessing(false);
        return;
      }

      const uid = user?.uid || 'demo-user-123';
      await restoreBackup(uid, validation.data, restoreMode);
      await refreshData();
      setStatusMessage({
        text: `Restored: ${validation.data.accounts.length} accounts, ${validation.data.categories.length} categories, ${validation.data.transactions.length} transactions, ${validation.data.budgets?.length || 0} budgets!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: err.message || 'Error processing backup file.', isError: true });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        id="backup-restore-modal"
        className="w-full max-w-md bg-[#242420] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630]">
          <h2 className="text-base font-semibold text-[#f5f5f0]">Backup & Restore</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0]">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs sm:text-sm">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                statusMessage.isError
                  ? 'bg-[#ff6565]/10 border-[#ff6565]/30 text-[#ff6565]'
                  : 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
              }`}
            >
              {statusMessage.isError ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Google Drive Cloud Sync & Backup in MoneyFlowData (Top Priority) */}
          <div className="p-3.5 bg-[#2a2a26] border border-[#44443c] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#4285F4]/15 text-[#4285F4] flex items-center justify-center">
                  <Cloud size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[#f5f5f0] text-xs sm:text-sm">Google Drive Cloud Storage</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#e6c875] mt-0.5">
                    <Folder size={12} />
                    <span>/{DRIVE_FOLDER_NAME} folder</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {isDriveLinked && (
                  <button
                    type="button"
                    onClick={loadFolderSnapshots}
                    disabled={isLoadingSnapshots}
                    title="Refresh folder snapshots"
                    className="p-1 rounded-md text-[#a3a398] hover:text-[#f5f5f0] hover:bg-[#33332d]"
                  >
                    <RefreshCw size={13} className={isLoadingSnapshots ? 'animate-spin' : ''} />
                  </button>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDriveLinked ? 'bg-[#4ade80]/15 text-[#4ade80]' : 'bg-[#e6c875]/15 text-[#e6c875]'
                }`}>
                  {isDriveLinked ? 'Connected' : 'Drive Ready'}
                </span>
              </div>
            </div>

            {lastDriveSyncTime && (
              <p className="text-[11px] text-[#777770]">
                Last Drive sync: {new Date(lastDriveSyncTime).toLocaleString()}
              </p>
            )}

            {/* Snapshots inside MoneyFlowData Folder */}
            {isDriveLinked && (
              <div className="space-y-2 pt-1 border-t border-[#383832]">
                <div className="flex items-center justify-between text-[11px] text-[#a3a398]">
                  <span className="font-semibold uppercase tracking-wider">
                    Snapshots in /{DRIVE_FOLDER_NAME}
                  </span>
                  <span>{snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}</span>
                </div>

                {isLoadingSnapshots ? (
                  <div className="py-3 text-center text-xs text-[#a3a398] flex items-center justify-center gap-2">
                    <RefreshCw size={13} className="animate-spin text-[#e6c875]" />
                    <span>Scanning /{DRIVE_FOLDER_NAME}...</span>
                  </div>
                ) : snapshots.length === 0 ? (
                  <div className="p-2.5 bg-[#1f1f1d] rounded-lg border border-[#33332d] text-center text-xs text-[#a3a398]">
                    No snapshots found in <strong>/{DRIVE_FOLDER_NAME}</strong> yet. Tap "Save Snapshot" to create the first one.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {snapshots.map((snap) => {
                      const isSelected = selectedSnapshotId === snap.id;
                      return (
                        <div
                          key={snap.id}
                          onClick={() => setSelectedSnapshotId(snap.id)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#e6c875]/10 border-[#e6c875] text-[#f5f5f0]'
                              : 'bg-[#1f1f1d] hover:bg-[#252522] border-[#363630] text-[#c5c5b8]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileJson size={14} className="text-[#e6c875] shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold truncate text-[11px]">{snap.name}</p>
                              <p className="text-[10px] text-[#777770]">
                                {new Date(snap.modifiedTime).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            {isSelected ? (
                              <span className="text-[10px] font-bold text-[#e6c875] px-1.5 py-0.5 rounded-sm bg-[#e6c875]/20">
                                Selected
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#777770]">Click to select</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Dialog for Destructive Operations per workspace guidelines */}
            {showDriveConfirm === 'restore' && (
              <div className="p-3 bg-[#ff6565]/10 border border-[#ff6565]/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-[#ff6565] font-semibold text-xs">
                  <AlertTriangle size={16} />
                  <span>Restore snapshot from Google Drive?</span>
                </div>
                <p className="text-[11px] text-[#c5c5b8]">
                  This will {restoreMode === 'replace' ? 'replace all current data' : 'merge records'} with the snapshot from your <strong>/{DRIVE_FOLDER_NAME}</strong> folder.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDriveRestore()}
                    disabled={isDriveProcessing}
                    className="flex-1 py-1.5 bg-[#ff6565] hover:bg-[#ff4d4d] text-white font-bold text-xs rounded-lg"
                  >
                    Confirm Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDriveConfirm(null)}
                    className="px-3 py-1.5 bg-[#252522] text-[#c5c5b8] text-xs rounded-lg border border-[#3e3e37]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                id="btn-drive-backup-now"
                type="button"
                onClick={handleDriveSave}
                disabled={isDriveProcessing}
                className="py-2.5 px-3 bg-[#e6c875] hover:bg-[#f0d58c] text-[#1c1c1a] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 active-press shadow-xs"
              >
                {isDriveProcessing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Cloud size={14} />
                )}
                <span>Save to /{DRIVE_FOLDER_NAME}</span>
              </button>

              <button
                id="btn-drive-restore-now"
                type="button"
                onClick={() => setShowDriveConfirm('restore')}
                disabled={isDriveProcessing || (isDriveLinked && snapshots.length === 0)}
                className="py-2.5 px-3 bg-[#33332d] hover:bg-[#3d3d36] text-[#f5f5f0] border border-[#44443c] font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 active-press"
              >
                <UploadCloud size={14} className="text-[#4ade80]" />
                <span>Restore Snapshot</span>
              </button>
            </div>
          </div>

          <hr className="border-[#363630]" />

          {/* Download Backup */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#f5f5f0] flex items-center gap-2">
              <HardDriveDownload size={16} className="text-[#e6c875]" />
              <span>Create Local Backup</span>
            </h3>
            <p className="text-xs text-[#a3a398]">
              Save a full JSON file with all your accounts, categories, transactions, and budgets.
            </p>
            <button
              id="btn-download-backup-json"
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2.5 px-4 bg-[#2a2a26] hover:bg-[#33332d] border border-[#3e3e37] text-[#e6c875] font-semibold text-xs rounded-xl transition-colors active-press"
            >
              Download Backup File (.json)
            </button>
          </div>

          <hr className="border-[#363630]" />

          {/* Restore Backup */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#f5f5f0] flex items-center gap-2">
              <UploadCloud size={16} className="text-[#4ade80]" />
              <span>Restore from Backup</span>
            </h3>

            {/* Mode: Replace or Merge */}
            <div>
              <span className="block text-[11px] text-[#a3a398] font-medium mb-1">Restore Mode</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRestoreMode('replace')}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-semibold transition-colors ${
                    restoreMode === 'replace'
                      ? 'border-[#e6c875] bg-[#e6c875]/15 text-[#e6c875]'
                      : 'border-[#383832] bg-[#1c1c1a] text-[#a3a398]'
                  }`}
                >
                  Replace All Data
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreMode('merge')}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-semibold transition-colors ${
                    restoreMode === 'merge'
                      ? 'border-[#e6c875] bg-[#e6c875]/15 text-[#e6c875]'
                      : 'border-[#383832] bg-[#1c1c1a] text-[#a3a398]'
                  }`}
                >
                  Merge with Existing
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
              id="restore-file-input"
            />

            <button
              id="btn-trigger-restore-file"
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-[#e6c875] hover:bg-[#f0d58c] text-[#1c1c1a] font-bold text-xs rounded-xl transition-colors disabled:opacity-50 active-press"
            >
              {isProcessing ? 'Restoring Data...' : 'Choose JSON File to Restore'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
