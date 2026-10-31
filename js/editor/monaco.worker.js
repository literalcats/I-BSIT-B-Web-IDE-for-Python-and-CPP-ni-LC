// js/editor/monaco.worker.js
// Monaco needs a small background worker for some features. We serve this
// tiny launcher from OUR OWN site (not a data: link) so the offline cache can
// store it and it keeps working without internet.
self.MonacoEnvironment = { baseUrl: new URL('../../vendor/monaco/', self.location.href).href };
importScripts(self.MonacoEnvironment.baseUrl + 'vs/base/worker/workerMain.js');
