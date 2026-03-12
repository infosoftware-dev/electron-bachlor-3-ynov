// =============================================================================
// renderer.js — Le cerveau de l'interface utilisateur
// =============================================================================
// Ce fichier est exécuté dans la fenêtre Electron (la "page web").
// Il gère tout ce que l'utilisateur voit et fait :
//   - Afficher la liste des tâches
//   - Ajouter une nouvelle tâche
//   - Cocher/décocher une tâche (faite ou pas)
//   - Supprimer une tâche
//
// IMPORTANT : Ce fichier NE touche PAS directement à la base de données.
// Pour ça, il passe par "window.api" qui est un pont sécurisé vers le
// processus principal (main.js). Ce pont s'appelle le "preload bridge".
// =============================================================================


// =============================================================================
// ÉTAPE 1 — Récupérer les éléments HTML de la page
// =============================================================================
// On utilise getElementById() pour "attraper" des éléments HTML et les
// stocker dans des variables. Ainsi, on peut les manipuler facilement
// dans tout le fichier sans avoir à les rechercher à chaque fois.

// Le champ de texte où l'utilisateur tape le TITRE de la tâche
const titleInput = document.getElementById('title');

// Le champ de texte où l'utilisateur tape la DESCRIPTION de la tâche
const descInput = document.getElementById('desc');

// Le bouton "Ajouter" sur lequel l'utilisateur clique pour créer une tâche
const btnAdd = document.getElementById('btn-add');

// La zone (div) qui va contenir la LISTE de toutes les tâches affichées
const taskList = document.getElementById('task-list');

// Le petit texte qui affiche le COMPTEUR de tâches (ex: "3 tâches")
const counter = document.getElementById('counter');

// Le conteneur du formulaire (utilisé pour ajouter la classe "editing" en mode édition)
const addForm = document.querySelector('.add-form');


// =============================================================================
// ÉTAT D'ÉDITION
// =============================================================================
// Cette variable mémorise l'id de la tâche en cours de modification.
// null  = on est en mode "ajout" (comportement normal)
// nombre = on est en mode "édition" (l'id correspond à la tâche à modifier)
let editingId = null;


// =============================================================================
// Fonction : ENTRER en mode édition
// =============================================================================
// Appelée quand l'utilisateur clique sur le bouton "Modifier" d'une tâche.
// Elle remplit les champs du formulaire avec les données de la tâche
// et transforme le bouton "Ajouter" en bouton "Mettre à jour".
//
// Paramètre :
//   task : l'objet tâche complet { id, title, description, done, createdAt }
function enterEditMode(task) {

  // On mémorise l'id de la tâche qu'on est en train de modifier
  editingId = task.id;

  // On remplit les champs avec les données actuelles de la tâche
  titleInput.value = task.title;
  descInput.value = task.description;

  // On change le texte du bouton pour signaler le mode édition
  btnAdd.textContent = '✎ Mettre à jour';

  // On ajoute la classe "editing" au formulaire pour changer son apparence (CSS)
  addForm.classList.add('editing');

  // On place le curseur dans le champ titre pour que l'utilisateur puisse
  // modifier directement sans avoir à cliquer
  titleInput.focus();
  titleInput.select(); // Sélectionne tout le texte pour faciliter la modification
}


// =============================================================================
// Fonction : QUITTER le mode édition (retour au mode ajout normal)
// =============================================================================
// Appelée après une mise à jour réussie pour réinitialiser le formulaire.
function exitEditMode() {

  // On remet l'id d'édition à null (retour au mode ajout)
  editingId = null;

  // On vide les champs du formulaire
  titleInput.value = '';
  descInput.value = '';

  // On remet le texte original du bouton
  btnAdd.textContent = '+ Ajouter';

  // On retire la classe "editing" du formulaire (retour au style normal)
  addForm.classList.remove('editing');

  // On remet le focus sur le champ titre pour enchaîner les saisies
  titleInput.focus();
}


// =============================================================================
// ÉTAPE 2 — Fonction pour AFFICHER toutes les tâches
// =============================================================================
// Cette fonction est appelée chaque fois qu'on a besoin de rafraîchir
// l'affichage (au démarrage, après ajout, après suppression, etc.)
//
// Le mot "async" signifie que la fonction est ASYNCHRONE :
// elle peut "attendre" des opérations longues (comme lire la base de données)
// sans bloquer tout le reste de l'application.

