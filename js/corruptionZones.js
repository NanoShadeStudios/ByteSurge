// ByteSurge: Infinite Loop - Corruption Zone System
// Hazardous red blobs that hunt the player

// ===== CORRUPTION ZONE CLASS =====
class CorruptionZone {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseSize = 15 + Math.random() * 10; // 15-25px radius
        this.currentSize = this.baseSize;
        this.speed = 20 + Math.random() * 30; // 20-50 px/s
        
        // Visual effects
        this.spawnTime = performance.now();
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.flickerPhase = Math.random() * Math.PI * 2;
        this.rotationAngle = 0;
        this.waveOffset = Math.random() * Math.PI * 2;
        
        // Movement behavior
        this.targetX = 0;
        this.targetY = 0;
        this.huntingSpeed = this.speed;
        
        // Particle effects
        this.particles = [];
        this.maxParticles = 12;

        
    }
    
    update(deltaTime) {
        const dt = deltaTime / 1000;
        
        // Update visual effects
        this.pulsePhase += deltaTime * 0.003;
        this.flickerPhase += deltaTime * 0.008; // Fast flicker
        this.rotationAngle += deltaTime * 0.001;
        this.waveOffset += deltaTime * 0.005;
        
        // Pulsing size animation
        this.currentSize = this.baseSize + Math.sin(this.pulsePhase) * 3;
        
        // Hunt the drone
        if (window.drone) {
            this.targetX = window.drone.x;
            this.targetY = window.drone.y;
            
            // Move toward drone
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 1) {
                // Normalize direction and apply speed
                this.x += (dx / distance) * this.huntingSpeed * dt;
                this.y += (dy / distance) * this.huntingSpeed * dt;
            }
        }
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Spawn corruption particles occasionally
        if (Math.random() < 0.05 && this.particles.length < this.maxParticles) {
            this.spawnCorruptionParticle();
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx * (deltaTime / 1000);
            particle.y += particle.vy * (deltaTime / 1000);
            particle.life -= deltaTime;
            particle.alpha = Math.max(0, particle.life / particle.maxLife);
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    spawnCorruptionParticle() {
        const angle = Math.random() * Math.PI * 2;
        const speed = 10 + Math.random() * 20;
        const life = 1000 + Math.random() * 2000;
        
        this.particles.push({
            x: this.x + Math.cos(angle) * this.currentSize * 0.8,
            y: this.y + Math.sin(angle) * this.currentSize * 0.8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: life,
            maxLife: life,
            alpha: 1,
            size: 1 + Math.random() * 2
        });
    }
    
    render(ctx) {
        ctx.save();
        
        // Move to corruption zone center
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);
        
        // Render corruption particles first (behind main blob)
        this.renderParticles(ctx);
        
        // Main corruption blob with wavy edges
        const segments = 12;
        const flickerIntensity = 0.3 + Math.sin(this.flickerPhase) * 0.2;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.currentSize * 1.5);
        gradient.addColorStop(0, `rgba(255, 50, 50, ${flickerIntensity * 0.1})`);
        gradient.addColorStop(0.7, `rgba(255, 100, 100, ${flickerIntensity * 0.05})`);
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.currentSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Main wavy blob
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const waveOffset = Math.sin(angle * 3 + this.waveOffset) * 3;
            const radius = this.currentSize + waveOffset;
            
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        
        // Fill with corrupted red
        const mainGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.currentSize);
        mainGradient.addColorStop(0, `rgba(255, 80, 80, ${flickerIntensity * 0.8})`);
        mainGradient.addColorStop(0.6, `rgba(220, 50, 50, ${flickerIntensity * 0.6})`);
        mainGradient.addColorStop(1, `rgba(180, 30, 30, ${flickerIntensity * 0.4})`);
        
        ctx.fillStyle = mainGradient;
        ctx.fill();
        
        // Add noise/static effect
        this.renderStaticNoise(ctx);
        
        ctx.restore();
    }
    
    renderParticles(ctx) {
        ctx.save();
        
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha * 0.6;
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(particle.x - this.x, particle.y - this.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    renderStaticNoise(ctx) {
        // Add random static-like noise for corruption effect
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * this.currentSize * 1.5;
            const y = (Math.random() - 0.5) * this.currentSize * 1.5;
            const size = Math.random() * 2;
            
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#ff0000';
            ctx.fillRect(x, y, size, size);
        }
        
        ctx.restore();
    }
    
    getBounds() {
        return {
            centerX: this.x,
            centerY: this.y,
            radius: this.currentSize
        };
    }
    
    isOffScreen() {
        // Remove if too far off screen (left side)
        return this.x < -100;
    }
    
    checkCollision(drone) {
        if (!drone || drone.isInvulnerable) return false;
        
        const dx = this.x - drone.x;
        const dy = this.y - drone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Use larger collision radius for better gameplay feel
        return distance < (this.currentSize + drone.size * 0.8);
    }
    
    draw(ctx) {
        // Draw particles first (behind the corruption zone)
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha * 0.4;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Calculate visual effects
        const flicker = 0.7 + Math.sin(this.flickerPhase) * 0.3;
        const waveStrength = 3;
        
        // Draw wavy blob
        ctx.save();
        ctx.globalAlpha = 0.6 * flicker;
        ctx.fillStyle = '#ff0000';
        
        ctx.beginPath();
        for (let i = 0; i < 360; i += 10) {
            const angle = (i * Math.PI) / 180;
            const wave = Math.sin(angle * 8 + this.waveOffset) * waveStrength;
            const radius = this.currentSize + wave;
            
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw glow effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.currentSize * 2
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.globalAlpha = 0.3 * flicker;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// ===== CORRUPTION ZONE MANAGEMENT =====
let corruptionSystem = {
    showWarnings: false,
    warningRange: 150,
    warnings: []
};

let corruptionZones = [];
let lastCorruptionSpawn = 0;
let corruptionSpawnInterval = 3000; // Start spawning every 3 seconds
let corruptionDifficulty = 1;

function updateCorruptionZones(deltaTime) {
    const now = performance.now();
    
    // Spawn new corruption zones periodically
    if (now - lastCorruptionSpawn >= corruptionSpawnInterval) {
        spawnCorruptionZone();
        lastCorruptionSpawn = now;
        
        // Gradually increase difficulty
        corruptionDifficulty += 0.1;
        corruptionSpawnInterval = Math.max(1500, 3000 - (corruptionDifficulty * 100));
    }
    
    // Update all corruption zones
    corruptionZones.forEach(zone => {
        zone.update(deltaTime);
    });
    
    // Remove off-screen corruption zones
    corruptionZones = corruptionZones.filter(zone => !zone.isOffScreen());
}

function spawnCorruptionZone() {
    if (!window.drone) return;
    
    // Spawn from right side of screen or ahead of drone
    const spawnMargin = 50;
    const spawnX = window.GAME_WIDTH + spawnMargin + Math.random() * 200;
    const spawnY = Math.random() * window.GAME_HEIGHT;
    
    // Don't spawn too close to drone
    const dx = spawnX - window.drone.x;
    const dy = spawnY - window.drone.y;
    const distanceToDrone = Math.sqrt(dx * dx + dy * dy);
    
    if (distanceToDrone > 100) {
        const zone = new CorruptionZone(spawnX, spawnY);
        corruptionZones.push(zone);
        
      
    }
}

function renderCorruptionZones(ctx) {
    // Render warning indicators if detection upgrade is active
    if (corruptionSystem.showWarnings && window.drone && window.gameState && window.gameState.hasDetection) {
        renderCorruptionWarnings(ctx);
    }
    
    corruptionZones.forEach(zone => {
        zone.render(ctx);
    });
}

function renderCorruptionWarnings(ctx) {
    if (!window.drone) return;
    
    const detectionRange = window.gameState.detectionRange || 150;
    
    corruptionZones.forEach(zone => {
        const dx = zone.x - window.drone.x;
        const dy = zone.y - window.drone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= detectionRange && distance > zone.currentSize + 20) {
            // Draw warning indicator
            ctx.save();
            
            // Warning circle around corruption
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.currentSize + 15, 0, Math.PI * 2);
            ctx.stroke();
            
            // Warning triangle above corruption
            const triangleSize = 8;
            ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.beginPath();
            ctx.moveTo(zone.x, zone.y - zone.currentSize - 25);
            ctx.lineTo(zone.x - triangleSize, zone.y - zone.currentSize - 10);
            ctx.lineTo(zone.x + triangleSize, zone.y - zone.currentSize - 10);
            ctx.closePath();
            ctx.fill();
            
            // Warning text
            ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', zone.x, zone.y - zone.currentSize - 15);
            
            ctx.restore();
        }
    });
}

function checkCorruptionCollisions(drone) {
    if (!drone) return false;
    
    for (let zone of corruptionZones) {
        const dx = drone.x - zone.x;
        const dy = drone.y - zone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionDistance = (drone.size || 8) / 2 + zone.currentSize;
        
        if (distance < collisionDistance) {
            // Collision with corruption zone!
           
            // Visual feedback
            if (window.createScreenFlash) {
                window.createScreenFlash('#ff0000', 0.5, 300);
            }
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
            
            return true; // Collision detected
        }
    }
    
    return false; // No collision
}

function resetCorruptionZones() {
    corruptionZones = [];
    lastCorruptionSpawn = performance.now();
    corruptionDifficulty = 1;
    corruptionSpawnInterval = 3000;
   
}

// Export for global access
window.CorruptionZone = CorruptionZone;
window.corruptionSystem = corruptionSystem;
window.corruptionZones = corruptionZones;
window.updateCorruptionZones = updateCorruptionZones;
window.renderCorruptionZones = renderCorruptionZones;
window.renderCorruptionWarnings = renderCorruptionWarnings;
window.checkCorruptionCollisions = checkCorruptionCollisions;
window.resetCorruptionZones = resetCorruptionZones;
