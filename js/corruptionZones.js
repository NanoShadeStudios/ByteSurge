// ByteSurge: Infinite Loop - Corruption Zone Class
// Individual corruption zone entities that hunt the player

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
        this.isActive = true;
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

        // Check if zone is off screen (with margin)
        const margin = 100;
        if (this.x < -margin || 
            this.x > window.GAME_WIDTH + margin || 
            this.y < -margin || 
            this.y > window.GAME_HEIGHT + margin) {
            this.isActive = false;
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

    checkCollision(drone) {
        if (!drone || drone.isInvulnerable) return false;
        
        const dx = this.x - drone.x;
        const dy = this.y - drone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
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

// Make CorruptionZone available globally
window.CorruptionZone = CorruptionZone;
