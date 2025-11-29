// data-io.js - CSV арқылы деректерді импорттау/экспорттау

import { openDB, getAllData, STORE_APARTMENTS, STORE_TARIFFS } from './db.js';

// Қайта экспорттау ✅
export { STORE_APARTMENTS, STORE_TARIFFS };

/**
 * CSV файлдан пәтер деректерін оқиды және IndexedDB-ге сақтайды.
 */
export async function importApartments(file) {
    // ... функция коды ...
}

/**
 * Пәтерлер немесе Төлемдер деректерін CSV ретінде экспорттау.
 */
export async function exportData(storeName) {
    // ... функция коды ...
}
