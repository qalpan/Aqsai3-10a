// data-io.js - CSV арқылы деректерді импорттау/экспорттау

import { openDB, getAllData, STORE_APARTMENTS, STORE_TARIFFS } from './db.js';

// ... (parseCSV функциясы - экспортталмаған, өйткені ол тек осы файлда қолданылады) ...

/**
 * CSV файлдан пәтер деректерін оқиды және IndexedDB-ге сақтайды.
 */
export async function importApartments(file) { // ✅ EXPORT қосылды
    // ... (функцияның қалған бөлігі) ...
}

// ... (toCSV, downloadCSV функциялары - экспортталмаған) ...

/**
 * Пәтерлер немесе Төлемдер деректерін CSV ретінде экспорттау.
 */
export async function exportData(storeName) { // ✅ EXPORT қосылды
    // ... (функцияның қалған бөлігі) ...
}
