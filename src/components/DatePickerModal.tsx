import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, getMonthYearString } from '../utils/date';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // ISO date string "YYYY-MM-DD"
  onSelectDate: (dateStr: string) => void;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
}) => {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentViewDate, setCurrentViewDate] = useState<Date>(initialDate);
  const [tempDate, setTempDate] = useState<Date>(initialDate);

  if (!isOpen) return null;

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentViewDate(addMonths(currentViewDate, -1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(addMonths(currentViewDate, 1));
  };

  const handleSelectDay = (day: number) => {
    const newD = new Date(year, month, day);
    setTempDate(newD);
  };

  const handleConfirm = () => {
    const y = tempDate.getFullYear();
    const m = String(tempDate.getMonth() + 1).padStart(2, '0');
    const d = String(tempDate.getDate()).padStart(2, '0');
    onSelectDate(`${y}-${m}-${d}`);
    onClose();
  };

  const headerDayName = DAY_NAMES[tempDate.getDay()];
  const headerDayNum = tempDate.getDate();
  const headerMonthName = MONTH_NAMES[tempDate.getMonth()];
  const headerYear = tempDate.getFullYear();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="date-picker-modal"
        className="w-full max-w-xs bg-[#242420] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Top Header matching screenshot */}
        <div className="bg-[#1b1b19] px-6 py-4 border-b border-[#363630]">
          <p className="text-xs font-semibold text-[#a3a398]">{headerYear}</p>
          <h2 className="text-2xl font-bold text-[#e6c875] tracking-wide mt-0.5">
            {headerDayName} {headerDayNum} {headerMonthName}
          </h2>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#363630]">
          <button
            id="prev-month-btn"
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-[#a3a398] hover:text-[#f5f5f0] hover:bg-[#33332d] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-script text-2xl font-bold text-[#e6c875]">
            {getMonthYearString(currentViewDate)}
          </span>
          <button
            id="next-month-btn"
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-[#a3a398] hover:text-[#f5f5f0] hover:bg-[#33332d] transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS_OF_WEEK.map((d, i) => (
              <span key={i} className="text-xs font-semibold text-[#a3a398]">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 w-9" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                tempDate.getDate() === day &&
                tempDate.getMonth() === month &&
                tempDate.getFullYear() === year;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-9 w-9 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#e6c875] text-[#1c1c1a] font-bold shadow-sm'
                      : 'text-[#f5f5f0] hover:bg-[#33332d]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-[#363630]">
          <button
            id="btn-date-cancel"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-semibold text-[#e6c875] hover:bg-[#e6c875]/10 rounded-lg transition-colors"
          >
            CANCEL
          </button>
          <button
            id="btn-date-ok"
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 text-sm font-semibold text-[#e6c875] hover:bg-[#e6c875]/10 rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
