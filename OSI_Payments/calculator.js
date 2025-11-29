// calculator.js - Ай сайынғы төлемдерді есептеу логикасы
import { db, getAllData, STORE_APARTMENTS, STORE_TARIFFS, STORE_PAYMENTS } from './db.js'; // ✅ db импорты қосылды

/**
 * Әр пәтер үшін ай сайынғы жиынтық төлемді есептейді.
 */
export async function calculateMonthlyCharges(month, year) { // ✅ EXPORT қосылды
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
            breakdown: {}
        };
        
        for (const tariff of tariffs) {
            let charge = 0;
            if (tariff.unit === 'sqm') { 
                charge = apart.sqm * tariff.rate;
            } else if (tariff.unit === 'flat') {
                charge = tariff.rate;
            }
            
            flatDetails.breakdown[tariff.name] = { rate: tariff.rate, charge: parseFloat(charge.toFixed(2)) };
            totalCharge += charge;
        }

        flatDetails.totalCharge = parseFloat(totalCharge.toFixed(2));
        flatDetails.previousBalance = apart.balance || 0;
        flatDetails.amountDue = flatDetails.totalCharge + flatDetails.previousBalance;
        
        monthlyCharges.push(flatDetails);
    }

    await saveMonthlyCharges(monthlyCharges, month, year);
    return monthlyCharges;
}


/**
 * Есептелген айлық төлемдерді IndexedDB-ге сақтайды/жаңартады.
 */
async function saveMonthlyCharges(charges, month, year) {
     const transaction = db.transaction([STORE_PAYMENTS], 'readwrite');
     const store = transaction.objectStore(STORE_PAYMENTS);
     
     console.log(`Төлемдер ${month}/${year} үшін сақталуда...`);
     
     charges.forEach(charge => {
        const record = {
            flatNumber: charge.flatNumber,
            month: month,
            year: year,
            totalCharge: charge.totalCharge,
            amountDue: charge.amountDue,
            breakdown: charge.breakdown,
            paidAmount: 0, 
            datePaid: null, 
        };

        const index = store.index('flatMonthYear');
        const request = index.get([charge.flatNumber, month, year]);

        request.onsuccess = (event) => {
            const existingRecord = event.target.result;
            if (existingRecord) {
                record.id = existingRecord.id;
                store.put(record);
            } else {
                store.add(record);
            }
        };
        request.onerror = (event) => console.error("Жазбаны іздеу/сақтау қатесі:", event.target.error);

     });
     
     return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event.target.error);
     });
}
