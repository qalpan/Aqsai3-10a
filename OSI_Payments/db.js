// db.js - IndexedDB арқылы деректерді басқару

const DB_NAME = 'OSIPaymentsDB';
const DB_VERSION = 1;
export const STORE_APARTMENTS = 'apartments'; // Пәтерлер туралы ақпарат
export const STORE_TARIFFS = 'tariffs';       // Қызмет тарифтері
export const STORE_PAYMENTS = 'payments';     // Ай сайынғы есептеулер мен төлемдер

export let db; // <--- ӨЗГЕРІС: db айнымалысы экспортталды

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

        // Егер деректер қоры жаңа болса немесе версия өзгерсе, іске қосылады
        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // 1. Пәтерлер (әр пәтердің алаңы, т.б.)
            if (!db.objectStoreNames.contains(STORE_APARTMENTS)) {
                const apartmentsStore = db.createObjectStore(STORE_APARTMENTS, { keyPath: 'id', autoIncrement: true });
                apartmentsStore.createIndex('flatNumber', 'flatNumber', { unique: true });
            }

            // 2. Тарифтер (ЖӨА, ЦС бағалары)
            if (!db.objectStoreNames.contains(STORE_TARIFFS)) {
                db.createObjectStore(STORE_TARIFFS, { keyPath: 'id', autoIncrement: true });
            }
            
            // 3. Төлемдер/Есептеулер
            if (!db.objectStoreNames.contains(STORE_PAYMENTS)) {
                const paymentsStore = db.createObjectStore(STORE_PAYMENTS, { keyPath: 'id', autoIncrement: true });
                paymentsStore.createIndex('flatMonthYear', ['flatNumber', 'month', 'year'], { unique: false });
            }

            console.log("IndexedDB структурасы жаңартылды.");
        };
    });
}

/**
 * Тарифтерді инициализациялау (егер базада жоқ болса, әдепкі мәндерді қосу)
 */
export async function initializeTariffs() {
    try {
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
                transaction.oncomplete = () => {
                    console.log("Әдепкі тарифтер сәтті қосылды.");
                    resolve();
                };
                transaction.onerror = (event) => reject(event.target.error);
            });
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
            // DB ашылмаған болса, оны ашуға тырысу
            openDB().then(() => {
                getAllData(storeName).then(resolve).catch(reject);
            }).catch(reject);
            return;
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
 * @param {number} flatNumber - Пәтер нөмірі
 * @param {number} changeAmount - Баланстың өзгеру сомасы (Төлем үшін теріс сан)
 * @returns {Promise<number>} - Жаңа баланс
 */
async function updateApartmentBalance(flatNumber, changeAmount) {
    return new Promise(async (resolve, reject) => {
        try {
            const transaction = db.transaction([STORE_APARTMENTS], 'readwrite');
            const store = transaction.objectStore(STORE_APARTMENTS);
            const index = store.index('flatNumber');
            const getRequest = index.get(flatNumber);

            getRequest.onsuccess = () => {
                const apartment = getRequest.result;
                if (!apartment) {
                    return reject(new Error(`Пәтер №${flatNumber} табылмады.`));
                }
                
                // Балансты есептеу: chargeAmount (есептелген) + changeAmount (төленген)
                // Егер changeAmount теріс болса, төлем; оң болса, қарыз.
                apartment.balance = parseFloat((apartment.balance || 0) + changeAmount).toFixed(2); 
                apartment.balance = parseFloat(apartment.balance); // Float-қа қайта түрлендіру

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
 * @param {Object} paymentRecord - Төлем жазбасы (flatNumber, month, year, paidAmount, datePaid)
 * @param {number} balanceChange - Баланстың өзгеру сомасы (Теріс сан - төлем)
 */
export function recordPayment(paymentRecord, balanceChange) {
    return new Promise(async (resolve, reject) => {
        const transaction = db.transaction([STORE_PAYMENTS, STORE_APARTMENTS], 'readwrite');
        const paymentsStore = transaction.objectStore(STORE_PAYMENTS);
        
        // 1. Төлем жазбасын сақтау
        const addRequest = paymentsStore.add(paymentRecord);
        
        addRequest.onsuccess = async () => {
            try {
                // 2. Пәтер балансын жаңарту
                // updateApartmentBalance енді пәтер нөмірін қабылдайды
                // Баланс өзгерісін тікелей жібереміз
                const newBalance = await updateApartmentBalance(paymentRecord.flatNumber, balanceChange); 
                resolve(newBalance);
            } catch (error) {
                reject(error);
            }
        };
        
        addRequest.onerror = (event) => reject(event.target.error);

        // Транзакцияның сәтті аяқталуын күту
        transaction.oncomplete = () => console.log("Төлем тіркеліп, баланс жаңартылды.");
        transaction.onerror = (event) => reject(event.target.error);
    });
}

// Экспорттар
// openDB, initializeTariffs, getAllData, getApartmentByNumber, recordPayment функциялары export ретінде жарияланған.
