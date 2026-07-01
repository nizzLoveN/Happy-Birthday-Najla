/**
 * --------------------------------------------------------------------------
 * PREMIUN INTERACTIVE BIRTHDAY EXPERIENCE SCRIPT
 * Architecture: Modular Vanilla JS (ES6+)
 * --------------------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- APP STATE & CACHE ---
    const DOM = {
        cursor: document.getElementById('custom-cursor'),
        trail: document.getElementById('cursor-trail'),
        loading: document.getElementById('loading-screen'),
        progress: document.getElementById('progress-bar'),
        themeBtn: document.getElementById('theme-toggle'),
        musicBtn: document.getElementById('play-pause-btn'),
        audio: document.getElementById('bg-music'),
        visualizer: document.getElementById('visualizer'),
        polaroids: document.querySelectorAll('.polaroid'),
        envelope: document.getElementById('envelope'),
        giftBox: document.getElementById('gift-box'),
        sections: document.querySelectorAll('.hidden-section'),
        wishForm: document.getElementById('wish-form'),
        wishInput: document.getElementById('wish-input'),
        wishesList: document.getElementById('wishes-list'),
        canvas: document.getElementById('particle-canvas')
    };

    let audioContext, analyser, dataArray;
    let isMusicPlaying = false;

    // --- 1. LOADING SCREEN ---
    let progressValue = 0;
    const progressInterval = setInterval(() => {
        progressValue += Math.random() * 15;
        if (progressValue >= 100) {
            progressValue = 100;
            clearInterval(progressInterval);
            setTimeout(() => {
                DOM.loading.style.opacity = '0';
                setTimeout(() => DOM.loading.style.display = 'none', 1000);
                initSakuraPhysics(); // Start canvas after load
            }, 800);
        }
        DOM.progress.style.width = `${progressValue}%`;
    }, 150);

    // --- 2. CUSTOM CURSOR (MAGNETIC & SMOOTH) ---
    let mouseX = 0, mouseY = 0;
    let trailX = 0, trailY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        DOM.cursor.style.left = `${mouseX}px`;
        DOM.cursor.style.top = `${mouseY}px`;
    });

    const animateTrail = () => {
        // Easing for trail effect
        trailX += (mouseX - trailX) * 0.15;
        trailY += (mouseY - trailY) * 0.15;
        DOM.trail.style.left = `${trailX}px`;
        DOM.trail.style.top = `${trailY}px`;
        requestAnimationFrame(animateTrail);
    };
    animateTrail();

    // Hover effect on interactive elements
    const interactives = document.querySelectorAll('button, .polaroid, .envelope, .gift-box');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
            DOM.cursor.style.transform = 'translate(-50%, -50%) scale(2)';
            DOM.trail.style.transform = 'translate(-50%, -50%) scale(1.5)';
            DOM.trail.style.borderColor = 'transparent';
            DOM.trail.style.background = 'rgba(255, 182, 193, 0.3)';
        });
        el.addEventListener('mouseleave', () => {
            DOM.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            DOM.trail.style.transform = 'translate(-50%, -50%) scale(1)';
            DOM.trail.style.borderColor = 'var(--accent-pink)';
            DOM.trail.style.background = 'transparent';
        });
    });

    // --- 3. THEME TOGGLE (DAY/NIGHT) ---
    const checkTimeTheme = () => {
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 6) {
            document.body.classList.remove('theme-day');
            document.body.classList.add('theme-night');
            DOM.themeBtn.innerHTML = '☀️';
        }
    };
    checkTimeTheme();

    DOM.themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('theme-night');
        document.body.classList.toggle('theme-day');
        DOM.themeBtn.innerHTML = document.body.classList.contains('theme-night') ? '☀️' : '🌙';
    });

    // --- 4. SCROLL ANIMATIONS (INTERSECTION OBSERVER) ---
    const observerOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: Unobserve if you only want it to animate once
                // scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    DOM.sections.forEach(sec => scrollObserver.observe(sec));

    // --- 5. DRAGGABLE POLAROIDS (PHYSICS BASED) ---
    let zIndexCounter = 10;
    
    // Initial random placement
    DOM.polaroids.forEach((polaroid, index) => {
        const randomX = Math.random() * (window.innerWidth - 300) + 50;
        const randomY = Math.random() * 200 + 50;
        const randomRotate = (Math.random() - 0.5) * 30; // -15 to +15 deg
        
        polaroid.style.left = `${randomX}px`;
        polaroid.style.top = `${randomY}px`;
        polaroid.style.transform = `rotate(${randomRotate}deg)`;
        polaroid.dataset.rotation = randomRotate;

        // Drag Logic
        let isDragging = false;
        let startX, startY, initialX, initialY;

        polaroid.addEventListener('mousedown', dragStart);
        polaroid.addEventListener('touchstart', dragStart, {passive: false});

        function dragStart(e) {
            e.preventDefault(); // prevent image ghost dragging
            isDragging = true;
            polaroid.classList.add('dragging');
            zIndexCounter++;
            polaroid.style.zIndex = zIndexCounter;

            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

            initialX = parseFloat(polaroid.style.left) || 0;
            initialY = parseFloat(polaroid.style.top) || 0;
            startX = clientX - initialX;
            startY = clientY - initialY;
            
            // Remove rotation during drag for better feel
            polaroid.style.transform = `rotate(0deg) scale(1.05)`;

            document.addEventListener('mousemove', dragMove);
            document.addEventListener('touchmove', dragMove, {passive: false});
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchend', dragEnd);
        }

        function dragMove(e) {
            if (!isDragging) return;
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

            polaroid.style.left = `${clientX - startX}px`;
            polaroid.style.top = `${clientY - startY}px`;
        }

        function dragEnd() {
            isDragging = false;
            polaroid.classList.remove('dragging');
            // Restore rotation
            polaroid.style.transform = `rotate(${polaroid.dataset.rotation}deg) scale(1)`;
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('touchmove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchend', dragEnd);
        }
    });

    // --- 6. ROMANTIC LETTER INTERACTION ---
    DOM.envelope.addEventListener('click', () => {
        DOM.envelope.classList.toggle('open');
    });

    // --- 7. GIFT BOX ANIMATION & CONFETTI ---
    DOM.giftBox.addEventListener('click', () => {
        if(!DOM.giftBox.classList.contains('opened')){
            DOM.giftBox.classList.add('opened');
            shootConfetti();
            
            // Show romantic message
            setTimeout(() => {
                const msg = document.createElement('h3');
                msg.className = 'handwritten fade-up is-visible';
                msg.style.marginTop = '2rem';
                msg.innerText = "Kado terbesarku adalah dirimu. I love you! ❤️";
                DOM.giftBox.parentElement.appendChild(msg);
            }, 1000);
        }
    });

    function shootConfetti() {
        const colors = ['#ffb6c1', '#b6d4ff', '#ffffff', '#ff6b81'];
        for(let i=0; i<50; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = '50%';
            confetti.style.top = '50%';
            confetti.style.zIndex = '1000';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            document.getElementById('gift').appendChild(confetti);

            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity - 100;

            confetti.animate([
                { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) rotate(${Math.random()*360}deg)`, opacity: 1, offset: 0.5 },
                { transform: `translate(${tx}px, ${ty+200}px) rotate(${Math.random()*720}deg)`, opacity: 0 }
            ], {
                duration: 1500 + Math.random() * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => confetti.remove();
        }
    }

    // --- 8. AUDIO PLAYER & VISUALIZER ---
    // Generate bars
    for(let i=0; i<10; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        DOM.visualizer.appendChild(bar);
    }
    const bars = document.querySelectorAll('.bar');

    DOM.musicBtn.addEventListener('click', () => {
        if(isMusicPlaying) {
            DOM.audio.pause();
            DOM.musicBtn.innerText = '▶';
            isMusicPlaying = false;
        } else {
            DOM.audio.play().catch(e => console.log("Audio play blocked until interaction."));
            DOM.musicBtn.innerText = '⏸';
            isMusicPlaying = true;
            initAudioContext();
        }
    });

    function initAudioContext() {
        if (audioContext) return; // Only init once
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(DOM.audio);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        renderFrame();
    }

    function renderFrame() {
        requestAnimationFrame(renderFrame);
        if(!isMusicPlaying) return;
        analyser.getByteFrequencyData(dataArray);
        bars.forEach((bar, index) => {
            // Map data array to bar height (max ~15px)
            const height = (dataArray[index] / 255) * 15;
            bar.style.height = `${Math.max(2, height)}px`;
        });
    }

    // --- 9. GUESTBOOK (LOCAL STORAGE) ---
    const loadWishes = () => {
        const wishes = JSON.parse(localStorage.getItem('birthday_wishes') || '[]');
        DOM.wishesList.innerHTML = '';
        wishes.forEach(wish => {
            const div = document.createElement('div');
            div.className = 'wish-item fade-up is-visible';
            div.innerText = wish;
            DOM.wishesList.appendChild(div);
        });
    };
    loadWishes();

    DOM.wishForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = DOM.wishInput.value.trim();
        if(val) {
            const wishes = JSON.parse(localStorage.getItem('birthday_wishes') || '[]');
            wishes.push(val);
            localStorage.setItem('birthday_wishes', JSON.stringify(wishes));
            DOM.wishInput.value = '';
            loadWishes();
        }
    });

    // --- 10. SAKURA PARTICLE SYSTEM (CANVAS) ---
    function initSakuraPhysics() {
        const ctx = DOM.canvas.getContext('2d');
        let width = DOM.canvas.width = window.innerWidth;
        let height = DOM.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            width = DOM.canvas.width = window.innerWidth;
            height = DOM.canvas.height = window.innerHeight;
        });

        const petals = [];
        const petalCount = 40; // Optimize for performance

        for (let i = 0; i < petalCount; i++) {
            petals.push({
                x: Math.random() * width,
                y: Math.random() * height - height,
                size: Math.random() * 5 + 3,
                speedY: Math.random() * 1 + 0.5,
                speedX: Math.random() * 1 - 0.5,
                rotation: Math.random() * 360,
                spinSpeed: Math.random() * 2 - 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        function drawPetal(p) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.globalAlpha = p.opacity;
            
            // Draw soft pink petal
            ctx.fillStyle = document.body.classList.contains('theme-night') ? '#ffffff' : '#ffb6c1';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(p.size, -p.size, p.size*2, p.size, 0, p.size*1.5);
            ctx.bezierCurveTo(-p.size*2, p.size, -p.size, -p.size, 0, 0);
            ctx.fill();
            ctx.restore();
        }

        function animateSakura() {
            ctx.clearRect(0, 0, width, height);
            
            petals.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.spinSpeed;

                // Wind effect (sine wave)
                p.x += Math.sin(p.y / 100) * 0.5;

                // Reset position if off screen
                if (p.y > height + p.size) {
                    p.y = -p.size;
                    p.x = Math.random() * width;
                }
                if (p.x > width + p.size) p.x = -p.size;
                if (p.x < -p.size) p.x = width + p.size;

                drawPetal(p);
            });
            requestAnimationFrame(animateSakura);
        }
        animateSakura();
    }

});
