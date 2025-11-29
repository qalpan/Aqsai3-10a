// receipt-generator.js - Түбіртек жасау және басып шығару логикасы
import { getAllData, STORE_APARTMENTS, STORE_PAYMENTS } from './db.js';
// calculateMonthlyCharges функциясын импорттау керек, бірақ қазір қарапайымдылық үшін тек ДБ-дан деректерді аламыз.

const formatCurrency = (amount) => new Intl.NumberFormat('kk-KZ', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 2
}).format(amount);

const MONTHS = ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"];

/**
 * Пәтер бойынша айлық төлем түбіртегін жасайды және басып шығаруды іске қосады.
 * @param {number} flatNumber - Пәтер нөмірі
 * @param {number} month - Ай нөмірі (1-12)
 * @param {number} year - Жыл
 */
async function generateReceipt(flatNumber, month, year) {
    try {
        // 1. Деректерді алу (Төлемдер мен Пәтер туралы ақпарат)
        const apartments = await getAllData(STORE_APARTMENTS);
        const payments = await getAllData(STORE_PAYMENTS);

        const apartment = apartments.find(a => a.flatNumber === flatNumber);
        if (!apartment) throw new Error(`Пәтер №${flatNumber} табылмады.`);

        // Тексерілген айлық төлем деректерін табу (нақты ДБ қосу логикасынан кейін)
        // Қарапайымдылық үшін, егер ДБ-да сақталмаған болса, кестеден есептелген нәтижені қолданамыз.
        // Қазір біз үлгі деректерін қолданамыз, себебі 2-қадамдағы saveMonthlyCharges әлі толық іске асырылмаған.
        
        // *******************************************************************
        // НАҚТЫ ЖҮЙЕДЕ БҰЛ ЖЕРДЕ IndexedDB-ден төлем жазбасын алу керек.
        // *******************************************************************
        
        // ҮЛГІ ДЕРЕКТЕРІ (егер DB-дан ала алмасақ)
        const paymentData = {
            flatNumber: flatNumber,
            owner: apartment.owner,
            area: apartment.area,
            monthName: MONTHS[month - 1],
            year: year,
            dateGenerated: new Date().toLocaleDateString('kk-KZ'),
            breakdown: {
                'Үйді күтіп ұстау': 1800.00, // 40тг/м2 * 45м2 (1-ші пәтер үшін үлгі)
                'Үй іші тазалығы': 850.00,
                'Бейнебақылау': 300.00,
                'Күрделі жөндеу': 1800.00
            },
            totalCharge: 4750.00,
            previousBalance: 500.00, // Үлгі қарыз
            amountDue: 5250.00,
            dueDate: 'Айдың 25-і'
        };

        const receiptHtml = createReceiptHtml(paymentData);
        
        // Түбіртекті негізгі бетте көрсету
        displayReceipt(receiptHtml);

        // Басып шығару диалогын ашу
        window.print();
        
    } catch (error) {
        alert(`Түбіртек жасауда қате: ${error.message}`);
        console.error(error);
    }
}

/**
 * Төлем деректері негізінде HTML түбіртегін құрады.
 * @param {Object} data - Төлем деректері
 * @returns {string} - HTML мазмұны
 */
function createReceiptHtml(data) {
    let breakdownRows = '';
    for (const [service, amount] of Object.entries(data.breakdown)) {
        breakdownRows += `
            <tr>
                <td>${service}</td>
                <td>${formatCurrency(amount)}</td>
            </tr>
        `;
    }

    return `
        <div class="receipt-container">
            <h2>📜 Төлем Түбіртегі</h2>
            <p><strong>МИБ/ОСИ:</strong> Ақсай-3, 10а (Үлгі)</p>
            <p><strong>Мерзімі:</strong> ${data.dateGenerated}</p>
            <hr>
            
            <div class="receipt-header">
                <p><strong>Пәтер №:</strong> ${data.flatNumber}</p>
                <p><strong>Төлеуші:</strong> ${data.owner}</p>
                <p><strong>Есептеу айы:</strong> ${data.monthName}, ${data.year}</p>
                <p><strong>Пәтер алаңы:</strong> ${data.area} м²</p>
            </div>
            
            <hr>
            
            <h3>Айлық есептеудің бөлшектенуі:</h3>
            <table class="receipt-table">
                <thead>
                    <tr><th>Қызмет атауы</th><th>Сомасы</th></tr>
                </thead>
                <tbody>
                    ${breakdownRows}
                </tbody>
            </table>

            <hr>
            
            <div class="receipt-summary">
                <p><strong>Айлық жиынтық төлем:</strong> <span>${formatCurrency(data.totalCharge)}</span></p>
                <p><strong>Алдыңғы айдағы қарыз/артық төлем:</strong> <span>${formatCurrency(data.previousBalance)}</span></p>
                <h3 class="final-due">Төлеуге жататын сома (Қарызбен): <span>${formatCurrency(data.amountDue)}</span></h3>
            </div>
            
            <p class="note">Төлем мерзімі: ${data.dueDate} дейін.</p>
            <p class="signature">МИБ/ОСИ Басқармасы (Автоматты түрде жасалған)</p>
        </div>
    `;
}

/**
 * Түбіртек HTML-ін DOM-ға енгізеді және басып шығаруға дайындайды.
 */
function displayReceipt(htmlContent) {
    const receiptDiv = document.getElementById('receipt-output');
    if (!receiptDiv) {
        // Егер түбіртек аймағы жоқ болса, оны жасау
        const newDiv = document.createElement('div');
        newDiv.id = 'receipt-output';
        newDiv.className = 'print-only'; // Тек басып шығару үшін
        document.body.appendChild(newDiv);
        receiptDiv = newDiv;
    }
    receiptDiv.innerHTML = htmlContent;
}


// generateReceipt функциясын глобалды етіп экспорттау
// себебі ол index.html-ден тікелей шақырылады
window.generateReceipt = generateReceipt;