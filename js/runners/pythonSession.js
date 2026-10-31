// js/runners/pythonSession.js
// ---------------------------------------------------------------------------
// The logic for running Python with Pyodide. It does NOT create the engine
// itself: it receives an already-loaded `pyodide` object. That keeps it
// testable in Node (tests/python.test.mjs) and reusable by the web worker.
// ---------------------------------------------------------------------------

/**
 * Prepare Python: load our helper file and return a `run` function.
 * @param pyodide          the loaded Pyodide engine
 * @param bootstrapSource  the text of python_bootstrap.py
 */
export function createPythonSession(pyodide, bootstrapSource) {
  pyodide.runPython(bootstrapSource); // defines run_user_code()
  const runUserCode = pyodide.globals.get('run_user_code');
  const decoderFor = () => new TextDecoder('utf-8');

  /**
   * Run one program.
   * @param code       the Python source text
   * @param fileName   shown in error messages, e.g. "hello.py"
   * @param stdin      the text for input(), one answer per line
   * @param write      write(kind, text)  kind = 'out' or 'err'
   * @returns          { exitCode }  0 = finished, 1 = crashed
   */
  function run({ code, fileName, stdin = '', write }) {
    // The lines input() will receive. A trailing newline must not create an extra empty line.
    const lines = stdin === '' ? [] : stdin.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');

    // Echo each answer into the output, like a real terminal does.
    pyodide.setStdin({
      stdin: () => {
        if (lines.length === 0) return undefined; // undefined = "no more input" -> EOFError
        const line = lines.shift();
        write('out', line + '\n');
        return line;
      },
    });

    // Output arrives as raw bytes; a streaming decoder keeps characters like "é" or emoji intact.
    for (const [setter, kind] of [['setStdout', 'out'], ['setStderr', 'err']]) {
      const decoder = decoderFor();
      pyodide[setter]({
        write: (bytes) => {
          write(kind, decoder.decode(bytes, { stream: true }));
          return bytes.length;
        },
        isatty: true, // line-buffered: text appears as soon as a line is finished
      });
    }

    const exitCode = runUserCode(code, fileName);
    return { exitCode };
  }

  return { run };
}
