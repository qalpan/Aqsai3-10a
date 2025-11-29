// db.js - IndexedDB арқылы деректерді басқару

const DB_NAME = 'OSIPaymentsDB';
const DB_VERSION = 1;
export const STORE_APARTMENTS = 'apartments';
export const STORE_TARIFFS = 'tariffs';
export const STORE_PAYMENTS = 'payments';

export let db; // ✅ ӨЗГЕРІС: 'db' айнымалысы экспортталды

/**
 * IndexedDB қосылуды ашады немесе жаңа деректер қорын құрады
 */
export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB ашылуында қате:", event.target.errorCode);
            reject("IndexedDB қатесі");
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("IndexedDB сәтті ашылды.");
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_APARTMENTS)) {
                const apartmentsStore = db.createObjectStore(STORE_APARTMENTS, { keyPath: 'id', autoIncrement: true });
                apartmentsStore.createIndex('flatNumber', 'flatNumber', { unique: true });
            }

            if (!db.objectStoreNames.contains(STORE_TARIFFS)) {
                db.createObjectStore(STORE_TARIFFS, { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains(STORE_PAYMENTS)) {
                const paymentsStore = db.createObjectStore(STORE_PAYMENTS, { keyPath: 'id', autoIncrement: true });
                paymentsStore.createIndex('flatMonthYear', ['flatNumber', 'month', 'year'], { unique: false });
            }

            console.log("IndexedDB структурасы жаңартылды.");
        };
    });
}

/**
 * Тарифтерді инициализациялау
 */
export async function initializeTariffs() {
    try {
        await openDB(); // db-ді ашу
        const tariffs = await getAllData(STORE_TARIFFS);
        if (tariffs.length === 0) {
            const defaultTariffs = [
                { name: 'ЖӨА', rate: 45, unit: 'sqm', description: 'Жалпы үй мүлкін ұстауға жұмсалатын шығыс' },
                { name: 'ЦС', rate: 1000, unit: 'flat', description: 'Сапалы қызмет көрсету үшін қосымша төлем' }
            ];
            
            const transaction = db.transaction([STORE_TARIFFS], 'readwrite');
            const store = transaction.objectStore(STORE_TARIFFS);
            defaultTariffs.forEach(tariff => store.add(tariff));

            await new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = (event) => reject(event.target.error);
            });
            console.log("Әдепкі тарифтер сәтті қосылды.");
        }
    } catch (error) {
        console.error("Тарифтерді инициализациялау қатесі:", error);
        throw error;
    }
}

/**
 * Берілген қоймадағы барлық деректерді алады.
 */
export function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        if (!db) {
            // Егер db ашылмаған болса, қате қайтару
            return reject(new Error("IndexedDB қосылымы әлі ашылмаған."));
        }

        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Пәтер нөмірі бойынша пәтер туралы деректі алады.
 */
export function getApartmentByNumber(flatNumber) {
    return new Promise((resolve, reject) => {
        if (!db) return reject(new Error("IndexedDB қосылымы әлі ашылмаған."));
        
        const transaction = db.transaction([STORE_APARTMENTS], 'readonly');
        const store = transaction.objectStore(STORE_APARTMENTS);
        const index = store.index('flatNumber');
        const request = index.get(flatNumber);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Пәтердің балансын жаңартады.
 */
function updateApartmentBalance(flatNumber, changeAmount) {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject(new Error("IndexedDB қосылымы әлі ашылмаған."));
        // ... (қалған updateApartmentBalance логикасы) ...

        // Бұл логиканы db.js-тің өзінде толығымен сақтаңыз
        try {
            const transaction = db.transaction([STORE_APARTMENTS], 'readwrite');
            const store = transaction.objectStore(STORE_APARTMENTS);
            const index = store.index('flatNumber');
            const getRequest = index.get(flatNumber);

            getRequest.onsuccess = () => {
                const apartment = getRequest.result;
                if (!apartment) return reject(new Error(`Пәтер №${flatNumber} табылмады.`));
                
                apartment.balance = parseFloat((apartment.balance || 0) + changeAmount).toFixed(2); 
                apartment.balance = parseFloat(apartment.balance); 

                const updateRequest = store.put(apartment);
                updateRequest.onsuccess = () => resolve(apartment.balance);
                updateRequest.onerror = (event) => reject(event.target.error);
            };
            getRequest.onerror = (event) => reject(event.target.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Төлем жазбасын сақтайды және пәтер балансын жаңартады.
 */
export function recordPayment(paymentRecord, balanceChange) {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject(new Error("IndexedDB қосылымы әлі ашылмаған."));
        
        const transaction = db.transaction([STORE_PAYMENTS, STORE_APARTMENTS], 'readwrite');
        const paymentsStore = transaction.objectStore(STORE_PAYMENTS);
        
        const addRequest = paymentsStore.add(paymentRecord);
        
        addRequest.onsuccess = async () => {
            try {
                // Пәтер балансын жаңарту
                const newBalance = await updateApartmentBalance(paymentRecord.flatNumber, balanceChange); 
                resolve(newBalance);
            } catch (error) {
                reject(error);
            }
        };
        
        addRequest.onerror = (event) => reject(event.target.error);
        transaction.onerror = (event) => reject(event.target.error);
    });
}
