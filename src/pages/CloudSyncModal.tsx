import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isFirebaseConfigured } from '../services/firebase';
import { X, Cloud, CheckCircle2, AlertCircle, KeyRound, Server } from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const { user, isConfigured } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        id="cloud-sync-modal"
        className="w-full max-w-md bg-[#242420] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630]">
          <div className="flex items-center gap-2">
            <Cloud size={20} className="text-[#e6c875]" />
            <h2 className="text-base font-bold text-[#f5f5f0]">Firebase Cloud Sync</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0]">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Status Badge */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isConfigured
                ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
                : 'bg-[#e6c875]/10 border-[#e6c875]/30 text-[#e6c875]'
            }`}
          >
            {isConfigured ? (
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm text-[#f5f5f0]">
                {isConfigured ? 'Firebase Active & Connected' : 'Offline / Demo Persistence Active'}
              </p>
              <p className="text-xs text-[#a3a398] mt-1 leading-relaxed">
                {isConfigured
                  ? 'All your accounts, transactions, and categories are stored securely in Google Cloud Firestore with real-time sync across devices.'
                  : 'Currently storing all data locally in browser storage. Add your Firebase keys in .env to enable instant cloud synchronization.'}
              </p>
            </div>
          </div>

          {/* User Session Info */}
          <div className="bg-[#1c1c1a] p-3 rounded-xl border border-[#383832] space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#a3a398]">Active User:</span>
              <span className="text-[#f5f5f0] font-medium truncate max-w-[200px]">
                {user?.email || (user?.isDemo ? 'Demo User (Local)' : 'Guest')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a3a398]">User ID:</span>
              <span className="text-[#e6c875] font-mono text-[11px] truncate max-w-[200px]">
                {user?.uid || 'demo-user-123'}
              </span>
            </div>
          </div>

          {/* Configuration Guide */}
          <div className="space-y-2">
            <h4 className="font-semibold text-xs text-[#f5f5f0] flex items-center gap-1.5">
              <KeyRound size={14} className="text-[#e6c875]" />
              <span>How to connect your own Firebase Project</span>
            </h4>
            <div className="bg-[#1a1a18] p-3 rounded-xl border border-[#363630] font-mono text-[11px] text-[#c5c5b8] space-y-1">
              <p># Create a free project at console.firebase.google.com</p>
              <p># Add these to your .env file:</p>
              <p className="text-[#e6c875]">VITE_FIREBASE_API_KEY=your_api_key</p>
              <p className="text-[#e6c875]">VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com</p>
              <p className="text-[#e6c875]">VITE_FIREBASE_PROJECT_ID=your_project_id</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#e6c875] text-[#1c1c1a] font-bold text-xs rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
