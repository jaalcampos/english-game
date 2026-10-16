/* ============================================================
   FIREBASE CONFIGURATION
============================================================ */

// TODO: Replace with your Firebase project configuration
// Get this from: Firebase Console > Project Settings > Your apps > SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuISrz-lZS3YQy0U7UAg98GSdduM2Zfx4",
  authDomain: "english-game-3937a.firebaseapp.com",
  databaseURL: "https://english-game-3937a-default-rtdb.firebaseio.com",
  projectId: "english-game-3937a",
  storageBucket: "english-game-3937a.firebasestorage.app",
  messagingSenderId: "319372193138",
  appId: "1:319372193138:web:b09add4c5fdccbbc49c1eb",
  measurementId: "G-DFHE6V79FW"
};

// Initialize Firebase
let app, db;

function initializeFirebase() {
  try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('✅ Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return false;
  }
}

/* ============================================================
   PLAYER MANAGEMENT
============================================================ */

// Current player data
let currentPlayer = null;

// Get or create player
async function getOrCreatePlayer(playerName) {
  if (!db) {
    console.error('Firebase not initialized');
    return null;
  }

  try {
    const playerRef = db.collection('players').doc(playerName.toLowerCase());
    const doc = await playerRef.get();

    if (doc.exists) {
      // Existing player
      currentPlayer = { id: doc.id, ...doc.data() };
      console.log('👋 Welcome back,', currentPlayer.name);
    } else {
      // New player
      const newPlayer = {
        name: playerName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        totalScore: 0,
        totalStars: 0,
        gamesPlayed: 0,
        progress: {
          rooms: { completed: false, score: 0, stars: 0 },
          furniture: { completed: false, score: 0, stars: 0 },
          adjectives: { completed: false, score: 0, stars: 0 },
          animals: { completed: false, score: 0, stars: 0 },
          colors: { completed: false, score: 0, stars: 0 },
          listenDraw: { completed: false, score: 0 },
          interactive: { completed: false, score: 0 },
          ahorcado: { highScore: 0, totalWords: 0 }
        }
      };

      await playerRef.set(newPlayer);
      currentPlayer = { id: playerName.toLowerCase(), ...newPlayer };
      console.log('🎉 New player created:', currentPlayer.name);
    }

    // Store in localStorage for quick access
    localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
    return currentPlayer;

  } catch (error) {
    console.error('Error getting/creating player:', error);
    return null;
  }
}

// Load player from localStorage
function loadPlayerFromStorage() {
  const stored = localStorage.getItem('currentPlayer');
  if (stored) {
    currentPlayer = JSON.parse(stored);
    return currentPlayer;
  }
  return null;
}

// Update player score for a specific game/category
async function updatePlayerProgress(category, data) {
  if (!db || !currentPlayer) {
    console.error('No player logged in or Firebase not initialized');
    return false;
  }

  try {
    const playerRef = db.collection('players').doc(currentPlayer.id);

    const updateData = {
      [`progress.${category}`]: data,
      gamesPlayed: firebase.firestore.FieldValue.increment(1),
      lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Update total score if provided
    if (data.score !== undefined) {
      updateData.totalScore = firebase.firestore.FieldValue.increment(data.score);
    }

    // Update total stars if provided
    if (data.stars !== undefined) {
      updateData.totalStars = firebase.firestore.FieldValue.increment(data.stars);
    }

    await playerRef.update(updateData);

    // Update local cache
    if (!currentPlayer.progress) currentPlayer.progress = {};
    currentPlayer.progress[category] = data;
    if (data.score) currentPlayer.totalScore = (currentPlayer.totalScore || 0) + data.score;
    if (data.stars) currentPlayer.totalStars = (currentPlayer.totalStars || 0) + data.stars;

    localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));

    console.log(`✅ Progress saved for ${category}:`, data);
    return true;

  } catch (error) {
    console.error('Error updating player progress:', error);
    return false;
  }
}

// Get top players (leaderboard)
async function getTopPlayers(limit = 10) {
  if (!db) {
    console.error('Firebase not initialized');
    return [];
  }

  try {
    const snapshot = await db.collection('players')
      .orderBy('totalScore', 'desc')
      .limit(limit)
      .get();

    const players = [];
    snapshot.forEach(doc => {
      players.push({ id: doc.id, ...doc.data() });
    });

    return players;

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

// Logout player
function logoutPlayer() {
  currentPlayer = null;
  localStorage.removeItem('currentPlayer');
  console.log('👋 Player logged out');
}

// Get current player
function getCurrentPlayer() {
  return currentPlayer;
}

/* ============================================================
   HELPER FUNCTIONS
============================================================ */

// Calculate stars based on score percentage
function calculateStars(score, maxScore) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 50) return 1;
  return 0;
}

// Check if Firebase is configured
function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
}
