from playwright.sync_api import sync_playwright
import json

BASE = 'http://127.0.0.1:3000'
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page()
    for prefix, language in [('', 'ar'), ('/en', 'en')]:
        cases = [(1, '172.50', None), (2, '172.50', None), (3, '632.50', '36'), (4, '632.50', None), (3, '632.50', '23')]
        for vehicle_index, expected, preferred_center in cases:
            page.goto(BASE + prefix + '/booking-appointment')
            page.locator('iframe').wait_for()
            frame = page.locator('iframe').element_handle().content_frame()
            for _ in range(60):
                if frame.evaluate('() => Boolean(window.originalBookingLookups && window.intlTelInput?.utils && window.localPaymentSummary)'):
                    break
                frame.wait_for_timeout(500)
            frame.evaluate('''({index, preferredCenter}) => {
              const d=document,j=window.originalBookingLookups;
              const typeSelect=d.getElementById('centerTypeDropdown');
              const typeOption=[...typeSelect.options].find(x=>Number(x.dataset.index)===index);
              const type=typeOption.value;
              const matches=row=>j.slotsByCenterAndDate[String(row.areaID)] && (!preferredCenter || String(row.areaID)===preferredCenter);
              const pair=Object.entries(j.centersByCityAndType).find(([key,value])=>key.split(':')[1]===type && value.data?.some(matches));
              const city=pair[0].split(':')[0];
              const center=pair[1].data.find(matches);
              const region=Object.entries(j.citiesByRegion).find(([key,value])=>value.data?.some(row=>String(row.cityID)===city))[0];
              const set=(id,value)=>{const e=d.getElementById(id);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
              d.querySelector('input[name="appointmentPurpose"][value="2"]').closest('label').click();
              set('fullNameInput','Test User');set('mobileInput','0500000000');d.getElementById('checkNonSaudi').click();set('nonSaudiPlate','TEST1234');
              typeSelect.selectedIndex=typeOption.index;typeSelect.dispatchEvent(new Event('change',{bubbles:true}));
              set('regionDropdown',region);set('cityDropdown',city);set('centerDropdown',String(center.areaID));
              d.getElementById('btnNext').click();
              d.querySelectorAll('#date-list .date-time-card.day')[1].click();d.querySelector('#slot-selector .slot-box').click();
              d.getElementById('btnNext').click();d.getElementById('btnNext').click();
            }''', {'index': vehicle_index, 'preferredCenter': preferred_center})
            page.wait_for_url('**' + prefix + '/payment-summary')
            result = frame.evaluate('''() => {
              const s=document.getElementById('localPaymentSummary');
              return {type:document.getElementById('reviewCenterType').textContent,
                center:document.getElementById('centerDropdown').value,
                amounts:[...s.querySelectorAll('.local-payment-summary__amount-number')].map(e=>e.textContent),
                unknown:s.querySelectorAll('.local-payment-summary__fee-unknown').length,
                notices:s.querySelectorAll('.local-payment-summary__notice').length,
                disabled:s.querySelector('.local-payment-summary__disabled-button').disabled,
                cardInputs:s.querySelectorAll('input').length};
            }''')
            assert result['notices'] == 0 and result['disabled'] and result['cardInputs'] == 0
            if expected is None:
                assert result['amounts'] == [] and result['unknown'] == 2, result
            else:
                assert result['amounts'] == [expected, expected] and result['unknown'] == 0, result
            if preferred_center:
                assert result['center'] == preferred_center
            results.append({'language': language, 'vehicle': result['type'], 'center': result['center'], 'total': expected or 'unspecified', 'noticeRemoved': True, 'paymentDisabled': True})
    browser.close()
print(json.dumps(results, ensure_ascii=False))
