// ByteSurge: Infinite Loop - Input System
// Advanced multi-platform input handling

// ===== INPUT STATE MANAGER =====
let inputState = {
    keys: new Set(),
    mousePos: { x: 0, y: 0 },
    mouseButtons: new Set(),
    touches: new Map(),
    lastInputTime: 0,
    inputBuffer: [],
    maxBufferSize: 10
};

// ===== INPUT SYSTEM =====
function setupInputHandlers() {
    console.log('🎮 Setting up advanced input system...');
    
    // === KEYBOARD INPUT SYSTEM ===
    document.addEventListener('keydown', (e) => {
        // Add to input state tracking
        inputState.keys.add(e.code);
        inputState.lastInputTime = performance.now();
        
        // Add to input buffer for frame-perfect detection
        inputState.inputBuffer.push({
            type: 'keydown',
            code: e.code,
            timestamp: performance.now()
        });
        
        // Maintain buffer size
        if (inputState.inputBuffer.length > inputState.maxBufferSize) {
            inputState.inputBuffer.shift();
        }        // Handle upgrade menu input first (works even when game isn't running)
        if (e.code === 'KeyU') {
            console.log('🔑 U key pressed - checking upgrade system...');
            console.log('upgradeSystem exists:', !!window.upgradeSystem);
            console.log('upgradeMenuUI exists:', !!window.upgradeMenuUI);
            if (window.upgradeSystem) {
                console.log('upgradeSystem.isMenuOpen:', window.upgradeSystem.isMenuOpen);
            }
            
            if (window.upgradeSystem && !window.upgradeSystem.isMenuOpen) {
                console.log('Opening upgrade menu...');
                window.upgradeMenuUI.openMenu();
                if (window.togglePause && window.getGameRunning && window.getGameRunning()) {
                    window.togglePause();
                }
                e.preventDefault();
                return;
            } else if (window.upgradeSystem && window.upgradeSystem.isMenuOpen) {
                console.log('Closing upgrade menu...');
                window.upgradeMenuUI.closeMenu();
                e.preventDefault();
                return;
            }
        }
        
        if (window.upgradeSystem && window.upgradeSystem.isMenuOpen) {
            switch (e.code) {
                case 'ArrowUp':
                    window.upgradeSystem.selectedUpgrade = Math.max(0, window.upgradeSystem.selectedUpgrade - 1);
                    e.preventDefault();
                    return;
                    
                case 'ArrowDown':
                    window.upgradeSystem.selectedUpgrade = Math.min(window.upgradeSystem.maxUpgrades - 1, window.upgradeSystem.selectedUpgrade + 1);
                    e.preventDefault();
                    return;
                    
                case 'Enter':
                case 'Space':
                    const selectedIndex = window.upgradeSystem.selectedUpgrade;
                    if (window.upgradeSystem.canAffordUpgrade(selectedIndex)) {
                        window.upgradeSystem.purchaseUpgrade(selectedIndex);
                    }
                    e.preventDefault();
                    return;
                    
                case 'Escape':
                    window.upgradeMenuUI.closeMenu();
                    e.preventDefault();
                    return;
            }
        }
        
        // Handle settings menu input
        if (window.settingsMenuUI) {
            if (window.settingsMenuUI.handleInput(e.code)) {
                e.preventDefault();
                return;
            }        }
          
        // Handle settings menu toggle (works even when game isn't running)
        if (e.code === 'Escape') {
            e.preventDefault();
            console.log('🔑 ESC key pressed - toggling settings menu');
            if (window.isSettingsMenuOpen && window.isSettingsMenuOpen()) {
                console.log('Closing settings menu');
                window.closeSettingsMenu();
            } else if (window.openSettingsMenu) {
                console.log('Opening settings menu');
                window.openSettingsMenu();
            } else {
                console.error('❌ openSettingsMenu function not found!');
            }
            return;
        }

        // Handle game-specific inputs
        if (!window.getGameRunning || !window.getGameRunning()) return;
          switch(e.code) {
            case 'Space':
                e.preventDefault();
                handleTurn();
                break;
            case 'KeyH':
                e.preventDefault();
                handleHarvesterDrop();
                break;
            case 'KeyP':
                e.preventDefault();
                togglePause();
                break;
            case 'KeyR':
                if (e.ctrlKey) {
                    e.preventDefault();
                    resetGame();
                }                break;
            case 'F11':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'KeyD':
                if (e.ctrlKey && e.shiftKey) {
                    e.preventDefault();
                    window.DEBUG_MODE = !window.DEBUG_MODE;
                }
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        inputState.keys.delete(e.code);
        
        inputState.inputBuffer.push({
            type: 'keyup',
            code: e.code,
            timestamp: performance.now()
        });
        
        if (inputState.inputBuffer.length > inputState.maxBufferSize) {
            inputState.inputBuffer.shift();
        }
    });
    
    // === MOUSE INPUT SYSTEM ===
    const canvas = document.getElementById('gameCanvas');
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const gameCoords = window.viewportManager.screenToGame(e.clientX, e.clientY);
        inputState.mousePos = gameCoords;
          // Forward mouse movement to upgrade menu if open
        if (window.upgradeMenuUI && window.isUpgradeMenuOpen && window.isUpgradeMenuOpen()) {
            window.upgradeMenuUI.updateMousePosition(gameCoords.x, gameCoords.y);
        }
        
        // Forward mouse movement to settings menu if open
        if (window.settingsMenuUI && window.isSettingsMenuOpen && window.isSettingsMenuOpen()) {
            window.settingsMenuUI.updateMousePosition(gameCoords.x, gameCoords.y);
        }
    });    canvas.addEventListener('mousedown', (e) => {
        inputState.mouseButtons.add(e.button);
        inputState.lastInputTime = performance.now();
          // Handle upgrade menu clicks first
        if (window.upgradeMenuUI && window.isUpgradeMenuOpen && window.isUpgradeMenuOpen()) {
            const rect = canvas.getBoundingClientRect();
            const gameCoords = window.viewportManager.screenToGame(e.clientX, e.clientY);
            if (window.upgradeMenuUI.handleMouseClick(gameCoords.x, gameCoords.y, e.button)) {
                e.preventDefault();
                return;
            }
        }
        
        // Handle settings menu clicks
        if (window.settingsMenuUI && window.isSettingsMenuOpen && window.isSettingsMenuOpen()) {
            const rect = canvas.getBoundingClientRect();
            const gameCoords = window.viewportManager.screenToGame(e.clientX, e.clientY);
            if (window.settingsMenuUI.handleMouseClick(gameCoords.x, gameCoords.y, e.button)) {
                e.preventDefault();
                return;
            }
        }
        
        if (!window.getGameRunning || !window.getGameRunning()) return;
        e.preventDefault();
        
        switch(e.button) {
            case 0: // Left click
                handleTurn();
                break;
            case 2: // Right click
                handleHarvesterDrop();
                break;
        }
    });
    
    canvas.addEventListener('mouseup', (e) => {
        inputState.mouseButtons.delete(e.button);
    });
    
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Prevent right-click menu
    });
    
    // === TOUCH INPUT SYSTEM ===
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        
        for (let touch of e.changedTouches) {
            const gameCoords = window.viewportManager.screenToGame(touch.clientX, touch.clientY);
            inputState.touches.set(touch.identifier, {
                startPos: gameCoords,
                currentPos: gameCoords,
                startTime: performance.now()
            });
        }
          inputState.lastInputTime = performance.now();
        
        if (!window.getGameRunning || !window.getGameRunning()) return;
        
        // Single touch = turn
        if (e.touches.length === 1) {
            handleTurn();
        }
        // Multi-touch = harvester
        else if (e.touches.length >= 2) {
            handleHarvesterDrop();
        }
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        for (let touch of e.changedTouches) {
            if (inputState.touches.has(touch.identifier)) {
                const gameCoords = window.viewportManager.screenToGame(touch.clientX, touch.clientY);
                inputState.touches.get(touch.identifier).currentPos = gameCoords;
            }
        }
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        
        for (let touch of e.changedTouches) {
            inputState.touches.delete(touch.identifier);
        }
    });
    
    // === GAMEPAD SUPPORT ===
    window.addEventListener('gamepadconnected', (e) => {
        console.log(`🎮 Gamepad connected: ${e.gamepad.id}`);
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
        console.log(`🎮 Gamepad disconnected: ${e.gamepad.id}`);
    });
    
    console.log('✅ Advanced input system initialized');
}

