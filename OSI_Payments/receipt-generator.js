// receipt-generator.js - Түбіртек жасау және басып шығару логикасы

// Қажетті IndexedDB деректерді басқару функцияларын импорттау
import { getAllData, STORE_APARTMENTS, STORE_PAYMENTS } from './db.js';

// Валюта форматы
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
export async function generateReceipt(flatNumber, month, year) { // <--- 'export' қосылды
    try {
        // 1. Деректерді алу
        const payments = await getAllData(STORE_PAYMENTS);

        // Берілген айға, жылға және пәтерге сәйкес келетін төлем жазбасын табу
        const paymentRecord = payments.find(p => 
            p.flatNumber === flatNumber && 
            p.month === month && 
            p.year === year
        );

        if (!paymentRecord) {
            alert(`Пәтер №${flatNumber} үшін ${MONTHS[month - 1]} ${year} жылына есептелген жазба табылмады. Алдымен есептеуді іске қосыңыз.`);
            return;
        }

        // 2. Түбіртектің HTML мазмұнын жасау
        const receiptHtml = createReceiptHtml(paymentRecord);
        
        // 3. Түбіртекті көрсету және басып шығару
        displayReceipt(receiptHtml);

    } catch (error) {
        console.error("Түбіртек жасаудағы қате:", error);
        alert("Түбіртекті жасау кезінде қателік туындады. Консольді тексеріңіз.");
    }
}

/**
 * Түбіртек HTML мазмұнын жасайды.
 * @param {Object} data - Төлем деректері
 * @returns {string} - HTML жолы
 */
function createReceiptHtml(data) {
    const monthName = MONTHS[data.month - 1];
    
    // Тарифтерді бөлек жолдарға бөлу
    let breakdownRows = '';
    for (const key in data.breakdown) {
        if (data.breakdown.hasOwnProperty(key)) {
            const item = data.breakdown[key];
            breakdownRows += `
                <tr>
                    <td>${key}</td>
                    <td>${formatCurrency(item.rate)}</td>
                    <td>${formatCurrency(item.charge)}</td>
                </tr>
            `;
        }
    }
    
    // Төлем мерзімін есептеу (айдың 25-і, қарапайым)
    const dueDate = `${data.month}/25/${data.year}`;

    return `
        <div class="receipt-container">
            <h3>МИБ/ОСИ ТӨЛЕМ ТҮБІРТЕГІ</h3>
            <hr>
            <p><strong>Мерзімі:</strong> ${monthName} ${data.year} жыл</p>
            <p><strong>Пәтер №:</strong> ${data.flatNumber}</p>
            <p><strong>Жасалу күні:</strong> ${new Date().toLocaleDateString('kk-KZ')}</p>
            <hr>
            
            <h4>Есептеу егжей-тегжейі</h4>
            <table>
                <thead>
                    <tr>
                        <th>Қызмет</th>
                        <th>Тариф</th>
                        <th>Есептелген сома</th>
                    </tr>
                </thead>
                <tbody>
                    ${breakdownRows}
                </tbody>
            </table>

            <hr>
            
            <div class="receipt-summary">
                <p><strong>Айлық жиынтық төлем:</strong> <span>${formatCurrency(data.totalCharge)}</span></p>
                <p><strong>Алдыңғы айдағы қарыз/артық төлем:</strong> <span>${formatCurrency(data.previousBalance || 0)}</span></p>
                <h3 class="final-due">Төлеуге жататын сома (Қарызбен): <span>${formatCurrency(data.amountDue)}</span></h3>
            </div>
            
            <p class="note">Төлем мерзімі: ${dueDate} дейін.</p>
            <p class="signature">МИБ/ОСИ Басқармасы (Автоматты түрде жасалған)</p>
        </div>
    `;
}

/**
 * Түбіртек HTML-ін DOM-ға енгізеді және басып шығаруға дайындайды.
 */
function displayReceipt(htmlContent) {
    // index.html-дегі #receipt-area элементін пайдалану
    const receiptDiv = document.getElementById('receipt-area');
    if (!receiptDiv) {
        console.error("Қате: #receipt-area элементі табылмады.");
        return;
    }
    
    // Мазмұнды орналастыру
    receiptDiv.innerHTML = htmlContent;
    
    // Басып шығару диалогын ашу
    window.print();
    
    // 5 секундтан кейін түбіртекті тазалау (қажет болмаса)
    // setTimeout(() => receiptDiv.innerHTML = '', 5000); 
}
