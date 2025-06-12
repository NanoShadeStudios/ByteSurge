// ByteSurge: Infinite Loop - Game Core
// Main game engine, loop, and coordination

// ===== CORE GAME VARIABLES =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingText = document.getElementById('loadingText') || null;
const gameStats = document.getElementById('gameStats') || null;

// ===== OPENING ANIMATION =====
let openingAnimation = null;
let homeScreen = null;
let showingOpeningAnimation = true;
let showingHomeScreen = false;

// ===== GAME STATE MANAGEMENT =====
let gameInitialized = false;
let gameRunning = false;
let gamePaused = false;
let lastTime = 0;
let frameCount = 0;
let fps = 60;
let fpsCounter = 0;
let lastFpsTime = 0;

// ===== PERFORMANCE MONITORING =====
let performanceMetrics = {
    frameTime: 0,
    updateTime: 0,
    renderTime: 0,
    avgFrameTime: 0,
    frameHistory: []
};

// ===== GAME STATISTICS =====
let gameState = {
    distance: 0,
    energy: 0,
    harvesters: 0,
    maxHarvesters: 3,
    zoneLevel: 1,
    score: 0,
    // Phase 2: Zone progression
    currentZone: 1,
    lastZoneDistance: 0,
    zoneDistance: 1000, // Distance required for next zone
    totalZonesBonuses: 0
};

// ===== ZONE SYSTEM =====
let zoneSystem = {
    zoneColors: [
        { bg: '#1a1a1a', accent: '#333' },      // Zone 1: Dark Gray
        { bg: '#1a1a2a', accent: '#4444aa' },   // Zone 2: Deep Blue
        { bg: '#2a1a1a', accent: '#aa4444' },   // Zone 3: Deep Red
        { bg: '#1a2a1a', accent: '#44aa44' },   // Zone 4: Deep Green
        { bg: '#2a2a1a', accent: '#aaaa44' },   // Zone 5: Deep Yellow
        { bg: '#2a1a2a', accent: '#aa44aa' },   // Zone 6: Deep Purple
        { bg: '#1a2a2a', accent: '#44aaaa' },   // Zone 7: Deep Cyan
        { bg: '#2a2a2a', accent: '#888888' }    // Zone 8+: Dark Gray
    ],
    
    energyMultipliers: [1, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0], // Energy value multipliers per zone
    
    getCurrentZoneData() {
        const zoneIndex = Math.min(gameState.currentZone - 1, this.zoneColors.length - 1);
        return {
            colors: this.zoneColors[zoneIndex],
            energyMultiplier: this.energyMultipliers[Math.min(gameState.currentZone - 1, this.energyMultipliers.length - 1)]
        };
    },
    
    checkZoneProgression() {
        const newZone = Math.floor(gameState.distance / gameState.zoneDistance) + 1;
        
        if (newZone > gameState.currentZone) {
            // Zone progression!
            const oldZone = gameState.currentZone;
            gameState.currentZone = newZone;
            gameState.zoneLevel = newZone;
            
            // Zone bonus energy
            const zoneBonus = newZone * 10;
            gameState.energy += zoneBonus;
            gameState.score += zoneBonus * 5;
            gameState.totalZonesBonuses += zoneBonus;
            
            // Visual feedback
            this.triggerZoneTransition(oldZone, newZone, zoneBonus);
            
            console.log(`🌍 Zone Progression! Entering Zone ${newZone} - Bonus: ${zoneBonus} energy`);
            
            return true;
        }
        
        return false;
    },
      triggerZoneTransition(oldZone, newZone, bonus) {
        // Screen flash for zone transition
        if (window.createScreenFlash) {
            window.createScreenFlash('#ffffff', 0.4, 500);
        }
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 300]);
        }
        
        // Show zone transition message on canvas
        this.showZoneTransition(oldZone, newZone, bonus);
        
        console.log(`Zone ${oldZone} → Zone ${newZone} | +${bonus} Energy Bonus!`);
    },
    
    showZoneTransition(oldZone, newZone, bonus) {
        // Store transition data for rendering
        this.transitionData = {
            startTime: performance.now(),
            duration: 3000, // 3 seconds
            oldZone,
            newZone,
            bonus,
            alpha: 1
        };
    },
    
    renderZoneTransition(ctx) {
        if (!this.transitionData) return;
        
        const elapsed = performance.now() - this.transitionData.startTime;
        const progress = elapsed / this.transitionData.duration;
        
        if (progress >= 1) {
            this.transitionData = null;
            return;
        }
        
        // Fade out over time
        const alpha = 1 - (progress * progress); // Ease out
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
        
        // Zone transition text
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const centerX = window.GAME_WIDTH / 2;
        const centerY = window.GAME_HEIGHT / 2;
        
        ctx.fillText(`ENTERING ZONE ${this.transitionData.newZone}`, centerX, centerY - 40);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`+${this.transitionData.bonus} ENERGY BONUS!`, centerX, centerY + 20);
        
        // Zone type indicator
        const zoneTypes = ['BASIC', 'ENHANCED', 'ADVANCED', 'SUPERIOR', 'ELITE', 'MASTER', 'LEGENDARY', 'COSMIC'];
        const zoneType = zoneTypes[Math.min(this.transitionData.newZone - 1, zoneTypes.length - 1)];
        
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`${zoneType} ENERGY ZONE`, centerX, centerY + 50);
        
        ctx.restore();
    }
};

