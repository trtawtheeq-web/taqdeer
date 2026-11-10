const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const source = fs.readFileSync('client/public/original/forms.js', 'utf8');
const start = source.indexOf('  function selectedCenterFeeTotal()');
const end = source.indexOf('  function openPaymentSummary(', start);
assert(start >= 0 && end > start);
const helper = source.slice(start, end);
const dataSource = fs.readFileSync('client/public/original/booking-data.js', 'utf8');
const data = JSON.parse(dataSource.split(' = ')[1].replace(/;\s*$/, ''));
const sandbox = { state: { lookupData: data, selects: { type: {}, city: {}, center: {} } } };
vm.createContext(sandbox);
vm.runInContext(helper, sandbox);
let count = 0;
for (const [key, value] of Object.entries(data.centersByCityAndType)) {
  const [city, type] = key.split(':');
  for (const row of value.data || []) {
    sandbox.state.selects = { type: { value: type }, city: { value: city }, center: { value: String(row.areaID) } };
    const fee = Number(row[type === '2' ? 'taqdeerHeavyFees' : 'taqdeerLightFees']) > 0
      ? Number(row[type === '2' ? 'taqdeerHeavyFees' : 'taqdeerLightFees'])
      : Number(row.taqdeerFees);
    const expected = fee > 0 ? Math.round(fee * 115) / 100 : null;
    assert(expected > 0, `Available source relation must have a quoted positive price: ${key}/${row.areaID}`);
    assert.equal(sandbox.selectedCenterFeeTotal(), expected, `Source fee mismatch ${key}/${row.areaID}`);
    count++;
  }
}
sandbox.state.selects = { type: { value: '2' }, city: { value: '3' }, center: { value: '23' } };
assert.equal(sandbox.selectedCenterFeeTotal(), 632.5);
sandbox.state.selects.center.value = 'not-a-real-center';
assert.equal(sandbox.selectedCenterFeeTotal(), null);
sandbox.state.lookupData = { centersByCityAndType: { '3:2': { data: [{ areaID: 23, taqdeerFees: 0, taqdeerHeavyFees: 0 }] } } };
sandbox.state.selects.center.value = '23';
assert.equal(sandbox.selectedCenterFeeTotal(), null);
sandbox.state.lookupData.centersByCityAndType['3:2'].data[0].taqdeerFees = 600;
assert.equal(sandbox.selectedCenterFeeTotal(), 690, 'Must read selected center fee rather than hardcoded vehicle total');
console.log(JSON.stringify({ sourceCenterRelationsChecked: count, unionBusTotal: 632.5, missingQuoteReturnsNull: true, respectsSelectedCenterAmount: true }));
