"""Run locally in a terminal; passwords stay in child-process memory only."""
from pathlib import Path
from datetime import datetime, timezone
import getpass
import hashlib
import json
import os
import re
import subprocess

root = Path(__file__).resolve().parent
out = root / 'release-artifacts'
source = out / 'SoupyLab-1.1.0-v10002-UNSIGNED.aab'
target = out / 'SoupyLab-1.1.0-v10002-SIGNED.aab'
keystore = Path(os.environ['USERPROFILE']) / 'Desktop/KEYSTOR DO NO DELETE/android_app_release-key.jks'
expected = 'a0bb74d087f37e265294ca77710bb6c79784f4e30eaa8edb49f1c7045dfdabd8'
alias = 'release-key'
if not source.is_file() or not keystore.is_file():
    raise SystemExit('Build the unsigned bundle and locate the original upload keystore first.')
if target.exists():
    raise SystemExit('Signed output already exists; preserve it before signing a newer candidate.')
receipt_path = out / 'build-receipt-v10002.json'
if not receipt_path.is_file():
    raise SystemExit('Build receipt is missing; rebuild the unsigned bundle before signing.')
recorded = json.loads(receipt_path.read_text())
recorded_hash = recorded.get('files', {}).get(source.name, {}).get('sha256')
if hashlib.sha256(source.read_bytes()).hexdigest() != recorded_hash:
    raise SystemExit('Unsigned bundle hash does not match the build receipt; signing stopped.')
jdk = Path(os.environ['JAVA_HOME']) if os.environ.get('JAVA_HOME') else next(
    (p for p in (root / '.build-tools').glob('jdk-*') if (p / 'bin/keytool.exe').exists()), None)
if jdk is None:
    raise SystemExit('Set JAVA_HOME to the JDK used to build this release.')
env = os.environ.copy()
env['SOUPY_RELEASE_STORE_PASSWORD'] = getpass.getpass('Upload keystore password (hidden): ')
env['SOUPY_RELEASE_KEY_PASSWORD'] = getpass.getpass('Key password (Enter if same): ') or env['SOUPY_RELEASE_STORE_PASSWORD']

def private_run(command):
    result = subprocess.run(command, capture_output=True, text=True, env=env)
    if result.returncode:
        raise SystemExit('Signing validation failed (exit %s). Check the local key/password; no bundle was uploaded.' % result.returncode)
    return result.stdout

try:
    listing = private_run([str(jdk / 'bin/keytool.exe'), '-list', '-v', '-keystore', str(keystore),
                           '-alias', alias, '-storepass:env', 'SOUPY_RELEASE_STORE_PASSWORD'])
    match = re.search(r'SHA256:\s*([0-9A-Fa-f:]+)', listing)
    fingerprint = match.group(1).replace(':', '').lower() if match else ''
    if fingerprint != expected:
        raise SystemExit('This keystore certificate does not match the supplied app bundle; signing stopped.')
    private_run([str(jdk / 'bin/jarsigner.exe'), '-keystore', str(keystore),
                 '-storepass:env', 'SOUPY_RELEASE_STORE_PASSWORD', '-keypass:env', 'SOUPY_RELEASE_KEY_PASSWORD',
                 '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256', '-signedjar', str(target), str(source), alias])
    private_run([str(jdk / 'bin/jarsigner.exe'), '-verify', '-strict', '-keystore', str(keystore),
                 '-storepass:env', 'SOUPY_RELEASE_STORE_PASSWORD', str(target), alias])
    receipt = {'packageName': 'com.soupylab.app', 'versionCode': 10002, 'versionName': '1.1.0',
               'signedAt': datetime.now(timezone.utc).isoformat(), 'alias': alias, 'certificateSha256': fingerprint,
               'unsignedSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
               'signedSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
               'signedFile': target.name, 'signatureVerified': True, 'playUploadStatus': 'not uploaded'}
    (out / 'signing-receipt-v10002.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print('Signed and verified:', target)
finally:
    for name in ['SOUPY_RELEASE_STORE_PASSWORD', 'SOUPY_RELEASE_KEY_PASSWORD']:
        env.pop(name, None)
