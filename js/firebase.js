// ByteSurge: Firebase Integration - Authentication, Cloud Save & Leaderboard
// Firebase configuration and initialization

// Firebase config (for auth and leaderboard - using shared-sign-in for both)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCntr6vfF8UI04kKGPwhQBpj5lNIxVavNQ",
  authDomain: "bytesurge-716f8.firebaseapp.com",
  databaseURL: "https://bytesurge-716f8-default-rtdb.firebaseio.com",
  projectId: "bytesurge-716f8",
  storageBucket: "bytesurge-716f8.firebasestorage.app",
  messagingSenderId: "196404297484",
  appId: "1:196404297484:web:61727456d3ef62ca815329",
  measurementId: "G-25NRWWDKGC"
};
// Using the same config for both auth and leaderboard
const leaderboardFirebaseConfig = firebaseConfig;

// Firebase services
let auth = null;
let db = null;
let app = null;

// Current user state
let currentUser = null;
let isSignedIn = false;

// Firebase System
const firebaseSystem = {
    initialized: false,
    
    async init() {
        if (this.initialized) return true;
        
        try {
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase SDK not loaded');
                return false;
            }
              // Initialize main Firebase app (auth, cloud save, and leaderboard)
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            
            // Simple initialization - let Firebase handle caching automatically
            console.log('✅ Firestore initialized successfully');
            
            // Set up auth state listener
            auth.onAuthStateChanged((user) => {
                if (user) {
                    currentUser = user;
                    isSignedIn = true;
                     ('🔑 User signed in:', user.displayName || user.email);
                    this.onSignIn(user);
                } else {
                    currentUser = null;
                    isSignedIn = false;
                     ('🚪 User signed out');
                    this.onSignOut();
                }
            });
            
            // Monitor Firestore connection state
            this.setupConnectionMonitoring();
            
            this.initialized = true;
             ('✅ Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            return false;
        }
    },

    // Setup connection monitoring for better error handling
    setupConnectionMonitoring() {
        if (!db) return;
        
        // Monitor Firestore connection by listening to a small document
        const connectionRef = db.collection('system').doc('connection');
        
        // Use onSnapshot with error handling
        connectionRef.onSnapshot(
            (doc) => {
                console.log('🌐 Firestore connection active');
            },
            (error) => {
                if (error.code === 'unavailable') {
                    console.warn('⚠️ Firestore temporarily unavailable - operating offline');
                } else {
                    console.warn('⚠️ Firestore connection issue:', error.code);
                }
            }
        );
    },    // Sign in with Google
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await auth.signInWithPopup(provider);
            
            // Check if this is a new user and store the info
            if (result.additionalUserInfo && result.additionalUserInfo.isNewUser) {
                // Mark this as a new user for tutorial purposes
                localStorage.setItem('isNewUser', 'true');
                 ('🆕 New user detected via Google sign-in');
            }
            
            return result.user;
        } catch (error) {
            console.error('❌ Google sign-in failed:', error);
            throw error;
        }
    },
      // Sign in with GitHub
    async signInWithGitHub() {
        try {
            const provider = new firebase.auth.GithubAuthProvider();
            provider.addScope('user:email');
            
            const result = await auth.signInWithPopup(provider);
            
            // Check if this is a new user and store the info
            if (result.additionalUserInfo && result.additionalUserInfo.isNewUser) {
                // Mark this as a new user for tutorial purposes
                localStorage.setItem('isNewUser', 'true');
                 ('🆕 New user detected via GitHub sign-in');
            }
            
            return result.user;
        } catch (error) {
            console.error('❌ GitHub sign-in failed:', error);
            throw error;
        }
    },
    
    // Sign in with email and password
    async signInWithEmail(email, password) {
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            console.error('❌ Email sign-in failed:', error);
            throw error;
        }
    },
      // Create account with email and password
    async createAccountWithEmail(email, password, displayName = '') {
        try {
            const result = await auth.createUserWithEmailAndPassword(email, password);
            
            // This is always a new user when creating an account
            localStorage.setItem('isNewUser', 'true');
             ('🆕 New user detected via email account creation');
            
            // Update display name if provided
            if (displayName && result.user) {
                await result.user.updateProfile({
                    displayName: displayName
                });
            }
            
            return result.user;
        } catch (error) {
            console.error('❌ Account creation failed:', error);
            throw error;
        }
    },
    
    // Reset password
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return true;
        } catch (error) {
            console.error('❌ Password reset failed:', error);
            throw error;
        }
    },    // Sign in anonymously
    async signInAnonymously() {
        try {
            const result = await auth.signInAnonymously();
            
            // Anonymous users should always see the tutorial since each session is fresh
            // Clear any previous tutorial completion status and mark as new user
            localStorage.removeItem('tutorialCompleted');
            localStorage.setItem('isNewUser', 'true');
             ('🆕 Anonymous user signed in - will show tutorial');
            
            return result.user;
        } catch (error) {
            console.error('❌ Anonymous sign-in failed:', error);
            throw error;
        }
    },
      // Sign out
    async signOut() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('❌ Sign-out failed:', error);
        }
    },    // Update display name
    async updateDisplayName(newDisplayName) {
        try {
            if (!currentUser) {
                throw new Error('No user signed in');
            }

            await currentUser.updateProfile({
                displayName: newDisplayName
            });

            // Force refresh the current user to get updated profile
            await currentUser.reload();
            currentUser = auth.currentUser;
            
            // Update all existing leaderboard entries with the new display name
            await this.updateLeaderboardDisplayName(newDisplayName);
            
             ('✅ Display name updated to:', newDisplayName);
             ('🔄 All leaderboard entries updated with new display name');
            return true;
        } catch (error) {
            console.error('❌ Failed to update display name:', error);
            throw error;
        }
    },    // Update all existing leaderboard entries for the current user
    async updateLeaderboardDisplayName(newDisplayName) {
        try {
            if (!currentUser || !db) {
                 ('⚠️ Cannot update leaderboard - not signed in or Firestore not available');
                return;
            }

            // Update the user's personal best score in playerData collection
            try {
                const userDocRef = db.collection('playerData').doc(currentUser.uid);
                await userDocRef.update({
                    displayName: newDisplayName
                });
                 ('✅ Updated personal best score display name');
            } catch (error) {
                 ('⚠️ Could not update personal best score:', error.message);
            }

            // Update all leaderboard entries for this user using batch writes
            try {
                const leaderboardQuery = db.collection('leaderboard').where('userId', '==', currentUser.uid);
                const querySnapshot = await leaderboardQuery.get();
                
                if (querySnapshot.empty) {
                     ('ℹ️ No existing leaderboard entries found for user');
                    return;
                }

                const batch = db.batch();
                let updateCount = 0;

                querySnapshot.forEach(doc => {
                    batch.update(doc.ref, { displayName: newDisplayName });
                    updateCount++;
                });

                await batch.commit();
                 (`🏆 Successfully updated ${updateCount} leaderboard entries with new display name: "${newDisplayName}"`);

            } catch (error) {
                 ('⚠️ Could not access leaderboard entries:', error.message);
                 ('💡 Your new display name will be used for future score submissions');
            }

        } catch (error) {
            console.error('❌ Failed to update leaderboard display names:', error);
            // Don't throw here - we don't want to fail the display name update if leaderboard update fails
        }
    },
    
    // Get current user
    getCurrentUser() {
        return currentUser;
    },
      // Check if signed in
    isSignedIn() {
        return isSignedIn;    },
    
    // Callbacks for auth state changes
    onSignIn(user) {
        // Load user's cloud save data
        if (window.cloudSaveSystem) {
            window.cloudSaveSystem.loadUserData();
        }
        
        // Update UI
        if (window.authUI) {
            window.authUI.updateUI();
        }
          // Check if this is a new user and they haven't seen the tutorial
        const isNewUser = localStorage.getItem('isNewUser') === 'true';
        const hasCompletedTutorial = window.tutorialSystem?.hasBeenCompleted();
          // Only auto-start tutorial for confirmed new users
        if (isNewUser && !hasCompletedTutorial && window.tutorialSystem) {
             ('🎓 Will start tutorial for new user - scheduling...');
            // Small delay to ensure the UI and game systems are ready
            setTimeout(() => {
                 ('🕐 Tutorial timer fired - checking readiness...');
                 ('📚 Tutorial system available:', !!window.tutorialSystem);
                 ('🎮 Tutorial active?', window.tutorialSystem?.isActive);
                 ('📄 DOM ready?', document.readyState);
                 ('🎬 Opening animation showing?', window.showingOpeningAnimation);
                 ('🏠 Home screen showing?', window.showingHomeScreen);
                
                if (window.tutorialSystem && !window.tutorialSystem.isActive) {
                     ('🎓 Starting tutorial for new user NOW');
                    window.tutorialSystem.start();
                    // Clear the new user flag after starting tutorial
                    localStorage.removeItem('isNewUser');
                } else {
                     ('❌ Could not start tutorial - conditions not met');
                }
            }, 800); // Increased delay to ensure everything is ready
        } else if (isNewUser) {
            // Clear the new user flag if tutorial was already completed
            localStorage.removeItem('isNewUser');
        }
    },
    
    onSignOut() {
        // For anonymous users, clear tutorial completion status since 
        // anonymous sessions don't persist across sign-ins
        const wasAnonymous = currentUser && currentUser.isAnonymous;
        if (wasAnonymous) {
            localStorage.removeItem('tutorialCompleted');
             ('🔄 Cleared tutorial status for anonymous user logout');
        }
        
        // Clear any cached data
        if (window.cloudSaveSystem) {
            window.cloudSaveSystem.clearLocalCache();
        }
        
        // Update UI
        if (window.authUI) {
            window.authUI.updateUI();
        }
    }
};

