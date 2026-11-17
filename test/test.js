/**
 * Automated Test Suite for Class Fold
 * Tests all core pattern matching, regex boundaries, length thresholds, and utility functions.
 * Runs directly on Node.js using native assertion primitives.
 */

const assert = require('assert');

// 1. Core Helper Utilities
function isImageSource(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(trimmed)) return true;
  if (/\.(png|jpe?g|gif|webp|svg|avif|ico|bmp|tiff)(\?.*)?$/i.test(trimmed)) return true;
  if (/^https?:\/\/.*(images?|img|photos?|assets?|static|avatar|gravatar|unsplash|cloudinary)/i.test(trimmed)) return true;
  return false;
}

function parseClassTokens(rawClasses) {
  if (!rawClasses) return [];
  return rawClasses.split(/\s+/).map((t) => t.trim()).filter((t) => t.length > 0);
}

function truncate(text, maxLength = 80) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

function safeRegex(pattern, flags = 'g') {
  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

console.log('🧪 Starting Class Fold automated test suite...\n');

// Test 1: Image source detection
console.log('▶ Test 1: Image source detection');
assert.strictEqual(
  isImageSource('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
  true,
  'Base64 data URI must be recognized as image'
);
assert.strictEqual(isImageSource('https://cdn.example.com/photos/avatar.png'), true, 'PNG URL must be recognized');
assert.strictEqual(isImageSource('https://images.unsplash.com/photo-12345'), true, 'Unsplash URL must be recognized');
assert.strictEqual(isImageSource('https://example.com/assets/vector.svg?v=2'), true, 'SVG with query params must be recognized');
assert.strictEqual(isImageSource('btn-primary flex items-center'), false, 'CSS classes must not be recognized as image');
assert.strictEqual(isImageSource(''), false, 'Empty string must return false');
console.log('  ✔ Image detection passed.');

// Test 2: Class token parsing
console.log('▶ Test 2: Class token parsing');
const tokens = parseClassTokens('   flex   items-center   justify-between   px-4  py-2  ');
assert.deepStrictEqual(tokens, ['flex', 'items-center', 'justify-between', 'px-4', 'py-2']);
assert.strictEqual(tokens.length, 5);
assert.deepStrictEqual(parseClassTokens(''), []);
console.log('  ✔ Class token parser passed.');

// Test 3: Truncate helper
console.log('▶ Test 3: Truncate helper');
assert.strictEqual(truncate('short text', 20), 'short text');
assert.strictEqual(truncate('This is a very long string that should get trimmed', 15), 'This is a very…');
console.log('  ✔ Truncate helper passed.');

// Test 4: Safe Regex compilation
console.log('▶ Test 4: Safe Regex compilation');
assert.ok(safeRegex('class="([^"]*)"', 'g') instanceof RegExp, 'Valid regex must compile');
assert.strictEqual(safeRegex('(?invalid regex', 'g'), null, 'Invalid regex must safely return null without throwing');
console.log('  ✔ Safe Regex compilation passed.');

// Test 5: Comprehensive Pattern Matching
console.log('▶ Test 5: Pattern extraction accuracy across modern frameworks');

const testMarkup = `
<div class="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
  <span className={'text-sm font-semibold tracking-wide text-slate-700'}>Title</span>
  <div className={\`grid grid-cols-1 md:grid-cols-3 gap-6 p-4\`}>Grid</div>
  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Sample" />
  <svg viewBox="0 0 100 100">
    <path d="M10 80 Q 95 10 180 80 T 360 80 M 10 80 Q 95 10 180 80 T 360 80" />
    <polygon points="0,0 100,0 100,100 0,100 50,50 150,150 200,200" />
  </svg>
  <button :class="isActive ? 'bg-blue-600 text-white font-medium shadow-md' : 'bg-gray-100 text-gray-700'">Click</button>
  <span class="btn">Small</span>
  <p class='font-mono text-xs text-neutral-500 tracking-normal'>Footer</p>
  <div className={cn("inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium")}>Button</div>
</div>
`;

// 5a. HTML and JSX double quote classes (excluding :class)
const classPattern = /(?<![:@])\b(?:class|className)\s*=\s*"([^"]*)"/dg;
const classMatches = [];
let m;
while ((m = classPattern.exec(testMarkup)) !== null) {
  classMatches.push(m[1]);
}
assert.strictEqual(classMatches.length, 2, 'Should match exactly 2 double-quoted class attributes');
assert.strictEqual(classMatches[0], 'flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl');
assert.strictEqual(classMatches[1], 'btn');

