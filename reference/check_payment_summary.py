from playwright.sync_api import sync_playwright
from urllib.parse import urlsplit
import json

BASE = 'http://127.0.0.1:3000'
results = []
PLATFORM_ANALYTICS_HOSTS = {'manus-analytics.com', 'api.manus.im', 'api2.amplitude.com'}

def application_post(request):
    url = urlsplit(request.url)
    return request.method == 'POST' and url.path != '/__manus__/logs' and url.hostname not in PLATFORM_ANALYTICS_HOSTS

def wait_until(frame, predicate):
    for _ in range(120):
        if frame.evaluate(predicate):
            return
        frame.wait_for_timeout(500)
    raise AssertionError('Expected application state did not become ready')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page()
    posts = []
    page.on('request', lambda req: posts.append(req.url) if application_post(req) else None)
    for prefix, language in [('', 'ar'), ('/en', 'en')]:
        page.goto(BASE + prefix + '/booking-appointment')
        page.locator('iframe').wait_for()
        frame = page.locator('iframe').element_handle().content_frame()
        wait_until(frame, '() => Boolean(window.originalBookingLookups && window.intlTelInput?.utils && window.localPaymentSummary)')
        result = frame.evaluate('''() => {
          const d=document,w=window,j=w.originalBookingLookups;
          const pair=Object.entries(j.centersByCityAndType).find(([key,value])=>value.data?.some(row=>String(row.areaID)==='19'));
          const [city,type]=pair[0].split(':');
          const region=Object.entries(j.citiesByRegion).find(([key,value])=>value.data?.some(row=>String(row.cityID)===city))[0];
          const set=(id,v)=>{const e=d.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
          d.querySelector('input[name="appointmentPurpose"][value="2"]').closest('label').click();
          set('fullNameInput','Test User');set('mobileInput','0500000000');
          d.getElementById('checkNonSaudi').click();set('nonSaudiPlate','TEST1234');
          set('centerTypeDropdown',type);set('regionDropdown',region);set('cityDropdown',city);set('centerDropdown','19');
          d.getElementById('btnNext').click();
          d.querySelectorAll('#date-list .date-time-card.day')[1].click();
          d.querySelector('#slot-selector .slot-box').click();
          d.getElementById('btnNext').click();
          const saved={name:d.getElementById('fullNameInput').value,date:d.getElementById('selectedDate').value,time:d.getElementById('selectedTime').value,slot:d.getElementById('selectedSlotId').value};
          d.getElementById('btnNext').click();
          return saved;
        }''')
        page.wait_for_url('**' + prefix + '/payment-summary')
        assert page.frames[1] == frame, 'Booking iframe was reloaded and input data lost'
        assert frame.evaluate('window.localPaymentSummary.isOpen()')
        info = frame.evaluate('''() => {
          const s=document.getElementById('localPaymentSummary');
          return {text:s.textContent,inputs:s.querySelectorAll('input').length,
            formHidden:document.getElementById('wizardForm').style.display==='none'};
        }''')
        assert info['inputs'] == 0 and info['formHidden']
        assert '172.50' in info['text'], info['text']
        assert 'Test User' not in info['text'] and '0500000000' not in info['text']
        assert 'TEST1234' not in page.url and '0500000000' not in page.url
        frame.evaluate("window.dispatchEvent(new CustomEvent('taqdeer-payment-back'))")
        page.wait_for_url('**' + prefix + '/booking-appointment')
        restored = frame.evaluate('''() => ({name:document.getElementById('fullNameInput').value,date:document.getElementById('selectedDate').value,time:document.getElementById('selectedTime').value,slot:document.getElementById('selectedSlotId').value})''')
        assert restored == result
        assert frame.locator('#step3').is_visible()
        # Browser Back also returns to the booking review without reloading.
        frame.locator('#btnNext').click()
        page.wait_for_url('**' + prefix + '/payment-summary')
        page.go_back()
        page.wait_for_url('**' + prefix + '/booking-appointment')
        assert frame.locator('#step3').is_visible()
        page.go_forward()
        page.wait_for_url('**' + prefix + '/payment-summary')
        wait_until(frame, '() => Boolean(window.localPaymentSummary?.isOpen())')
        assert page.frames[1] == frame
        # Direct access without booking shows empty state, not a fabricated invoice.
        page.goto(BASE + prefix + '/payment-summary')
        page.locator('iframe').wait_for()
        frame = page.locator('iframe').element_handle().content_frame()
        wait_until(frame, '() => Boolean(window.localPaymentSummary?.isOpen())')
        empty = frame.locator('#localPaymentSummary').inner_text()
        assert '172.50' not in empty and 'Test User' not in empty
        results.append({'language': language, 'summary': True, 'preservedBooking': True, 'browserBackAndForward': True, 'emptyState': True, 'cardInputs': 0})
    assert posts == [], posts
    browser.close()
print(json.dumps({'results': results, 'applicationPostRequests': len(posts)}, ensure_ascii=False))
