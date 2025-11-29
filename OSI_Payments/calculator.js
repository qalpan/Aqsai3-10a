// calculator.js - Ай сайынғы төлемдерді есептеу логикасы
import { db, getAllData, STORE_APARTMENTS, STORE_TARIFFS, STORE_PAYMENTS } from './db.js'; // <--- ӨЗГЕРІС: db импортталды

/**
 * Әр пәтер үшін ай сайынғы жиынтық төлемді есептейді.
 * @param {number} month - Ай нөмірі (1-12)
 * @param {number} year - Жыл
 * @returns {Promise<Array<Object>>} - Әр пәтерге есептелген жиынтық сома
 */
export async function calculateMonthlyCharges(month, year) {
    const apartments = await getAllData(STORE_APARTMENTS);
    const tariffs = await getAllData(STORE_TARIFFS);
    const monthlyCharges = [];

    for (const apart of apartments) {
        let totalCharge = 0;
        const flatDetails = { 
            flatId: apart.id, 
            flatNumber: apart.flatNumber, 
            month: month, 
            year: year, 
            breakdown: {} // Әр қызмет бойынша есептеу
        };
        
        // Әрбір тариф бойынша төлемді есептеу
        for (const tariff of tariffs) {
            let charge = 0;
            
            // Төлемді есептеу логикасы
            if (tariff.unit === 'sqm') { // Шаршы метрмен есептелсе (тг/м2)
                charge = apart.sqm * tariff.rate;
            } else if (tariff.unit === 'flat') { // Пәтер бойынша есептелсе (бір пәтерден тг)
                charge = tariff.rate;
            }
            
            flatDetails.breakdown[tariff.name] = { rate: tariff.rate, charge: parseFloat(charge.toFixed(2)) };
            totalCharge += charge;
        }

        flatDetails.totalCharge = parseFloat(totalCharge.toFixed(2));
        
        // Ескі қарызды алу (қазір қарапайымдылық үшін apart.balance-ты қолданамыз)
        // Нақты жүйеде алдыңғы айдың төлемдер тарихын IndexedDB-ден алу керек.
        
        flatDetails.previousBalance = apart.balance || 0; // Балансты алу
        flatDetails.amountDue = flatDetails.totalCharge + flatDetails.previousBalance;
        
        monthlyCharges.push(flatDetails);
    }

    // Нәтижелерді сақтау (немесе жаңарту)
    await saveMonthlyCharges(monthlyCharges, month, year);
    
    return monthlyCharges;
}


/**
 * Есептелген айлық төлемдерді IndexedDB-ге сақтайды/жаңартады.
 * @param {Array<Object>} charges - Есептелген төлемдер тізімі
 * @param {number} month - Ай нөмірі
 * @param {number} year - Жыл
 */
async function saveMonthlyCharges(charges, month, year) {
     const transaction = db.transaction([STORE_PAYMENTS], 'readwrite');
     const store = transaction.objectStore(STORE_PAYMENTS);
     
     // ДБ API-сін шақыру қажет, бірақ қазір қарапайым:
     console.log(`Төлемдер ${month}/${year} үшін сақталуда...`);
     
     // Сақтау логикасы (қайта жазу немесе жаңа жазба қосу)
     charges.forEach(charge => {
        // Есептелген төлем жазбасын сақтау (толық төлемдер тарихына арналған)
        // Қазіргі уақытта бұл жай ғана ай сайынғы есептеуді сақтайды.
        const record = {
            flatNumber: charge.flatNumber,
            month: month,
            year: year,
            totalCharge: charge.totalCharge,
            amountDue: charge.amountDue,
            breakdown: charge.breakdown,
            // Төлем деректері (әлі төленбеген)
            paidAmount: 0, 
            datePaid: null, 
            // id IndexedDB-де автоматты түрде қосылады
        };

        // Бұрынғы жазбаны іздеу және жаңарту (қажет болса)
        const index = store.index('flatMonthYear');
        const request = index.get([charge.flatNumber, month, year]);

        request.onsuccess = (event) => {
            const existingRecord = event.target.result;
            if (existingRecord) {
                // Егер жазба бар болса, жаңарту
                record.id = existingRecord.id;
                store.put(record);
            } else {
                // Жаңа жазба қосу
                store.add(record);
            }
        };
        request.onerror = (event) => console.error("Жазбаны іздеу/сақтау қатесі:", event.target.error);

     });
     
     return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
            console.log(`Барлық айлық төлемдер ${month}/${year} үшін сәтті сақталды.`);
            resolve();
        };
        transaction.onerror = (event) => reject(event.target.error);
     });
}
