// data-io.js - CSV арқылы деректерді импорттау/экспорттау

import { openDB, getAllData, STORE_APARTMENTS, STORE_TARIFFS } from './db.js';

/**
 * Қарапайым CSV жолын массивтер массивіне түрлендіреді.
 * @param {string} csvText - CSV форматындағы мәтін
 * @returns {Array<Array<string>>}
 */
function parseCSV(csvText) {
    // CSV-ні жолдарға бөлу, соңғы бос жолды алып тастау
    const lines = csvText.trim().split('\n');
    
    // Әр жолды үтірмен бөлу
    return lines.map(line => {
        // Қос тырнақшадағы үтірлерді ескеретін қарапайым парсер
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim()); // Соңғы элементті қосу
        return result;
    });
}

/**
 * CSV файлын оқиды және IndexedDB-ге Пәтерлерді импорттайды.
 * Бағандар: flatNumber, area, owner, balance
 * @param {File} file - CSV File объектісі
 */
async function importApartments(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const csvData = parseCSV(e.target.result);
            if (csvData.length < 2) return reject("CSV файлы бос немесе формат дұрыс емес.");

            // Бірінші жол - тақырыптар (headers)
            const headers = csvData[0].map(h => h.toLowerCase().trim());
            const dataRows = csvData.slice(1);
            
            const apartmentsToSave = [];
            
            for (const row of dataRows) {
                if (row.length < 3) continue; // Минималды деректерді тексеру
                
                const flatData = {};
                // flatNumber, area, owner бағандарын табу
                flatData.flatNumber = parseInt(row[headers.indexOf('flatnumber')]);
                flatData.area = parseFloat(row[headers.indexOf('area')]);
                flatData.owner = row[headers.indexOf('owner')];
                flatData.balance = parseFloat(row[headers.indexOf('balance')]) || 0; // Бастапқы баланс
                
                if (flatData.flatNumber && flatData.area) {
                     // ID-ді қамтамасыз ету (Жаңа пәтерлер үшін IndexDB-де id автоматты қосылады)
                     apartmentsToSave.push(flatData);
                }
            }
            
            if (apartmentsToSave.length > 0) {
                 const db = await openDB(); // DB қосылуын алу
                 const transaction = db.transaction([STORE_APARTMENTS], 'readwrite');
                 const store = transaction.objectStore(STORE_APARTMENTS);
                 
                 // Жаңа пәтерлерді қосу
                 apartmentsToSave.forEach(item => {
                    // flatNumber бойынша индексті қолданып, бар пәтерді жаңарту үшін put қолдануға болады
                    // Бірақ қарапайымдылық үшін қазір add қолданамыз (бар болса қате береді)
                    store.add(item); 
                 });
                 
                 transaction.oncomplete = () => resolve(apartmentsToSave.length);
                 transaction.onerror = (event) => reject(event.target.error);
            } else {
                reject("Импорттау үшін жарамды деректер табылмады.");
            }
        };

        reader.onerror = () => reject("Файлды оқу қатесі.");
        reader.readAsText(file);
    });
}


/**
 * Берілген массивті CSV жолына түрлендіреді.
 * @param {Array<Object>} data - Объектілер массиві
 * @returns {string} - CSV мәтіні
 */
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const headerRow = headers.join(',');
    
    const dataRows = data.map(obj => 
        headers.map(header => {
            let value = obj[header];
            if (value === null || value === undefined) value = '';
            // Егер мәтінде үтір болса, тырнақшаға алу
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        }).join(',')
    );
    
    return [headerRow, ...dataRows].join('\n');
}

/**
 * Деректерді CSV файлы ретінде жүктеп алу.
 * @param {string} filename - Файл атауы
 * @param {string} data - CSV мәтіні
 */
function downloadCSV(filename, data) {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { 
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Пәтерлер немесе Төлемдер деректерін CSV ретінде экспорттау.
 * @param {string} storeName - Деректер қоймасының атауы (STORE_APARTMENTS, STORE_PAYMENTS)
 */
async function exportData(storeName) {
    const data = await getAllData(storeName);
    if (data.length === 0) {
        alert("Экспорттау үшін деректер жоқ.");
        return;
    }
    const filename = `${storeName}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    const csvData = convertToCSV(data);
    downloadCSV(filename, csvData);
}

// Сыртқы қолдану үшін экспорттау
export { importApartments, exportData, STORE_APARTMENTS, STORE_TARIFFS };