// ===== INPUT HANDLERS =====
function handleTurn() {
    // Try to turn the drone
    if (window.drone && window.drone.turn()) {
        // Haptic feedback for mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
}

function handleHarvesterDrop() {
    if (!window.drone || !window.gameState) return;
    
    // Check if we haven't reached the harvester limit
    if (window.harvesterSystem.harvesters.length >= window.gameState.maxHarvesters) {
        // Visual feedback for hitting the limit
        if (window.createScreenFlash) {
            window.createScreenFlash('#ff0000', 0.2, 200);
        }
        // Add warning particle effect
        if (window.particleSystem) {
            const warningParticles = 6;
            for (let i = 0; i < warningParticles; i++) {
                const angle = (i / warningParticles) * Math.PI * 2;
                window.particleSystem.addParticle({
                    x: window.drone.x,
                    y: window.drone.y,
                    velocity: {
                        x: Math.cos(angle) * 50,
                        y: Math.sin(angle) * 50
                    },
                    life: 500,
                    color: '#ff4444',
                    size: 2
                });
            }
        }
        return;
    }
      // Create new harvester at drone's position
    const harvester = new Harvester(window.drone.x, window.drone.y);
    
    // Apply any active upgrades
    window.harvesterSystem.applyUpgradesToHarvester(harvester);
    
    // Add to harvester system
    window.harvesterSystem.harvesters.push(harvester);
    
    // Also add to legacy harvesters array for backward compatibility
    if (window.harvesters) {
        window.harvesters.push(harvester);
    }
    
    // Update game state
    window.gameState.harvesters = window.harvesterSystem.harvesters.length;
    
    // Visual and audio feedback
    if (window.createScreenFlash) {
        window.createScreenFlash('#00ff00', 0.3, 300);
    }
    
    if (window.particleSystem) {
        const deployParticles = 12;
        for (let i = 0; i < deployParticles; i++) {
            const angle = (i / deployParticles) * Math.PI * 2;
            window.particleSystem.addParticle({
                x: window.drone.x,
                y: window.drone.y,
                velocity: {
                    x: Math.cos(angle) * 80,
                    y: Math.sin(angle) * 80
                },
                life: 800,
                color: '#00ff00',
                size: 3
            });
        }
    }
    
    // Add screen shake for deployment feedback
    if (window.addScreenShake) {
        window.addScreenShake(5, 100);
    }
}

// ===== INPUT UTILITIES =====
function isKeyPressed(keyCode) {
    return inputState.keys.has(keyCode);
}

function wasKeyJustPressed(keyCode, timeWindow = 100) {
    const now = performance.now();
    return inputState.inputBuffer.some(input => 
        input.type === 'keydown' && 
        input.code === keyCode && 
        now - input.timestamp < timeWindow
    );
}

function updateGamepadInput() {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (gamepad) {
            // Button 0 (A/X) = Turn
            if (gamepad.buttons[0].pressed) {
                handleTurn();
            }
            
            // Button 1 (B/Circle) = Harvester
            if (gamepad.buttons[1].pressed) {
                handleHarvesterDrop();
            }
            
            // Start/Options button = Pause
            if (gamepad.buttons[9].pressed) {
                togglePause();
            }
        }
    }
}

function cleanupInputBuffer() {
    const now = performance.now();
    const maxAge = 500; // Keep inputs for 500ms
    
    inputState.inputBuffer = inputState.inputBuffer.filter(
        input => now - input.timestamp < maxAge
    );
}

// ===== VISUAL FEEDBACK =====
function createScreenFlash(color, opacity, duration) {
    const flashElement = document.createElement('div');
    flashElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: ${color};
        opacity: ${opacity};
        pointer-events: none;
        z-index: 9999;
        transition: opacity ${duration}ms ease-out;
    `;
    
    document.body.appendChild(flashElement);
    
    setTimeout(() => {
        flashElement.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(flashElement);
        }, duration);
    }, 50);
}

// Export for global access
window.inputState = inputState;
window.setupInputHandlers = setupInputHandlers;
window.updateGamepadInput = updateGamepadInput;
window.cleanupInputBuffer = cleanupInputBuffer;
window.createScreenFlash = createScreenFlash;
window.createScreenFlash = createScreenFlash;
window.createScreenFlash = createScreenFlash;
