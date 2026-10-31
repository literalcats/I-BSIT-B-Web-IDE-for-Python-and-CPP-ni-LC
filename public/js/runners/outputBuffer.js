// js/runners/outputBuffer.js
// Collects the text a program prints and sends it to the page in chunks.
// Sending one message per tiny print() would be slow for programs that print
// thousands of lines, so we group text. Text of the same kind
// ('out' = normal, 'err' = error) is merged, and the order is always kept.

const CHUNK_SIZE = 2048;

export function createOutputBuffer(send) {
  let kind = 'out';
  let text = '';

  function flush() {
    if (text === '') return;
    send(kind, text);
    text = '';
  }

  return {
    write(nextKind, chunk) {
      if (chunk === '') return;
      if (nextKind !== kind) {
        flush(); // keep the order: send what we have before switching kind
        kind = nextKind;
      }
      text += chunk;
      if (text.length >= CHUNK_SIZE) flush();
    },
    flush,
  };
}
