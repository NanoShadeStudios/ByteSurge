// ByteSurge: Home Screen System
// Main menu after opening animation

class HomeScreen {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hoveredMenuItem = -1;
        this.mouseX = 0;
        this.mouseY = 0;
        this.menuItems = [
            { text: 'START GAME', action: 'start', glow: 0 },
            { text: 'CONTROLS', action: 'controls', glow: 0 },
            { text: 'ABOUT', action: 'about', glow: 0 }
        ];
        this.showingSubMenu = null;
        this.pulseOffset = 0;
        this.particleOffset = 0;
        
        // Animation effects
        this.titlePulse = 0;
        this.backgroundParticles = [];
        this.initBackgroundParticles();
        
        console.log('🏠 Home Screen initialized');
    }
    
    initBackgroundParticles() {
        this.backgroundParticles = [];
        for (let i = 0; i < 50; i++) {
            this.backgroundParticles.push({
                x: Math.random() * window.GAME_WIDTH,
                y: Math.random() * window.GAME_HEIGHT,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                alpha: Math.random() * 0.5 + 0.2,
                size: Math.random() * 2 + 1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
      update(deltaTime) {
        this.pulseOffset += deltaTime * 0.003;
        this.titlePulse += deltaTime * 0.002;
        this.particleOffset += deltaTime * 0.001;
        
        // Update menu item glow effects based on hover
        this.menuItems.forEach((item, index) => {
            const targetGlow = index === this.hoveredMenuItem ? 1 : 0;
            const glowSpeed = 8; // Speed of glow transition
            
            if (item.glow < targetGlow) {
                item.glow = Math.min(targetGlow, item.glow + (deltaTime / 1000) * glowSpeed);
            } else if (item.glow > targetGlow) {
                item.glow = Math.max(targetGlow, item.glow - (deltaTime / 1000) * glowSpeed);
            }
        });
        
        // Update background particles
        this.backgroundParticles.forEach(particle => {
            particle.x += particle.vx * (deltaTime / 1000);
            particle.y += particle.vy * (deltaTime / 1000);
            particle.phase += deltaTime * 0.002;
            
            // Wrap particles around screen
            if (particle.x < 0) particle.x = window.GAME_WIDTH;
            if (particle.x > window.GAME_WIDTH) particle.x = 0;
            if (particle.y < 0) particle.y = window.GAME_HEIGHT;
            if (particle.y > window.GAME_HEIGHT) particle.y = 0;
        });
    }
    
    render() {
        const gameWidth = window.GAME_WIDTH || 1200;
        const gameHeight = window.GAME_HEIGHT || 800;
        
        // Clear screen with dark gradient background
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, gameWidth, gameHeight);
        
        // Add animated background gradient
        const gradient = this.ctx.createRadialGradient(
            gameWidth / 2, gameHeight / 2, 0,
            gameWidth / 2, gameHeight / 2, Math.max(gameWidth, gameHeight)
        );
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0a0a0a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, gameWidth, gameHeight);
        
        // Render background particles
        this.renderBackgroundParticles();
        
        // Render scan lines effect
        this.renderScanLines();
        
        if (this.showingSubMenu) {
            this.renderSubMenu();
        } else {
            this.renderMainMenu();
        }
    }
    
    renderMainMenu() {
        const gameWidth = window.GAME_WIDTH || 1200;
        const gameHeight = window.GAME_HEIGHT || 800;
        
        this.ctx.save();
        
        // Main title
        const titleGlow = 0.8 + Math.sin(this.titlePulse) * 0.2;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20 * titleGlow;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 48px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BYTESURGE', gameWidth / 2, gameHeight * 0.25);
        
        // Subtitle
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#888';
        this.ctx.font = '18px monospace';
        this.ctx.fillText('INFINITE LOOP PROTOCOL', gameWidth / 2, gameHeight * 0.32);
        
        // Menu items
        const menuStartY = gameHeight * 0.5;
        const menuSpacing = 60;        this.menuItems.forEach((item, index) => {
            const y = menuStartY + (index * menuSpacing);
            const isHovered = index === this.hoveredMenuItem;
            
            // Set font first to get accurate measurements
            const fontSize = isHovered ? 28 : 24;
            this.ctx.font = isHovered ? 'bold 28px monospace' : '24px monospace';
            
            // Measure actual text width
            const textMetrics = this.ctx.measureText(item.text);
            const textWidth = textMetrics.width;
            const textX = gameWidth / 2;
            const textY = y + 5;
            
            // Hover highlight with perfectly centered glow
            if (isHovered || item.glow > 0) {
                const glowAlpha = 0.2 + (item.glow * 0.3);
                const glowSize = 10 + (item.glow * 20);
                
                // Calculate glow box centered exactly on the text
                const glowBoxWidth = textWidth + 40;
                const glowBoxHeight = fontSize + 20;
                const glowBoxX = textX - (glowBoxWidth / 2);
                const glowBoxY = textY - fontSize + 5;
                
                // Outer glow perfectly centered on text
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = glowSize;
                this.ctx.fillStyle = `rgba(0, 255, 255, ${glowAlpha})`;
                this.ctx.fillRect(glowBoxX, glowBoxY, glowBoxWidth, glowBoxHeight);
                this.ctx.shadowBlur = 0;
            }
            
            // Menu item text with enhanced glow when hovered
            const textGlowIntensity = 5 + (item.glow * 20);
            this.ctx.shadowColor = isHovered ? '#ffffff' : '#00ff88';
            this.ctx.shadowBlur = textGlowIntensity;
            this.ctx.fillStyle = isHovered ? '#ffffff' : '#00ff88';
            this.ctx.fillText(item.text, textX, textY);
        });// Clear any shadow effects before rendering bottom text
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
        
        // Instructions
        this.ctx.fillStyle = '#666';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click to Select • ESC Exit', gameWidth / 2, gameHeight * 0.85);
        
        // Version info
        this.ctx.fillStyle = '#444';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('v1.0.0', gameWidth - 20, gameHeight - 20);
        
        this.ctx.restore();
    }
    
    renderSubMenu() {
        const gameWidth = window.GAME_WIDTH || 1200;
        const gameHeight = window.GAME_HEIGHT || 800;
        
        this.ctx.save();
        
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, gameWidth, gameHeight);
        
        // Sub-menu content box
        const boxWidth = gameWidth * 0.7;
        const boxHeight = gameHeight * 0.6;
        const boxX = (gameWidth - boxWidth) / 2;
        const boxY = (gameHeight - boxHeight) / 2;
        
        // Box background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Content based on sub-menu type
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        
        if (this.showingSubMenu === 'controls') {
            this.renderControlsMenu(boxX, boxY, boxWidth, boxHeight);
        } else if (this.showingSubMenu === 'about') {
            this.renderAboutMenu(boxX, boxY, boxWidth, boxHeight);
        }
        
        // Close instruction
        this.ctx.fillStyle = '#888';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('Press ESC to return', gameWidth / 2, boxY + boxHeight + 30);
        
        this.ctx.restore();
    }
    
    renderControlsMenu(boxX, boxY, boxWidth, boxHeight) {
        const centerX = boxX + boxWidth / 2;
        let y = boxY + 50;
        
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 28px monospace';
        this.ctx.fillText('CONTROLS', centerX, y);
        
        y += 60;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px monospace';
        this.ctx.textAlign = 'left';
        
        const controls = [
            'SPACE / ARROW KEYS - Turn Drone',
            'H - Deploy Harvester',
            'P - Pause Game',
            'F - Toggle Fullscreen',
            'R - Reset Game',
            '',
            'OBJECTIVE:',
            '• Collect energy nodes',
            '• Deploy harvesters for passive energy',
            '• Avoid corruption zones',
            '• Survive as long as possible!'
        ];
        
        controls.forEach((control, index) => {
            if (control === '') {
                y += 20;
                return;
            }
            
            if (control.startsWith('OBJECTIVE:')) {
                this.ctx.fillStyle = '#00ff88';
                this.ctx.font = 'bold 18px monospace';
            } else if (control.startsWith('•')) {
                this.ctx.fillStyle = '#cccccc';
                this.ctx.font = '16px monospace';
            } else {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '18px monospace';
            }
            
            this.ctx.fillText(control, boxX + 40, y);
            y += 25;
        });
    }
    
    renderAboutMenu(boxX, boxY, boxWidth, boxHeight) {
        const centerX = boxX + boxWidth / 2;
        let y = boxY + 50;
        
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 28px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ABOUT', centerX, y);
        
        y += 60;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px monospace';
        
        const aboutText = [
            'ByteSurge: Infinite Loop Protocol',
            '',
            'A retro-style endless runner where you pilot',
            'a drone through an infinite digital landscape.',
            '',
            'Navigate through energy zones, collect power,',
            'deploy harvesters, and survive the corruption',
            'that threatens the digital realm.',
            '',
            'Developed by NanoShade Studios',
            '',
            'Built with HTML5 Canvas and JavaScript'
        ];
        
        aboutText.forEach(line => {
            if (line === '') {
                y += 20;
                return;
            }
            
            if (line.includes('ByteSurge') || line.includes('NanoShade Studios')) {
                this.ctx.fillStyle = '#00ff88';
                this.ctx.font = 'bold 18px monospace';
            } else {
                this.ctx.fillStyle = '#cccccc';
                this.ctx.font = '16px monospace';
            }
            
            this.ctx.fillText(line, centerX, y);
            y += 25;
        });
    }
    
    renderBackgroundParticles() {
        this.ctx.save();
        
        this.backgroundParticles.forEach(particle => {
            const alpha = particle.alpha * (0.5 + Math.sin(particle.phase) * 0.3);
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#00ffff';
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        
        this.ctx.restore();
    }
    
    renderScanLines() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.05;
        this.ctx.fillStyle = '#ffffff';
        
        for (let y = 0; y < window.GAME_HEIGHT; y += 4) {
            this.ctx.fillRect(0, y, window.GAME_WIDTH, 1);
        }
        
        this.ctx.restore();    }
    
    getMenuItemBounds(index) {
        const gameWidth = window.GAME_WIDTH || 1200;
        const gameHeight = window.GAME_HEIGHT || 800;
        const menuStartY = gameHeight * 0.5;
        const menuSpacing = 60;
        const y = menuStartY + (index * menuSpacing);
        
        // Estimate text width (approximate)
        const text = this.menuItems[index].text;
        const fontSize = index === this.hoveredMenuItem ? 28 : 24;
        const charWidth = fontSize * 0.6; // Approximate character width for monospace
        const textWidth = text.length * charWidth;
        
        return {
            x: (gameWidth - textWidth) / 2,
            y: y - 20,
            width: textWidth,
            height: 40
        };
    }
    
    updateMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
        
        // Check which menu item is being hovered
        this.hoveredMenuItem = -1;
        
        if (!this.showingSubMenu) {
            for (let i = 0; i < this.menuItems.length; i++) {
                const bounds = this.getMenuItemBounds(i);
                if (x >= bounds.x && x <= bounds.x + bounds.width &&
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    this.hoveredMenuItem = i;
                    break;
                }
            }
        }
    }
      handleKeyDown(event) {
        if (this.showingSubMenu) {
            if (event.code === 'Escape') {
                this.showingSubMenu = null;
                return true;
            }
            return true; // Consume input in sub-menu
        }
        
        switch (event.code) {
            case 'Escape':
                // Could add exit confirmation here
                return true;
        }
        
        return false;
    }
      handleClick(x, y) {
        if (this.showingSubMenu) {
            this.showingSubMenu = null;
            return true;
        }
        
        // Check if click is on a menu item
        for (let i = 0; i < this.menuItems.length; i++) {
            const bounds = this.getMenuItemBounds(i);
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                return this.selectMenuItem(i);
            }
        }
        
        return false;
    }
    
    selectMenuItem(index = this.hoveredMenuItem) {
        if (index < 0 || index >= this.menuItems.length) return false;
        
        const selectedItem = this.menuItems[index];
        
        switch (selectedItem.action) {
            case 'start':
                return 'start_game'; // Signal to start the game
                
            case 'controls':
                this.showingSubMenu = 'controls';
                return true;
                
            case 'about':
                this.showingSubMenu = 'about';
                return true;
        }
        
        return true;
    }
}

// Export for global access
window.HomeScreen = HomeScreen;