async function displayTasks() {

    // On demande au processus principal de nous donner toutes les tâches.
    // "await" signifie "attends que la réponse arrive avant de continuer".
    // Les tâches arrivent sous forme de tableau (array) d'objets JavaScript.
    // Exemple : [ { id: 1, title: "Faire les courses", done: false, ... }, ... ]
    const tasks = await window.api.getTasks();

    // On vide complètement la zone de liste avant de la remplir à nouveau.
    // Si on ne faisait pas ça, les tâches s'accumuleraient en double à chaque rafraîchissement.
    taskList.innerHTML = '';

    // ── Cas particulier : aucune tâche dans la liste ──
    // Si le tableau "tasks" est vide (longueur 0), on affiche un message sympa
    // et on remet le compteur à zéro, puis on quitte la fonction (return).
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty">Aucune tâche pour le moment ✌️</div>';
        counter.textContent = '0 tâche';
        return; // On arrête la fonction ici, pas besoin d'aller plus loin
    }

    // ── Cas normal : on a des tâches à afficher ──
    // forEach() parcourt CHAQUE tâche du tableau une par une.
    // Pour chaque tâche, on crée un bloc HTML et on l'ajoute à la page.
    tasks.forEach(task => {

        // On crée un nouvel élément HTML <div> en mémoire (pas encore visible sur la page)
        const taskEl = document.createElement('div');

        // On lui donne la classe CSS "task" pour le style de base.
        // Si la tâche est terminée (done = true), on ajoute aussi la classe "done"
        // qui va barrer le texte par exemple (c'est défini dans le CSS).
        // L'opérateur ternaire "condition ? siVrai : siFaux" est un raccourci de if/else.
        taskEl.className = `task ${task.done ? 'done' : ''}`;

        // On remplit l'intérieur du bloc avec du HTML généré dynamiquement.
        // Les backticks ` ` permettent d'écrire du HTML sur plusieurs lignes
        // et d'insérer des variables avec la syntaxe ${variable}.
        taskEl.innerHTML = `
            <input type="checkbox" ${task.done ? 'checked' : ''} data-id="${task.id}">
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
                <div class="task-date">${task.createdAt}</div>
            </div>
            <button class="btn-update" data-id="${task.id}">Modifier</button>
            <button class="btn-delete" data-id="${task.id}">Supprimer</button>
        `;
        // Nouveau bouton ajouté :
        // <button class="btn-update" data-id="${task.id}">Modifier</button>
        //   → Placé AVANT le bouton supprimer, à droite du contenu de la tâche.
        //   → data-id stocke l'id pour savoir quelle tâche charger dans le formulaire.
        // Explication ligne par ligne du HTML généré :
        //
        // <input type="checkbox" ...>
        //   → La case à cocher. Si la tâche est faite, l'attribut "checked" est ajouté.
        //   → data-id="${task.id}" stocke l'identifiant de la tâche dans le HTML
        //     pour pouvoir la retrouver quand l'utilisateur clique.
        //
        // <div class="task-title">${task.title}</div>
        //   → Affiche le titre de la tâche.
        //
        // ${task.description ? `<div class="task-desc">...</div>` : ''}
        //   → Si une description existe, on affiche un bloc pour elle.
        //   → Sinon, on n'affiche rien du tout (chaîne vide '').
        //
        // <div class="task-date">${task.createdAt}</div>
        //   → Affiche la date de création de la tâche.
        //
        // <button class="btn-delete" data-id="${task.id}">Supprimer</button>
        //   → Le bouton supprimer. data-id stocke aussi l'id pour savoir quelle tâche supprimer.

        // On ajoute le bloc <div> qu'on vient de construire à la fin de la liste visible.
        taskList.appendChild(taskEl);
    });

    // Mise à jour du compteur en bas de la liste.
    // Si tasks.length > 1, on met le mot "tâches" au pluriel, sinon "tâche" au singulier.
    // Exemple : "1 tâche", "2 tâches", "5 tâches"
    counter.textContent = `${tasks.length} tâche${tasks.length > 1 ? 's' : ''}`;
}


// =============================================================================
// ÉTAPE 3 — Fonction principale du bouton (Ajouter OU Mettre à jour)
// =============================================================================
// Cette fonction est appelée quand l'utilisateur clique sur le bouton principal
// ou appuie sur Entrée dans le champ titre.
//
// Son comportement dépend du mode actif :
//   → Si editingId === null  : on est en mode AJOUT  → crée une nouvelle tâche
//   → Si editingId !== null  : on est en mode ÉDITION → met à jour la tâche existante

