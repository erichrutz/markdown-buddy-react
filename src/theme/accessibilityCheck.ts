/**
 * Accessibility Contrast Checker for the color palette
 * Verifies that our color combinations meet WCAG 2.1 standards
 */

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return [
    parseInt(result[1] ?? '0', 16),
    parseInt(result[2] ?? '0', 16),
    parseInt(result[3] ?? '0', 16)
  ];
}

// Calculate relative luminance
function getRelativeLuminance(r: number, g: number, b: number): number {
  const linearize = (c: number) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [rs, gs, bs] = [linearize(r), linearize(g), linearize(b)];
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  
  const l1 = getRelativeLuminance(r1, g1, b1);
  const l2 = getRelativeLuminance(r2, g2, b2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Check if contrast meets WCAG standards
function meetsWCAG(foreground: string, background: string): {
  ratio: number;
  aa: boolean;
  aaa: boolean;
  aaLarge: boolean;
  aaaLarge: boolean;
} {
  const ratio = getContrastRatio(foreground, background);
  return {
    ratio,
    aa: ratio >= 4.5,        // WCAG AA normal text
    aaa: ratio >= 7,         // WCAG AAA normal text
    aaLarge: ratio >= 3,     // WCAG AA large text
    aaaLarge: ratio >= 4.5   // WCAG AAA large text
  };
}

// Test our color combinations
const colorTests = [
  // Light theme combinations
  { name: 'Light: Primary text on background', fg: '#111827', bg: '#f5f5f4' },
  { name: 'Light: Secondary text on background', fg: '#6b7280', bg: '#f5f5f4' },
  { name: 'Light: Links on background', fg: '#0284c7', bg: '#f5f5f4' },
  { name: 'Light: Primary button text', fg: '#ffffff', bg: '#2563eb' },
  { name: 'Light: Secondary button text', fg: '#ffffff', bg: '#ef4444' },
  { name: 'Light: Code text on code background', fg: '#111827', bg: '#f3f4f6' },
  
  // Dark theme combinations
  { name: 'Dark: Primary text on background', fg: '#ffffff', bg: '#111827' },
  { name: 'Dark: Secondary text on background', fg: '#d1d5db', bg: '#111827' },
  { name: 'Dark: Links on background', fg: '#38bdf8', bg: '#111827' },
  { name: 'Dark: Primary button text', fg: '#ffffff', bg: '#3b82f6' },
  { name: 'Dark: Secondary button text', fg: '#ffffff', bg: '#f87171' },
  { name: 'Dark: Code text on code background', fg: '#f3f4f6', bg: '#1f2937' },
];

console.log('Color Accessibility Analysis');
console.log('==========================================\n');

colorTests.forEach(test => {
  const result = meetsWCAG(test.fg, test.bg);
  const status = result.aa ? '✓' : '✗';
  const level = result.aaa ? 'AAA' : result.aa ? 'AA' : 'FAIL';
  
  console.log(`${status} ${test.name}`);
  console.log(`   Ratio: ${result.ratio.toFixed(2)}:1 (${level})`);
  console.log(`   Foreground: ${test.fg} | Background: ${test.bg}`);
  console.log('');
});

export { meetsWCAG, getContrastRatio };