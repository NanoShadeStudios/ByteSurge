// ByteSurge: Infinite Loop - Upgrade System
// Advanced upgrade menu with visual polish and smooth animations

// ===== UPGRADE SYSTEM DATA =====
let upgradeSystem = {
    isMenuOpen: false,
    selectedUpgrade: 0,
    maxUpgrades: 5,
    animationState: {
        menuScale: 0,
        backgroundAlpha: 0,
        targetScale: 1,
        targetAlpha: 0.8,
        animationSpeed: 0.15
    },
    
    // Upgrade definitions with costs and effects
    upgrades: [
        {
            id: 'droneSpeed',
            name: 'Drone Speed',
            description: 'Increases drone movement speed',
            maxLevel: 10,
            currentLevel: 0,
            baseCost: 25,
            costMultiplier: 1.5,
            effect: 'speed',
            icon: '⚡',
            color: '#00ffff'
        },
        {
            id: 'harvesterRate',
            name: 'Harvester Rate',
            description: 'Harvesters collect energy faster',
            maxLevel: 10,
            currentLevel: 0,
            baseCost: 30,
            costMultiplier: 1.6,
            effect: 'harvesterSpeed',
            icon: '🏭',
            color: '#00ff00'
        },
        {
            id: 'harvesterLimit',
            name: 'Harvester Limit',
            description: 'Deploy more harvesters at once',
            maxLevel: 5,
            currentLevel: 0,
            baseCost: 100,
            costMultiplier: 2.0,
            effect: 'maxHarvesters',
            icon: '📈',
            color: '#ffaa00'
        },
        {
            id: 'autoTurnAssist',
            name: 'Auto-Turn Assist',
            description: 'Smoother drone movement control',
            maxLevel: 3,
            currentLevel: 0,
            baseCost: 75,
            costMultiplier: 1.8,
            effect: 'turning',
            icon: '🎯',
            color: '#aa44ff'
        },
        {
            id: 'zoneDetection',
            name: 'Zone Detection',
            description: 'Mini-map shows upcoming hazards',
            maxLevel: 3,
            currentLevel: 0,
            baseCost: 150,
            costMultiplier: 2.2,
            effect: 'detection',
            icon: '📡',
            color: '#ff4444'
        }
    ],
    
    // Calculate upgrade cost
    getUpgradeCost(upgradeIndex) {
        const upgrade = this.upgrades[upgradeIndex];
        if (!upgrade || upgrade.currentLevel >= upgrade.maxLevel) return null;
        
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
    },
    
    // Check if upgrade is affordable
    canAffordUpgrade(upgradeIndex) {
        const cost = this.getUpgradeCost(upgradeIndex);
        return cost !== null && window.gameState && window.gameState.energy >= cost;
    },
    
    // Purchase upgrade
    purchaseUpgrade(upgradeIndex) {
        if (!this.canAffordUpgrade(upgradeIndex)) return false;
        
        const upgrade = this.upgrades[upgradeIndex];
        const cost = this.getUpgradeCost(upgradeIndex);
        
        // Deduct energy
        if (window.gameState) {
            window.gameState.energy -= cost;
        }
        
        // Level up the upgrade
        upgrade.currentLevel++;
        
        // Apply upgrade effects immediately
        this.applyUpgradeEffect(upgrade);
        
        // Visual feedback
        if (window.createScreenFlash) {
            window.createScreenFlash(upgrade.color, 0.2, 150);
        }
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
        
        // Save upgrades to localStorage
        this.saveUpgrades();
        
        return true;
    },      // Apply upgrade effects to game systems
    applyUpgradeEffect(upgrade) {
        switch (upgrade.effect) {
            case 'speed':
                if (window.drone) {
                    // Level 0-10: 15% speed increase per level (max 150% faster)
                    const speedMultiplier = 1 + Math.min(upgrade.currentLevel, upgrade.maxLevel) * 0.15;
                    window.drone.speed = window.drone.baseSpeed * speedMultiplier;
                }
                break;
                
            case 'harvesterSpeed':
                // Apply to all existing harvesters and set global multiplier
                const harvesterSpeedMultiplier = 1 + Math.min(upgrade.currentLevel, upgrade.maxLevel) * 0.2; // 20% faster per level
                const harvesterIntervalDivisor = 1 + Math.min(upgrade.currentLevel, upgrade.maxLevel) * 0.15; // 15% shorter interval per level
                
                if (window.harvesterSystem && window.harvesterSystem.harvesters) {
                    window.harvesterSystem.harvesters.forEach(harvester => {
                        harvester.energyGenerationRate = harvester.baseEnergyGenerationRate * harvesterSpeedMultiplier;
                        harvester.generationInterval = harvester.baseGenerationInterval / harvesterIntervalDivisor;
                    });
                }
                
                // Store global multipliers for new harvesters
                if (window.harvesterSystem) {
                    window.harvesterSystem.globalSpeedMultiplier = harvesterSpeedMultiplier;
                    window.harvesterSystem.globalIntervalDivisor = harvesterIntervalDivisor;
                }
                break;
                
            case 'maxHarvesters':
                if (window.gameState) {
                    // Level 0-5: +1 harvester per level (max 8 total)
                    window.gameState.maxHarvesters = 3 + Math.min(upgrade.currentLevel, upgrade.maxLevel);
                }
                break;
                
            case 'turning':
                if (window.drone) {
                    // Level 0-3: Better turn response and smoothness
                    const turnLevel = Math.min(upgrade.currentLevel, upgrade.maxLevel);
                    window.drone.turnSmoothness = 1 + turnLevel * 0.3;
                    window.drone.minTurnDelay = Math.max(30, 100 - turnLevel * 20); // Minimum 30ms delay
                }
                break;
                
            case 'detection':
                // Zone detection upgrade - shows corruption warnings and energy node hints
                const detectionLevel = Math.min(upgrade.currentLevel, upgrade.maxLevel);
                if (window.gameState) {
                    window.gameState.detectionLevel = detectionLevel;
                    window.gameState.hasDetection = detectionLevel > 0;
                    window.gameState.detectionRange = 100 + detectionLevel * 50; // Range in pixels
                }
                
                // Enable corruption warning system
                if (window.corruptionSystem && detectionLevel > 0) {
                    window.corruptionSystem.showWarnings = true;
                    window.corruptionSystem.warningRange = 100 + detectionLevel * 50;
                }
                break;
        }
    },
      // Apply all upgrades (called on game start)
    applyAllUpgrades() {
        this.upgrades.forEach(upgrade => {
            if (upgrade.currentLevel > 0) {
                // Apply each level of the upgrade
                for (let i = 0; i < upgrade.currentLevel; i++) {
                    this.applyUpgradeEffect(upgrade);
                }
            }
        });
    },
    
    // Save upgrades to localStorage
    saveUpgrades() {
        const upgradeData = {};
        this.upgrades.forEach(upgrade => {
            upgradeData[upgrade.id] = upgrade.currentLevel;
        });
        
        try {
            localStorage.setItem('bytesurge_upgrades', JSON.stringify(upgradeData));
        } catch (e) {
          
        }
    },
    
    // Load upgrades from localStorage
    loadUpgrades() {
        try {
            const upgradeData = localStorage.getItem('bytesurge_upgrades');
            if (upgradeData) {
                const parsed = JSON.parse(upgradeData);
                
                this.upgrades.forEach(upgrade => {
                    if (parsed[upgrade.id] !== undefined) {
                        upgrade.currentLevel = Math.min(parsed[upgrade.id], upgrade.maxLevel);
                    }
                });
                
                // Apply loaded upgrades
                this.applyAllUpgrades();
            }
        } catch (e) {
            

        }
    }
};

