// js/runners/cppSession.js
// ---------------------------------------------------------------------------
// The logic for running C++ with JSCPP (a C++ interpreter written in
// JavaScript). Like pythonSession.js it receives the engine from outside, so
// it can be tested in Node and reused by the web worker.
//
// IMPORTANT FOR STUDENTS: JSCPP understands "beginner" C++ (variables, loops,
// functions, arrays, pointers, cin/cout, <cmath>, <cstring>...). It is NOT a
// full compiler, so classes, vectors and templates may fail here even though
// they work with g++. The cheat sheet tags every topic with what works.
// ---------------------------------------------------------------------------

/** Turn whatever JSCPP threw into one readable line of text. */
export function describeCppError(error) {
  const text = String(error && error.message ? error.message : error).trim();
  return text === '' ? 'The C++ interpreter stopped without a message.' : text;
}

/**
 * Run one C++ program.
 * @param JSCPP    the loaded engine (global JSCPP in the browser)
 * @param code     the C++ source text
 * @param stdin    text for cin, answers separated by spaces or new lines
 * @param write    write(kind, text)  kind = 'out' or 'err'
 * @returns        { exitCode }  0 = finished, 1 = failed
 */
export function runCpp(JSCPP, { code, stdin = '', write }) {
  const config = {
    stdio: { write: (text) => write('out', String(text)) },
    // Beginner programs often overflow unsigned numbers by accident; show a warning, don't crash.
    unsigned_overflow: 'warn',
  };

  try {
    const exitCode = JSCPP.run(code, stdin, config);
    // JSCPP returns main()'s return value; treat anything but a non-zero number as success.
    return { exitCode: typeof exitCode === 'number' && exitCode !== 0 ? exitCode : 0 };
  } catch (error) {
    write('err', `${describeCppError(error)}\n`);
    return { exitCode: 1 };
  }
}
