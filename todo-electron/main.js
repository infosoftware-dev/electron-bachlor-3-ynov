// =============================================================================
// main.js — Le PROCESSUS PRINCIPAL de l'application Electron
// =============================================================================
// Dans une application Electron, il y a DEUX types de processus :
//
//  1. Le PROCESSUS PRINCIPAL (ce fichier — main.js)
//     → C'est le "chef d'orchestre". Il démarre l'application,
//       crée les fenêtres, et accède aux ressources système
//       (fichiers, base de données, internet, etc.)
//     → Il tourne avec Node.js, donc il peut utiliser require()
//
//  2. Le PROCESSUS RENDERER (renderer.js)
//     → C'est la "page web" que l'utilisateur voit.
//     → Il ressemble à du code JavaScript de navigateur.
//     → Pour des raisons de SÉCURITÉ, il n'a PAS accès aux fichiers.
//       Il doit passer par le processus principal pour ça.
//
// La communication entre les deux s'appelle l'IPC (Inter-Process Communication).
// C'est comme envoyer des messages entre deux programmes différents.
// =============================================================================


// =============================================================================
// ÉTAPE 1 — Importer les modules nécessaires
// =============================================================================
// "require()" est la façon Node.js d'importer des bibliothèques.
// C'est l'équivalent de "import" en JavaScript moderne.

// On importe 3 outils depuis Electron :
//   - app          : gère le cycle de vie de l'application (démarrage, fermeture)
//   - BrowserWindow: permet de créer des fenêtres (comme des onglets de navigateur)
//   - ipcMain      : permet de recevoir des messages venant du Renderer (la page web)
const { app, BrowserWindow, ipcMain } = require('electron');

// "path" est un module Node.js intégré.
// Il permet de construire des chemins de fichiers de façon compatible
// avec tous les systèmes d'exploitation (Windows, Mac, Linux).
// Exemple : path.join('dossier', 'fichier.json') → "dossier/fichier.json" ou "dossier\fichier.json"
const path = require('path');

// "fs" signifie "File System" (système de fichiers).
// C'est un module Node.js intégré qui permet de lire et écrire des fichiers.
const fs = require('fs');


// =============================================================================
// ÉTAPE 2 — Définir où seront sauvegardées les tâches
// =============================================================================

// "__dirname" est une variable spéciale de Node.js.
// Elle contient automatiquement le chemin ABSOLU du dossier où se trouve ce fichier.
// Exemple : "/home/username/Electron/mon-app"
//
// path.join() assemble le chemin vers le fichier tasks.json
// dans le MÊME dossier que main.js.
// Résultat : "/home/username/Electron/mon-app/tasks.json"
const DATA_FILE = path.join(__dirname, 'tasks.json');


// =============================================================================
// ÉTAPE 3 — Fonctions pour lire et écrire les tâches dans le fichier JSON
// =============================================================================

// ── Fonction LIRE les tâches ──
// Cette fonction ouvre le fichier tasks.json et retourne son contenu
// sous forme de tableau JavaScript (array d'objets).
function loadTasks() {

  // fs.existsSync() vérifie si le fichier existe.
  // La première fois qu'on lance l'application, tasks.json n'existe pas encore !
  // Donc on vérifie avant d'essayer de le lire pour éviter une erreur.
  if (fs.existsSync(DATA_FILE)) {

    // fs.readFileSync() lit le fichier et retourne son contenu comme texte brut.
    // 'utf-8' est l'encodage de texte (pour lire les accents correctement).
    // Le fichier contient quelque chose comme : [{"id":123,"title":"Faire les courses",...}]
    const data = fs.readFileSync(DATA_FILE, 'utf-8');

    // JSON.parse() convertit ce texte brut en vrai tableau JavaScript
    // qu'on peut manipuler avec .forEach(), .filter(), etc.
    return JSON.parse(data);
  }

  // Si le fichier n'existe pas encore, on retourne un tableau vide [].
  // La prochaine fois qu'on sauvegarde, le fichier sera créé automatiquement.
  return [];
}


