// js/storage/schema.js
// The "shape" of our database, shared by the real database (idb.js) and the
// in-memory copy (memory.js) so they always agree.
//
//   files    - one record per student file:
//              { id, name, language, content, stdin, createdAt, updatedAt }
//   settings - small remembered things:  { key, value }

export const STORES = ['files', 'settings'];

// Which field of a record is its unique key.
export const KEY_PATHS = {
  files: 'id',
  settings: 'key',
};
