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
    
   
}

// ===== GAME CONTROLS =====
function togglePause() {
    gamePaused = !gamePaused;
  
}

function resetGame(goToHomeScreen = false) {
   
    
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
    
  
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
           
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
    
    // Apply saved upgrades
    if (window.reinitializeUpgrades) {
        window.reinitializeUpgrades();
    }
    
    // Start the actual game
    showingHomeScreen = false;
    gameRunning = true;
    
   
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
    
    // === CLEAR PHASE ===
    clearCanvas();
    
    // === UPDATE PHASE ===
    const updateStartTime = performance.now();
    
    // Update gamepad input
    if (window.updateGamepadInput) {
        window.updateGamepadInput();
    }    // Update game logic (skip if paused or upgrade menu is open, but still render UI)
    const isUpgradeMenuOpen = window.isUpgradeMenuOpen && window.isUpgradeMenuOpen();
    const isSettingsMenuOpen = window.isSettingsMenuOpen && window.isSettingsMenuOpen();
    if (!gamePaused && !isUpgradeMenuOpen && !isSettingsMenuOpen) {
        updateGame(deltaTime);
    } else {
        // Still update menu animations when paused or menus are open
        if (window.upgradeMenuUI) {
            window.upgradeMenuUI.update(deltaTime);
        }
        if (window.settingsMenuUI) {
            window.settingsMenuUI.update(deltaTime);
        }
    }
    
    // Clean up old input buffer entries
    if (window.cleanupInputBuffer) {
        window.cleanupInputBuffer();
    }
    
    performanceMetrics.updateTime = performance.now() - updateStartTime;
      // === RENDER PHASE ===
    const renderStartTime = performance.now();
      // Render game objects (skip if paused or upgrade menu is open)
    if (!gamePaused && !isUpgradeMenuOpen && !isSettingsMenuOpen) {
        renderGame();
    }
    
    // Always render UI overlays (including upgrade menu)
    renderUI();
    
    // Render debug information (if enabled)
    if (window.DEBUG_MODE) {
        renderDebugInfo();
    }
    
    performanceMetrics.renderTime = performance.now() - renderStartTime;
    
    // === FRAME COMPLETE ===
    performanceMetrics.frameTime = performance.now() - frameStartTime;
    
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
    
    // Update upgrade menu animations
    if (window.upgradeMenuUI) {
        window.upgradeMenuUI.update(deltaTime);
    }
    
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
    // All game stats are now rendered directly in canvas
    // See renderUI() for the canvas-based UI implementation
}