// ===== VIEWPORT MANAGEMENT =====
let viewportManager = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    
    updateScale() {
        const containerRect = canvas.getBoundingClientRect();
        const scaleX = containerRect.width / window.GAME_WIDTH;
        const scaleY = containerRect.height / window.GAME_HEIGHT;
        this.scale = Math.min(scaleX, scaleY);
        
        this.offsetX = (containerRect.width - window.GAME_WIDTH * this.scale) / 2;
        this.offsetY = (containerRect.height - window.GAME_HEIGHT * this.scale) / 2;
    },
    
    screenToGame(screenX, screenY) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (screenX - rect.left - this.offsetX) / this.scale,
            y: (screenY - rect.top - this.offsetY) / this.scale
        };
    },
    
    gameToScreen(gameX, gameY) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: rect.left + this.offsetX + gameX * this.scale,
            y: rect.top + this.offsetY + gameY * this.scale
        };
    }
};

// ===== GAME ENTITIES =====
let drone = null;

// ===== CANVAS SETUP =====
function setupCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
      // Base dimensions (expanded for better gameplay experience)
    const baseWidth = 1200;
    const baseHeight = 800;
    
    // Set actual canvas size with device pixel ratio for crisp rendering
    canvas.width = baseWidth * dpr;
    canvas.height = baseHeight * dpr;
    
    // Set display size (CSS pixels)
    canvas.style.width = baseWidth + 'px';
    canvas.style.height = baseHeight + 'px';
    
    // Scale the drawing context to match the device pixel ratio
    ctx.scale(dpr, dpr);
    
    // Configure rendering settings for pixel-perfect 2D graphics
    ctx.imageSmoothingEnabled = false; // Sharp pixel art
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    
    // Store canvas dimensions for game logic
    window.GAME_WIDTH = baseWidth;
    window.GAME_HEIGHT = baseHeight;
    window.CANVAS_DPR = dpr;
    
    console.log(`✅ Canvas setup complete: ${baseWidth}x${baseHeight}px`);
}

// ===== GAME CONTROLS =====
function togglePause() {
    gamePaused = !gamePaused;
    console.log(gamePaused ? '⏸️ Game Paused' : '▶️ Game Resumed');
}

function resetGame(goToHomeScreen = false) {
    console.log('🔄 Game Reset');
    
    // Reset game state
    gameState.distance = 0;
    gameState.energy = 0;
    gameState.harvesters = 0;
    gameState.zoneLevel = 1;
    gameState.score = 0;
    
    // Reset zone progression
    gameState.currentZone = 1;
    gameState.lastZoneDistance = 0;
    gameState.totalZonesBonuses = 0;
    
    // Reset drone
    if (drone) {
        drone.reset();
    }
      // Reset energy nodes
    if (window.resetEnergyNodes) {
        window.resetEnergyNodes();
    }
      // Reset corruption zones
    if (window.resetCorruptionZones) {
        window.resetCorruptionZones();
    }
    
    // Reset harvesters
    if (window.resetHarvesters) {
        window.resetHarvesters();
    }
    
    // Check if we should return to home screen
    if (goToHomeScreen) {
        returnToHomeScreen();
        return;
    }
    
    // Reset harvesters
    if (window.resetHarvesters) {
        window.resetHarvesters();
    }
    
    if (goToHomeScreen) {
        returnToHomeScreen();
    } else {
        // Visual feedback
        if (window.createScreenFlash) {
            window.createScreenFlash('#ffffff', 0.3, 200);
        }
    }
}

