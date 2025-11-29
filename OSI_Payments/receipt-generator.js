// receipt-generator.js - Түбіртек жасау және басып шығару логикасы

import { getAllData, STORE_APARTMENTS, STORE_PAYMENTS } from './db.js';

const formatCurrency = (amount) => new Intl.NumberFormat('kk-KZ', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 2
}).format(amount);

const MONTHS = ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"];

/**
 * Пәтер бойынша айлық төлем түбіртегін жасайды және басып шығаруды іске қосады.
 */
export async function generateReceipt(flatNumber, month, year) { // ✅ EXPORT қосылды
    try {
        const payments = await getAllData(STORE_PAYMENTS);
        const paymentRecord = payments.find(p => 
            p.flatNumber === flatNumber && p.month === month && p.year === year
        );

        if (!paymentRecord) {
            alert(`Пәтер №${flatNumber} үшін ${MONTHS[month - 1]} ${year} жылына есептелген жазба табылмады. Алдымен есептеуді іске қосыңыз.`);
            return;
        }

        const receiptHtml = createReceiptHtml(paymentRecord);
        displayReceipt(receiptHtml);

    } catch (error) {
        console.error("Түбіртек жасаудағы қате:", error);
        alert("Түбіртекті жасау кезінде қателік туындады. Консольді тексеріңіз.");
    }
}

// ... (қалған функциялар: createReceiptHtml, displayReceipt)
// Бұл функциялар экспортқа мұқтаж емес, өйткені олар generateReceipt ішінде ғана қолданылады.
// Оларды бастапқы нұсқаларында қалдырыңыз.