// ── Fonction ÉCRIRE les tâches ──
// Cette fonction reçoit un tableau de tâches et le sauvegarde dans le fichier JSON.
// Elle est appelée à chaque modification (ajout, suppression, cocher/décocher).
function saveTasks(tasks) {

  // JSON.stringify() fait l'inverse de JSON.parse() :
  // il convertit un tableau JavaScript en texte JSON.
  //
  // Les 3 arguments de JSON.stringify() :
  //   1. tasks      : l'objet à convertir en texte
  //   2. null       : pas de transformation spéciale des valeurs
  //   3. 2          : indenter avec 2 espaces pour que le fichier soit lisible par un humain
  //
  // fs.writeFileSync() écrit ce texte dans le fichier.
  // Si le fichier n'existe pas, il est créé automatiquement.
  // Si le fichier existe déjà, son contenu est REMPLACÉ entièrement.
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}


// =============================================================================
// ÉTAPE 4 — Créer la fenêtre de l'application
// =============================================================================

// Cette fonction crée et configure la fenêtre principale de l'application.
function createWindow() {

  // new BrowserWindow() crée une nouvelle fenêtre, comme un onglet de navigateur.
  // On lui passe un objet de configuration entre les accolades {}.
  const win = new BrowserWindow({

    // Taille de la fenêtre en pixels à l'ouverture
    width: 900,
    height: 700,

    // webPreferences = réglages de sécurité et de comportement pour la page web
    webPreferences: {

      // preload : chemin vers le fichier preload.js.
      // Ce fichier est chargé AVANT la page HTML, dans un contexte spécial
      // qui a accès à la fois à Node.js ET à la page web.
      // C'est lui qui crée le pont sécurisé "window.api".
      preload: path.join(__dirname, 'preload.js'),

      // contextIsolation: true → OBLIGATOIRE pour la sécurité.
      // Ça crée une barrière entre le code du preload et le code de la page web.
      // Sans ça, une page malveillante pourrait accéder aux fichiers de l'ordinateur !
      contextIsolation: true,

      // nodeIntegration: false → OBLIGATOIRE pour la sécurité.
      // Ça empêche la page HTML d'utiliser directement Node.js (require, fs, etc.).
      // La page web ne peut accéder aux fichiers QUE via window.api (contrôlé par nous).
      nodeIntegration: false,
    }
  });

  // win.loadFile() charge notre fichier HTML dans la fenêtre.
  // C'est comme ouvrir index.html dans un navigateur.
  win.loadFile('index.html');

  // win.webContents.openDevTools() ouvre les outils de développement (comme F12 dans Chrome).
  // Très utile pour déboguer : voir les erreurs, inspecter les éléments, etc.
  // CONSEIL : Supprime ou mets en commentaire cette ligne avant de livrer l'application !
  // win.webContents.openDevTools();
}


// =============================================================================
// ÉTAPE 5 — Démarrer l'application
// =============================================================================

// app.whenReady() retourne une Promesse qui se résout quand Electron est prêt.
// .then(createWindow) = "quand c'est prêt, appelle la fonction createWindow".
// On ne peut pas créer de fenêtre avant qu'Electron soit initialisé !
app.whenReady().then(createWindow);

// Événement "window-all-closed" : déclenché quand toutes les fenêtres sont fermées.
// Sur macOS (darwin), il est courant de garder l'application ouverte même sans fenêtre.
// Sur Windows et Linux, on ferme l'application complètement.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


// =============================================================================
// ÉTAPE 6 — Les HANDLERS IPC (la communication avec la page web)
// =============================================================================
// IPC = Inter-Process Communication (communication entre processus).
//
// Principe de fonctionnement :
//   1. Le Renderer (renderer.js) envoie un message avec un NOM et des DONNÉES.
//      Exemple : ipcRenderer.invoke('add-task', { title: 'Faire les courses' })
//
//   2. Le Main (ici) reçoit ce message grâce à ipcMain.handle().
//      Il effectue l'opération demandée (lire/écrire dans le fichier)
//      et retourne un résultat.
//
//   3. Le Renderer reçoit le résultat et met à jour l'affichage.
//
// C'est comme un serveur web, mais en local sur l'ordinateur !
// Le Renderer est le "client", le Main est le "serveur".
// =============================================================================


// ── Handler 1 : Récupérer TOUTES les tâches ──
// Quand le Renderer envoie le message 'get-tasks',
// on lit le fichier et on retourne le tableau de tâches.
ipcMain.handle('get-tasks', () => {
  return loadTasks();
});