function renderUI() {
    if (!gameRunning || !gameState) return;

    ctx.save();
    
    // Background for stats
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 200, 100, 5);
    ctx.fill();
    
    // Set up text style
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Stats positioning
    let y = 20;
    const lineHeight = 20;
    
    // Distance with fancy formatting
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`DIST: ${Math.floor(gameState.distance).toString().padStart(6, '0')}m`, 20, y);
    y += lineHeight;
    
    // Energy with glowing effect
    const energyGlow = Math.sin(performance.now() * 0.003) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 0, ${energyGlow})`;
    ctx.fillText(`ENGY: ${Math.floor(gameState.energy).toString().padStart(4, '0')}`, 20, y);
    y += lineHeight;
    
    // Harvesters with color coding
    const harvesterColor = gameState.harvesters >= gameState.maxHarvesters ? '#ff4444' : '#44ff44';
    ctx.fillStyle = harvesterColor;
    ctx.fillText(`HVST: ${gameState.harvesters}/${gameState.maxHarvesters}`, 20, y);
    y += lineHeight;
    
    // Zone level with dynamic color
    const zoneColors = [
        '#ffffff', // Zone 1
        '#00ffff', // Zone 2
        '#ff4444', // Zone 3
        '#44ff44', // Zone 4
        '#ffaa00', // Zone 5
        '#aa44ff', // Zone 6
        '#ff44aa', // Zone 7
        '#ffffff'  // Zone 8+
    ];
    const zoneColor = zoneColors[Math.min(gameState.zoneLevel - 1, zoneColors.length - 1)];
    ctx.fillStyle = zoneColor;
    ctx.fillText(`ZONE: ${gameState.zoneLevel}`, 20, y);
    
    // High score display
    const highScore = localStorage.getItem('highScore');
    if (highScore) {
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText(`BEST: ${highScore}m`, 20, y + lineHeight);
    }
    
    ctx.restore();

    // Render zone transition overlay
    if (window.zoneSystem) {
        window.zoneSystem.renderZoneTransition(ctx);
    }
    
    // Render pause menu if needed
    if (gamePaused && !window.isUpgradeMenuOpen()) {
        renderPauseMenu();
    }
    
    // Render control hints
    if (!gamePaused) {
        renderControlHints();
    }
    
    // Render input indicators
    renderInputIndicators();
}

function renderControlHints() {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    
    // Position in bottom-right corner
    let y = window.GAME_HEIGHT - 10;
    const lineHeight = 15;
    
    // Control hints with icons
    ctx.fillText('SPACE/CLICK → Turn', window.GAME_WIDTH - 10, y);
    y -= lineHeight;
    ctx.fillText('H → Drop Harvester', window.GAME_WIDTH - 10, y);
    y -= lineHeight;
    ctx.fillText('P → Pause', window.GAME_WIDTH - 10, y);
    y -= lineHeight;
    ctx.fillText('ESC → Settings', window.GAME_WIDTH - 10, y);
    
    ctx.restore();
}

function renderPauseMenu() {
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
    
    ctx.restore();
}

function renderInputIndicators() {
    if (!window.inputState || !window.inputState.inputBuffer) return;

    const now = performance.now();
    const fadeTime = 300; // How long indicators stay visible
    
    ctx.save();
    
    // Show recent inputs as visual indicators
    window.inputState.inputBuffer.forEach((input, index) => {
        const age = now - input.timestamp;
        if (age < fadeTime) {
            const alpha = 1 - (age / fadeTime);
            let color = '#00ffff';
            let text = '';
            let x = 20;
            let y = window.GAME_HEIGHT - 30;
            
            // Configure appearance based on input type
            if (input.type === 'keydown') {
                switch (input.code) {
                    case 'Space':
                        color = '#00ffff';
                        text = '↺ TURN';
                        break;
                    case 'KeyH':
                        color = '#00ff00';
                        text = '⬡ HARVEST';
                        break;
                    case 'KeyP':
                        color = '#ffff00';
                        text = '❚❚ PAUSE';
                        break;
                    case 'KeyU':
                        color = '#ff00ff';
                        text = '⬆ UPGRADE';
                        break;
                    case 'Escape':
                        color = '#888888';
                        text = '⚙ SETTINGS';
                        break;
                }
            } else if (input.type === 'click') {
                color = '#00ffff';
                text = '↺ TURN';
            }
            
            if (text) {
                // Draw indicator with fade effect
                ctx.globalAlpha = alpha;
                ctx.fillStyle = color;
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                
                // Position indicators in a row
                const indicatorSpacing = 100;
                x += index * indicatorSpacing;
                
                // Draw background pill
                const padding = 8;
                const textWidth = ctx.measureText(text).width;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.beginPath();
                ctx.roundRect(x - padding, y - 10, textWidth + padding * 2, 20, 10);
                ctx.fill();
                
                // Draw text
                ctx.fillStyle = color;
                ctx.fillText(text, x, y);
            }
        }
    });
    
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
        
    }, 100);
});

// Handle orientation changes on mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (gameInitialized) {
            setupCanvas();
            viewportManager.updateScale();
           
        }
    }, 300);
});

// ===== GAME INITIALIZATION =====
async function initializeGame() {
   
      // Enable debug mode if running locally
    window.DEBUG_MODE = false; // Disabled for clean UI
    
    // Setup canvas with enhanced scaling
    setupCanvas();    // Initialize opening animation (check settings first)
    if (window.OpeningAnimation && !window.shouldSkipOpeningAnimation()) {
        openingAnimation = new window.OpeningAnimation(canvas, ctx);
        // Hide game UI elements during opening animation
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('opening-animation');
        }
    } else {
        // Skip opening animation - go directly to home screen
        showingOpeningAnimation = false;
        showingHomeScreen = true;
        
        // Show game UI elements immediately
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.remove('opening-animation');
        }
        
        // Initialize home screen immediately
        if (window.HomeScreen) {
            homeScreen = new window.HomeScreen(canvas, ctx);
        } else {
            console.error('❌ HomeScreen class not available, starting game directly');
            showingHomeScreen = false;
            startGame();
        }
        
        console.log('⏭️ Opening animation skipped via settings');
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
            }        } else {
            // Handle upgrade menu clicks during gameplay
            if (window.upgradeMenuUI && window.isUpgradeMenuOpen && window.isUpgradeMenuOpen()) {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (window.GAME_WIDTH / rect.width);
                const y = (e.clientY - rect.top) * (window.GAME_HEIGHT / rect.height);
                
                window.upgradeMenuUI.handleMouseClick(x, y, 0); // Left click
            }
            // Handle settings menu clicks during gameplay
            else if (window.settingsMenuUI && window.isSettingsMenuOpen && window.isSettingsMenuOpen()) {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (window.GAME_WIDTH / rect.width);
                const y = (e.clientY - rect.top) * (window.GAME_HEIGHT / rect.height);
                
                window.settingsMenuUI.handleMouseClick(x, y, 0); // Left click
            }
        }
    });canvas.addEventListener('mousemove', (e) => {
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
            }        } else {
            // Handle upgrade menu hover during gameplay
            if (window.upgradeMenuUI && window.isUpgradeMenuOpen && window.isUpgradeMenuOpen()) {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (window.GAME_WIDTH / rect.width);
                const y = (e.clientY - rect.top) * (window.GAME_HEIGHT / rect.height);
                
                window.upgradeMenuUI.updateMousePosition(x, y);
                
                // Update cursor style based on hover
                if (window.upgradeMenuUI.hoveredUpgrade >= 0) {
                    canvas.style.cursor = 'pointer';
                } else {
                    canvas.style.cursor = 'default';
                }
            }
            // Handle settings menu hover during gameplay
            else if (window.settingsMenuUI && window.isSettingsMenuOpen && window.isSettingsMenuOpen()) {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (window.GAME_WIDTH / rect.width);
                const y = (e.clientY - rect.top) * (window.GAME_HEIGHT / rect.height);
                
                window.settingsMenuUI.updateMousePosition(x, y);
                
                // Update cursor style based on hover
                if (window.settingsMenuUI.hoveredCategory >= 0 || window.settingsMenuUI.hoveredSetting >= 0) {
                    canvas.style.cursor = 'pointer';
                } else {
                    canvas.style.cursor = 'default';
                }
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
    lastFpsTime = performance.now();    // Create drone at center of screen
    if (window.Drone) {
        drone = new window.Drone(window.GAME_WIDTH / 2, window.GAME_HEIGHT / 2);
        window.drone = drone; // Update global reference
    } else {
       
    }
    
    // Initialize and apply upgrades
    if (window.upgradeSystem) {
        window.upgradeSystem.loadUpgrades();
        window.upgradeSystem.applyAllUpgrades();
      
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
