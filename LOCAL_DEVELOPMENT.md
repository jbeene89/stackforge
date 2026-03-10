# SoupyForge — Local Development Guide

## 🚀 Quick Start (Web)

```bash
npm install
npm run dev
```

---

## 📱 Mobile App (Capacitor)

### Prerequisites
- **Android**: [Android Studio](https://developer.android.com/studio) installed
- **iOS**: Mac with [Xcode](https://developer.apple.com/xcode/) installed

### Setup Steps

1. **Export to GitHub**
   - Click "Export to GitHub" in Lovable settings
   - Clone the repo locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add native platforms**
   ```bash
   # For Android
   npx cap add android
   
   # For iOS (Mac only)
   npx cap add ios
   ```

4. **Build and sync**
   ```bash
   npm run build
   npx cap sync
   ```

5. **Run on device/emulator**
   ```bash
   # Android
   npx cap run android
   
   # iOS
   npx cap run ios
   ```

### Hot Reload (Development)
The app is pre-configured to connect to the Lovable preview URL for hot reload during development. Changes you make in Lovable will instantly appear on your device.

### Production Build
For production, update `capacitor.config.ts`:
```typescript
// Remove or comment out the server block:
// server: {
//   url: '...',
//   cleartext: true
// }
```

Then rebuild:
```bash
npm run build
npx cap sync
npx cap run android  # or ios
```

---

## 🖥️ Desktop App (Electron) — Optional

For desktop (Windows/Mac/Linux), you can wrap this app with Electron:

1. Install Electron Builder
   ```bash
   npm install --save-dev electron electron-builder
   ```

2. Create `electron/main.js`:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');
   
   function createWindow() {
     const win = new BrowserWindow({
       width: 1400,
       height: 900,
       webPreferences: {
         nodeIntegration: false,
         contextIsolation: true
       }
     });
     
     // In development, load from Vite dev server
     // In production, load from built files
     if (process.env.NODE_ENV === 'development') {
       win.loadURL('http://localhost:8080');
     } else {
       win.loadFile(path.join(__dirname, '../dist/index.html'));
     }
   }
   
   app.whenReady().then(createWindow);
   ```

3. Run desktop app
   ```bash
   npm run build
   npx electron .
   ```

---

## 📦 PWA Installation

The app is also a Progressive Web App. Users can install it directly from the browser:

- **Android Chrome**: Menu → "Add to Home Screen"
- **iOS Safari**: Share → "Add to Home Screen"
- **Desktop Chrome**: Click install icon in address bar

---

## 🔧 Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npx cap sync` | Sync web build to native projects |
| `npx cap run android` | Run on Android |
| `npx cap run ios` | Run on iOS |
| `npx cap open android` | Open Android Studio |
| `npx cap open ios` | Open Xcode |

---

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Lovable Native App Guide](https://docs.lovable.dev/tips-tricks/native-mobile-apps)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
