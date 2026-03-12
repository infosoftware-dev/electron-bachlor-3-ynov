# Electron - Bachelier 3 YNOV

Projets réalisés dans le cadre du cours Electron — Bachelor 3 YNOV.

---

## Structure du repo

```
Electron/
├── hello-world/          # Projet 1 — première fenêtre Electron
├── api-natives-electron/ # Projet 2 — APIs natives Electron
└── todo-electron/        # Projet 3 — application Todo
```

---

## Projet 1 — hello-world

Première application Electron : affiche une fenêtre avec un message HTML/CSS.

```
hello-world/
├── main.js       # Point d'entrée — crée la fenêtre (processus principal)
├── index.html    # Interface affichée dans la fenêtre (processus renderer)
└── package.json  # Configuration du projet (dépendances, scripts)
```

### Concepts abordés

- **`app`** : gère le cycle de vie de l'application (démarrage, fermeture)
- **`BrowserWindow`** : crée et configure la fenêtre native
- **`win.loadFile()`** : charge un fichier HTML dans la fenêtre
- Séparation entre **processus principal** (`main.js`) et **renderer** (`index.html`)

### Lancer le projet

```bash
cd hello-world
npm install
npm start
```

---

## Projet 2 — api-natives-electron

Exploration des APIs natives d'Electron (notifications, dialog, shell, etc.).

```bash
cd api-natives-electron
npm install
npm start
```

---

## Projet 3 — todo-electron

Application de gestion de tâches construite avec Electron.

```bash
cd todo-electron
npm install
npm start
```

---

## Architecture Electron (rappel)

```
┌─────────────────────────────────────┐
│         Processus Principal         │
│  main.js — Node.js complet          │
│  Accès : système de fichiers, OS    │
│           BrowserWindow, app        │
└──────────────┬──────────────────────┘
               │  IPC (ipcMain / ipcRenderer)
┌──────────────▼──────────────────────┐
│         Processus Renderer          │
│  index.html + JS — contexte web     │
│  Affiche l'interface utilisateur    │
└─────────────────────────────────────┘
```
