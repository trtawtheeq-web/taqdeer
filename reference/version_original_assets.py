from pathlib import Path
from urllib.parse import urlsplit
import hashlib
from bs4 import BeautifulSoup

ROOT = Path('/home/ubuntu/taqdeer')
PUBLIC = ROOT / 'client/public'
ORIGINAL = PUBLIC / 'original'


def versioned(path):
    asset = PUBLIC / path.lstrip('/')
    if not asset.is_file():
        raise RuntimeError(f'Missing local original asset: {path}')
    fingerprint = hashlib.sha256(asset.read_bytes()).hexdigest()[:16]
    return f'{path}?v={fingerprint}'


lookup_url = versioned('/original/booking-data.js')
count = 0
for page in sorted(ORIGINAL.glob('*/*.html')):
    source = page.read_text()
    soup = BeautifulSoup(source, 'html.parser')
    replacements = {}
    for script in soup.select('script[src]'):
        old = script['src']
        path = urlsplit(old).path
        if not path.startswith(('/original/', '/vendor/')):
            continue
        new = versioned(path)
        replacement = str(script)
        script['src'] = new
        if path == '/original/forms.js':
            script['data-booking-src'] = lookup_url
        replacements[replacement] = str(script)
    for link in soup.select('link[rel="stylesheet"][href]'):
        path = urlsplit(link['href']).path
        if not path.startswith('/original/'):
            continue
        replacement = str(link)
        link['href'] = versioned(path)
        replacements[replacement] = str(link)
    # Only script tags change; preserve all original markup and whitespace.
    for old, new in replacements.items():
        if old not in source:
            # Source tags are serialized consistently by the source builder.
            raise RuntimeError(f'Unrecognized source script markup in {page.name}: {old[:100]}')
        source = source.replace(old, new)
    page.write_text(source)
    count += 1
print(f'Versioned original runtime assets in {count} pages; booking data: {lookup_url}')