// Cloud Save System
const cloudSaveSystem = {
    retryAttempts: 3,
    
    // Save game data to cloud with retry logic
    async saveToCloud(gameData, attempt = 1) {
        if (!isSignedIn || !currentUser) {
             ('⚠️ Not signed in - cannot save to cloud');
            return false;
        }

        // Check if we're online
        if (!navigator.onLine) {
             ('⚠️ Offline - cannot save to cloud');
            return false;
        }

        try {
            const userData = {
                ...gameData,
                lastSaved: firebase.firestore.FieldValue.serverTimestamp(),
                userId: currentUser.uid,
                displayName: currentUser.displayName || 'Anonymous'
            };
            
            await db.collection('playerData').doc(currentUser.uid).set(userData, { merge: true });
             ('☁️ Game data saved to cloud');            return true;
        } catch (error) {
            // Handle specific Firebase errors with retry logic
            if (error.code === 'unavailable' || error.code === 'failed-precondition') {
                if (attempt < this.retryAttempts) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.warn(`⚠️ Firebase unavailable - retrying in ${delay/1000}s (attempt ${attempt}/${this.retryAttempts})`);
                    
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(this.saveToCloud(gameData, attempt + 1));
                        }, delay);
                    });
                } else {
                    console.warn('⚠️ Max retry attempts reached - save failed');
                }
            } else if (error.code === 'permission-denied') {
                 ('⚠️ Permission denied - check Firebase rules');
            } else {
                console.error('❌ Failed to save to cloud:', error.message);
            }
            return false;
        }
    },
      // Load game data from cloud
    async loadFromCloud() {
        if (!isSignedIn || !currentUser) {
             ('⚠️ Not signed in - cannot load from cloud');
            return null;
        }

        // Check if we're online
        if (!navigator.onLine) {
             ('⚠️ Offline - cannot load from cloud');
            return null;
        }

        try {
            const doc = await db.collection('playerData').doc(currentUser.uid).get();
            
            if (doc.exists) {
                const data = doc.data();
                 ('☁️ Game data loaded from cloud');
                return data;
            } else {
                 ('📝 No cloud save found - starting fresh');
                return null;
            }
        } catch (error) {
            // Handle specific Firebase errors
            if (error.code === 'unavailable' || error.code === 'failed-precondition') {
                 ('⚠️ Firebase temporarily unavailable - using local data');
            } else if (error.code === 'permission-denied') {
                 ('⚠️ Permission denied - check Firebase rules');
            } else {
                console.error('❌ Failed to load from cloud:', error.message);
            }
            return null;
        }
    },
      // Load user data and apply to game
    async loadUserData() {
        // Only try to load if we're online and signed in
        if (!isSignedIn || !navigator.onLine) {
             ('⚠️ Offline or not signed in - skipping cloud load');
            return;
        }

        const cloudData = await this.loadFromCloud();
        if (!cloudData) return;

        try {
            // Apply upgrades
            if (cloudData.upgrades && window.upgradeSystem) {
                window.upgradeSystem.upgrades.forEach(upgrade => {
                    const savedUpgrade = cloudData.upgrades.find(u => u.id === upgrade.id);
                    if (savedUpgrade) {
                        upgrade.currentLevel = savedUpgrade.currentLevel || 0;
                    }
                });
                window.upgradeSystem.applyAllUpgrades();
            }
            
            // Apply game state
            if (cloudData.gameState && window.gameState) {
                window.gameState.energy = cloudData.gameState.energy || 0;                // Don't restore distance/score as those are per-run
            }
            
             ('✅ Cloud data applied to game');
        } catch (error) {
            console.error('❌ Failed to apply cloud data:', error);
        }
    },
      // Auto-save current game state
    async autoSave() {
        if (!isSignedIn || !navigator.onLine) return;
        
        const gameData = {
            upgrades: window.upgradeSystem ? window.upgradeSystem.upgrades.map(u => ({
                id: u.id,
                currentLevel: u.currentLevel
            })) : [],
            
            gameState: window.gameState ? {
                energy: window.gameState.energy,
                highScore: localStorage.getItem('highScore') || 0
            } : {},
            
            harvesters: window.harvesterSystem ? window.harvesterSystem.harvesters.map(h => ({
                x: h.x,
                y: h.y,
                energyGenerationRate: h.energyGenerationRate,
                generationInterval: h.generationInterval,
                totalEnergyGenerated: h.totalEnergyGenerated
            })) : []
        };
        
        await this.saveToCloud(gameData);
    },
    
    // Clear local cache
    clearLocalCache() {
        // Could clear localStorage items if needed
         ('🧹 Local cache cleared');
    }
};