function returnToHomeScreen() {
    // Stop the game
    gameRunning = false;
    gamePaused = false;
    
    // Hide game stats
    if (gameStats) {
        gameStats.style.display = 'none';
    }
    
    // Reset game state
    resetGame();
    
    // Show home screen
    showingHomeScreen = true;
    
    // Re-initialize home screen if needed
    if (!homeScreen && window.HomeScreen) {
        homeScreen = new window.HomeScreen(canvas, ctx);
    }
    
    console.log('🏠 Returned to home screen');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

function startGame() {
    // Show game UI elements
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.classList.remove('opening-animation');
    }
    
    // Show game stats
    if (gameStats) {
        gameStats.style.display = 'block';
    }
    
    // Reset game state
    resetGame();
    
    // Start the actual game
    showingHomeScreen = false;
    gameRunning = true;
    
    console.log('🎮 Game started!');
}

// ===== GAME LOOP =====
function gameLoop(currentTime) {
    if (!gameInitialized) return;
    
    const frameStartTime = performance.now();
    
    // Handle opening animation
    if (showingOpeningAnimation && openingAnimation) {
        const animationComplete = openingAnimation.update(currentTime);
        openingAnimation.render();        if (animationComplete) {
            showingOpeningAnimation = false;
            showingHomeScreen = true;
            
            // Initialize home screen
            if (window.HomeScreen) {
                homeScreen = new window.HomeScreen(canvas, ctx);
            } else {
                console.error('❌ HomeScreen class not found!');
                // Fallback: start game directly
                showingHomeScreen = false;
                startGame();
            }        }
        
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Handle home screen
    if (showingHomeScreen && homeScreen) {
        homeScreen.update(currentTime - lastTime);
        homeScreen.render();
        
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Calculate delta time with safety clamping
    const rawDeltaTime = currentTime - lastTime;
    const deltaTime = Math.min(rawDeltaTime, 33.33); // Cap at ~30fps minimum
    lastTime = currentTime;
    
    // Update performance metrics
    updatePerformanceMetrics(frameStartTime, deltaTime);
    
    // Skip frame if game is paused
    if (gamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // === CLEAR PHASE ===
    clearCanvas();
    
    // === UPDATE PHASE ===
    const updateStartTime = performance.now();
    
    // Update gamepad input
    if (window.updateGamepadInput) {
        window.updateGamepadInput();
    }
    
    // Update game logic
    updateGame(deltaTime);
    
    // Clean up old input buffer entries
    if (window.cleanupInputBuffer) {
        window.cleanupInputBuffer();
    }
    
    performanceMetrics.updateTime = performance.now() - updateStartTime;
    
    // === RENDER PHASE ===
    const renderStartTime = performance.now();
    
    // Render game objects
    renderGame();
    
    // Render UI overlays
    renderUI();
    
    // Render debug information (if enabled)
    if (window.DEBUG_MODE) {
        renderDebugInfo();
    }
    
    performanceMetrics.renderTime = performance.now() - renderStartTime;
    
    // === FRAME COMPLETE ===
    performanceMetrics.frameTime = performance.now() - frameStartTime;
    
    // Update UI with current stats
    updateUI();
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// ===== PERFORMANCE MONITORING =====
function updatePerformanceMetrics(frameStartTime, deltaTime) {
    frameCount++;
    fpsCounter++;
    
    // Calculate FPS every second
    if (frameStartTime - lastFpsTime >= 1000) {
        fps = Math.round(fpsCounter * 1000 / (frameStartTime - lastFpsTime));
        fpsCounter = 0;
        lastFpsTime = frameStartTime;
    }
    
    // Track frame time history for smoothing
    performanceMetrics.frameHistory.push(performanceMetrics.frameTime);
    if (performanceMetrics.frameHistory.length > 60) {
        performanceMetrics.frameHistory.shift();
    }
    
    // Calculate average frame time
    performanceMetrics.avgFrameTime = performanceMetrics.frameHistory.reduce((a, b) => a + b, 0) / performanceMetrics.frameHistory.length;
}

// ===== RENDERING SYSTEM =====
function clearCanvas() {
    // Get current zone data for dynamic background
    const zoneData = zoneSystem.getCurrentZoneData();
    
    // Zone-based background color
    ctx.fillStyle = zoneData.colors.bg;
    ctx.fillRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
    
    // Subtle animated background pattern with zone accent color
    const time = performance.now() * 0.001;
    ctx.save();
    ctx.globalAlpha = 0.03;
    
    // Moving grid pattern with zone accent
    ctx.strokeStyle = zoneData.colors.accent;
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    const offsetX = (time * 20) % gridSize;
    const offsetY = (time * 10) % gridSize;
    
    for (let x = -offsetX; x < window.GAME_WIDTH + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, window.GAME_HEIGHT);
        ctx.stroke();
    }
    
    for (let y = -offsetY; y < window.GAME_HEIGHT + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(window.GAME_WIDTH, y);
        ctx.stroke();
    }
    
    ctx.restore();
}

function updateGame(deltaTime) {
    if (!gameRunning) return;
    
    // Update drone
    if (drone) {
        drone.update(deltaTime);
          // Update distance based on drone movement
        gameState.distance += (drone.speed || 120) * (deltaTime / 1000);
        
        // Check for zone progression
        zoneSystem.checkZoneProgression();
    }
      // Update energy nodes
    if (window.updateEnergyNodes) {
        window.updateEnergyNodes(deltaTime);
    }
      // Update corruption zones
    if (window.updateCorruptionZones) {
        window.updateCorruptionZones(deltaTime);
    }
    
    // Update harvesters
    if (window.updateHarvesters) {
        window.updateHarvesters(deltaTime);
    }
      // Check collisions and collect energy
    if (window.checkEnergyCollisions && drone) {
        const energyCollected = window.checkEnergyCollisions(drone);
        if (energyCollected > 0) {
            // Apply zone multiplier to collected energy
            const zoneData = zoneSystem.getCurrentZoneData();
            const multipliedEnergy = Math.floor(energyCollected * zoneData.energyMultiplier);
            
            gameState.energy += multipliedEnergy;
            gameState.score += multipliedEnergy * 10; // 10 points per energy
            
            // Log zone-enhanced collection
            if (zoneData.energyMultiplier > 1) {
                console.log(`⚡ Zone ${gameState.currentZone} Energy Boost! ${energyCollected} → ${multipliedEnergy} (+${Math.floor((zoneData.energyMultiplier - 1) * 100)}%)`);
            }
        }
    }
    
    // Check corruption collisions (this will reset the game)
    if (window.checkCorruptionCollisions && drone) {
        const hitCorruption = window.checkCorruptionCollisions(drone);
        if (hitCorruption) {
            // Reset the game run
            resetGame();
            return; // Exit update loop since game is reset
        }
    }
    
    // TODO: Update corruption zones
    // TODO: Update harvesters
}

function renderGame() {
    if (!gameRunning) return;
    
    // Render drone
    if (drone) {
        drone.render(ctx);
    }
      // Render energy nodes
    if (window.renderEnergyNodes) {
        window.renderEnergyNodes(ctx);
    }
      // Render corruption zones
    if (window.renderCorruptionZones) {
        window.renderCorruptionZones(ctx);
    }
    
    // Render harvesters
    if (window.renderHarvesters) {
        window.renderHarvesters(ctx);
    }
    
    // TODO: Render corruption zones
    // TODO: Render harvesters
    // TODO: Render particle effects
}

function updateUI() {
    // Only update UI elements if they exist
    const distanceEl = document.getElementById('distanceValue');
    if (distanceEl) {
        const currentDistance = Math.floor(gameState.distance);
        if (parseInt(distanceEl.textContent) !== currentDistance) {
            distanceEl.textContent = currentDistance + 'm';
            distanceEl.style.transform = 'scale(1.1)';
            setTimeout(() => distanceEl.style.transform = 'scale(1)', 100);
        }
    }    // Animate energy counter with enhanced flash effects
    const energyEl = document.getElementById('energyValue');
    if (energyEl) {
        if (parseInt(energyEl.textContent) !== gameState.energy) {
            const energyDiff = gameState.energy - parseInt(energyEl.textContent);
            energyEl.textContent = gameState.energy;
            
            // Enhanced flash for energy collection
            if (energyDiff > 0) {
                energyEl.classList.add('flash');
                energyEl.style.color = '#00ff00';
                energyEl.style.transform = 'scale(1.3)';
                energyEl.style.textShadow = '0 0 12px rgba(0, 255, 0, 1)';
                
                setTimeout(() => {
                    energyEl.classList.remove('flash');
                    energyEl.style.color = '#00ffff';
                    energyEl.style.transform = 'scale(1)';
                    energyEl.style.textShadow = '0 0 4px rgba(0, 255, 255, 0.6)';
                }, 300);
            } else {
                // Normal update without flash
                energyEl.style.color = '#00ffff';
                energyEl.style.transform = 'scale(1)';
            }
        }
    }
      // Update score with enhanced animation
    const scoreEl = document.getElementById('scoreValue');
    if (scoreEl) {
        if (parseInt(scoreEl.textContent) !== gameState.score) {
            scoreEl.textContent = gameState.score;
            scoreEl.style.color = '#ffff00';
            scoreEl.style.transform = 'scale(1.2)';
            scoreEl.style.textShadow = '0 0 8px rgba(255, 255, 0, 0.8)';
            setTimeout(() => {
                scoreEl.style.color = '#00ffff';
                scoreEl.style.transform = 'scale(1)';
                scoreEl.style.textShadow = '0 0 4px rgba(0, 255, 255, 0.6)';
            }, 200);
        }
    }
    
    // Update harvesters
    const harvestersEl = document.getElementById('harvestersValue');
    if (harvestersEl) {
        harvestersEl.textContent = `${gameState.harvesters}/${gameState.maxHarvesters}`;
    }
    
    // Update zone level with color coding
    const zoneLevelEl = document.getElementById('zoneLevelValue');
    if (zoneLevelEl) {
        zoneLevelEl.textContent = gameState.zoneLevel;
        
        // Color code zone levels
        if (gameState.zoneLevel <= 3) {
            zoneLevelEl.style.color = '#00ffff';
        } else if (gameState.zoneLevel <= 7) {
            zoneLevelEl.style.color = '#ffff00';
        } else {
            zoneLevelEl.style.color = '#ff4444';
        }
    }
}

function renderUI() {
    // Render pause indicator
    if (gamePaused) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
          ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', window.GAME_WIDTH / 2, window.GAME_HEIGHT / 2);
        
        ctx.font = '12px monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('Press P to Resume', window.GAME_WIDTH / 2, window.GAME_HEIGHT / 2 + 40);
        
        ctx.restore();    }
    
    // Render zone transition overlay
    zoneSystem.renderZoneTransition(ctx);
    
    // Render input indicators
    renderInputIndicators();
}

function renderInputIndicators() {
    const now = performance.now();
    const fadeTime = 300;
    
    // Show recent inputs as visual indicators
    ctx.save();
    
    if (window.inputState && window.inputState.inputBuffer) {
        window.inputState.inputBuffer.forEach((input, index) => {
            const age = now - input.timestamp;
            if (age < fadeTime) {
                const alpha = 1 - (age / fadeTime);
                ctx.globalAlpha = alpha;
                
                let color = '#00ffff';
                let text = '';
                
                if (input.type === 'keydown') {
                    switch (input.code) {
                        case 'Space':
                            color = '#00ffff';
                            text = 'TURN';
                            break;
                        case 'KeyH':
                            color = '#00ff00';
                            text = 'HARVEST';
                            break;
                    }
                }
                  if (text) {
                    ctx.fillStyle = color;
                    ctx.font = 'bold 12px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(text, window.GAME_WIDTH - 100, 50 + index * 20);
                }
            }
        });
    }
    
    ctx.restore();
}

function renderDebugInfo() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, window.GAME_HEIGHT - 120, 300, 110);
      ctx.fillStyle = '#00ff00';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    
    let y = window.GAME_HEIGHT - 115;
    const lineHeight = 12;
      ctx.fillText(`FPS: ${fps}`, 15, y); y += lineHeight;
    ctx.fillText(`Frame: ${performanceMetrics.frameTime.toFixed(2)}ms`, 15, y); y += lineHeight;
    ctx.fillText(`Update: ${performanceMetrics.updateTime.toFixed(2)}ms`, 15, y); y += lineHeight;
    ctx.fillText(`Render: ${performanceMetrics.renderTime.toFixed(2)}ms`, 15, y); y += lineHeight;
    ctx.fillText(`Avg Frame: ${performanceMetrics.avgFrameTime.toFixed(2)}ms`, 15, y); y += lineHeight;
    ctx.fillText(`Input Buffer: ${window.inputState ? window.inputState.inputBuffer.length : 0}`, 15, y); y += lineHeight;    ctx.fillText(`Keys Active: ${window.inputState ? window.inputState.keys.size : 0}`, 15, y); y += lineHeight;    ctx.fillText(`Energy Nodes: ${window.energyNodes ? window.energyNodes.length : 0}`, 15, y); y += lineHeight;
    ctx.fillText(`Corruption Zones: ${window.corruptionZones ? window.corruptionZones.length : 0}`, 15, y); y += lineHeight;
    ctx.fillText(`Harvesters: ${window.harvesters ? window.harvesters.length : 0}/3`, 15, y); y += lineHeight;
    ctx.fillText(`Energy: ${gameState.energy} Score: ${gameState.score}`, 15, y);
    
    ctx.restore();
}

