// calculator.js - Ай сайынғы төлемдерді есептеу логикасы
import { getAllData, STORE_APARTMENTS, STORE_TARIFFS, STORE_PAYMENTS } from './db.js';

/**
 * Әр пәтер үшін ай сайынғы жиынтық төлемді есептейді.
 * @param {number} month - Ай нөмірі (1-12)
 * @param {number} year - Жыл
 * @returns {Promise<Array<Object>>} - Әр пәтерге есептелген жиынтық сома
 */
async function calculateMonthlyCharges(month, year) {
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
                charge = tariff.rate * apart.area;
            } else if (tariff.unit === 'flat') { // Пәтер бірлігімен есептелсе (тг/пәтер)
                charge = tariff.rate;
            }
            
            // Есептелген соманы жиынтыққа қосу
            totalCharge += charge;
            
            // Есептеуді бөлшектеуге сақтау
            flatDetails.breakdown[tariff.serviceCode] = parseFloat(charge.toFixed(2));
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
     
     for (const charge of charges) {
         // Бұл жерде Index арқылы бар екенін тексеріп, put (жаңарту) немесе add (қосу)
         // операциясын орындау қажет. Қарапайымдылық үшін қазір тек консольге шығарамыз.
         // Нақты жүйеде: store.put(charge);
     }
     // transaction.oncomplete = () => console.log("Сақтау сәтті.");
}

export { calculateMonthlyCharges };