// js/editor/indent.js
// Auto-indent for the simple editor: when a student presses Enter, the new
// line starts at the same indentation as the line above. After a line that
// ends with ":" (Python) or "{" (C++) it goes one level deeper.
// Pure functions (no page access), so they are easy to test.

export const INDENT = '    '; // 4 spaces

/** Leading spaces/tabs of a line. */
export function leadingWhitespace(line) {
  return /^[ \t]*/.exec(line)[0];
}

/**
 * Text to insert when Enter is pressed.
 * @param textBeforeCursor everything before the cursor
 * @param languageId       'python' or 'cpp'
 */
export function newLineWithIndent(textBeforeCursor, languageId) {
  const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
  const line = textBeforeCursor.slice(lineStart);
  let indent = leadingWhitespace(line);

  const code = languageId === 'python' ? line.replace(/#.*$/, '') : line.replace(/\/\/.*$/, '');
  const opener = languageId === 'python' ? /:\s*$/ : /\{\s*$/;
  if (opener.test(code)) indent += INDENT;

  return '\n' + indent;
}

/** Remove one level of indentation from the start of a line (Shift+Tab). */
export function outdentLine(line) {
  if (line.startsWith(INDENT)) return line.slice(INDENT.length);
  if (line.startsWith('\t')) return line.slice(1);
  return line.replace(/^ {1,3}/, '');
}