// ===== WINDOW MANAGEMENT =====
let resizeTimeout;
window.addEventListener('resize', () => {
    if (!gameInitialized) return;
    
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        setupCanvas();
        viewportManager.updateScale();
        console.log(`🔄 Viewport Resized - Scale: ${viewportManager.scale.toFixed(2)}x`);
    }, 100);
});

// Handle orientation changes on mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (gameInitialized) {
            setupCanvas();
            viewportManager.updateScale();
            console.log('📱 Orientation Changed - Canvas Rescaled');
        }
    }, 300);
});

// ===== GAME INITIALIZATION =====
async function initializeGame() {
    console.log('🚀 ByteSurge: Infinite Loop - Advanced Initialization...');
    
    // Enable debug mode if running locally
    window.DEBUG_MODE = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    
    // Setup canvas with enhanced scaling
    setupCanvas();
      // Initialize opening animation
    if (window.OpeningAnimation) {
        openingAnimation = new window.OpeningAnimation(canvas, ctx);
        // Hide game UI elements during opening animation
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('opening-animation');
        }
    }
    
    // Initialize viewport management
    viewportManager.updateScale();
    
    // Setup advanced input handlers
    if (window.setupInputHandlers) {
        window.setupInputHandlers();
    }
    
    // Add skip animation input
    const skipAnimation = () => {
        if (showingOpeningAnimation && openingAnimation) {
            openingAnimation.skipAnimation();
        }
    };    canvas.addEventListener('click', (e) => {
        if (showingOpeningAnimation && openingAnimation) {
            skipAnimation();
        } else if (showingHomeScreen && homeScreen) {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (window.GAME_WIDTH / rect.width);
            const y = (e.clientY - rect.top) * (window.GAME_HEIGHT / rect.height);
            
            const result = homeScreen.handleClick(x, y);
            if (result === 'start_game') {
                startGame();
            }
        }
    });
      canvas.addEventListener('mousemove', (e) => {
        if (showingHomeScreen && homeScreen) {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (window.GAME_WIDTH / rect.width);
            const y = (e.clientY - rect.top) * (window.GAME_HEIGHT / rect.height);
            
            homeScreen.updateMousePosition(x, y);
            
            // Update cursor style based on hover
            if (homeScreen.hoveredMenuItem >= 0) {
                canvas.style.cursor = 'pointer';
            } else {
                canvas.style.cursor = 'default';
            }
        }
    });
    
    window.addEventListener('keydown', (e) => {
        if (showingOpeningAnimation) {
            if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
                e.preventDefault();
                skipAnimation();
            }
        } else if (showingHomeScreen && homeScreen) {
            e.preventDefault();
            const result = homeScreen.handleKeyDown(e);
            if (result === 'start_game') {
                startGame();
            }
        }
    });
    
    // Initialize performance monitoring
    lastTime = performance.now();
    lastFpsTime = performance.now();
      // Create drone at center of screen
    if (window.Drone) {
        drone = new window.Drone(window.GAME_WIDTH / 2, window.GAME_HEIGHT / 2);
        window.drone = drone; // Update global reference
    } else {
        console.error('❌ Drone class not found!');
    }
    
    // Hide loading text and keep stats hidden until animation completes
    if (loadingText) {
        loadingText.style.display = 'none';
    }
    if (gameStats) {
        gameStats.style.display = 'none';
    }
    
    gameInitialized = true;
    gameRunning = false; // Will be set to true after opening animation
    gamePaused = false;
    
    // Start the game loop (will show opening animation first)
    requestAnimationFrame(gameLoop);
}

// ===== STARTUP =====
window.addEventListener('load', initializeGame);

// Export globals for module access
window.gameState = gameState;
window.getGameRunning = () => gameRunning;
window.getGamePaused = () => gamePaused;
window.drone = null; // Will be set during initialization
window.viewportManager = viewportManager;
window.togglePause = togglePause;
window.resetGame = resetGame;
window.returnToHomeScreen = returnToHomeScreen;
window.startGame = startGame;
window.toggleFullscreen = toggleFullscreen;

// ===== CONSOLE BRANDING =====
