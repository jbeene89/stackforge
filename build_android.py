"""Build SoupyLab's packaged Android release; never uploads to Google Play."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import shutil
import subprocess
from datetime import datetime, timezone

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--skip-web', action='store_true')
args = parser.parse_args()
env = os.environ.copy()
jdk = Path(env['JAVA_HOME']) if env.get('JAVA_HOME') else next(
    (p for p in (root / '.build-tools').glob('jdk-*') if (p / 'bin/java.exe').exists()), None)
if jdk is None:
    raise SystemExit('Set JAVA_HOME to a JDK 21 installation before building.')
sdk = Path(env.get('ANDROID_HOME', Path(os.environ['LOCALAPPDATA']) / 'Android/Sdk'))
env.update(JAVA_HOME=str(jdk), ANDROID_HOME=str(sdk))

def run(command, cwd=root):
    subprocess.run(command, cwd=cwd, env=env, check=True)

if not args.skip_web:
    run(['npm.cmd', 'run', 'build'])
run(['npx.cmd', 'cap', 'sync', 'android'])
run([str(root / 'android/gradlew.bat'), '--no-daemon', '--console=plain',
     ':app:assembleDebug', ':app:bundleRelease', ':app:lintDebug', ':app:testDebugUnitTest', ':app:assembleDebugAndroidTest'], root / 'android')
out = root / 'release-artifacts'
out.mkdir(exist_ok=True)
files = {}
for source, name in [
    ('android/app/build/outputs/apk/debug/app-debug.apk', 'SoupyLab-1.1.0-v10002-DEBUG.apk'),
    ('android/app/build/outputs/bundle/release/app-release.aab', 'SoupyLab-1.1.0-v10002-UNSIGNED.aab'),
]:
    destination = out / name
    shutil.copy2(root / source, destination)
    files[name] = {'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
                   'bytes': destination.stat().st_size}
receipt = {
    'packageName': 'com.soupylab.app', 'versionName': '1.1.0', 'versionCode': 10002,
    'builtAt': datetime.now(timezone.utc).isoformat(),
    'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
    'sourceDirty': bool(subprocess.check_output(['git', 'status', '--porcelain'], cwd=root, text=True).strip()),
    'debugPackageName': 'com.soupylab.app.preview', 'minSdk': 24, 'targetSdk': 36, 'compileSdk': 36, 'gradle': '8.14.3', 'agp': '8.13.0',
    'checks': [':app:assembleDebug', ':app:bundleRelease', ':app:lintDebug', ':app:testDebugUnitTest', ':app:assembleDebugAndroidTest'],
    'signingStatus': 'unsigned; existing upload-key password required',
    'playUploadStatus': 'not uploaded', 'files': files,
}
(out / 'build-receipt-v10002.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
