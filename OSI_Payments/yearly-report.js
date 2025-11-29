// yearly-report.js - Жеке пәтер бойынша жылдық есеп беру
import { getAllData, STORE_PAYMENTS } from './db.js';

const formatCurrency = (amount) => new Intl.NumberFormat('kk-KZ').format(amount);
const MONTHS = ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"];

/**
 * Пәтер бойынша жылдық төлемдер тарихын алады және көрсетеді.
 */
export async function generateYearlyReport(flatNumber, year) { // ✅ EXPORT қосылды
    try {
        const allPayments = await getAllData(STORE_PAYMENTS);
        
        const yearlyPayments = allPayments.filter(p => 
            p.flatNumber === flatNumber && p.year === year
        ).sort((a, b) => a.month - b.month); 
        
        if (yearlyPayments.length === 0) {
            alert(`Пәтер №${flatNumber} үшін ${year} жылында төлем жазбалары табылмады.`);
            return;
        }

        const reportHtml = createReportHtml(flatNumber, year, yearlyPayments);
        // ... (қалған логика: жаңа терезеде ашу)
        const newWindow = window.open('', '_blank');
        newWindow.document.write(reportHtml);
        newWindow.document.close();

    } catch (error) {
        console.error("Жылдық есеп беру қатесі:", error);
        alert("Жылдық есеп беру кезінде қателік туындады.");
    }
}

// ... (қалған createReportHtml логикасы) ...
