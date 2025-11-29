import json
import datetime
import os

# --- Конфигурациялар ---
CONFIG_FILE = 'apartments_config.json'
RATES_FILE = 'rates_config.json'
PAYMENTS_FILE = 'payments.json'

def generate_receipt_html(config, rates, month_str, total_amount, costs):
    """Әр пәтерге арналған толық HTML түбіртек мазмұнын жасайды."""
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="kk">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{month_str} айына түбіртек - Пәтер {config['apartment']}</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }}
            .receipt-header {{ text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }}
            .receipt-details {{ margin-bottom: 20px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
            th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
            .total-row {{ font-weight: bold; background-color: #e0f7fa; }}
        </style>
    </head>
    <body>
        <div class="receipt-header">
            <h1>Aqsai-3, 10a Үй Бірлестігі</h1>
            <h2>Төлем түбіртегі</h2>
            <p>{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} уақытында автоматты түрде жасалды</p>
        </div>
        
        <div class="receipt-details">
            <p><strong>Пәтер нөмірі:</strong> {config['apartment']}</p>
            <p><strong>Төлем айы:</strong> {month_str}</p>
            <p><strong>Пәтер алаңы:</strong> {config['area_sqm']} м²</p>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Қызмет түрі</th>
                    <th>Тариф</th>
                    <th>Есептеу</th>
                    <th>Сомасы (тг)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Үиді күтіп ұстау (Содержание дома)</td>
                    <td>{rates['monthly_rates']['maintenance_sqm']} тг/м²</td>
                    <td>{config['area_sqm']} * {rates['monthly_rates']['maintenance_sqm']}</td>
                    <td align="right">{costs['maintenance_cost']:,}</td>
                </tr>
                <tr>
                    <td>Күрделі жөндеу (Капитальный ремонт)</td>
                    <td>{rates['monthly_rates']['capital_repair_sqm']} тг/м²</td>
                    <td>{config['area_sqm']} * {rates['monthly_rates']['capital_repair_sqm']}</td>
                    <td align="right">{costs['capital_repair_cost']:,}</td>
                </tr>
                <tr>
                    <td>Жылыу есептеу құралдарына қызымет</td>
                    <td>{rates['monthly_rates']['heat_meter_service_sqm']} тг/м²</td>
                    <td>{config['area_sqm']} * {rates['monthly_rates']['heat_meter_service_sqm']}</td>
                    <td align="right">{costs['heat_meter_cost']:,}</td>
                </tr>
                <tr>
                    <td>Үи іші тазалығы (Уборка)</td>
                    <td>{rates['fixed_rates']['cleaning_unit']} тг/пәтер</td>
                    <td>1 * {rates['fixed_rates']['cleaning_unit']}</td>
                    <td align="right">{costs['cleaning_cost']:,}</td>
                </tr>
                <tr>
                    <td>Кіреберіс есік, беинебақылау</td>
                    <td>{rates['fixed_rates']['video_service_unit']} тг/пәтер</td>
                    <td>{ '1' if config.get('has_video') else '0' } * {rates['fixed_rates']['video_service_unit']}</td>
                    <td align="right">{costs['video_service_cost']:,}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="3" align="right">ЖАЛПЫ СОМАСЫ (К оплате):</td>
                    <td align="right">{total_amount:,} тг</td>
                </tr>
            </tbody>
        </table>
        
        <p style="margin-top: 30px;">Төлеу мерзімі: Келесі айдың 25-іне дейін.</p>
    </body>
    </html>
    """
    return html_content


def calculate_and_generate(config, rates, month_str):
    """Төлемді есептейді және түбіртекті жасайды."""
    area = config['area_sqm']
    
    # 1. Есептеу
    costs = {}
    costs['maintenance_cost'] = round(area * rates['monthly_rates']['maintenance_sqm'])
    costs['capital_repair_cost'] = round(area * rates['monthly_rates']['capital_repair_sqm'])
    costs['heat_meter_cost'] = round(area * rates['monthly_rates']['heat_meter_service_sqm'])
    costs['cleaning_cost'] = rates['fixed_rates']['cleaning_unit']
    costs['video_service_cost'] = rates['fixed_rates']['video_service_unit'] if config.get('has_video', False) else 0

    total_cost = sum(costs.values())
    
    # 2. Түбіртекті генерациялау
    receipt_filename = f"receipt_{month_str}_{config['apartment']}.html"
    receipt_path = os.path.join("receipts", receipt_filename)
    
    receipt_html = generate_receipt_html(config, rates, month_str, total_cost, costs)
    
    os.makedirs("receipts", exist_ok=True) 

    with open(receipt_path, 'w', encoding='utf-8') as f:
        f.write(receipt_html)
        
    return total_cost, receipt_path.replace("\\", "/") # GitHub жолына бейімдеу


def main():
    print("--- Төлемдерді автоматты жаңарту басталды ---")
    
    # 1. Конфигурацияларды жүктеу
    if not os.path.exists(RATES_FILE) or not os.path.exists(CONFIG_FILE):
        print(f"Қате: {RATES_FILE} немесе {CONFIG_FILE} файлдары табылмады.")
        return

    with open(RATES_FILE, 'r', encoding='utf-8') as f:
        rates = json.load(f)
        
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        apartment_configs = json.load(f)

    # 2. Қазіргі деректерді жүктеу
    current_payments = []
    if os.path.exists(PAYMENTS_FILE) and os.path.getsize(PAYMENTS_FILE) > 0:
        with open(PAYMENTS_FILE, 'r', encoding='utf-8') as f:
            current_payments = json.load(f)
    
    # 3. Келесі айды анықтау
    today = datetime.date.today()
    if today.month == 12:
        next_month = 1
        next_year = today.year + 1
    else:
        next_month = today.month + 1
        next_year = today.year
        
    next_month_str = datetime.date(next_year, next_month, 1).strftime('%Y-%m')

    # 4. Жаңа деректерді генерациялау және түбіртектер жасау
    new_payments_to_add = []
    for config in apartment_configs:
        apartment_num = config['apartment']
        
        # Егер келесі айдың төлемі бұрыннан бар болса, өткізіп жібереміз
        existing_payment = next((p for p in current_payments if p['apartment'] == apartment_num and p['month'] == next_month_str), None)

        if existing_payment:
            continue
            
        # Есептеу және түбіртек жасау
        total_cost, receipt_link = calculate_and_generate(config, rates, next_month_str)
        
        new_entry = {
            "apartment": apartment_num,
            "month": next_month_str,
            "amount": int(total_cost), 
            "status": "Күтуде",
            "receipt_link": receipt_link
        }
        new_payments_to_add.append(new_entry)
        print(f"Пәтер {apartment_num} үшін {next_month_str} төлемі ({total_cost} тг) қосылды. Түбіртек: {receipt_link}")

    # 5. Деректерді біріктіру және сақтау
    final_data = current_payments + new_payments_to_add
    
    with open(PAYMENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)
        
    print(f"--- Жұмыс аяқталды. Жалпы {len(final_data)} жазбасы бар {PAYMENTS_FILE} сәтті жаңартылды. ---")

if __name__ == "__main__":
    main()