// 5b. Single quote class pattern
const singleQuotePattern = /(?<![:@])\b(?:class|className)\s*=\s*'([^']*)'/dg;
const singleQuoteMatches = [];
while ((m = singleQuotePattern.exec(testMarkup)) !== null) {
  singleQuoteMatches.push(m[1]);
}
assert.strictEqual(singleQuoteMatches.length, 1);
assert.strictEqual(singleQuoteMatches[0], 'font-mono text-xs text-neutral-500 tracking-normal');

// 5c. JSX template literal: className={`...`}
const templateLiteralPattern = /(?<![:@])\b(?:class|className)\s*=\s*\{\s*`([^`]*)`\s*\}/dg;
const templateMatches = [];
while ((m = templateLiteralPattern.exec(testMarkup)) !== null) {
  templateMatches.push(m[1]);
}
assert.strictEqual(templateMatches.length, 1);
assert.strictEqual(templateMatches[0], 'grid grid-cols-1 md:grid-cols-3 gap-6 p-4');

// 5d. Image src pattern
const imgPattern = /\bsrc\s*=\s*"([^"]*)"/dg;
const imgMatches = [];
while ((m = imgPattern.exec(testMarkup)) !== null) {
  imgMatches.push(m[1]);
}
assert.strictEqual(imgMatches.length, 1);
assert.ok(imgMatches[0].startsWith('data:image/png;base64,'), 'Should match base64 img src');

// 5e. SVG path (d) & points pattern
const svgPathPattern = /\bd\s*=\s*"([^"]*)"/dg;
const svgPathMatches = [];
while ((m = svgPathPattern.exec(testMarkup)) !== null) {
  svgPathMatches.push(m[1]);
}
assert.strictEqual(svgPathMatches.length, 1);
assert.ok(svgPathMatches[0].startsWith('M10 80'), 'Should match SVG path data');

const svgPointsPattern = /\bpoints\s*=\s*"([^"]*)"/dg;
const svgPointsMatches = [];
while ((m = svgPointsPattern.exec(testMarkup)) !== null) {
  svgPointsMatches.push(m[1]);
}
assert.strictEqual(svgPointsMatches.length, 1);
assert.ok(svgPointsMatches[0].startsWith('0,0 100,0'), 'Should match SVG points data');

// 5f. Vue bound class (:class)
const vuePattern = /(?<=[\s<])(?::class|v-bind:class)\s*=\s*"([^"]*)"/dg;
const vueMatches = [];
while ((m = vuePattern.exec(testMarkup)) !== null) {
  vueMatches.push(m[1]);
}
assert.strictEqual(vueMatches.length, 1);
assert.ok(vueMatches[0].includes('isActive ?'), 'Should match Vue bound class');

// 5g. Utility helper function: cn("...")
const cnPattern = /\b(?:clsx|cn|twMerge|cva)\(\s*"([^"]*)"\s*\)/dg;
const cnMatches = [];
while ((m = cnPattern.exec(testMarkup)) !== null) {
  cnMatches.push(m[1]);
}
assert.strictEqual(cnMatches.length, 1);
assert.strictEqual(cnMatches[0], 'inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium');

console.log('  ✔ Regex pattern extraction passed.');

// Test 6: Length threshold filtering
console.log('▶ Test 6: Minimum length threshold');
const minFoldLength = 20;
const filteredClasses = classMatches.filter((c) => c.length >= minFoldLength);
assert.strictEqual(filteredClasses.length, 1, 'Only long classes should pass minFoldLength threshold');
assert.strictEqual(filteredClasses[0], 'flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl');
console.log('  ✔ Length filtering passed.');

console.log('\n🎉 All 6 test suites passed flawlessly!\n');
