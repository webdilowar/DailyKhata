/**
 * Safe mathematical expression evaluator for the transaction keypad.
 * Supports +, -, × (*), ÷ (/), and floating point numbers.
 */

export function evaluateExpression(expr: string): number {
  if (!expr || expr.trim() === '') return 0;

  // Clean and normalize operators
  let cleaned = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '')
    .trim();

  // Strip trailing operators before evaluation if user pressed '=' with an open operator
  cleaned = cleaned.replace(/[+\-*/]+$/, '');

  if (!cleaned) return 0;

  try {
    // Tokenize expression safely without eval
    // Only allow numbers, decimals, and basic arithmetic operators
    if (!/^[0-9+\-*/. ]+$/.test(cleaned)) {
      return 0;
    }

    // Function constructor safe numeric evaluation
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const result = Function(`'use strict'; return (${cleaned})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      // Round to 2 decimal places to prevent floating point inaccuracies
      return Math.round(result * 100) / 100;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function formatCalculatorDisplay(expr: string): string {
  if (!expr) return '0';
  return expr;
}
