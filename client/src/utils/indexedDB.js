const DB_NAME = 'GyaanSetuDB';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('quiz_cache')) {
        db.createObjectStore('quiz_cache', { keyPath: 'topic' });
      }
      if (!db.objectStoreNames.contains('explanation_cache')) {
        db.createObjectStore('explanation_cache', { keyPath: 'topic' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const addToQueue = async (type, data, timestamp = new Date()) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite');
    tx.objectStore('offline_queue').add({ type, data, timestamp: timestamp.toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getQueue = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readonly');
    const request = tx.objectStore('offline_queue').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const clearQueue = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite');
    tx.objectStore('offline_queue').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const cacheQuiz = async (topic, questions) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('quiz_cache', 'readwrite');
    tx.objectStore('quiz_cache').put({ topic, questions });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedQuiz = async (topic) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('quiz_cache', 'readonly');
    const request = tx.objectStore('quiz_cache').get(topic);
    request.onsuccess = () => resolve(request.result?.questions || null);
    request.onerror = () => reject(request.error);
  });
};

export const cacheExplanation = async (topic, text) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('explanation_cache', 'readwrite');
    tx.objectStore('explanation_cache').put({ topic, text });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedExplanation = async (topic) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('explanation_cache', 'readonly');
    const request = tx.objectStore('explanation_cache').get(topic);
    request.onsuccess = () => resolve(request.result?.text || null);
    request.onerror = () => reject(request.error);
  });
};

export default openDB;
