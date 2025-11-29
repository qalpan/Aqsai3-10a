// db-v2.js - IndexedDB арқылы деректерді басқару (Duplicate Export қатесі жойылған)

const DB_NAME = 'OSIPaymentsDB';
const DB_VERSION = 1;
const STORE_APARTMENTS = 'apartments'; 
const STORE_TARIFFS = 'tariffs';       
const STORE_PAYMENTS = 'payments';     

let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB ашылуында қате:", event.target.errorCode);
            reject(new Error("IndexedDB қатесі"));
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_APARTMENTS)) {
                const apartStore = db.createObjectStore(STORE_APARTMENTS, { keyPath: 'id', autoIncrement: true });
                apartStore.createIndex('flatNumber', 'flatNumber', { unique: true });
            }

            if (!db.objectStoreNames.contains(STORE_TARIFFS)) {
                db.createObjectStore(STORE_TARIFFS, { keyPath: 'serviceCode' });
            }
            
            if (!db.objectStoreNames.contains(STORE_PAYMENTS)) {
                const paymentStore = db.createObjectStore(STORE_PAYMENTS, { keyPath: 'id', autoIncrement: true });
                paymentStore.createIndex('flatMonthYear', ['flatId', 'month', 'year'], { unique: true });
            }
            
            event.target.transaction.oncomplete = () => {
                populateInitialData();
            };
        };
    });
}

async function populateInitialData() {
    const apartData = [
        { flatNumber: 1, area: 45.0, owner: "А.Е. Асанов", balance: 0 },
        { flatNumber: 2, area: 60.5, owner: "Б.К. Беріков", balance: 0 },
    ];
    
    const tariffData = [
        { serviceCode: 'SD', name: 'Үйді күтіп ұстау', unit: 'sqm', rate: 40, description: '40 тг/м2' },
        { serviceCode: 'UB', name: 'Үй іші тазалығы', unit: 'flat', rate: 850, description: '850 тг/пәтер' },
        { serviceCode: 'VN', name: 'Бейнебақылау', unit: 'flat', rate: 300, description: '300 тг/пәтер' },
        { serviceCode: 'KR', name: 'Күрделі жөндеу', unit: 'sqm', rate: 40, description: '40 тг/м2' },
    ];

    try {
        await addData(STORE_APARTMENTS, apartData);
        await addData(STORE_TARIFFS, tariffData);
    } catch (error) {
        // Егер деректер бұрыннан бар болса, қате болуы мүмкін. Қалыпты жағдай.
    }
}

function addData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        data.forEach(item => store.add(item));

        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event.target.error);
    });
}

function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function updateApartmentBalance(flatNumber, amount) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_APARTMENTS], 'readwrite');
        const store = transaction.objectStore(STORE_APARTMENTS);
        
        // flatNumber бойынша іздеу үшін индекс қолданылады
        const flatIndex = store.index('flatNumber');
        const getRequest = flatIndex.get(flatNumber);

        getRequest.onsuccess = (event) => {
            const apartment = event.target.result;
            if (!apartment) {
                return reject(new Error(`Пәтер №${flatNumber} табылмады.`));
            }
            
            apartment.balance = parseFloat((apartment.balance + amount).toFixed(2));
            
            const updateRequest = store.put(apartment); 
            
            updateRequest.onsuccess = () => resolve(apartment.balance);
            updateRequest.onerror = (event) => reject(event.target.error);
        };
        
        getRequest.onerror = (event) => reject(event.target.error);
    });
}

function recordPayment(paymentRecord, balanceChange) {
    return new Promise(async (resolve, reject) => {
        const transaction = db.transaction([STORE_PAYMENTS, STORE_APARTMENTS], 'readwrite');
        const paymentsStore = transaction.objectStore(STORE_PAYMENTS);
        
        const addRequest = paymentsStore.add(paymentRecord);
        
        addRequest.onsuccess = async () => {
            try {
                // updateApartmentBalance енді пәтер нөмірін қабылдайды
                const newBalance = await updateApartmentBalance(paymentRecord.flatNumber, balanceChange); 
                resolve(newBalance);
            } catch (error) {
                reject(error);
            }
        };
        
        addRequest.onerror = (event) => reject(event.target.error);

        transaction.oncomplete = () => console.log("Төлем тіркеліп, баланс жаңартылды.");
    });
}

// Тек БІР РЕТ ЭКСПОРТТАУ
export { 
    openDB, 
    getAllData, 
    updateApartmentBalance, 
    recordPayment, 
    STORE_APARTMENTS, 
    STORE_TARIFFS, 
    STORE_PAYMENTS 
};
