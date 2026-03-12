// ═══════════════════════════════════════════
// main.js – LE PATRON DE L'APPLICATION
// C'est lui qui crée la fenêtre et gère le système
// ═══════════════════════════════════════════


// On importe 2 choses d'Electron :
// - app : gère le cycle de vie (démarrage, fermeture)
// - BrowserWindow : crée une fenêtre
const { app, BrowserWindow } = require('electron');


// Fonction qui crée la fenêtre principale
function createWindow() {
  // Créer une fenêtre de 800x600 pixels
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });


  // Charger notre page HTML dans la fenêtre
  // C'est comme ouvrir index.html dans Chrome
  win.loadFile('index.html');
}


// Quand Electron est prêt (tout est chargé)
// → on crée la fenêtre
app.whenReady().then(() => {
  createWindow();
});


// Quand toutes les fenêtres sont fermées → quitter
// (sauf sur Mac où les apps restent en arrière-plan)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