// ===== UPGRADE MENU UI =====
let upgradeMenuUI = {
    mousePos: { x: 0, y: 0 },
    hoveredUpgrade: -1,
    panelBounds: { x: 0, y: 0, width: 0, height: 0 },
    upgradeBounds: [],

    // Open upgrade menu
    openMenu() {
        if (upgradeSystem.isMenuOpen) return;
        
        upgradeSystem.isMenuOpen = true;
        upgradeSystem.selectedUpgrade = 0;
        upgradeSystem.animationState.menuScale = 1; // Start fully visible for debugging
        upgradeSystem.animationState.backgroundAlpha = 1;
        this.hoveredUpgrade = -1;
        
        // Calculate panel and upgrade bounds
        this.calculateBounds();
    },
      // Close upgrade menu
    closeMenu() {
        if (!upgradeSystem.isMenuOpen) return;
        
        upgradeSystem.isMenuOpen = false;
        this.hoveredUpgrade = -1;
        
        // Resume game if it was running
        if (window.togglePause && window.getGameRunning && window.getGameRunning() && window.getGamePaused()) {
            window.togglePause();
        }
    },

    // Calculate bounds for mouse interaction
    calculateBounds() {
        const panelWidth = 600;
        const panelHeight = 500;
        const panelX = (window.GAME_WIDTH - panelWidth) / 2;
        const panelY = (window.GAME_HEIGHT - panelHeight) / 2;
        
        this.panelBounds = { x: panelX, y: panelY, width: panelWidth, height: panelHeight };
        
        // Calculate upgrade item bounds
        this.upgradeBounds = [];
        const startY = panelY + 100;
        const itemHeight = 70;
        
        for (let i = 0; i < upgradeSystem.maxUpgrades; i++) {
            const y = startY + i * itemHeight;
            this.upgradeBounds.push({
                x: panelX + 10,
                y: y - 25,
                width: panelWidth - 20,
                height: itemHeight - 10,
                index: i
            });
        }
    },

    // Update mouse position and hover state
    updateMousePosition(x, y) {
        if (!upgradeSystem.isMenuOpen) return;
        
        this.mousePos = { x, y };
        this.hoveredUpgrade = -1;
        
        // Check if mouse is over any upgrade item
        for (let bounds of this.upgradeBounds) {
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                this.hoveredUpgrade = bounds.index;
                // Also update keyboard selection to match hover
                upgradeSystem.selectedUpgrade = bounds.index;
                break;
            }
        }
    },

    // Handle mouse click
    handleMouseClick(x, y, button) {
        if (!upgradeSystem.isMenuOpen || button !== 0) return false; // Only left click
        
        // Check if click is inside panel
        if (x < this.panelBounds.x || x > this.panelBounds.x + this.panelBounds.width ||
            y < this.panelBounds.y || y > this.panelBounds.y + this.panelBounds.height) {
            // Click outside panel - close menu
            this.closeMenu();
            return true;
        }
        
        // Check if click is on an upgrade item
        for (let bounds of this.upgradeBounds) {
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                // Purchase the clicked upgrade
                if (upgradeSystem.purchaseUpgrade(bounds.index)) {
                    // Purchase successful - add visual feedback
                    console.log(`Purchased upgrade: ${upgradeSystem.upgrades[bounds.index].name}`);
                }
                return true;
            }
        }
        
        return true; // Consumed the click
    },
    
    // Handle input
    handleInput(keyCode) {
        if (!upgradeSystem.isMenuOpen) return false;
        
        switch (keyCode) {
            case 'ArrowUp':
            case 'KeyW':
                upgradeSystem.selectedUpgrade = Math.max(0, upgradeSystem.selectedUpgrade - 1);
                return true;
                
            case 'ArrowDown':
            case 'KeyS':
                upgradeSystem.selectedUpgrade = Math.min(upgradeSystem.maxUpgrades - 1, upgradeSystem.selectedUpgrade + 1);
                return true;
                
            case 'Enter':
            case 'Space':
                if (upgradeSystem.purchaseUpgrade(upgradeSystem.selectedUpgrade)) {
                    // Purchase successful
                }
                return true;
                
            case 'Escape':
            case 'KeyU':
                this.closeMenu();
                return true;
        }
        
        return false;
    },
      // Update animations
    update(deltaTime) {
        if (!upgradeSystem.isMenuOpen) return;
        
        const speed = upgradeSystem.animationState.animationSpeed * (deltaTime / 16.67);
        
        // Animate menu scale
        upgradeSystem.animationState.menuScale += 
            (upgradeSystem.animationState.targetScale - upgradeSystem.animationState.menuScale) * speed;
        
        // Animate background alpha
        upgradeSystem.animationState.backgroundAlpha += 
            (upgradeSystem.animationState.targetAlpha - upgradeSystem.animationState.backgroundAlpha) * speed;
        
        // Recalculate bounds if needed (in case of window resize)
        if (this.panelBounds.width === 0) {
            this.calculateBounds();
        }
    },// Render upgrade menu
    render(ctx) {
        if (!upgradeSystem.isMenuOpen) {
            return;
        }
        
        // Simple initial render without animations for debugging
     
        ctx.save();
          // Background overlay (dark transparent)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
        
        // Main menu panel (simplified)
        const panelWidth = 600;
        const panelHeight = 500;
        const panelX = (window.GAME_WIDTH - panelWidth) / 2;
        const panelY = (window.GAME_HEIGHT - panelHeight) / 2;
        
        // Panel background
        ctx.fillStyle = 'rgba(10, 20, 30, 0.95)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Title
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('UPGRADE TERMINAL', panelX + panelWidth / 2, panelY + 40);
        
        // Energy display
        const energy = window.gameState ? window.gameState.energy : 0;
        ctx.fillStyle = '#ffff00';
        ctx.font = '16px monospace';
        ctx.fillText(`Energy: ${energy}`, panelX + panelWidth / 2, panelY + 70);
        
        // Simple upgrade list
        const startY = panelY + 100;
        const itemHeight = 70;
          upgradeSystem.upgrades.forEach((upgrade, index) => {
            const y = startY + index * itemHeight;
            const isSelected = index === upgradeSystem.selectedUpgrade;
            const isHovered = index === this.hoveredUpgrade;
            const canAfford = upgradeSystem.canAffordUpgrade(index);
            const cost = upgradeSystem.getUpgradeCost(index);
            const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;
            
            // Hover highlight (stronger than selection)
            if (isHovered) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.fillRect(panelX + 10, y - 25, panelWidth - 20, itemHeight - 10);
                // Hover border
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(panelX + 10, y - 25, panelWidth - 20, itemHeight - 10);
            }
            // Selection highlight (for keyboard navigation)
            else if (isSelected) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
                ctx.fillRect(panelX + 10, y - 25, panelWidth - 20, itemHeight - 10);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(panelX + 10, y - 25, panelWidth - 20, itemHeight - 10);
            }
            
            // Name and level
            ctx.fillStyle = isMaxed ? '#888888' : (isHovered ? '#ffffff' : '#cccccc');
            ctx.font = isHovered ? 'bold 18px monospace' : 'bold 16px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${upgrade.name} [${upgrade.currentLevel}/${upgrade.maxLevel}]`, panelX + 30, y - 10);
            
            // Description
            ctx.fillStyle = isHovered ? '#ffffff' : '#cccccc';
            ctx.font = isHovered ? '14px monospace' : '12px monospace';
            ctx.fillText(upgrade.description, panelX + 30, y + 10);
            
            // Cost or status
            ctx.textAlign = 'right';
            if (isMaxed) {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 14px monospace';
                ctx.fillText('MAXED', panelX + panelWidth - 30, y);
            } else if (cost !== null) {
                ctx.fillStyle = canAfford ? (isHovered ? '#ffff88' : '#ffff00') : '#ff4444';
                ctx.font = isHovered ? 'bold 16px monospace' : 'bold 14px monospace';
                ctx.fillText(`${cost} Energy`, panelX + panelWidth - 30, y);
                
                // Add purchase hint when hovering affordable upgrades
                if (isHovered && canAfford) {
                    ctx.fillStyle = '#88ff88';
                    ctx.font = '10px monospace';
                    ctx.fillText('Click to purchase', panelX + panelWidth - 30, y + 15);
                }
            }
        });
          // Controls hint
        ctx.fillStyle = '#888888';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('↑↓ Navigate  |  ENTER/CLICK Purchase  |  U/ESC Close', panelX + panelWidth / 2, panelY + panelHeight - 20);
        
        ctx.restore();
        
    }
};

// ===== GLOBAL FUNCTIONS =====
function openUpgradeMenu() {
    upgradeMenuUI.openMenu();
}

function closeUpgradeMenu() {
    upgradeMenuUI.closeMenu();
}

function isUpgradeMenuOpen() {
    return upgradeSystem.isMenuOpen;
}

// Function to reinitialize upgrades when game objects are ready
function reinitializeUpgrades() {
    if (window.upgradeSystem) {
        window.upgradeSystem.applyAllUpgrades();
        
        // Ensure harvester system is updated
        if (window.harvesterSystem && window.harvesterSystem.harvesters) {
            window.harvesterSystem.applyUpgradesToAllHarvesters();
        }
    }
}

// Initialize upgrade system
upgradeSystem.loadUpgrades();

// Export for global access
window.upgradeSystem = upgradeSystem;
window.upgradeMenuUI = upgradeMenuUI;
window.openUpgradeMenu = openUpgradeMenu;
window.closeUpgradeMenu = closeUpgradeMenu;
window.isUpgradeMenuOpen = isUpgradeMenuOpen;
window.reinitializeUpgrades = reinitializeUpgrades;
