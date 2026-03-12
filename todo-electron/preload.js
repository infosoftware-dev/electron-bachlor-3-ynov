// =============================================================================
// preload.js — Le PONT SÉCURISÉ entre la page web et le système
// =============================================================================
// Dans Electron, pour des raisons de SÉCURITÉ, la page web (renderer.js)
// n'a pas le droit d'accéder directement aux fichiers ou à Node.js.
//
// Ce fichier est la SOLUTION : il s'exécute dans un contexte spécial
// qui a accès aux deux mondes en même temps :
//   → Il peut utiliser Node.js / Electron (require, ipcRenderer...)
//   → Il peut aussi communiquer avec la page web (window, document...)
//
// Son rôle : créer un "guichet" limité et contrôlé (window.api)
// qui expose UNIQUEMENT les fonctions dont la page web a besoin.
// Rien de plus, rien de moins. C'est la bonne pratique de sécurité Electron.
//
// ANALOGIE : C'est comme un guichet de banque.
//   → Le client (la page web) ne peut pas entrer dans les réserves de la banque.
//   → Il passe par le guichet (preload.js) pour faire ses demandes.
//   → Le guichetier (le Main) traite la demande de façon sécurisée.
// =============================================================================


// =============================================================================
// ÉTAPE 1 — Importer les outils Electron nécessaires
// =============================================================================

// On importe deux outils depuis Electron :
//
//   contextBridge : permet d'exposer des fonctions de façon sécurisée
//                   à la page web, sans lui donner un accès total à Node.js.
//
//   ipcRenderer   : permet d'ENVOYER des messages au processus principal (main.js)
//                   et d'ATTENDRE sa réponse.
//                   "ipc" = Inter-Process Communication
//                   "Renderer" = on est du côté de la page web
const { contextBridge, ipcRenderer } = require('electron');


// =============================================================================
// ÉTAPE 2 — Créer le pont et exposer les fonctions autorisées
// =============================================================================

// contextBridge.exposeInMainWorld() crée une variable globale accessible
// depuis n'importe quel endroit de la page web via "window.api".
//
// Premier argument  : 'api' → c'est le nom de la variable (window.api)
// Deuxième argument : un objet contenant toutes les fonctions autorisées
contextBridge.exposeInMainWorld('api', {


  // ── Fonction 1 : Récupérer toutes les tâches ──
  // ipcRenderer.invoke() envoie un message au Main et retourne une Promesse.
  // Le Main reçoit ce message grâce à ipcMain.handle('get-tasks', ...) dans main.js.
  // La réponse (le tableau de tâches) arrivera quand le Main aura lu le fichier.
  getTasks: () => ipcRenderer.invoke('get-tasks'),


  // ── Fonction 2 : Ajouter une nouvelle tâche ──
  // On envoie le message 'add-task' avec les données de la tâche en argument.
  // "task" est un objet comme : { title: "Faire les courses", description: "Pain, lait" }
  // Le Main créera un objet complet (avec id, date, done=false) et le sauvegardera.
  addTask: (task) => ipcRenderer.invoke('add-task', task),


  // ── Fonction 3 : Supprimer une tâche ──
  // On envoie l'identifiant (id) de la tâche à supprimer.
  // Le Main se chargera de la retirer du fichier tasks.json.
  deleteTask: (id) => ipcRenderer.invoke('delete-task', id),


  // ── Fonction 4 : Cocher ou décocher une tâche ──
  // On envoie l'identifiant de la tâche dont on veut inverser l'état.
  // "toggle" signifie "basculer" : faite → pas faite, ou pas faite → faite.
  toggleTask: (id) => ipcRenderer.invoke('toggle-task', id),


  // ── Fonction 5 : Modifier une tâche existante ──
  // On envoie un objet avec l'id de la tâche à modifier, le nouveau titre et la nouvelle description.
  // Exemple : { id: 1773307843618, title: "Nouveau titre", description: "Nouvelle description" }
  // Le Main trouvera la tâche par son id et mettra à jour ses champs.
  updateTask: (task) => ipcRenderer.invoke('update-task', task),

});


// =============================================================================
// RÉSUMÉ : Ce que la page web peut maintenant faire via window.api
// =============================================================================
//
// Depuis renderer.js ou index.html, on peut écrire :
//
//   const tasks = await window.api.getTasks();
//   → Retourne un tableau de toutes les tâches
//
//   await window.api.addTask({ title: 'Acheter du pain', description: 'Boulangerie' });
//   → Crée et sauvegarde une nouvelle tâche
//
//   await window.api.deleteTask(1773307843618);
//   → Supprime la tâche avec cet identifiant
//
//   await window.api.toggleTask(1773307843618);
//   → Inverse l'état "done" de cette tâche
//
// Tout le reste (accès aux fichiers, Node.js, etc.) est INTERDIT à la page web.
// =============================================================================