// ── Handler 2 : AJOUTER une nouvelle tâche ──
// Quand le Renderer envoie le message 'add-task' avec les données de la tâche,
// on crée un objet tâche complet et on le sauvegarde.
//
// Paramètres :
//   event    : informations sur l'événement IPC (rarement utilisé)
//   taskData : l'objet envoyé par le Renderer, ex: { title: "Courses", description: "Pain, lait" }
ipcMain.handle('add-task', (event, taskData) => {

  // On charge toutes les tâches existantes
  const tasks = loadTasks();

  // On crée un nouvel objet tâche avec toutes ses propriétés
  const newTask = {

    // Date.now() retourne le nombre de millisecondes depuis le 1er janvier 1970.
    // C'est un nombre unique à chaque milliseconde, donc parfait comme identifiant !
    // Exemple : 1773307843618
    id: Date.now(),

    // Le titre vient directement de ce que l'utilisateur a tapé
    title: taskData.title,

    // La description est optionnelle. Si elle n'est pas fournie (undefined ou vide),
    // on met une chaîne vide '' par défaut grâce à l'opérateur "||".
    description: taskData.description || '',

    // Une nouvelle tâche est toujours "pas faite" au départ
    done: false,

    // La date du jour formatée en français (ex: "12/03/2026")
    // toLocaleDateString('fr-FR') formate la date selon les conventions françaises
    createdAt: new Date().toLocaleDateString('fr-FR'),
  };

  // On ajoute la nouvelle tâche à la fin du tableau
  tasks.push(newTask);

  // On sauvegarde le tableau mis à jour dans le fichier JSON
  saveTasks(tasks);

  // On retourne le tableau complet mis à jour (pas obligatoire ici mais pratique)
  return tasks;
});


// ── Handler 3 : SUPPRIMER une tâche ──
// Quand le Renderer envoie 'delete-task' avec l'id d'une tâche,
// on la retire du tableau et on sauvegarde.
//
// Paramètres :
//   event  : informations IPC (non utilisé ici)
//   taskId : l'identifiant numérique de la tâche à supprimer
ipcMain.handle('delete-task', (event, taskId) => {

  let tasks = loadTasks();

  // .filter() crée un NOUVEAU tableau en gardant seulement les éléments
  // pour lesquels la condition est VRAIE.
  // Ici : "garde toutes les tâches SAUF celle dont l'id correspond"
  // C'est la façon la plus simple de "supprimer" un élément en JavaScript !
  tasks = tasks.filter(t => t.id !== taskId);

  saveTasks(tasks);
  return tasks;
});


// ── Handler 4 : COCHER / DÉCOCHER une tâche ──
// Quand le Renderer envoie 'toggle-task' avec l'id d'une tâche,
// on inverse son état done (true → false, ou false → true).
//
// "Toggle" = interrupteur en anglais, ça s'allume/s'éteint à chaque appui.
ipcMain.handle('toggle-task', (event, taskId) => {

  const tasks = loadTasks();

  // .find() cherche dans le tableau le PREMIER élément qui correspond à la condition.
  // Ici : "trouve la tâche dont l'id est égal à taskId".
  // Si trouvée, "task" pointe vers cet objet. Sinon, task = undefined.
  const task = tasks.find(t => t.id === taskId);

  // Si on a bien trouvé la tâche (protection contre les bugs)
  if (task) {
    // L'opérateur "!" inverse un booléen : true devient false, false devient true.
    // Donc à chaque appel, la tâche bascule entre "faite" et "pas faite".
    task.done = !task.done;
  }

  saveTasks(tasks);
  return tasks;
});


// ── Handler 5 : MODIFIER une tâche existante ──
// Quand le Renderer envoie 'update-task' avec les nouvelles données,
// on trouve la tâche concernée et on met à jour son titre et sa description.
// L'id, la date de création et l'état done restent inchangés.
//
// Paramètres :
//   event    : informations IPC (non utilisé ici)
//   taskData : objet envoyé par le Renderer, ex: { id: 1773307843618, title: "Nouveau titre", description: "..." }
ipcMain.handle('update-task', (_event, taskData) => {

  const tasks = loadTasks();

  // On cherche la tâche dont l'id correspond à celui envoyé
  const task = tasks.find(t => t.id === taskData.id);

  // Si la tâche existe bien, on met à jour ses champs modifiables
  if (task) {
    task.title = taskData.title;
    // L'opérateur "||" : si description est vide/undefined, on met une chaîne vide
    task.description = taskData.description || '';
  }

  // On sauvegarde le tableau mis à jour dans le fichier JSON
  saveTasks(tasks);
  return tasks;
});


