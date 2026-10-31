// js/runners/limitHints.js
// ---------------------------------------------------------------------------
// Helps students tell apart "I made a mistake" from "this app cannot do that".
//
// C++ here runs on JSCPP, a SIMPLIFIED C++ interpreter. Valid C++ (a std::string,
// a struct, a vector...) can fail in it with an error that looks like the
// student's fault. When a C++ run ends with an error, we add a short, honest note.
//
// Pure functions (no screen code), so they are easy to test.
// ---------------------------------------------------------------------------

const UNSUPPORTED = 'std::string, struct, classes, vectors, references (&), new/delete, templates, exceptions and files';

/** Pull the library name out of JSCPP's "cannot find library: vector" error, if present. */
export function findMissingLibrary(errorText) {
  const match = /cannot find library:\s*([\w./]+)/i.exec(String(errorText));
  return match ? match[1] : '';
}

/**
 * The note shown under a failed C++ run.
 * @param errorText  everything the program printed as an error
 */
export function cppLimitHint(errorText) {
  const library = findMissingLibrary(errorText);
  const lead = library
    ? `The <${library}> library is not available in this app's C++ engine. That does not mean your code is wrong.`
    : 'This error can be a mistake in your code, or something this app\'s simplified C++ cannot do.';
  return (
    `\nNote: ${lead} This app runs a simplified C++ (it is not a full compiler). ` +
    `These do not run here: ${UNSUPPORTED}. ` +
    'If your code works in a real compiler such as g++, it is fine. ' +
    'See More (⋮) → Tips and limits.\n'
  );
}
