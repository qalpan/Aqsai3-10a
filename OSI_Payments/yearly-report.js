// yearly-report.js - Жеке пәтер бойынша жылдық есеп беру
import { getAllData, STORE_PAYMENTS } from './db.js';

const formatCurrency = (amount) => new Intl.NumberFormat('kk-KZ').format(amount);
const MONTHS = ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"];

/**
 * Пәтер бойынша жылдық төлемдер тарихын алады және көрсетеді.
 * @param {number} flatNumber - Пәтер нөмірі
 * @param {number} year - Жыл
 */
async function generateYearlyReport(flatNumber, year) {
    try {
        const allPayments = await getAllData(STORE_PAYMENTS);
        
        // Берілген пәтер мен жыл бойынша төлемдерді сүзу
        const yearlyPayments = allPayments.filter(p => 
            p.flatNumber === flatNumber && p.year === year
        ).sort((a, b) => a.month - b.month); // Ай бойынша сұрыптау
        
        if (yearlyPayments.length === 0) {
            alert(`Пәтер №${flatNumber} үшін ${year} жылында төлем жазбалары табылмады.`);
            return;
        }

        const reportHtml = createReportHtml(flatNumber, year, yearlyPayments);
        
        // Есепті жаңа терезеде көрсету (немесе модальда)
        const reportWindow = window.open('', 'YearlyReport', 'width=800,height=600');
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
        reportWindow.print(); // Басып шығаруға жіберу

    } catch (error) {
        alert(`Жылдық есеп беруде қате: ${error.message}`);
        console.error(error);
    }
}

function createReportHtml(flatNumber, year, payments) {
    let tableRows = '';
    let totalBilled = 0;
    let totalPaid = 0;

    payments.forEach(p => {
        totalBilled += p.amountBilled || 0;
        totalPaid += p.paidAmount || 0;
        
        tableRows += `
            <tr>
                <td>${MONTHS[p.month - 1]}</td>
                <td>${p.datePaid || 'Тіркелмеген'}</td>
                <td>${formatCurrency(p.amountBilled || 0)}</td>
                <td>${formatCurrency(p.paidAmount || 0)}</td>
                <td>${formatCurrency(p.balanceAfter || 0)}</td>
            </tr>
        `;
    });
    
    // Жалпы баланс
    const finalBalance = payments.length > 0 ? payments[payments.length - 1].balanceAfter : 0;

    return `
        <html>
        <head>
            <title>Жылдық Есеп: Пәтер ${flatNumber}, ${year}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
                th { background-color: #f0f0f0; }
                .summary p { font-size: 1.1em; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Жылдық Төлемдер Есебі</h1>
            <h2>Пәтер №${flatNumber} - ${year} жыл</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>Ай</th>
                        <th>Төлем күні</th>
                        <th>Есептелген (тг)</th>
                        <th>Төленген (тг)</th>
                        <th>Ай соңындағы қарыз (тг)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            
            <div class="summary">
                <p>Жылдық жалпы есептелген сома: ${formatCurrency(totalBilled)}</p>
                <p>Жылдық жалпы төленген сома: ${formatCurrency(totalPaid)}</p>
                <p style="color: ${finalBalance > 0 ? 'red' : 'green'};">Жыл соңындағы қалдық/қарыз: ${formatCurrency(finalBalance)}</p>
            </div>
        </body>
        </html>
    `;
}

// Глобалды қолдану үшін экспорттау
window.generateYearlyReport = generateYearlyReport;