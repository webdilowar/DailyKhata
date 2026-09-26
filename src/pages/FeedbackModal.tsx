import React, { useState } from 'react';
import { X, Send, Heart, CheckCircle2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      onClose();
      setSent(false);
      setMessage('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        id="feedback-modal"
        className="w-full max-w-sm bg-[#242420] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630]">
          <h2 className="text-base font-bold text-[#f5f5f0]">Feedback</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0]">
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center space-y-3 animate-in zoom-in-95">
            <CheckCircle2 size={40} className="text-[#4ade80] mx-auto" />
            <h3 className="text-base font-bold text-[#f5f5f0]">Thank You!</h3>
            <p className="text-xs text-[#a3a398]">Your feedback helps improve MoneyFlow.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#a3a398] uppercase text-[11px] mb-2">
                Rate your experience
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-10 h-10 rounded-xl text-lg font-bold flex items-center justify-center transition-all ${
                      rating >= star
                        ? 'bg-[#e6c875] text-[#1c1c1a]'
                        : 'bg-[#1c1c1a] text-[#70706a] border border-[#383832]'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#a3a398] uppercase text-[11px] mb-1.5">
                Message / Feature Request
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What do you think of MoneyFlow? Any features you'd like to see?"
                rows={4}
                className="w-full bg-[#1c1c1a] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl p-3 text-[#f5f5f0] outline-hidden resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#e6c875] text-[#1c1c1a] font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Send size={14} />
              <span>Send Feedback</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
