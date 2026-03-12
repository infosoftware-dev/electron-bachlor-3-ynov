# api-natives-electron

Application desktop construite avec **Electron** — un éditeur de texte qui démontre les fonctionnalités natives : menu, dialogues, notifications, system tray et stockage local.

---

## Qu'est-ce qu'Electron ?

Electron permet de créer des applications de bureau (Windows, macOS, Linux) avec des technologies web (HTML, CSS, JavaScript). Il embarque :
- **Node.js** pour accéder au système (fichiers, OS…)
- **Chromium** pour afficher l'interface graphique

---

## Architecture de l'application

Une application Electron fonctionne avec **deux processus séparés** qui communiquent entre eux :

```
┌─────────────────────────────────────────────────────┐
│  PROCESSUS MAIN — main.js                           │
│  Accès total au système (Node.js)                   │
│  • Crée la fenêtre                                  │
│  • Lit/écrit des fichiers (fs)                      │
│  • Affiche dialogues, notifications, tray           │
│  • Stocke les préférences (electron-store)          │
└──────────────────┬──────────────────────────────────┘
                   │  IPC (messages entre processus)
┌──────────────────▼──────────────────────────────────┐
│  SCRIPT PONT — preload.js                           │
│  S'exécute avant la page, contexte isolé            │
│  • Expose window.api au renderer                    │
│  • Relais sécurisé Main ↔ Renderer                  │
└──────────────────┬──────────────────────────────────┘
                   │  window.api
┌──────────────────▼──────────────────────────────────┐
│  PROCESSUS RENDERER — index.html + renderer.js      │
│  Navigateur Chromium (JavaScript web classique)     │
│  • Gère l'interface utilisateur                     │
│  • N'accède au système QUE via window.api           │
└─────────────────────────────────────────────────────┘
```

---

## Structure des fichiers

```
api-natives-electron/
│
├── main.js        → Processus principal (Node.js)
├── preload.js     → Pont sécurisé Main ↔ Renderer
├── renderer.js    → Logique de l'interface (JavaScript web)
├── index.html     → Structure de la page
├── style.css      → Mise en forme (thèmes clair et sombre)
├── icon.png       → (optionnel) Icône pour le system tray
└── package.json   → Configuration du projet et dépendances
```

---

## Fonctionnalités

### Éditeur de texte
- Ouvrir un fichier `.txt` via bouton ou menu Fichier > Ouvrir (Ctrl+O)
- Sauvegarder le contenu via bouton ou menu Fichier > Sauvegarder (Ctrl+S)
- Effacer l'éditeur
- Compteur de caractères en temps réel

### Notifications système
Après une sauvegarde, une notification native s'affiche (en dehors de la fenêtre) :
```js
new Notification({ title: 'Terminé', body: 'Fichier sauvegardé.' }).show();
```

### System Tray (icône barre des tâches)
- La croix de fermeture **cache** la fenêtre au lieu de quitter l'app
- L'icône dans la barre système reste visible
- Clic droit → menu : **Afficher** ou **Quitter**
- Double-clic → réaffiche la fenêtre
- Ajouter un fichier `icon.png` à la racine pour personnaliser l'icône

### Stockage local (electron-store)
Les préférences sont sauvegardées en JSON sur le disque et rechargées au prochain lancement :
```js
// Sauvegarder
await globalThis.api.setPreference('preferences.theme', 'dark');

// Lire (avec valeur par défaut)
const theme = await globalThis.api.getPreference('preferences.theme', 'dark');

// Supprimer
await globalThis.api.deletePreference('preferences.theme');
```

Emplacement du fichier JSON (exemples) :
- Linux : `~/.config/api-natives-electron/config.json`
- Windows : `%APPDATA%\api-natives-electron\config.json`

### Thème clair / sombre
- Le bouton **🌙 Thème** bascule entre le thème sombre et le thème clair
- Le choix est mémorisé grâce à electron-store et restauré au démarrage

---

## Communication IPC

IPC = *Inter-Process Communication* — le système de messagerie entre Main et Renderer.

| Direction | API Renderer | Gestionnaire Main |
|---|---|---|
| Renderer → Main (avec réponse) | `ipcRenderer.invoke('canal')` | `ipcMain.handle('canal', ...)` |
| Main → Renderer (sans réponse) | `ipcRenderer.on('canal', cb)` | `webContents.send('canal')` |

Exemple complet — sauvegarde d'un fichier :
```
Renderer                    Preload (pont)               Main
   │                             │                         │
   │─ api.sauvegarder(texte) ───►│                         │
   │                             │─ invoke('save-content') ►│
   │                             │                         │ écrit le fichier
   │                             │                         │ affiche notification
   │                             │◄── résolution promesse ─│
   │◄── promesse résolue ────────│                         │
```

---

## Installation

```bash
npm install
```

## Lancer en développement

```bash
npm start
```

## Compiler l'application

### Linux (AppImage)

```bash
npx electron-builder --linux
```

Exécuter l'AppImage générée (si FUSE indisponible sur WSL2) :
```bash
./dist/linux-unpacked/api-natives-electron
```

### Windows — depuis WSL2/Linux

**Option 1 : Exécutable portable (sans Wine)**

Dans `package.json`, changer la target win :
```json
"win": { "target": "portable" }
```
Puis :
```bash
npx electron-builder --win
```

**Option 2 : Installeur `.exe` NSIS (avec Wine)**

```bash
sudo apt install wine wine32 wine64
npx electron-builder --win
```

**Option 3 : Builder nativement sous Windows (recommandé)**

```powershell
npm install
npx electron-builder --win
```

---

## Dépendances

| Package | Rôle | Type |
|---|---|---|
| `electron` | Framework desktop | devDependency |
| `electron-builder` | Compilation en installeur | devDependency |
| `electron-store` | Stockage JSON persistant | dependency |
