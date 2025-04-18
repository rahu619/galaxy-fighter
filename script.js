document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.querySelector('.cursor-follower');
    const cursorTrail = document.querySelector('.cursor-trail');
    const floatingElements = document.querySelectorAll('.floating-element');
    const scoreElement = document.getElementById('score');
    let score = 0;
    let combo = 0;
    let lastHitTime = 0;
    const comboTimeout = 2000; // 2 seconds to maintain combo
    let trailPositions = [];
    const maxTrailLength = 10;
    let lastX = 0;
    let lastY = 0;
    let lastTime = Date.now();
    let lastSpeed = 0;
    let maxParticles = 20;
    let activeParticles = [];
    let spawnInterval = 800; // Reduced from 1200 to 800 milliseconds
    let minSpawnInterval = 120; // Reduced from 180 to 120 milliseconds
    let spawnTimer = null;
    let gameStartTime = Date.now();
    let superAlienActive = false;
    let lastActivityTime = Date.now();
    let inactivityTimeout = 5000; // 5 seconds of inactivity before game over
    let inactivityTimer = null;
    let maxObstacles = 12;
    let timeoutCounter = null;
    let timeoutElement = document.getElementById('timeout');
    let timeoutCounterElement = document.querySelector('.timeout-counter');

    // Volume controls
    let volume = 0.5; // Default volume
    const volumeControl = document.createElement('div');
    volumeControl.className = 'volume-control';
    volumeControl.innerHTML = `
        <div class="volume-icon">🔊</div>
        <input type="range" min="0" max="100" value="50" class="volume-slider">
    `;
    document.querySelector('.content').appendChild(volumeControl);

    // Volume control event listeners
    const volumeSlider = volumeControl.querySelector('.volume-slider');
    const volumeIcon = volumeControl.querySelector('.volume-icon');

    volumeSlider.addEventListener('input', (e) => {
        volume = e.target.value / 100;
        if (masterGainNode) {
            masterGainNode.gain.value = volume;
        }
        updateVolumeIcon();
    });

    function updateVolumeIcon() {
        if (volume === 0) {
            volumeIcon.textContent = '🔇';
        } else if (volume < 0.3) {
            volumeIcon.textContent = '🔈';
        } else if (volume < 0.7) {
            volumeIcon.textContent = '🔉';
        } else {
            volumeIcon.textContent = '🔊';
        }
    }

    // Power-up states
    let powerUps = {
        speed: { active: false, timer: null, multiplier: 2 },
        shield: { active: false, timer: null },
        multiplier: { active: false, timer: null, value: 2 }
    };

    // Sound system using Web Audio API
    let audioContext;
    let masterGainNode;
    let soundsInitialized = false;
    
    // Initialize audio context
    function initAudioContext() {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                masterGainNode = audioContext.createGain();
                masterGainNode.connect(audioContext.destination);
                masterGainNode.gain.value = 0.5; // Master volume
                console.log('Audio context initialized successfully');
            }
            return true;
        } catch (e) {
            console.error('Failed to initialize audio context:', e);
            return false;
        }
    }
    
    // Sound generation functions
    function playCollectSound() {
        try {
            if (!audioContext) {
                if (!initAudioContext()) return;
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGainNode);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            
            console.log('Collect sound played');
        } catch (e) {
            console.error('Error playing collect sound:', e);
        }
    }
    
    function playPowerupSound() {
        try {
            if (!audioContext) {
                if (!initAudioContext()) return;
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGainNode);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            
            console.log('Powerup sound played');
        } catch (e) {
            console.error('Error playing powerup sound:', e);
        }
    }
    
    function playGameOverSound() {
        try {
            if (!audioContext) {
                if (!initAudioContext()) return;
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGainNode);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(110, audioContext.currentTime + 0.4);
            
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
            
            console.log('Game over sound played');
        } catch (e) {
            console.error('Error playing game over sound:', e);
        }
    }
    
    function playComboSound() {
        try {
            if (!audioContext) {
                if (!initAudioContext()) return;
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGainNode);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.05);
            oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            
            console.log('Combo sound played');
        } catch (e) {
            console.error('Error playing combo sound:', e);
        }
    }
    
    function playVillainSound() {
        try {
            if (!audioContext) {
                if (!initAudioContext()) return;
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGainNode);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(110, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            
            console.log('Villain sound played');
        } catch (e) {
            console.error('Error playing villain sound:', e);
        }
    }
    
    // Background music
    let backgroundOscillator;
    let backgroundGainNode;
    let backgroundInterval;
    
    function startBackgroundMusic() {
        try {
            if (!audioContext) {
                if (!initAudioContext()) return;
            }
            
            // Stop any existing background music
            stopBackgroundMusic();
            
            // Create new background music
            backgroundOscillator = audioContext.createOscillator();
            backgroundGainNode = audioContext.createGain();
            
            backgroundOscillator.connect(backgroundGainNode);
            backgroundGainNode.connect(masterGainNode);
            
            // Set lower volume for background music
            backgroundGainNode.gain.value = 0.15;
            
            // More upbeat retro background music pattern
            const notes = [523, 587, 659, 698, 784, 880, 784, 698, 659, 587];
            let noteIndex = 0;
            
            backgroundOscillator.type = 'square';
            backgroundOscillator.frequency.setValueAtTime(notes[0], audioContext.currentTime);
            
            backgroundOscillator.start();
            
            // Change notes every 0.3 seconds for a faster tempo
            backgroundInterval = setInterval(() => {
                noteIndex = (noteIndex + 1) % notes.length;
                backgroundOscillator.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
            }, 300);
            
            console.log('Background music started');
        } catch (e) {
            console.error('Error starting background music:', e);
        }
    }
    
    function stopBackgroundMusic() {
        try {
            if (backgroundOscillator) {
                backgroundOscillator.stop();
                backgroundOscillator = null;
            }
            
            if (backgroundInterval) {
                clearInterval(backgroundInterval);
                backgroundInterval = null;
            }
            
            console.log('Background music stopped');
        } catch (e) {
            console.error('Error stopping background music:', e);
        }
    }

    // Movement patterns for obstacles
    const movementPatterns = {
        straight: (obstacle, time) => {
            const speed = parseFloat(obstacle.dataset.speed);
            const direction = obstacle.dataset.direction;
            const currentLeft = parseFloat(obstacle.style.left);
            const newLeft = direction === 'left' ? currentLeft - speed : currentLeft + speed;
            obstacle.style.left = `${newLeft}px`;
        },
        zigzag: (obstacle, time) => {
            const speed = parseFloat(obstacle.dataset.speed);
            const direction = obstacle.dataset.direction;
            const currentLeft = parseFloat(obstacle.style.left);
            const currentTop = parseFloat(obstacle.style.top);
            const newLeft = direction === 'left' ? currentLeft - speed : currentLeft + speed;
            const newTop = currentTop + Math.sin(time / 500) * 3;
            obstacle.style.left = `${newLeft}px`;
            obstacle.style.top = `${newTop}px`;
        },
        spiral: (obstacle, time) => {
            const speed = parseFloat(obstacle.dataset.speed);
            const direction = obstacle.dataset.direction;
            const currentLeft = parseFloat(obstacle.style.left);
            const currentTop = parseFloat(obstacle.style.top);
            const centerY = window.innerHeight / 2;
            const radius = 50 + Math.sin(time / 1000) * 30;
            const angle = time / 500;
            const newLeft = direction === 'left' ? currentLeft - speed : currentLeft + speed;
            const newTop = centerY + Math.sin(angle) * radius;
            obstacle.style.left = `${newLeft}px`;
            obstacle.style.top = `${newTop}px`;
            obstacle.style.transform = `rotate(${angle * 30}deg)`;
        },
        bounce: (obstacle, time) => {
            const speed = parseFloat(obstacle.dataset.speed);
            const direction = obstacle.dataset.direction;
            const currentLeft = parseFloat(obstacle.style.left);
            const currentTop = parseFloat(obstacle.style.top);
            const newLeft = direction === 'left' ? currentLeft - speed : currentLeft + speed;
            const newTop = currentTop + Math.sin(time / 300) * 5;
            obstacle.style.left = `${newLeft}px`;
            obstacle.style.top = `${newTop}px`;
        }
    };

    // Obstacle types and their emojis
    const obstacleTypes = [
        { class: 'alien', emoji: '👾' },
        { class: 'meteor', emoji: '☄️' },
        { class: 'ufo', emoji: '🛸' },
        { class: 'rock', emoji: '🪨' },
        { class: 'super-alien', emoji: '👽', isSuper: true },
        { class: 'danger-alien', emoji: '👾', isDanger: true, points: -50 },
        { class: 'danger-alien', emoji: '👾', isDanger: true, points: -50 },
        { class: 'ghost', emoji: '👻', isVillain: true, points: -30 },
        { class: 'skull', emoji: '💀', isVillain: true, points: -40 },
        { class: 'poison', emoji: '☠️', isVillain: true, points: -60 },
        { class: 'bomb', emoji: '💣', isVillain: true, points: -70 }
    ];

    // Initialize background parallax
    function initParallax() {
        const stars = document.querySelector('.stars');
        const nebula = document.querySelector('.nebula');
        
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            stars.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
            nebula.style.transform = `translate(${x * 40}px, ${y * 40}px)`;
        });
    }

    // Power-up types
    const powerUpTypes = [
        { type: 'speed', emoji: '⚡', duration: 5000 },
        { type: 'shield', emoji: '🛡️', duration: 8000 },
        { type: 'multiplier', emoji: '✨', duration: 10000 }
    ];

    // Function to create power-up
    function createPowerUp() {
        if (Math.random() < 0.1) { // 10% chance to spawn power-up
            const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            const powerUp = document.createElement('div');
            powerUp.className = `power-up ${powerUpType.type}`;
            powerUp.textContent = powerUpType.emoji;
            powerUp.dataset.type = powerUpType.type;
            powerUp.dataset.duration = powerUpType.duration;
            
            // Random position
            powerUp.style.left = `${Math.random() * (window.innerWidth - 100)}px`;
            powerUp.style.top = `${Math.random() * (window.innerHeight - 100)}px`;
            
            document.body.appendChild(powerUp);
            
            // Remove after 10 seconds if not collected
            setTimeout(() => {
                if (powerUp.parentNode) {
                    powerUp.remove();
                }
            }, 10000);
        }
    }

    // Function to activate power-up
    function activatePowerUp(type, duration) {
        if (powerUps[type].active) {
            clearTimeout(powerUps[type].timer);
        }
        
        powerUps[type].active = true;
        document.getElementById(`${type}-icon`).classList.add('active');
        
        // Add visual effect
        const effect = document.createElement('div');
        effect.className = `${type}-effect`;
        document.body.appendChild(effect);
        
        // Play sound
        playPowerupSound();
        
        // Deactivate after duration
        powerUps[type].timer = setTimeout(() => {
            powerUps[type].active = false;
            document.getElementById(`${type}-icon`).classList.remove('active');
            effect.remove();
        }, duration);
    }

    // Modify the existing createPowerUp function
    const originalCreatePowerUp = createPowerUp;
    createPowerUp = function() {
        const powerUp = originalCreatePowerUp();
        if (powerUp) {
            createPowerUpEffect(
                parseFloat(powerUp.style.left),
                parseFloat(powerUp.style.top),
                powerUp.dataset.type
            );
        }
    };

    // Function to create a trail particle
    function createTrailParticle(x, y, speed) {
        const particle = document.createElement('div');
        particle.className = 'trail-particle';
        
        // Scale particle size based on speed
        const size = Math.min(20, 10 + speed * 0.5);
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Position particle at cursor position
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Set initial opacity based on speed
        const opacity = Math.min(1, 0.3 + speed * 0.1);
        particle.style.opacity = opacity;
        
        cursorTrail.appendChild(particle);
        activeParticles.push({
            element: particle,
            x: x,
            y: y,
            speed: speed,
            createdAt: Date.now()
        });
        
        // Remove old particles if we have too many
        while (activeParticles.length > maxParticles) {
            const oldParticle = activeParticles.shift();
            oldParticle.element.remove();
        }
    }

    // Function to update trail particles
    function updateTrailParticles() {
        const currentTime = Date.now();
        activeParticles = activeParticles.filter(particle => {
            const age = currentTime - particle.createdAt;
            const lifetime = 500; // Particle lifetime in milliseconds
            
            if (age > lifetime) {
                particle.element.remove();
                return false;
            }
            
            // Fade out based on age
            const opacity = 1 - (age / lifetime);
            particle.element.style.opacity = opacity * (0.3 + particle.speed * 0.1);
            
            // Shrink based on age
            const scale = 1 - (age / lifetime) * 0.5;
            const size = Math.min(20, (10 + particle.speed * 0.5) * scale);
            particle.element.style.width = `${size}px`;
            particle.element.style.height = `${size}px`;
            
            return true;
        });
        
        requestAnimationFrame(updateTrailParticles);
    }

    // Start particle update loop
    updateTrailParticles();

    // Update cursor position with smooth animation and trail effect
    document.addEventListener('mousemove', (e) => {
        // Reset inactivity timer on mouse movement
        resetInactivityTimer();
        
        const x = e.clientX;
        const y = e.clientY;
        
        const currentTime = Date.now();
        const deltaTime = currentTime - lastTime;
        
        // Calculate speed (pixels per millisecond)
        const distance = Math.hypot(x - lastX, y - lastY);
        const speed = distance / deltaTime;
        
        // Calculate angle for rocket rotation (adjusted to point top of rocket in movement direction)
        const angle = Math.atan2(y - lastY, x - lastX) * (180 / Math.PI) - 90;
        
        // Add current position to trail
        trailPositions.unshift({ x, y, speed });
        if (trailPositions.length > maxTrailLength) {
            trailPositions.pop();
        }

        // Create trail particles based on speed
        if (speed > 0.1) {
            const particleCount = Math.min(3, Math.floor(speed * 10));
            for (let i = 0; i < particleCount; i++) {
                createTrailParticle(x, y, speed);
            }
        }

        // Update cursor position and rotation
        requestAnimationFrame(() => {
            // Position cursor directly at mouse coordinates
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
            cursor.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        });

        // Check for obstacle collisions with more lenient detection
        document.querySelectorAll('.obstacle').forEach(obstacle => {
            if (!obstacle.classList.contains('burst')) {
                const rect = obstacle.getBoundingClientRect();
                const cursorRect = cursor.getBoundingClientRect();
                
                // Calculate centers
                const obstacleCenterX = rect.left + rect.width / 2;
                const obstacleCenterY = rect.top + rect.height / 2;
                const cursorCenterX = cursorRect.left + cursorRect.width / 2;
                const cursorCenterY = cursorRect.top + cursorRect.height / 2;
                
                // Calculate distance between centers
                const distance = Math.hypot(
                    cursorCenterX - obstacleCenterX,
                    cursorCenterY - obstacleCenterY
                );
                
                // Calculate collision threshold based on obstacle size
                const collisionThreshold = Math.max(rect.width, rect.height) * 0.6;
                
                if (distance < collisionThreshold) {
                    // Add burst class to trigger animation
                    obstacle.classList.add('burst');
                    
                    // Add screen shake
                    addScreenShake();
                    
                    // Check if it's a super alien, danger alien, or villain
                    const isSuper = obstacle.classList.contains('super-alien');
                    const isDanger = obstacle.classList.contains('danger-alien');
                    const isVillain = obstacle.classList.contains('ghost') || 
                                     obstacle.classList.contains('skull') || 
                                     obstacle.classList.contains('poison') || 
                                     obstacle.classList.contains('bomb');
                    
                    // Update combo only for good obstacles
                    if (!isDanger && !isVillain) {
                        if (currentTime - lastHitTime < comboTimeout) {
                            combo++;
                        } else {
                            combo = 1;
                        }
                        lastHitTime = currentTime;
                        
                        // Show combo text if combo is greater than 1
                        if (combo > 1) {
                            showComboText();
                        }
                    } else {
                        // Reset combo when hitting an enemy
                        combo = 0;
                        lastHitTime = 0;
                    }
                    
                    let points = 10;
                    if (isSuper) {
                        points = 30;
                        showSuperAlienEffect();
                    } else if (isDanger || isVillain) {
                        points = obstacle.dataset.points ? parseInt(obstacle.dataset.points) : -50;
                        
                        if (isDanger) {
                            showDangerAlienEffect();
                        } else if (obstacle.classList.contains('ghost')) {
                            showGhostEffect();
                        } else if (obstacle.classList.contains('skull')) {
                            showSkullEffect();
                        } else if (obstacle.classList.contains('poison')) {
                            showPoisonEffect();
                        } else if (obstacle.classList.contains('bomb')) {
                            showBombEffect();
                        }
                    }
                    
                    // Apply combo multiplier to positive points only
                    if (points > 0) {
                        points *= combo;
                    }
                    
                    // Apply power-up multiplier if active
                    if (powerUps.multiplier.active && points > 0) {
                        points *= powerUps.multiplier.value;
                    }
                    
                    // Don't apply negative points if shield is active
                    if (powerUps.shield.active && points < 0) {
                        points = 0;
                    }
                    
                    score += points;
                    scoreElement.textContent = score;
                    showScoreChange(points);
                    
                    // Check for game over condition
                    if (score <= 0) {
                        gameOver("Score reached zero");
                    }
                    
                    // Play collect sound
                    if (isDanger || isVillain) {
                        playVillainSound();
                    } else {
                        playCollectSound();
                    }
                    
                    // Create burst particles with different colors based on obstacle type
                    const colors = obstacle.classList.contains('alien') ? ['#00ff87', '#60efff'] :
                                 obstacle.classList.contains('meteor') ? ['#ff6b6b', '#ffd93d'] :
                                 obstacle.classList.contains('ufo') ? ['#a8e6cf', '#dcedc1'] :
                                 obstacle.classList.contains('super-alien') ? ['#4169e1', '#00bfff'] :
                                 obstacle.classList.contains('danger-alien') ? ['#ff0000', '#ff4500'] :
                                 obstacle.classList.contains('ghost') ? ['#c8c8ff', '#ffffff'] :
                                 obstacle.classList.contains('skull') ? ['#969696', '#505050'] :
                                 obstacle.classList.contains('poison') ? ['#00ff00', '#008000'] :
                                 obstacle.classList.contains('bomb') ? ['#ffa500', '#ff4500'] :
                                 ['#8b4513', '#a0522d'];
                    
                    createBurstParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, colors);
                    
                    // Remove obstacle after animation
                    setTimeout(() => {
                        obstacle.remove();
                    }, 1000);
                }
            }
        });

        // Check for power-up collisions
        document.querySelectorAll('.power-up').forEach(powerUp => {
            const rect = powerUp.getBoundingClientRect();
            const distance = Math.hypot(
                x - (rect.left + rect.width / 2),
                y - (rect.top + rect.height / 2)
            );

            if (distance < 30) {
                const type = powerUp.dataset.type;
                const duration = parseInt(powerUp.dataset.duration);
                activatePowerUp(type, duration);
                powerUp.remove();
            }
        });

        lastX = x;
        lastY = y;
        lastTime = currentTime;
        lastSpeed = speed;
    });

    // Function to show combo text
    function showComboText() {
        const comboElement = document.createElement('div');
        comboElement.className = 'combo-text';
        comboElement.textContent = `${combo}x COMBO!`;
        
        // Add combo multiplier effect
        if (combo >= 5) {
            comboElement.classList.add('super-combo');
        }
        
        document.body.appendChild(comboElement);
        
        // Play combo sound with increasing pitch
        playComboSound();
        
        setTimeout(() => comboElement.remove(), 1000);
    }

    // Function to add screen shake
    function addScreenShake() {
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }

    // Function to show score change
    function showScoreChange(points) {
        scoreElement.classList.add('score-change');
        setTimeout(() => {
            scoreElement.classList.remove('score-change');
        }, 500);
    }

    // Function to create enhanced burst particles
    function createBurstParticles(x, y, colors) {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.background = `linear-gradient(45deg, ${colors[0]}, ${colors[1]})`;
            document.body.appendChild(particle);

            const angle = (Math.random() * 360) * (Math.PI / 180);
            const velocity = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            let posX = x;
            let posY = y;
            let opacity = 1;

            function animateParticle() {
                posX += vx;
                posY += vy;
                opacity -= 0.02;

                particle.style.transform = `translate(${posX - x}px, ${posY - y}px)`;
                particle.style.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    particle.remove();
                }
            }

            requestAnimationFrame(animateParticle);
        }
    }

    // Handle cursor effects on floating elements
    floatingElements.forEach(element => {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 5;
            const rotateY = (centerX - x) / 5;
            
            element.style.transform = `
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg) 
                scale(1.2)
                translateZ(50px)
            `;
            
            cursor.style.transform = `translate(${e.clientX - 15}px, ${e.clientY - 15}px) rotate(${angle}deg) scale(1.5)`;
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1) translateZ(0)';
            cursor.style.transform = `translate(${event.clientX - 15}px, ${event.clientY - 15}px) rotate(${angle}deg) scale(1)`;
        });
    });

    // Add floating animation to elements
    floatingElements.forEach((element, index) => {
        const baseX = parseFloat(getComputedStyle(element).left);
        const baseY = parseFloat(getComputedStyle(element).top);
        
        animate();
        
        function animate() {
            const time = Date.now() / 1000;
            const offsetX = Math.sin(time + index) * 15;
            const offsetY = Math.cos(time + index) * 15;
            
            element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            requestAnimationFrame(animate);
        }
    });

    // Handle cursor entering/leaving window
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        cursorTrail.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        cursorTrail.style.opacity = '0';
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        // Ensure cursor stays within bounds after resize
        const x = Math.max(0, Math.min(lastX, window.innerWidth));
        const y = Math.max(0, Math.min(lastY, window.innerHeight));
        const cursorSize = 30;
        const safeX = Math.max(cursorSize/2, Math.min(x, window.innerWidth - cursorSize/2));
        const safeY = Math.max(cursorSize/2, Math.min(y, window.innerHeight - cursorSize/2));
        
        cursor.style.transform = `translate(${safeX - cursorSize/2}px, ${safeY - cursorSize/2}px) rotate(${Math.atan2(y - lastY, x - lastX) * (180 / Math.PI)}deg)`;
    });

    // Function to show super alien effect
    function showSuperAlienEffect() {
        superAlienActive = true;
        document.body.classList.add('super-alien-active');
        
        // Create a flash effect
        const flash = document.createElement('div');
        flash.className = 'super-flash';
        document.body.appendChild(flash);
        
        // Remove the effect after animation
        setTimeout(() => {
            flash.remove();
            document.body.classList.remove('super-alien-active');
            superAlienActive = false;
        }, 1000);
    }

    // Function to show danger alien effect
    function showDangerAlienEffect() {
        document.body.classList.add('danger-alien-active');
        
        // Create a flash effect
        const flash = document.createElement('div');
        flash.className = 'danger-flash';
        document.body.appendChild(flash);
        
        // Remove the effect after animation
        setTimeout(() => {
            flash.remove();
            document.body.classList.remove('danger-alien-active');
        }, 1000);
    }

    // Function to show ghost effect
    function showGhostEffect() {
        document.body.classList.add('ghost-active');
        
        // Create a flash effect
        const flash = document.createElement('div');
        flash.className = 'ghost-flash';
        document.body.appendChild(flash);
        
        // Remove the effect after animation
        setTimeout(() => {
            flash.remove();
            document.body.classList.remove('ghost-active');
        }, 1000);
    }
    
    // Function to show skull effect
    function showSkullEffect() {
        document.body.classList.add('skull-active');
        
        // Create a flash effect
        const flash = document.createElement('div');
        flash.className = 'skull-flash';
        document.body.appendChild(flash);
        
        // Remove the effect after animation
        setTimeout(() => {
            flash.remove();
            document.body.classList.remove('skull-active');
        }, 1000);
    }
    
    // Function to show poison effect
    function showPoisonEffect() {
        document.body.classList.add('poison-active');
        
        // Create a flash effect
        const flash = document.createElement('div');
        flash.className = 'poison-flash';
        document.body.appendChild(flash);
        
        // Remove the effect after animation
        setTimeout(() => {
            flash.remove();
            document.body.classList.remove('poison-active');
        }, 1000);
    }
    
    // Function to show bomb effect
    function showBombEffect() {
        document.body.classList.add('bomb-active');
        
        // Create a flash effect
        const flash = document.createElement('div');
        flash.className = 'bomb-flash';
        document.body.appendChild(flash);
        
        // Remove the effect after animation
        setTimeout(() => {
            flash.remove();
            document.body.classList.remove('bomb-active');
        }, 1000);
    }

    // Function to update timeout counter
    function updateTimeoutCounter() {
        const timeLeft = Math.max(0, inactivityTimeout - (Date.now() - lastActivityTime));
        const secondsLeft = (timeLeft / 1000).toFixed(1);
        timeoutElement.textContent = secondsLeft;
        
        // Add warning class when less than 2 seconds remaining
        if (timeLeft < 2000) {
            timeoutCounterElement.classList.add('warning');
        } else {
            timeoutCounterElement.classList.remove('warning');
        }
    }

    // Reset inactivity timer
    function resetInactivityTimer() {
        lastActivityTime = Date.now();
        
        // Clear existing timers
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        if (timeoutCounter) {
            clearInterval(timeoutCounter);
        }
        
        // Reset timeout counter display
        timeoutElement.textContent = (inactivityTimeout / 1000).toFixed(1);
        timeoutCounterElement.classList.remove('warning');
        
        // Start new timeout counter
        timeoutCounter = setInterval(updateTimeoutCounter, 100);
        
        // Set new timer
        inactivityTimer = setTimeout(() => {
            if (Date.now() - lastActivityTime >= inactivityTimeout) {
                gameOver("Inactivity timeout");
            }
        }, inactivityTimeout);
    }
    
    // Initialize inactivity timer
    resetInactivityTimer();

    // Function to handle game over
    function gameOver(reason = "Score reached zero") {
        // Stop spawning new obstacles
        clearTimeout(spawnTimer);
        clearTimeout(inactivityTimer);
        clearInterval(timeoutCounter);
        
        // Stop all obstacle movement
        document.querySelectorAll('.obstacle').forEach(obstacle => obstacle.remove());
        
        // Remove all power-ups
        document.querySelectorAll('.power-up').forEach(powerUp => powerUp.remove());
        
        // Reset power-up states
        Object.keys(powerUps).forEach(type => {
            if (powerUps[type].active) {
                clearTimeout(powerUps[type].timer);
                powerUps[type].active = false;
                document.getElementById(`${type}-icon`).classList.remove('active');
            }
        });
        
        // Stop background music
        stopBackgroundMusic();
        
        // Play game over sound
        playGameOverSound();
        
        // Create game over message
        const gameOverMessage = document.createElement('div');
        gameOverMessage.className = 'game-over';
        gameOverMessage.innerHTML = `
            <h2>Game Over</h2>
            <p>Your score: ${score}</p>
            <p class="game-over-reason">${reason}</p>
            <button id="restart-button">Play Again</button>
        `;
        document.body.appendChild(gameOverMessage);
        
        // Add restart functionality
        document.getElementById('restart-button').addEventListener('click', () => {
            // Restart background music
            startBackgroundMusic();
            
            // Remove game over message
            gameOverMessage.remove();
            
            // Reset game state
            score = 0;
            combo = 0;
            lastHitTime = 0;
            scoreElement.textContent = score;
            
            // Reset spawn interval
            spawnInterval = 800;
            
            // Reset game start time
            gameStartTime = Date.now();
            
            // Reset last activity time
            lastActivityTime = Date.now();
            
            // Reset timeout counter display
            timeoutElement.textContent = (inactivityTimeout / 1000).toFixed(1);
            timeoutCounterElement.classList.remove('warning');
            
            // Start spawning obstacles again
            scheduleNextSpawn();
            
            // Reset inactivity timer
            resetInactivityTimer();
        });
    }

    // Function to update obstacle positions
    function updateObstacles() {
        const obstacles = document.querySelectorAll('.obstacle');
        const currentTime = Date.now();
        
        obstacles.forEach(obstacle => {
            if (obstacle.classList.contains('burst')) {
                // Get burst velocity
                const burstVX = parseFloat(obstacle.dataset.burstVX);
                const burstVY = parseFloat(obstacle.dataset.burstVY);
                const burstTime = parseInt(obstacle.dataset.burstTime);
                const burstAge = currentTime - burstTime;
                
                // Apply burst velocity with deceleration
                const deceleration = 0.98; // Slow down over time
                const currentVX = burstVX * Math.pow(deceleration, burstAge / 100);
                const currentVY = burstVY * Math.pow(deceleration, burstAge / 100);
                
                // Get current position
                const currentLeft = parseFloat(obstacle.style.left);
                const currentTop = parseFloat(obstacle.style.top);
                
                // Update position with burst velocity
                obstacle.style.left = `${currentLeft + currentVX}px`;
                obstacle.style.top = `${currentTop + currentVY}px`;
                
                // Add rotation based on movement direction
                const rotationSpeed = 10;
                const currentRotation = parseFloat(obstacle.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
                const newRotation = currentRotation + (currentVX > 0 ? rotationSpeed : -rotationSpeed);
                obstacle.style.transform = `rotate(${newRotation}deg)`;
                
                // Fade out over time
                const opacity = Math.max(0, 1 - (burstAge / 1000));
                obstacle.style.opacity = opacity;
                
                return; // Skip normal movement for bursting obstacles
            }
            
            const pattern = obstacle.dataset.pattern;
            const startTime = parseInt(obstacle.dataset.startTime);
            const timeSinceStart = currentTime - startTime;
            
            // Apply movement pattern
            movementPatterns[pattern](obstacle, timeSinceStart);
            
            // Check if obstacle is off-screen and remove it
            const currentLeft = parseFloat(obstacle.style.left);
            const currentTop = parseFloat(obstacle.style.top);
            const direction = obstacle.dataset.direction;
            
            if ((direction === 'left' && currentLeft < -100) || 
                (direction === 'right' && currentLeft > window.innerWidth + 100) ||
                currentTop < -100 || currentTop > window.innerHeight + 100) {
                obstacle.remove();
            }
        });
        
        requestAnimationFrame(updateObstacles);
    }
    
    // Start obstacle movement animation
    updateObstacles();

    // Initialize game
    function initGame() {
        initParallax();
        initSounds();
        scheduleNextSpawn();
        resetInactivityTimer();
    }

    // Start the game
    initGame();

    // Initialize sounds
    function initSounds() {
        if (soundsInitialized) return;
        
        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            if (!audioContext && initAudioContext()) {
                startBackgroundMusic();
                soundsInitialized = true;
                console.log('Sounds initialized on first user interaction');
            }
        }, { once: true });
        
        // Also try to initialize on any user interaction
        const initOnInteraction = () => {
            if (!audioContext && initAudioContext()) {
                startBackgroundMusic();
                soundsInitialized = true;
                console.log('Sounds initialized on user interaction');
                document.removeEventListener('keydown', initOnInteraction);
                document.removeEventListener('mousemove', initOnInteraction);
                document.removeEventListener('touchstart', initOnInteraction);
            }
        };
        
        document.addEventListener('keydown', initOnInteraction);
        document.addEventListener('mousemove', initOnInteraction);
        document.addEventListener('touchstart', initOnInteraction);
    }

    // High score system
    let highScore = localStorage.getItem('highScore') || 0;
    const highScoreElement = document.createElement('div');
    highScoreElement.className = 'high-score';
    highScoreElement.innerHTML = `High Score: <span>${highScore}</span>`;
    document.querySelector('.content').appendChild(highScoreElement);

    // Update high score
    function updateHighScore() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            highScoreElement.querySelector('span').textContent = highScore;
            
            // Show new high score animation
            const celebration = document.createElement('div');
            celebration.className = 'high-score-celebration';
            celebration.textContent = 'NEW HIGH SCORE!';
            document.body.appendChild(celebration);
            
            setTimeout(() => celebration.remove(), 2000);
        }
    }

    // Enhanced visual effects
    function createPowerUpEffect(x, y, type) {
        const effect = document.createElement('div');
        effect.className = `power-up-effect ${type}`;
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        document.body.appendChild(effect);
        
        setTimeout(() => effect.remove(), 1000);
    }

    // Power-up duration indicator
    function showPowerUpDuration(type, duration) {
        const indicator = document.createElement('div');
        indicator.className = `power-up-indicator ${type}`;
        indicator.innerHTML = `
            <div class="power-up-icon">${type === 'speed' ? '⚡' : type === 'shield' ? '🛡️' : '✨'}</div>
            <div class="power-up-timer"></div>
        `;
        document.body.appendChild(indicator);
        
        const timer = indicator.querySelector('.power-up-timer');
        const startTime = Date.now();
        
        const updateTimer = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const percentage = (remaining / duration) * 100;
            
            timer.style.width = `${percentage}%`;
            
            if (remaining > 0) {
                requestAnimationFrame(updateTimer);
            } else {
                indicator.remove();
            }
        };
        
        requestAnimationFrame(updateTimer);
    }

    // Modify the existing game over function
    const originalGameOver = gameOver;
    gameOver = function(reason = "Score reached zero") {
        updateHighScore();
        originalGameOver(reason);
    };

    // Function to create obstacle
    function createObstacle() {
        const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const obstacle = document.createElement('div');
        obstacle.className = `obstacle ${obstacleType.class}`;
        obstacle.textContent = obstacleType.emoji;
        
        // Set random position
        const direction = Math.random() < 0.5 ? 'left' : 'right';
        const startX = direction === 'left' ? window.innerWidth + 50 : -50;
        const startY = Math.random() * (window.innerHeight - 100) + 50;
        
        obstacle.style.left = `${startX}px`;
        obstacle.style.top = `${startY}px`;
        
        // Set random speed
        const speed = 2 + Math.random() * 3;
        obstacle.dataset.speed = speed;
        obstacle.dataset.direction = direction;
        
        // Set random movement pattern
        const patterns = ['straight', 'zigzag', 'spiral', 'bounce'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        obstacle.dataset.pattern = pattern;
        
        // Set points for villains
        if (obstacleType.isVillain || obstacleType.isDanger) {
            obstacle.dataset.points = obstacleType.points;
        }
        
        document.body.appendChild(obstacle);
        
        // Remove obstacle if it goes off screen
        const checkPosition = () => {
            const rect = obstacle.getBoundingClientRect();
            if ((direction === 'left' && rect.right < 0) || 
                (direction === 'right' && rect.left > window.innerWidth)) {
                obstacle.remove();
            } else {
                requestAnimationFrame(checkPosition);
            }
        };
        requestAnimationFrame(checkPosition);
    }

    // Function to schedule next obstacle spawn
    function scheduleNextSpawn() {
        if (spawnTimer) {
            clearTimeout(spawnTimer);
        }
        
        // Calculate next spawn interval (decreases over time)
        const timeElapsed = Date.now() - gameStartTime;
        const newInterval = Math.max(minSpawnInterval, 
            spawnInterval - (timeElapsed / 10000) * 50); // Decrease by 50ms every 10 seconds
        
        spawnTimer = setTimeout(() => {
            if (document.querySelectorAll('.obstacle').length < maxObstacles) {
                createObstacle();
            }
            scheduleNextSpawn();
        }, newInterval);
    }

    // Start spawning obstacles
    scheduleNextSpawn();
}); 