// Leaderboard System (uses Firestore)
const leaderboardSystem = {
      // Submit score to leaderboard
    async submitScore(score, distance, zone) {
        if (!isSignedIn || !currentUser) {
             ('⚠️ Not signed in - cannot submit score');
            return false;
        }
        
        // Validate score data
        if (typeof score !== 'number' || score < 0) {
             ('⚠️ Invalid score data:', score);
            return false;
        }
        
        if (typeof distance !== 'number' || distance < 0) {
             ('⚠️ Invalid distance data:', distance);
            return false;
        }
        
        if (typeof zone !== 'number' || zone < 1) {
             ('⚠️ Invalid zone data:', zone);
            return false;
        }
        
        try {
            const scoreData = {
                score: Math.floor(score), // Ensure integer
                distance: Math.floor(distance), // Ensure integer
                zone: Math.floor(zone), // Ensure integer
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userId: currentUser.uid,
                displayName: currentUser.displayName || currentUser.email || 'Anonymous',
                photoURL: currentUser.photoURL || null
            };
            
             ('📊 Score data being submitted:', scoreData);
            
            // Add to leaderboard collection in Firestore
            await db.collection('leaderboard').add(scoreData);
              // Update user's best distance in playerData collection
            const userDocRef = db.collection('playerData').doc(currentUser.uid);
            const userDoc = await userDocRef.get();
            const currentBest = userDoc.exists ? userDoc.data().bestScore : null;
            
            // Compare by distance instead of score
            if (!currentBest || distance > (currentBest.distance || 0)) {
                await userDocRef.set({
                    bestScore: scoreData
                }, { merge: true });
            }
            
             ('🏆 Score submitted to leaderboard:', score);
            return true;
        } catch (error) {
            console.error('❌ Failed to submit score:', error);
            return false;
        }
    },    // Submit score to leaderboard (manual submission - no personal best check)
    async submitScoreManual(score, distance, zone) {
        if (!isSignedIn || !currentUser) {
             ('⚠️ Not signed in - cannot submit score');
            return false;
        }
        
        // Validate score data
        if (typeof score !== 'number' || score < 0) {
             ('⚠️ Invalid score data for manual submission:', score);
            return false;
        }
        
        if (typeof distance !== 'number' || distance < 0) {
             ('⚠️ Invalid distance data for manual submission:', distance);
            return false;
        }
        
        if (typeof zone !== 'number' || zone < 1) {
             ('⚠️ Invalid zone data for manual submission:', zone);
            return false;
        }
        
        try {
            const scoreData = {
                score: Math.floor(score), // Ensure integer
                distance: Math.floor(distance), // Ensure integer
                zone: Math.floor(zone), // Ensure integer
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userId: currentUser.uid,
                displayName: currentUser.displayName || currentUser.email || 'Anonymous',
                photoURL: currentUser.photoURL || null,
                manualSubmission: true // Flag to indicate this was manually uploaded
            };
            
             ('📊 Manual score data being submitted:', scoreData);
            
            // Add to leaderboard collection in Firestore
            await db.collection('leaderboard').add(scoreData);
            
             ('🏆 Score manually submitted to leaderboard:', score);
            return true;
        } catch (error) {
            console.error('❌ Failed to manually submit score:', error);
            return false;
        }
    },
      // Get top distances (changed from scores)
    async getTopScores(limit = 10) {
        try {
            const snapshot = await leaderboardDatabase.ref('leaderboard')
                .orderByChild('distance')
                .limitToLast(limit)
                .once('value');
            
            const scores = [];
            snapshot.forEach(child => {
                scores.push({
                    id: child.key,
                    ...child.val()
                });
            });
            
            // Reverse to get highest distances first
            return scores.reverse();
        } catch (error) {
            console.error('❌ Failed to fetch leaderboard:', error);
            return [];
        }
    },
      // Get user's rank (based on distance)
    async getUserRank() {
        if (!isSignedIn || !currentUser) return null;
        
        try {
            const userRef = leaderboardDatabase.ref(`playerData/${currentUser.uid}/bestScore`);
            const userSnapshot = await userRef.once('value');
            const userBest = userSnapshot.val();
            
            if (!userBest) return null;
            
            const userDistance = userBest.distance || 0;
            
            // Get all distances higher than user's distance
            const higherDistancesSnapshot = await leaderboardDatabase.ref('leaderboard')
                .orderByChild('distance')
                .startAt(userDistance + 1)
                .once('value');
            
            let higherCount = 0;
            higherDistancesSnapshot.forEach(() => {
                higherCount++;
            });
            
            return higherCount + 1; // +1 because rank is 1-based
        } catch (error) {
            console.error('❌ Failed to get user rank:', error);
            return null;
        }
    },    // Check if distance is user's personal best distance
    async isPersonalHighScore(score, distance) {
        if (!isSignedIn || !currentUser) return false;        
        try {
            const userDocRef = db.collection('playerData').doc(currentUser.uid);
            const userDoc = await userDocRef.get();
            const userBest = userDoc.exists ? userDoc.data().bestScore : null;
            
            if (!userBest) {
                return true; // First score is always a personal best
            }
            
            // Compare by distance instead of score
            return distance > (userBest.distance || 0);
        } catch (error) {
            console.error('❌ Failed to check personal best distance:', error);
            return false;
        }
    }
};

// Initialize auto-save with connection checking
setInterval(() => {
    if (isSignedIn && window.gameRunning && navigator.onLine) {
        cloudSaveSystem.autoSave().catch(error => {
            // Silently handle auto-save failures to avoid spam
             ('⚠️ Auto-save failed, will retry next interval');
        });
    }
}, 60000); // Auto-save every 60 seconds (reduced frequency)

// Export to global scope
window.firebaseSystem = firebaseSystem;
window.cloudSaveSystem = cloudSaveSystem;
window.leaderboardSystem = leaderboardSystem;

// Initialize Firebase when the script loads
document.addEventListener('DOMContentLoaded', () => {
    firebaseSystem.init();
});
