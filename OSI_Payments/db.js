// db.js - IndexedDB арқылы деректерді басқару
const DB_NAME = 'OSIPaymentsDB';
const DB_VERSION = 1;
const STORE_APARTMENTS = 'apartments'; // Пәтерлер туралы ақпарат
const STORE_TARIFFS = 'tariffs';       // Қызмет тарифтері
const STORE_PAYMENTS = 'payments';     // Ай сайынғы есептеулер мен төлемдер

let db;

/**
 * IndexedDB қосылуды ашады немесе жаңа деректер қорын құрады
 */
function openDB() {
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
                const apartStore = db.createObjectStore(STORE_APARTMENTS, { keyPath: 'id', autoIncrement: true });
                apartStore.createIndex('flatNumber', 'flatNumber', { unique: true });
            }

            // 2. Тарифтер (қызмет бағасы)
            if (!db.objectStoreNames.contains(STORE_TARIFFS)) {
                const tariffStore = db.createObjectStore(STORE_TARIFFS, { keyPath: 'serviceCode' });
            }
            
            // 3. Төлемдер (ай сайынғы есеп, төленген сома)
            if (!db.objectStoreNames.contains(STORE_PAYMENTS)) {
                const paymentStore = db.createObjectStore(STORE_PAYMENTS, { keyPath: 'id', autoIncrement: true });
                // flatId және ай-жыл бойынша іздеу үшін индекс
                paymentStore.createIndex('flatMonthYear', ['flatId', 'month', 'year'], { unique: true });
            }
            
            console.log("Деректер қорының құрылымы жасалды.");
            
            // Бастапқы деректерді толтыру үшін функцияны шақыру
            event.target.transaction.oncomplete = () => {
                 populateInitialData();
            };
        };
    });
}

/**
 * IndexedDB-ге бастапқы деректерді қосу
 */
async function populateInitialData() {
    const apartData = [
        { flatNumber: 1, area: 45.0, owner: "А.Е. Асанов", balance: 0 },
        { flatNumber: 2, area: 60.5, owner: "Б.К. Беріков", balance: 0 },
        // ... қосымша пәтерлерді қосыңыз
    ];
    
    // Сіз жүктеген құжаттарға сәйкес Тарифтер үлгісі
    const tariffData = [
        // "Үиді күтіп ұстау. Содержание дома" - 40 тг/м2
        { serviceCode: 'SD', name: 'Үйді күтіп ұстау', unit: 'sqm', rate: 40, description: '40 тг/м2' },
        // "Үй іші тазалығы. Уборка внутри дома" - 850 тг/пәтер
        { serviceCode: 'UB', name: 'Үй іші тазалығы', unit: 'flat', rate: 850, description: '850 тг/пәтер' },
        // "Кіреберіс есікке қызымет, бейнебақылау" - 300 тг/пәтер
        { serviceCode: 'VN', name: 'Бейнебақылау', unit: 'flat', rate: 300, description: '300 тг/пәтер' },
        // "Күрделі жөндеу. Капитальный ремонт" - 40 тг/м2
        { serviceCode: 'KR', name: 'Күрделі жөндеу', unit: 'sqm', rate: 40, description: '40 тг/м2' },
        // ... басқа қызметтерді қосыңыз
    ];

    try {
        await addData(STORE_APARTMENTS, apartData);
        await addData(STORE_TARIFFS, tariffData);
        console.log("Бастапқы деректер сәтті толтырылды.");
    } catch (error) {
        console.error("Бастапқы деректерді толтыру қатесі:", error);
    }
}

/**
 * Объектілер қоймасына деректерді қосады
 * @param {string} storeName - Деректер қоймасының атауы
 * @param {Array<Object>} data - Қосылатын объектілер массиві
 */
function addData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        data.forEach(item => store.add(item));

        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Объектілер қоймасындағы барлық деректерді алады
 * @param {string} storeName - Деректер қоймасының атауы
 */
function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// Сыртқы қолдану үшін экспорттау
export { openDB, getAllData, STORE_APARTMENTS, STORE_TARIFFS, STORE_PAYMENTS };





// db.js - Жаңа функциялар қосылды

// ... (бұрынғы код: DB_NAME, DB_VERSION, STORE_*, openDB, populateInitialData, getAllData)

/**
 * Пәтердің ағымдағы балансын жаңартады (қарыз оң сан, артық төлем теріс сан).
 * @param {number} flatId - Пәтердің DB идентификаторы
 * @param {number} amount - Балансты өзгерту сомасы
 */
function updateApartmentBalance(flatId, amount) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_APARTMENTS], 'readwrite');
        const store = transaction.objectStore(STORE_APARTMENTS);
        
        const getRequest = store.get(flatId);
        
        getRequest.onsuccess = (event) => {
            const apartment = event.target.result;
            if (!apartment) {
                return reject(`Пәтер ID ${flatId} табылмады.`);
            }
            
            // Балансты жаңарту
            apartment.balance = parseFloat((apartment.balance + amount).toFixed(2));
            
            const updateRequest = store.put(apartment);
            
            updateRequest.onsuccess = () => resolve(apartment.balance);
            updateRequest.onerror = (event) => reject(event.target.error);
        };
        
        getRequest.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Төленген соманы төлемдер тарихына қосады және пәтер балансын жаңартады.
 * @param {Object} paymentRecord - Төлем деректері (flatId, month, year, paidAmount, datePaid)
 * @param {number} balanceChange - Баланстың өзгеру сомасы (әдетте -paidAmount)
 */
function recordPayment(paymentRecord, balanceChange) {
    return new Promise(async (resolve, reject) => {
        const transaction = db.transaction([STORE_PAYMENTS, STORE_APARTMENTS], 'readwrite');
        const paymentsStore = transaction.objectStore(STORE_PAYMENTS);
        
        // 1. Төлем жазбасын сақтау
        const addRequest = paymentsStore.add(paymentRecord);
        
        addRequest.onsuccess = async () => {
            try {
                // 2. Пәтер балансын жаңарту
                const newBalance = await updateApartmentBalance(paymentRecord.flatId, balanceChange);
                resolve(newBalance);
            } catch (error) {
                // Егер балансты жаңарту сәтсіз болса, транзакцияны кері қайтару (қажет болса)
                reject(error);
            }
        };
        
        addRequest.onerror = (event) => reject(event.target.error);

        // Транзакцияның сәтті аяқталуын күту
        transaction.oncomplete = () => console.log("Төлем тіркеліп, баланс жаңартылды.");
    });
}

// Сыртқы қолдану үшін экспорттау
export { openDB, getAllData, updateApartmentBalance, recordPayment, 
         STORE_APARTMENTS, STORE_TARIFFS, STORE_PAYMENTS }; // recordPayment экспортталды