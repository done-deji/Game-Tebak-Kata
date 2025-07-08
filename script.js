document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen Game Tebak Angka ---
    const guessGameContainer = document.getElementById('guessGameContainer');
    const guessInput = document.getElementById('guessInput');
    const checkButton = document.getElementById('checkButton');
    const message = document.getElementById('message');
    const resetButton = document.getElementById('resetButton');

    // --- Elemen Overlay ---
    const winOverlay = document.getElementById('winOverlay');
    const winMessage = document.getElementById('winMessage');
    const closeWinOverlayBtn = winOverlay.querySelector('.close-overlay-btn');

    const loseOverlay = document.getElementById('loseOverlay');
    const loseMessage = document.getElementById('loseMessage');
    const closeLoseOverlayBtn = loseOverlay.querySelector('.close-overlay-btn');

    // --- Elemen Game Tempur ---
    const combatGameContainer = document.getElementById('combatGameContainer');
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    const backToGuessButton = document.getElementById('backToGuessButton');

    // --- Elemen Efek Background ---
    const backgroundEffectsContainer = document.querySelector('.background-effects');

    // --- Variabel Game Tebak Angka ---
    let randomNumber;
    let attempts;
    const MAX_ATTEMPTS = 20;

    // --- Variabel Game Tempur Sederhana ---
    let player_spaceship_image = new Image();
    player_spaceship_image.src = 'player_spaceship.png'; // PASTIKAN PATH GAMBAR BENAR!

    let player = {}; // Akan diinisialisasi di initCombatGame
    let bullets = [];
    let targets = [];
    let score = 0;
    let combatGameInterval;
    let spawnTargetInterval;

    // --- Variabel untuk Input Keyboard (Pergerakan Ditahan) ---
    const keys = {};
    const PLAYER_SPEED = 7;

    // --- Definisi State dan Transisi (FSM Inti) ---
    const GAME_STATES = {
        LOADING: 'LOADING',
        GUESSING_GAME: 'GUESSING_GAME',
        COMBAT_GAME: 'COMBAT_GAME',
        WIN_OVERLAY: 'WIN_OVERLAY',
        LOSE_OVERLAY: 'LOSE_OVERLAY',
    };

    let currentState = GAME_STATES.LOADING; // State awal

    // Fungsi untuk mengubah state game
    function transitionTo(newState, payload = null) {
        // Logika keluar dari state sebelumnya
        exitState(currentState);

        // Atur state baru
        currentState = newState;
        console.log(`Transitioning to: ${newState}`); // Untuk debugging

        // Logika masuk ke state baru
        enterState(newState, payload);
    }

    // Logika yang dijalankan saat keluar dari sebuah state
    function exitState(state) {
        switch (state) {
            case GAME_STATES.GUESSING_GAME:
                // Sembunyikan container tebak angka
                guessGameContainer.classList.remove('active');
                break;
            case GAME_STATES.COMBAT_GAME:
                // Sembunyikan container tempur dan hentikan interval
                combatGameContainer.classList.remove('active');
                if (combatGameInterval) clearInterval(combatGameInterval);
                if (spawnTargetInterval) clearInterval(spawnTargetInterval);
                // Reset status tombol
                for (const key in keys) { if (keys.hasOwnProperty(key)) keys[key] = false; }
                break;
            case GAME_STATES.WIN_OVERLAY:
                winOverlay.classList.remove('show');
                break;
            case GAME_STATES.LOSE_OVERLAY:
                loseOverlay.classList.remove('show');
                break;
            case GAME_STATES.LOADING:
                // Tidak ada elemen spesifik untuk disembunyikan saat keluar dari loading
                break;
        }
    }

    // Logika yang dijalankan saat masuk ke sebuah state
    function enterState(state, payload) {
        // Beri delay untuk transisi visual antar container
        setTimeout(() => { // Delay ini sesuai dengan transition opacity di CSS
            switch (state) {
                case GAME_STATES.LOADING:
                    // Misalnya, tampilkan loading spinner atau layar splash
                    // Kita akan transisi langsung ke guessing_game setelah aset dimuat
                    break;
                case GAME_STATES.GUESSING_GAME:
                    guessGameContainer.classList.add('active');
                    startGame(); // Inisialisasi game tebak angka
                    break;
                case GAME_STATES.COMBAT_GAME:
                    combatGameContainer.classList.add('active');
                    initCombatGame(); // Inisialisasi dan mulai game tempur
                    break;
                case GAME_STATES.WIN_OVERLAY:
                    winMessage.textContent = payload.message; // Gunakan payload dari transisi
                    showOverlay(winOverlay); // Tampilkan overlay dengan animasi
                    closeWinOverlayBtn.focus();
                    break;
                case GAME_STATES.LOSE_OVERLAY:
                    loseMessage.textContent = payload.message; // Gunakan payload dari transisi
                    showOverlay(loseOverlay); // Tampilkan overlay dengan animasi
                    closeLoseOverlayBtn.focus();
                    break;
            }
        }, state === GAME_STATES.GUESSING_GAME || state === GAME_STATES.COMBAT_GAME ? 800 : 0); // Hanya delay saat transisi antar game mode
    }

    // --- Fungsi Game Tebak Angka ---
    function startGame() {
        randomNumber = Math.floor(Math.random() * 100) + 1;
        attempts = 0;
        updateMessage(`Tebak angka antara 1 dan 100. Kamu punya ${MAX_ATTEMPTS} percobaan.`, '#555');
        guessInput.value = '';
        guessInput.disabled = false;
        checkButton.disabled = false;
        resetButton.style.display = 'none';

        guessInput.focus();
        console.log('Angka rahasia (untuk debugging):', randomNumber);
    }

    function checkGuess() {
        if (currentState !== GAME_STATES.GUESSING_GAME) return; // Pastikan hanya bisa menebak di state ini

        const userGuess = parseInt(guessInput.value);

        if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
            updateMessage('Angka harus antara 1 dan 100!', '#dc3545');
            return;
        }

        attempts++;

        if (userGuess === randomNumber) {
            // Transisi ke WIN_OVERLAY dengan pesan kemenangan sebagai payload
            transitionTo(GAME_STATES.WIN_OVERLAY, {
                message: `Kamu menebak angka ${randomNumber} dengan benar dalam ${attempts} percobaan! Luar biasa! Sekarang lanjut ke Mode Tempur!`
            });
            guessInput.disabled = true;
            checkButton.disabled = true;
            resetButton.style.display = 'block'; // Tombol reset muncul setelah game tebak angka selesai (menang/kalah)
        } else if (attempts >= MAX_ATTEMPTS) {
            // Transisi ke LOSE_OVERLAY dengan pesan kekalahan sebagai payload
            transitionTo(GAME_STATES.LOSE_OVERLAY, {
                message: `Maaf, percobaanmu habis! Angka rahasia adalah ${randomNumber}. Jangan menyerah, coba lagi!`
            });
            guessInput.disabled = true;
            checkButton.disabled = true;
            resetButton.style.display = 'block';
        } else {
            let hintMessage = (userGuess < randomNumber) ? 'Terlalu rendah!' : 'Terlalu tinggi!';
            updateMessage(`${hintMessage} Sisa percobaan: ${MAX_ATTEMPTS - attempts}.`, '#ffc107');
            guessInput.value = '';
        }
    }

    // --- Fungsi Bantuan untuk UI/UX ---
    function updateMessage(text, color) {
        message.style.animation = 'none';
        message.offsetHeight;
        message.style.animation = null;

        message.textContent = text;
        message.style.color = color;
        message.style.opacity = 0;
        message.style.transform = 'translateY(10px)';
        message.style.animation = 'fadeAndScaleUp 0.5s ease-out forwards';
    }

    function showOverlay(overlayElement) {
        overlayElement.classList.add('show');
        const content = overlayElement.querySelector('.overlay-content');
        content.style.transform = 'scale(0.7)';
        content.offsetHeight;
        content.style.transform = 'scale(1)';
    }

    function createRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - (button.getBoundingClientRect().left + radius)}px`;
        circle.style.top = `${event.clientY - (button.getBoundingClientRect().top + radius)}px`;
        circle.classList.add('ripple');

        const ripple = button.getElementsByClassName('ripple')[0];

        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    }

    // --- Logika Efek Background Partikel ---
    function createParticle() {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        backgroundEffectsContainer.appendChild(particle);

        const size = Math.random() * 20 + 10;
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;

        const duration = Math.random() * 15 + 15;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;

        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }

    function initParticles(count) {
        for (let i = 0; i < count; i++) {
            createParticle();
        }
        setInterval(createParticle, 2000);
    }

    // --- Logika Game Tempur Sederhana ---
    function initCombatGame() {
        // Reset player untuk game tempur
        player = { x: gameCanvas.width / 2, y: gameCanvas.height - 70, width: 60, height: 60 }; // Gunakan width/height
        bullets = [];
        targets = [];
        score = 0;

        // Reset status tombol
        for (const key in keys) { if (keys.hasOwnProperty(key)) keys[key] = false; }

        // Pastikan interval tidak ganda
        if (combatGameInterval) clearInterval(combatGameInterval);
        if (spawnTargetInterval) clearInterval(spawnTargetInterval);

        combatGameInterval = setInterval(gameLoop, 1000 / 60);
        spawnTargetInterval = setInterval(spawnTarget, 1500);
    }

    // Fungsi Game Over untuk game tempur
    function gameOverCombat() {
        if (currentState !== GAME_STATES.COMBAT_GAME) return; // Pastikan hanya bisa game over dari state tempur

        // Transisi ke LOSE_OVERLAY dengan pesan kekalahan dan skor sebagai payload
        transitionTo(GAME_STATES.LOSE_OVERLAY, {
            message: `Game Over! Kamu berhasil mendapatkan skor ${score}. Jangan menyerah, coba lagi!`
        });
    }

    // --- Fungsi Gambar ---
    function drawPlayer() {
        if (player_spaceship_image.complete && player_spaceship_image.naturalWidth !== 0) {
            ctx.drawImage(
                player_spaceship_image,
                player.x - player.width / 2,
                player.y - player.height / 2,
                player.width,
                player.height
            );
        } else {
            ctx.fillStyle = 'cyan';
            ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
        }
    }

    function drawBullets() {
        ctx.fillStyle = 'yellow';
        bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawTargets() {
        ctx.fillStyle = 'red';
        targets.forEach(target => {
            ctx.beginPath();
            ctx.arc(target.x, target.y, target.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawScore() {
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Score: ' + score, 10, 30);
    }

    // --- Fungsi Update Logika Game ---
    function updateGame() {
        // Hanya update logika game tempur jika berada di state COMBAT_GAME
        if (currentState !== GAME_STATES.COMBAT_GAME) return;

        // Pergerakan Pemain Kontinu
        if (keys['ArrowLeft'] || keys['a']) {
            player.x = Math.max(player.width / 2, player.x - PLAYER_SPEED);
        }
        if (keys['ArrowRight'] || keys['d']) {
            player.x = Math.min(gameCanvas.width - player.width / 2, player.x + PLAYER_SPEED);
        }

        // Update dan Hapus Peluru
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].y -= 7;
            if (bullets[i].y < 0) {
                bullets.splice(i, 1);
            }
        }

        // Update dan Hapus Target, serta Deteksi Game Over
        for (let i = targets.length - 1; i >= 0; i--) {
            let target = targets[i];
            target.y += 2; // Kecepatan target

            if (target.y - target.size > gameCanvas.height) {
                targets.splice(i, 1);
                console.log('Target lewat! Game Over!');
                gameOverCombat(); // Panggil fungsi game over (yang akan melakukan transisi state)
                return; // Keluar dari updateGame
            }
        }

        // Deteksi tabrakan (peluru vs target)
        for (let b = bullets.length - 1; b >= 0; b--) {
            for (let t = targets.length - 1; t >= 0; t--) {
                const distance = Math.sqrt(
                    Math.pow(bullets[b].x - targets[t].x, 2) + Math.pow(bullets[b].y - targets[t].y, 2)
                );
                if (distance < bullets[b].size + targets[t].size) {
                    bullets.splice(b, 1); // Hapus peluru
                    targets.splice(t, 1); // Hapus target
                    score += 10;
                    break; // Keluar dari inner loop karena peluru sudah mengenai target
                }
            }
        }
    }

    function gameLoop() {
        // Pastikan hanya menggambar jika di state COMBAT_GAME
        if (currentState !== GAME_STATES.COMBAT_GAME) {
            // Bersihkan canvas jika tidak di state tempur tapi interval masih jalan (misal transisi)
            ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
            return;
        }

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

        updateGame(); // Logika update hanya jalan jika di state COMBAT_GAME (cek di awal fungsi)
        drawPlayer();
        drawBullets();
        drawTargets();
        drawScore();
    }

    function spawnTarget() {
        const x = Math.random() * (gameCanvas.width - 40) + 20;
        const size = Math.random() * 10 + 15;
        targets.push({ x: x, y: -size, size: size });
    }

    // --- Input Keyboard Global (Untuk Kedua Game) ---
    document.addEventListener('keydown', (e) => {
        // Kontrol untuk game tebak angka (Enter)
        if (currentState === GAME_STATES.GUESSING_GAME && e.key === 'Enter') {
            checkGuess();
        }
        // Kontrol untuk game tempur
        else if (currentState === GAME_STATES.COMBAT_GAME) {
            keys[e.key] = true;

            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                if (bullets.length < 5) {
                   bullets.push({ x: player.x, y: player.y - player.height / 2, size: 5 });
                }
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (currentState === GAME_STATES.COMBAT_GAME) {
            keys[e.key] = false;
        }
    });

    // --- Event Listener Tombol UI ---
    checkButton.addEventListener('click', checkGuess);

    // Tombol reset dan kembali ke tebak angka selalu mengarah ke state GUESSING_GAME
    resetButton.addEventListener('click', () => transitionTo(GAME_STATES.GUESSING_GAME));
    backToGuessButton.addEventListener('click', () => transitionTo(GAME_STATES.GUESSING_GAME));

    // Tombol di overlay kemenangan
    closeWinOverlayBtn.addEventListener('click', () => {
        transitionTo(GAME_STATES.COMBAT_GAME); // Lanjut ke mode tempur
    });

    // Tombol di overlay kekalahan
    closeLoseOverlayBtn.addEventListener('click', () => {
        transitionTo(GAME_STATES.GUESSING_GAME); // Kembali ke game tebak angka
    });

    // Event listener untuk efek riak pada semua tombol
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', createRipple);
    });

    // --- Inisialisasi Awal Game ---
    // Pastikan semua aset dimuat sebelum memulai game
    player_spaceship_image.onload = () => {
        console.log("Assets loaded, starting game.");
        initParticles(20); // Inisialisasi partikel setelah aset dimuat
        transitionTo(GAME_STATES.GUESSING_GAME); // Transisi ke game tebak angka
    };
    // Jika gambar gagal dimuat, tetap mulai game dengan fallback
    player_spaceship_image.onerror = () => {
        console.warn("Failed to load player_spaceship_image. Using fallback.");
        initParticles(20);
        transitionTo(GAME_STATES.GUESSING_GAME);
    };

    // Ini adalah titik masuk utama. Awalnya di state LOADING.
    // Game akan benar-benar dimulai setelah gambar dimuat (lihat onload).
});