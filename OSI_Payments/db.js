// db.js – IndexedDB деректер базасын басқару

const DB_NAME = "ApartmentPaymentsDB";
const DB_VERSION = 1;

// Дүкен атаулары (store names)
export const STORE_APARTMENTS = "apartments";
export const STORE_TARIFFS = "tariffs";
export const STORE_PAYMENTS = "payments";

/**
 * IndexedDB ашу
 */
export async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Пәтерлер дүкені
            if (!db.objectStoreNames.contains(STORE_APARTMENTS)) {
                db.createObjectStore(STORE_APARTMENTS, { keyPath: "flatNumber" });
            }

            // Тарифтер дүкені
            if (!db.objectStoreNames.contains(STORE_TARIFFS)) {
                db.createObjectStore(STORE_TARIFFS, { keyPath: "id", autoIncrement: true });
            }

            // Төлемдер дүкені
            if (!db.objectStoreNames.contains(STORE_PAYMENTS)) {
                db.createObjectStore(STORE_PAYMENTS, { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Барлық деректерді алу
 */
export async function getAllData(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Тарифтерді бастапқы күйге келтіру
 */
export async function initializeTariffs() {
    const db = await openDB();
    const tx = db.transaction(STORE_TARIFFS, "readwrite");
    const store = tx.objectStore(STORE_TARIFFS);

    // Мысал тарифтер
    const tariffs = [
        { id: 1, name: "ЖӨА", rate: 150 },
        { id: 2, name: "ЦС", rate: 200 }
    ];

    tariffs.forEach(t => store.put(t));
}

/**
 * Пәтерді нөмірі бойынша алу
 */
export async function getApartmentByNumber(flatNumber) {
    const db = await openDB();
    return new Promise
