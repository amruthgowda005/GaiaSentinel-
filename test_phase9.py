import urllib.request, json

BASE = 'http://localhost:8000'

def test(name, url, method='GET', data=None):
    try:
        req = urllib.request.Request(url, method=method,
            data=json.dumps(data).encode() if data else None,
            headers={'Content-Type': 'application/json'} if data else {})
        with urllib.request.urlopen(req, timeout=5) as r:
            body = json.loads(r.read())
            print(f'  [PASS] {name}')
            print(f'         -> {json.dumps(body)[:150]}')
            return body
    except Exception as e:
        print(f'  [FAIL] {name}: {e}')
        return None

print()
print('===== GAIA SENTINEL PHASE 9 — TEST SUITE =====')

r = test('Health (verify correct backend)', f'{BASE}/health')
if r and r.get('service') != 'Gaia Sentinel Backend':
    print('  [WARN] Wrong backend may be responding!')

test('POST /scan/save  Bangalore-Good', f'{BASE}/scan/save', 'POST', {
    'latitude': 12.9716, 'longitude': 77.5946,
    'aqi': 45, 'aqi_status': 'Good',
    'water_score': 85, 'water_status': 'Pristine',
    'water_ph': 7.1, 'turbidity': 2.5, 'insights_count': 3
})

test('POST /scan/save  Delhi-Critical', f'{BASE}/scan/save', 'POST', {
    'latitude': 28.6139, 'longitude': 77.2090,
    'aqi': 138, 'aqi_status': 'Poor',
    'water_score': 38, 'water_status': 'Contaminated',
    'water_ph': 8.9, 'turbidity': 9.1, 'insights_count': 6
})

hist = test('GET /scan/history', f'{BASE}/scan/history?limit=10')
if hist:
    count = hist.get('total', 0)
    print(f'         [INFO] {count} record(s) stored in SQLite DB')
    ids = [r['id'] for r in hist.get('history', [])]
    print(f'         [INFO] IDs (newest first): {ids}')
    if count >= 2 and ids == sorted(ids, reverse=True):
        print(f'  [PASS] Data persists + ordered correctly')
    else:
        print(f'  [FAIL] Data persistence or ordering issue')

print()
print('===== TESTS DONE =====')
