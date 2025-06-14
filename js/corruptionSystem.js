// ByteSurge: Infinite Loop - Corruption System
const CorruptionSystem = {
    init: function() {
        this.baseSpawnInterval = 3000;
        this.currentSpawnInterval = 3000;
        this.spawnTimer = 0;
        this.difficultyMultiplier = 1;
        this.zones = [];
        this.maxZonesBase = 3;
        this.currentMaxZones = 3;
        
        // Zone progression scaling
        this.speedMultiplier = 1;
        this.sizeMultiplier = 1;
        this.spawnRateMultiplier = 1;
        return this;
    },

    update: function(deltaTime) {
        // Update existing zones
        this.zones.forEach(zone => zone.update(deltaTime));
        
        // Remove zones that are off-screen or inactive
        this.zones = this.zones.filter(zone => zone.isActive !== false);
        
        // Spawn new zones if needed
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.currentSpawnInterval && this.zones.length < this.currentMaxZones) {
            this.spawnNewZone();
            this.spawnTimer = 0;
            
            // Gradually decrease spawn interval the longer player stays in zone
            this.currentSpawnInterval = Math.max(
                1000, // Minimum 1 second between spawns
                this.baseSpawnInterval * Math.pow(0.98, this.zones.length) // 2% faster per active zone
            );
        }
    },
      spawnNewZone: function() {
        // Spawn from the right side of the screen
        const x = window.GAME_WIDTH + 50;
        const y = Math.random() * (window.GAME_HEIGHT - 100) + 50;
        
        const zone = new CorruptionZone(x, y);
        
        // Apply current difficulty modifiers
        zone.huntingSpeed *= this.speedMultiplier;
        zone.baseSize *= this.sizeMultiplier;
        
        this.zones.push(zone);
        
        console.log('🔥 Spawned corruption zone at:', x.toFixed(1), y.toFixed(1), 'Total zones:', this.zones.length);
    },
    
    increaseZoneDifficulty: function(zoneLevel) {
        // Scale various difficulty factors based on zone level
        this.speedMultiplier = 1 + (zoneLevel - 1) * 0.2; // 20% faster per zone
        this.sizeMultiplier = 1 + (zoneLevel - 1) * 0.1; // 10% larger per zone
        this.spawnRateMultiplier = 1 + (zoneLevel - 1) * 0.15; // 15% faster spawning per zone
        
        // Update maximum concurrent zones
        this.currentMaxZones = Math.min(
            this.maxZonesBase + Math.floor((zoneLevel - 1) / 2), // Add 1 max zone every 2 levels
            8 // Hard cap at 8 zones
        );
        
        // Update spawn interval
        this.baseSpawnInterval = Math.max(
            1000, // Minimum 1 second
            3000 * Math.pow(0.9, zoneLevel - 1) // 10% faster per zone
        );
        
        // Update existing zones with new speed
        this.zones.forEach(zone => {
            zone.huntingSpeed = zone.speed * this.speedMultiplier;
        });
    },
    
    checkCollisions: function(drone) {
        if (!drone) return false;
        
        for (const zone of this.zones) {
            if (zone.checkCollision(drone)) {
                return true;
            }
        }
        
        return false;    },
    
    render: function(ctx) {
        // Render all active corruption zones
        this.zones.forEach(zone => {
            if (zone.isActive) {
                zone.draw(ctx);
            }
        });
    },
    
    reset: function() {
        this.zones = [];
        this.spawnTimer = 0;
        this.currentSpawnInterval = this.baseSpawnInterval;
        this.speedMultiplier = 1;
        this.sizeMultiplier = 1;
        this.spawnRateMultiplier = 1;
        this.currentMaxZones = this.maxZonesBase;
    }
};

// Initialize the corruption system globally
window.corruptionSystem = Object.create(CorruptionSystem).init();
console.log('🔥 Corruption system initialized with methods:', Object.keys(window.corruptionSystem.__proto__));

// Global function to render corruption zones
function renderCorruptionZones(ctx) {
    if (window.corruptionSystem && window.corruptionSystem.render) {
        window.corruptionSystem.render(ctx);
    }
}

// Global function to reset corruption zones
function resetCorruptionZones() {
    if (window.corruptionSystem && window.corruptionSystem.reset) {
        window.corruptionSystem.reset();
    }
}

// Expose functions to global scope
window.renderCorruptionZones = renderCorruptionZones;
window.resetCorruptionZones = resetCorruptionZones;