async function addTaskFromInput() {

    // On récupère le texte saisi dans le champ titre.
    // .trim() supprime les espaces vides au début et à la fin
    // (ex: "  Ma tâche  " devient "Ma tâche")
    const title = titleInput.value.trim();

    // Si le titre est vide (l'utilisateur n'a rien tapé), on ne fait rien.
    // L'opérateur "!" signifie "si PAS" — donc "si title est vide, on quitte".
    if (!title) return;

    // ── Mode ÉDITION : on met à jour une tâche existante ──
    // editingId contient l'id de la tâche en cours de modification
    if (editingId !== null) {

        // On envoie au processus principal l'id de la tâche + les nouvelles valeurs
        await globalThis.api.updateTask({
            id: editingId,
            title,
            description: descInput.value,
        });

        // On quitte le mode édition (remet le formulaire en mode ajout normal)
        exitEditMode();

        // On rafraîchit la liste pour afficher les nouvelles valeurs
        displayTasks();
        return; // On arrête ici, pas besoin d'exécuter le code d'ajout ci-dessous
    }

    // ── Mode AJOUT : on crée une nouvelle tâche ──
    // On envoie la nouvelle tâche au processus principal pour qu'il la sauvegarde.
    // On passe un objet avec le titre et la description.
    await window.api.addTask({ title, description: descInput.value });

    // On vide les champs de saisie après l'ajout pour préparer la prochaine tâche.
    titleInput.value = '';
    descInput.value = '';

    // On remet le curseur dans le champ titre pour que l'utilisateur puisse
    // immédiatement taper une nouvelle tâche sans avoir à cliquer.
    titleInput.focus();

    // On rafraîchit l'affichage pour que la nouvelle tâche apparaisse dans la liste.
    displayTasks();
}


// =============================================================================
// ÉTAPE 4 — Écouter les actions de l'utilisateur (les "événements")
// =============================================================================
// addEventListener() dit au navigateur : "quand tel événement se produit
// sur tel élément, exécute telle fonction".

// ── Événement : clic sur le bouton "Ajouter" ──
// Quand l'utilisateur clique sur le bouton, on appelle addTaskFromInput().
btnAdd.addEventListener('click', addTaskFromInput);

// ── Événement : touche pressée dans le champ titre ──
// On écoute chaque touche du clavier enfoncée dans le champ titre.
// Si la touche est "Entrée" (e.key === 'Enter'), on ajoute la tâche.
// Pratique pour ne pas avoir à cliquer sur le bouton à chaque fois !
titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTaskFromInput();
});

// ── Événement : clic n'importe où dans la liste des tâches ──
// Plutôt que de mettre un écouteur sur CHAQUE case à cocher et CHAQUE bouton
// supprimer (ce qui serait long et compliqué), on utilise une technique
// appelée "délégation d'événements" :
//   → On pose UN SEUL écouteur sur le conteneur parent (taskList).
//   → Quand un clic se produit à l'intérieur, l'événement "remonte" jusqu'à lui.
//   → On regarde alors QUEL élément a été cliqué (e.target) pour réagir.
taskList.addEventListener('click', async (e) => {

    // e.target est l'élément exactement cliqué (la case à cocher ou le bouton).
    // data-id est l'attribut HTML qu'on a mis sur chaque case et bouton.
    // Number() convertit la valeur (qui est une chaîne de texte) en nombre entier.
    const id = Number(e.target.dataset.id);

    // Si id est 0 ou undefined (l'utilisateur a cliqué ailleurs, pas sur une case/bouton),
    // on ne fait rien et on quitte.
    if (!id) return;

    // ── Cas 1 : l'utilisateur a cliqué sur une CASE À COCHER ──
    // On vérifie que l'élément cliqué est bien une case à cocher (type === 'checkbox').
    if (e.target.type === 'checkbox') {
        // On demande au processus principal d'inverser l'état de la tâche :
        // si elle était "faite" elle devient "pas faite", et vice-versa.
        await window.api.toggleTask(id);
        // On rafraîchit la liste pour refléter le changement visuellement.
        displayTasks();
    }

    // ── Cas 2 : l'utilisateur a cliqué sur le bouton MODIFIER ──
    // On vérifie que l'élément cliqué possède la classe CSS "btn-update".
    if (e.target.classList.contains('btn-update')) {

        // On récupère toutes les tâches pour trouver celle qui correspond à l'id cliqué
        const tasks = await globalThis.api.getTasks();
        const task = tasks.find(t => t.id === id);

        // Si la tâche existe bien, on passe en mode édition
        // (remplit les champs + change le bouton en "Mettre à jour")
        if (task) enterEditMode(task);
    }

    // ── Cas 3 : l'utilisateur a cliqué sur le bouton SUPPRIMER ──
    // On vérifie que l'élément cliqué possède la classe CSS "btn-delete".
    if (e.target.classList.contains('btn-delete')) {
        // On demande au processus principal de supprimer définitivement cette tâche.
        await window.api.deleteTask(id);
        // On rafraîchit la liste pour que la tâche disparaisse de l'écran.
        displayTasks();
    }
});


// =============================================================================
// ÉTAPE 5 — Lancement au démarrage
// =============================================================================
// Quand la page se charge pour la première fois, on appelle displayTasks()
// pour afficher immédiatement les tâches déjà enregistrées dans la base de données.
// Sans cette ligne, la liste serait vide à l'ouverture de l'application.
displayTasks();
