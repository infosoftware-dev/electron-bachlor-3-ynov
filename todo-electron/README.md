# Todo Electron

Une application de gestion de tâches (todo list) construite avec **Electron**, **HTML/CSS** et **JavaScript** vanilla.

## Fonctionnalités

- **Ajouter** une tâche avec un titre et une description optionnelle
- **Cocher / décocher** une tâche pour la marquer comme faite
- **Modifier** une tâche existante (titre et description)
- **Supprimer** une tâche
- **Persistance** : les tâches sont sauvegardées dans un fichier `tasks.json` local
- Compteur de tâches affiché en temps réel
- Interface entièrement en français

## Structure du projet

```
todo-electron/
├── main.js        # Processus principal Electron (lecture/écriture fichier, IPC handlers)
├── preload.js     # Pont sécurisé entre la page web et Node.js (contextBridge)
├── renderer.js    # Logique de l'interface utilisateur (DOM, événements)
├── index.html     # Structure HTML + styles CSS de l'application
├── tasks.json     # Données des tâches (créé automatiquement au premier lancement)
└── package.json   # Configuration npm
```

## Prérequis

- [Node.js](https://nodejs.org/) (version 16 ou supérieure recommandée)
- npm (inclus avec Node.js)

## Installation

```bash
npm install
```

## Lancement

```bash
npm start
```

## Architecture

L'application suit le modèle de sécurité recommandé par Electron :

- **`main.js`** — Processus principal. Gère le cycle de vie de l'app, crée la fenêtre, et expose 5 handlers IPC (`get-tasks`, `add-task`, `delete-task`, `toggle-task`, `update-task`) pour interagir avec le fichier `tasks.json`.
- **`preload.js`** — Pont sécurisé. Expose uniquement les fonctions nécessaires via `contextBridge` sous `window.api`, sans donner un accès direct à Node.js à la page web.
- **`renderer.js`** — Interface utilisateur. Communique exclusivement via `window.api` pour toutes les opérations sur les tâches.

La communication entre le renderer et le main passe par l'IPC (Inter-Process Communication) avec `ipcRenderer.invoke` / `ipcMain.handle`.

## Format des données (`tasks.json`)

```json
[
  {
    "id": 1773307843618,
    "title": "Titre de la tâche",
    "description": "Description optionnelle",
    "done": false,
    "createdAt": "12/03/2026"
  }
]
```

## Licence

ISC
