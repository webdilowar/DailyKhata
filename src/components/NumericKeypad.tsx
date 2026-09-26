import React from 'react';

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onOperator: (op: string) => void;
  onEqual: () => void;
  onDecimal: () => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigit,
  onOperator,
  onEqual,
  onDecimal,
}) => {
  return (
    <div id="numeric-keypad" className="grid grid-cols-4 gap-1.5 p-2 bg-[#1a1a18] dark:bg-[#1a1a18] rounded-xl">
      {/* Row 1 */}
      <button
        id="keypad-plus"
        type="button"
        onClick={() => onOperator('+')}
        className="h-13 sm:h-14 bg-[#383a2e] active:bg-[#484a3b] text-[#e6c875] font-semibold text-2xl rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        +
      </button>
      <button
        id="keypad-7"
        type="button"
        onClick={() => onDigit('7')}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        7
      </button>
      <button
        id="keypad-8"
        type="button"
        onClick={() => onDigit('8')}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        8
      </button>
      <button
        id="keypad-9"
        type="button"
        onClick={() => onDigit('9')}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        9
      </button>

      {/* Row 2 */}
      <button
        id="keypad-minus"
        type="button"
        onClick={() => onOperator('-')}
        className="h-13 sm:h-14 bg-[#383a2e] active:bg-[#484a3b] text-[#e6c875] font-semibold text-2xl rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        −
      </button>
      <button
        id="keypad-4"
        type="button"
        onClick={() => onDigit('4')}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        4
      </button>
      <button
        id="keypad-5"
        type="button"
        onClick={() => onDigit('5')}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        5
      </button>
      <button
        id="keypad-6"
        type="button"
        onClick={() => onDigit('6')}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        6
      </button>

      {/* Row 3 */}
      <button
        id="keypad-multiply"
        type="button"
        onClick={() => onOperator('×')}
        className="h-13 sm:h-14 bg-[#383a2e] active:bg-[#484a3b] text-[#e6c875] font-semibold text-2xl rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        ×
      </button>
      <button
        id="keypad-1"
        type="button"
        onClick={() => onDigit('1')}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        1
      </button>
      <button
        id="keypad-2"
        type="button"
        onClick={() => onDigit('2')}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        2
      </button>
      <button
        id="keypad-3"
        type="button"
        onClick={() => onDigit('3')}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        3
      </button>

      {/* Row 4 */}
      <button
        id="keypad-divide"
        type="button"
        onClick={() => onOperator('÷')}
        className="h-13 sm:h-14 bg-[#383a2e] active:bg-[#484a3b] text-[#e6c875] font-semibold text-2xl rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        ÷
      </button>
      <button
        id="keypad-0"
        type="button"
        onClick={() => onDigit('0')}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        0
      </button>
      <button
        id="keypad-decimal"
        type="button"
        onClick={onDecimal}
        className="h-13 sm:h-14 bg-[#262622] hover:bg-[#2e2e2a] active:bg-[#383832] text-[#f5f5f0] text-2xl font-medium rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        .
      </button>
      <button
        id="keypad-equal"
        type="button"
        onClick={onEqual}
        className="h-13 sm:h-14 bg-[#383a2e] active:bg-[#484a3b] text-[#e6c875] font-semibold text-2xl rounded-lg flex items-center justify-center transition-colors active-press shadow-sm"
      >
        =
      </button>
    </div>
  );
};
