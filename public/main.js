const LOGO_URL = "https://i.ibb.co/GfG3bg4D/Background-Eraser-20251204-190859969.png";

const PRESET_SONGS = [
    {
        title: "El Año Entero",
        artist: "Dani Venz",
        audio: "https://files.catbox.moe/bwlvhk.mp3?direct",
        cover: "https://i.ibb.co/NnrCFRLj/Screenshot-2025-07-26-21-50-56-120-com-google-android-googlequicksearchbox-edit.jpg",
        id: "1"
    },
    {
        title: "Carrusel",
        artist: "Alev",
        audio: "https://files.catbox.moe/f98jez.m4a?direct",
        cover: "https://i.ibb.co/mZDmstj/Picsart-25-08-29-10-58-59-716.png",
        id: "2"
    },
    {
        title: "De Qué Sirve",
        artist: "Dani Venz",
        audio: "https://media.vocaroo.com/mp3/1a51zziro3cb",
        cover: "https://i.ibb.co/Gfn5GKg3/Screenshot-2025-07-24-18-55-10-029-com-spotify-music-edit.jpg",
        id: "3"
    },
    {
        title: "COMERTE 🅴",
        artist: "BigFeer",
        audio: "https://media.vocaroo.com/mp3/1nKiJtJ8HBTn",
        cover: "https://i.ibb.co/v68zp7mf/Screenshot-2025-07-26-21-54-10-962-com-google-android-youtube-edit.jpg",
        id: "4"
    },
    {
        title: "PANTIS 🅴",
        artist: "BigFeer",
        audio: "https://media.vocaroo.com/mp3/11Xf1ThrfsUM",
        cover: "https://i.ibb.co/zDtxKfY/Screenshot-2025-07-26-21-55-31-237-com-spotify-music-edit.jpg",
        id: "5"
    },
    {
        title: "Si La Vez",
        artist: "Iago",
        audio: "https://media.vocaroo.com/mp3/1iCK9NAQN9oy",
        cover: "https://i.ibb.co/rgvf62m/IMG-20250604-WA0164-1.jpg",
        id: "6"
    },
    {
        title: "SEPHORA",
        artist: "Jack",
        audio: "https://files.catbox.moe/xslgh0.mp3?direct",
        cover: "https://i.ibb.co/5QQ5NtF/SEPHORA-Jack-Bobii.jpg",
        id: "7"
    },
    {
        title: "FRIO EN MIAMI",
        artist: "Jack",
        audio: "https://files.catbox.moe/ca10su.mp3?direct",
        cover: "https://i.ibb.co/DHfM2pjN/Frio-En-Miami-Jack.jpg",
        id: "8"
    },
    {
        title: "DE QUE ME SIRVE?",
        artist: "GZ",
        audio: "https://files.catbox.moe/swl7vm.mp3?direct",
        cover: "https://cdn-images.dzcdn.net/images/cover/903d29bcb00e776d91a9135cc426a48c/0x1900-000000-80-0-0.jpg",
        id: "9"
    },
    {  
        title: "Noches De Insomnio",
        artist: "BigFeer",
        audio: "https://files.catbox.moe/rrmqk9.mp3?direct",
        cover: "https://i.ibb.co/B5zdp8d0/NDI-Big-Feer.jpg",
        id: "10"
    },
    {  
        title: "PUESTO PA' VERNOS",
        artist: "Alev",
        audio: "https://files.catbox.moe/aulpjz.mp3?direct",
        cover: "https://i.ibb.co/PZNsXr6r/Captura-de-pantalla-2025-12-31-172305.png",
        id: "11"
    }
];

let songs = [...PRESET_SONGS];
let currentSongIndex = 0;
let isPlaying = false;
let currentAudio = null;
let currentUser = null;
let favorites = [];
let recentSongs = [];
let currentView = 'home';
let authUnsubscribe = null;
let pendingUsernameResolver = null;
let songsUnsubscribe = null;
let pendingUploadModal = null;
let pendingUploadSubmit = false;
let toastContainer = null;
const mediaCache = new Map();
const MAX_AUDIO_MB = 8;
const SONGS_META_PATH = 'songs/meta';
const SONGS_MEDIA_PATH = 'songs/media';
let pendingUploads = [];
let lastStatusMap = {};
const PENDING_UPLOADS_KEY = 'pendingUploads';
const READY_STATUS = 'ready';
const PROCESSING_STATUS = 'processing';

const ensureToastContainer = () => {
    if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
    return toastContainer;
};

const showToast = (message, type = 'info', duration = 3200) => {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 200);
    }, duration);
};

const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

const createCoverVersions = async (file) => {
    const toDataUrl = await readFileAsDataURL(file);
    const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = toDataUrl;
    });

    const build = (maxSize, quality = 0.75) => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.max(1, Math.floor(img.width * scale));
        canvas.height = Math.max(1, Math.floor(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', quality);
    };

    return {
        thumb: build(360, 0.7),
        full: build(1200, 0.82)
    };
};

const bytesFromDataUrl = (dataUrl = '') => {
    const base64 = dataUrl.split(',')[1] || '';
    return Math.floor((base64.length * 3) / 4);
};

const downloadCurrentSong = async () => {
    let currentSong = songs[currentSongIndex];
    if (!currentSong) return;

    if (!currentSong.audio) {
        try {
            currentSong = await ensureSongMedia(currentSongIndex);
        } catch (err) {
            showToast('No se pudo cargar el audio para descargar.', 'error');
            return;
        }
    }

    try {
        
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            downloadBtn.disabled = true;
        }


        const response = await fetch(currentSong.audio, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error('No se pudo descargar el archivo');
        }
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        
        const link = document.createElement('a');
        link.href = blobUrl;
        

        const fileName = `${currentSong.artist} - ${currentSong.title}.mp3`
            .replace(/[^a-z0-9\s\-\.]/gi, '_')
            .replace(/\s+/g, ' ')
            .trim();
        
        
        link.download = fileName;
        
        
        document.body.appendChild(link);
        link.click();
        
        
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            
            if (downloadBtn) {
                downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
                downloadBtn.disabled = false;
            }
        }, 100);
        
    } catch (error) {
        console.error('Error al descargar la canción:', error);
        showToast('No se pudo descargar la canción. Intenta de nuevo más tarde.', 'error');
        
        
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
            downloadBtn.disabled = false;
        }
    }
};

const requestUsername = (suggested = '') => {
    return new Promise((resolve) => {
        
        if (pendingUsernameResolver) {
            pendingUsernameResolver(suggested);
            pendingUsernameResolver = null;
        }

        pendingUsernameResolver = resolve;

        const modal = document.createElement('div');
        modal.className = 'modal glass';
        modal.innerHTML = `
            <div class="modal-content glass" style="max-width: 420px;">
                <h2 class="modal-title">Elige un nombre de usuario</h2>
                <input type="text" class="modal-input" id="usernameInput" placeholder="Tu usuario" value="${suggested}">
                <div class="modal-buttons">
                    <button class="modal-btn btn-secondary" id="usernameCancel">Cancelar</button>
                    <button class="modal-btn btn-primary" id="usernameSave">Guardar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector('#usernameInput');
        const btnSave = modal.querySelector('#usernameSave');
        const btnCancel = modal.querySelector('#usernameCancel');

        const close = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 250);
        };

        const submit = () => {
            const value = (input.value || '').trim();
            if (value.length === 0) return;
            resolve(value);
            pendingUsernameResolver = null;
            close();
        };

        btnSave.addEventListener('click', submit);
        btnCancel.addEventListener('click', () => {
            resolve(suggested);
            pendingUsernameResolver = null;
            close();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submit();
        });

        setTimeout(() => {
            modal.classList.add('active');
            input.focus();
            input.select();
        }, 10);
    });
};

window.requestUsername = requestUsername;

const handleLogin = async () => {
    try {
        if (window.firebaseServices?.signInWithGoogle) {
            const result = await window.firebaseServices.signInWithGoogle();
            
        }
    } catch (err) {
        console.error('Error al iniciar sesión:', err);
        showToast('No se pudo iniciar sesión. Intenta de nuevo.', 'error');
    }
};

const handleLogout = async () => {
    try {
        if (window.firebaseServices?.signOutUser) {
            await window.firebaseServices.signOutUser();
        }
    } catch (err) {
        console.error('Error al cerrar sesión:', err);
    }
};

const setupFirebaseAuth = () => {
    if (!window.firebaseServices?.auth || !window.firebaseServices?.onAuthStateChanged) return;
    const { auth, onAuthStateChanged, loadUserProfile } = window.firebaseServices;

    if (authUnsubscribe) authUnsubscribe();

    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                
                const profile = await loadUserProfile(user.uid);
                
                
                const displayName = profile?.username || user.displayName;
                
                currentUser = {
                    username: profile?.username,
                    displayName: displayName,
                    email: user.email,
                    photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}`,
                    uid: user.uid,
                };
            } catch (error) {
                console.error('Error al cargar el perfil:', error);
                
                currentUser = {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    uid: user.uid,
                };
            }
        } else {
            currentUser = null;
        }
        updateUserUI();
        updateUploadButton();
        subscribeSongs();
    });
};

const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const loadFromLocalStorage = (key, defaultValue = []) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
};

const loadPendingUploads = () => {
    pendingUploads = loadFromLocalStorage(PENDING_UPLOADS_KEY, []);
};

const savePendingUploads = () => {
    saveToLocalStorage(PENDING_UPLOADS_KEY, pendingUploads);
};

const addPendingUpload = (item) => {
    pendingUploads.push(item);
    savePendingUploads();
};

const removePendingUpload = (id) => {
    const before = pendingUploads.length;
    pendingUploads = pendingUploads.filter(p => p.id !== id);
    if (pendingUploads.length !== before) {
        savePendingUploads();
    }
};

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const fadeIn = (element, duration = 300) => {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    requestAnimationFrame(() => {
        element.style.opacity = '1';
    });
};

const slideIn = (element, direction = 'up', duration = 300) => {
    const directions = {
        up: 'translateY(20px)',
        down: 'translateY(-20px)',
        left: 'translateX(20px)',
        right: 'translateX(-20px)'
    };
    
    element.style.transform = directions[direction];
    element.style.opacity = '0';
    element.style.transition = `all ${duration}ms ease`;
    
    requestAnimationFrame(() => {
        element.style.transform = 'translate(0, 0)';
        element.style.opacity = '1';
    });
};

const injectStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
    .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 9999;
        pointer-events: none;
    }
    .toast {
        background: rgba(20, 20, 20, 0.9);
        color: #fff;
        padding: 12px 16px;
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.35);
        transform: translateY(-8px);
        opacity: 0;
        transition: all 180ms ease;
        pointer-events: auto;
        font-size: 14px;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast-info { border-left: 4px solid #4aa3ff; }
    .toast-success { border-left: 4px solid #4cd964; }
    .toast-error { border-left: 4px solid #ff4757; }
    .upload-btn.disabled { opacity: 0.6; cursor: not-allowed; }
    .upload-btn {
        background: #16a34a;
        color: #fff;
        border: none;
        padding: 10px 16px;
        border-radius: 14px;
        font-weight: 700;
        letter-spacing: 0.3px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 8px 18px rgba(22,163,74,0.28);
    }
    .upload-btn .fa-cloud-upload-alt { font-size: 14px; }
    .modal-content {
        background: linear-gradient(145deg, rgba(20,22,30,0.9), rgba(34,36,48,0.92));
        border: 1px solid rgba(255,255,255,0.06);
        box-shadow: 0 18px 60px rgba(0,0,0,0.4);
    }
    .modal-input, .modal-label {
        color: #e8e8e8;
    }
    .modal-label {
        font-size: 13px;
        font-weight: 600;
        margin-top: 8px;
        opacity: 0.9;
    }
    .modal-hint {
        font-size: 12px;
        color: #b8b8b8;
        margin-top: 6px;
    }
    .pill-info {
        background: rgba(74,163,255,0.12);
        color: #dceeff;
        padding: 8px 12px;
        border-radius: 10px;
        font-size: 13px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(74,163,255,0.2);
        margin-bottom: 8px;
    }
    .modal-warning {
        background: rgba(255, 87, 87, 0.12);
        color: #ffcdd2;
        border: 1px solid rgba(255, 87, 87, 0.3);
        padding: 10px 12px;
        border-radius: 10px;
        font-size: 13px;
        margin-top: 6px;
        display: flex;
        gap: 8px;
        align-items: center;
    }
    `;
    document.head.appendChild(style);
};

const openSidebar = () => {
    document.body.classList.add('sidebar-open');
    document.body.classList.remove('sidebar-closed');
};

const closeSidebar = () => {
    document.body.classList.add('sidebar-closed');
    document.body.classList.remove('sidebar-open');
};

const toggleSidebar = () => {
    if (document.body.classList.contains('sidebar-open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
};

const syncSidebarState = () => {
    if (window.innerWidth <= 1024) {
        closeSidebar();
    } else {
        document.body.classList.remove('sidebar-open', 'sidebar-closed');
    }
};

const initPlayer = () => {
    const audio = new Audio();
    currentAudio = audio;
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', playNextSong);
    
    return audio;
};

const ensureSongMedia = async (songIndex) => {
    const song = songs[songIndex];
    if (!song || song.audio) return song;

    if (mediaCache.has(song.id)) {
        const cached = mediaCache.get(song.id);
        songs[songIndex] = { ...song, ...cached };
        return songs[songIndex];
    }

    const services = window.firebaseServices || {};
    const { db, ref, get } = services;
    if (!db || !ref || !get) throw new Error('Firebase no disponible');

    const snap = await get(ref(db, `${SONGS_MEDIA_PATH}/${song.id}`));
    if (!snap.exists()) throw new Error('Audio no encontrado');
    const media = snap.val();
    const merged = { ...song, audio: media.audio, cover: media.coverFull || song.cover };
    mediaCache.set(song.id, { audio: merged.audio, cover: merged.cover });
    songs[songIndex] = merged;
    return merged;
};

const playSong = async (songIndex) => {
    let song = songs[songIndex];
    if (!song) return;
    
    try {
        if (!song.audio) {
            song = await ensureSongMedia(songIndex);
        }
    } catch (err) {
        showToast('No se pudo cargar el audio.', 'error');
        console.error(err);
        return;
    }
    
    if (!currentAudio) {
        initPlayer();
    }
    
    if (currentAudio.src !== song.audio) {
        currentAudio.src = song.audio;
    }
    
    currentAudio.play().then(() => {
        isPlaying = true;
        updatePlayerUI(songIndex);
        updatePlayButton();
        addToRecent(song);
        updateMiniPlayer();
    }).catch(error => {
        console.warn('Error al reproducir (ignorado):', error);
    });
    
    currentSongIndex = songIndex;
};

const togglePlayPause = () => {
    if (!currentAudio || !currentAudio.src) {
        playSong(0);
        return;
    }
    
    if (isPlaying) {
        currentAudio.pause();
    } else {
        currentAudio.play();
    }
    
    isPlaying = !isPlaying;
    updatePlayButton();
};

const playNextSong = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    playSong(nextIndex);
};

const playPrevSong = () => {
    if (songs.length === 0) return;
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(prevIndex);
};

const updateProgress = () => {
    if (!currentAudio) return;
    
    const progress = document.querySelector('.progress');
    const currentTime = document.querySelector('.current-time');
    const duration = document.querySelector('.duration');
    
    if (progress && currentTime && duration) {
        const percent = (currentAudio.currentTime / currentAudio.duration) * 100;
        progress.style.width = `${percent}%`;
        currentTime.textContent = formatTime(currentAudio.currentTime);
        
        if (!isNaN(currentAudio.duration)) {
            duration.textContent = formatTime(currentAudio.duration);
        }
    }
};

const seekSong = (e) => {
    if (!currentAudio) return;
    
    const progressBar = e.currentTarget;
    const clickPosition = e.offsetX;
    const progressBarWidth = progressBar.clientWidth;
    const percentage = (clickPosition / progressBarWidth);
    
    currentAudio.currentTime = percentage * currentAudio.duration;
};

const updatePlayerUI = (songIndex) => {
    const song = songs[songIndex];
    if (!song) return;
    const playerCover = document.querySelector('.player-cover');
    const playerTitle = document.querySelector('.player-title');
    const playerArtist = document.querySelector('.player-artist');
    const downloadBtn = document.getElementById('download-btn');
    
    if (playerCover) playerCover.src = song.cover;
    if (playerTitle) playerTitle.textContent = song.title;
    if (playerArtist) playerArtist.textContent = song.artist;
    if (downloadBtn) {
        downloadBtn.title = `Descargar ${song.title} - ${song.artist}`;
    }
};

const updatePlayButton = () => {
    const playBtn = document.querySelector('.play-btn');
    if (playBtn) {
        playBtn.innerHTML = isPlaying ? 
            '<i class="fas fa-pause"></i>' : 
            '<i class="fas fa-play"></i>';
    }
};

const addToRecent = (song) => {
    
    recentSongs = recentSongs.filter(s => s.id !== song.id);
    

    recentSongs.unshift(song);
    
    
    if (recentSongs.length > 5) {
        recentSongs = recentSongs.slice(0, 5);
    }
    
    saveToLocalStorage('recentSongs', recentSongs);
    
    if (currentView === 'recent') {
        renderSongs(recentSongs, 'recent');
    }
};

const updateMiniPlayer = () => {
    const miniPlayer = document.querySelector('.mini-player');
    if (window.scrollY > 100) {
        miniPlayer.classList.add('active');
    } else {
        miniPlayer.classList.remove('active');
    }
};

const toggleFavorite = (songId) => {
    const index = favorites.findIndex(fav => fav.id === songId);
    
    if (index === -1) {
        const song = songs.find(s => s.id === songId);
        if (song) {
            favorites.push(song);
        }
    } else {
        favorites.splice(index, 1);
    }
    
    saveToLocalStorage('favorites', favorites);
    renderSongs(songs, currentView);
    
    if (currentView === 'favorites') {
        renderSongs(favorites, 'favorites');
    }
};

const isFavorite = (songId) => {
    return favorites.some(fav => fav.id === songId);
};

const createPlaylist = (name) => {
    const newPlaylist = {
        id: Date.now().toString(),
        name,
        songs: []
    };
    
    playlists.push(newPlaylist);
    saveToLocalStorage('playlists', playlists);
    renderPlaylists();
    
    return newPlaylist;
};

const addToPlaylist = (playlistId, songId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    const song = songs.find(s => s.id === songId);
    
    if (playlist && song && !playlist.songs.some(s => s.id === songId)) {
        playlist.songs.push(song);
        saveToLocalStorage('playlists', playlists);
        
        if (currentView === 'playlist-' + playlistId) {
            renderSongs(playlist.songs, 'playlist-' + playlistId);
        }
        
        return true;
    }
    
    return false;
};

const removeFromPlaylist = (playlistId, songId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    
    if (playlist) {
        const index = playlist.songs.findIndex(s => s.id === songId);
        if (index !== -1) {
            playlist.songs.splice(index, 1);
            saveToLocalStorage('playlists', playlists);
            
            if (currentView === 'playlist-' + playlistId) {
                renderSongs(playlist.songs, 'playlist-' + playlistId);
            }
            
            return true;
        }
    }
    
    return false;
};

const showPlaylistModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal glass';
    modal.innerHTML = `
        <div class="modal-content glass">
            <h2 class="modal-title">Crear nueva playlist</h2>
            <input type="text" class="modal-input" placeholder="Nombre de la playlist" id="playlistName">
            <div class="modal-buttons">
                <button class="modal-btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button class="modal-btn btn-primary" onclick="submitPlaylist()">Crear</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('active');
        document.getElementById('playlistName').focus();
    }, 10);
};

const closeModal = () => {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

const submitPlaylist = () => {
    const nameInput = document.getElementById('playlistName');
    const name = nameInput.value.trim();
    
    if (name) {
        createPlaylist(name);
        closeModal();
    }
};

const showAddToPlaylistModal = (songId) => {
    const modal = document.createElement('div');
    modal.className = 'modal glass';
    
    let optionsHTML = '';
    playlists.forEach(playlist => {
        const hasSong = playlist.songs.some(s => s.id === songId);
        optionsHTML += `
            <div class="playlist-option" onclick="selectPlaylistForSong('${playlist.id}', '${songId}')" 
                 style="padding: 12px; border-radius: 8px; cursor: pointer; margin-bottom: 8px; transition: background 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${playlist.name}</span>
                    <span>${hasSong ? '✓' : '+'}</span>
                </div>
                <div style="font-size: 12px; color: #b3b3b3;">${playlist.songs.length} canciones</div>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div class="modal-content glass" style="max-width: 400px;">
            <h2 class="modal-title">Añadir a playlist</h2>
            <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                ${optionsHTML || '<p style="text-align: center; color: #b3b3b3;">No hay playlists creadas</p>'}
            </div>
            <div class="modal-buttons">
                <button class="modal-btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button class="modal-btn btn-primary" onclick="createAndAddToPlaylist('${songId}')">Nueva playlist</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
};

const selectPlaylistForSong = (playlistId, songId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    const hasSong = playlist.songs.some(s => s.id === songId);
    
    if (hasSong) {
        removeFromPlaylist(playlistId, songId);
    } else {
        addToPlaylist(playlistId, songId);
    }
    
    closeModal();
    showAddToPlaylistModal(songId); 
};

const createAndAddToPlaylist = (songId) => {
    closeModal();
    
    const modal = document.createElement('div');
    modal.className = 'modal glass';
    modal.innerHTML = `
        <div class="modal-content glass">
            <h2 class="modal-title">Crear y añadir a playlist</h2>
            <input type="text" class="modal-input" placeholder="Nombre de la playlist" id="newPlaylistName">
            <div class="modal-buttons">
                <button class="modal-btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button class="modal-btn btn-primary" onclick="createAndAdd('${songId}')">Crear y añadir</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('active');
        document.getElementById('newPlaylistName').focus();
    }, 10);
};

const createAndAdd = (songId) => {
    const nameInput = document.getElementById('newPlaylistName');
    const name = nameInput.value.trim();
    
    if (name) {
        const newPlaylist = createPlaylist(name);
        addToPlaylist(newPlaylist.id, songId);
        closeModal();
    }
};

const renderSongCard = (song, viewType = 'home') => {
    const div = document.createElement('div');
    div.className = 'song-card glass';
    
    div.innerHTML = `
        <img src="${song.cover}" alt="${song.title}" class="song-cover">
        <div class="song-title">${song.title}</div>
        <div class="song-artist">${song.artist}</div>
        <div class="song-actions">
            <button class="action-btn favorite-btn ${isFavorite(song.id) ? 'active' : ''}" 
                    onclick="toggleFavorite('${song.id}')">
                <i class="fas fa-heart"></i>
            </button>
            <button class="action-btn" onclick="showAddToPlaylistModal('${song.id}')">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;
    
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.song-actions')) {
            const index = songs.findIndex(s => s.id === song.id);
            playSong(index);
        }
    });
    
    return div;
};

const renderSongs = (songs, viewType) => {
    const content = document.getElementById('main-content-area');
    if (!content) return;
    
    content.innerHTML = '';
    
    if (songs.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #b3b3b3;">
                <i class="fas fa-music" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>No hay canciones aquí</p>
            </div>
        `;
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'songs-grid';
    
    songs.forEach(song => {
        const card = renderSongCard(song, viewType);
        grid.appendChild(card);
    });
    
    content.appendChild(grid);
    slideIn(grid, 'up');
};

const renderPlaylists = () => {
    const content = document.getElementById('main-content-area');
    if (!content) return;
    
    content.innerHTML = `
        <h2 class="section-title">Tus Playlists</h2>
        <div class="playlists-grid" id="playlists-grid"></div>
    `;
    
    const grid = document.getElementById('playlists-grid');
    
    const createBtn = document.createElement('button');
    createBtn.className = 'playlist-card create-playlist-btn glass';
    createBtn.innerHTML = `
        <div class="playlist-icon">+</div>
        <div>Crear nueva playlist</div>
    `;
    createBtn.addEventListener('click', showPlaylistModal);
    grid.appendChild(createBtn);
    
    
    playlists.forEach(playlist => {
        const card = document.createElement('div');
        card.className = 'playlist-card glass';
        card.innerHTML = `
            <div class="playlist-icon"><i class="fas fa-music"></i></div>
            <div class="song-title">${playlist.name}</div>
            <div class="song-artist">${playlist.songs.length} canciones</div>
        `;
        
        card.addEventListener('click', () => {
            navigateTo('playlist-' + playlist.id);
            renderSongs(playlist.songs, 'playlist-' + playlist.id);
        });
        
        grid.appendChild(card);
    });
    
    slideIn(grid, 'up');
};

const renderHome = () => {
    const content = document.getElementById('main-content-area');
    if (!content) return;
    
    content.innerHTML = `
        <h2 class="section-title">Tus Favoritos</h2>
        <div id="favorites-section"></div>
        
        <h2 class="section-title" style="margin-top: 40px;">Escuchados Recientemente</h2>
        <div id="recent-section"></div>
        
        <h2 class="section-title" style="margin-top: 40px;">Todas las Canciones</h2>
        <div id="all-songs-section"></div>
    `;
    
    const favSection = document.getElementById('favorites-section');
    if (favorites.length > 0) {
        const favGrid = document.createElement('div');
        favGrid.className = 'songs-grid';
        favorites.slice(0, 5).forEach(song => {
            favGrid.appendChild(renderSongCard(song, 'home'));
        });
        favSection.appendChild(favGrid);
        slideIn(favGrid, 'up');
    } else {
        favSection.innerHTML = '<p style="color: #b3b3b3; margin-bottom: 40px;">Aún no tienes favoritos</p>';
    }
    
    
    const recentSection = document.getElementById('recent-section');
    if (recentSongs.length > 0) {
        const recentGrid = document.createElement('div');
        recentGrid.className = 'songs-grid';
        recentSongs.forEach(song => {
            recentGrid.appendChild(renderSongCard(song, 'home'));
        });
        recentSection.appendChild(recentGrid);
        slideIn(recentGrid, 'up');
    } else {
        recentSection.innerHTML = '<p style="color: #b3b3b3; margin-bottom: 40px;">Aún no has escuchado canciones</p>';
    }
    
    
    const allSongsSection = document.getElementById('all-songs-section');
    const allSongsGrid = document.createElement('div');
    allSongsGrid.className = 'songs-grid';
    songs.forEach(song => {
        allSongsGrid.appendChild(renderSongCard(song, 'home'));
    });
    allSongsSection.appendChild(allSongsGrid);
    slideIn(allSongsGrid, 'up');
};

const navigateTo = (view) => {
    currentView = view;
    
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-view="${view}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    
    switch(view) {
        case 'home':
            renderHome();
            break;
        case 'favorites':
            renderSongs(favorites, 'favorites');
            break;
        case 'recent':
            renderSongs(recentSongs, 'recent');
            break;
        case 'playlists':
            renderPlaylists();
            break;
        default:
            if (view.startsWith('playlist-')) {
                const playlistId = view.replace('playlist-', '');
                const playlist = playlists.find(p => p.id === playlistId);
                if (playlist) {
                    renderSongs(playlist.songs, view);
                }
            }
    }
};

const updateUserUI = () => {
    const userSection = document.querySelector('.user-section');
    if (!userSection) return;
    
    userSection.innerHTML = '';
    
    if (currentUser) {
    
        const displayName = currentUser.username || currentUser.displayName || 'Usuario';
    
        const photoURL = currentUser.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
        
        userSection.innerHTML = `
            <div class="user-menu">
                <button class="user-menu-btn" onclick="toggleUserMenu(event)">
                    <img src="${photoURL}" 
                         alt="${displayName}" 
                         class="user-avatar"
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random'">
                    <span class="user-name">${displayName}</span>
                    <i class="fas fa-chevron-down" style="font-size:12px;"></i>
                </button>
                <div class="user-dropdown">
                    <button onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
                </div>
            </div>
        `;
    } else {
        userSection.innerHTML = `
            <button class="login-btn glass" onclick="handleLogin()">
                <i class="fab fa-google"></i> Iniciar sesión
            </button>
        `;
    }
};

const initApp = () => {
    
    injectStyles();
    
    
    favorites = loadFromLocalStorage('favorites', []);
    recentSongs = loadFromLocalStorage('recentSongs', []);
    playlists = loadFromLocalStorage('playlists', []);
    loadPendingUploads();
    currentUser = null;
    
    document.body.innerHTML = '';
    
    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';
    
    appContainer.innerHTML = `
        <aside class="sidebar glass">
            <button class="sidebar-close" aria-label="Cerrar menú" onclick="closeSidebar()">
                <i class="fas fa-times"></i>
            </button>
            <div class="logo-container">
                <img src="${LOGO_URL}" alt="Sorex" class="logo">
            </div>
            <div class="nav-item active" data-view="home">
                <i class="nav-icon fas fa-home"></i>
                <span>Inicio</span>
            </div>
            <div class="nav-item" data-view="favorites">
                <i class="nav-icon fas fa-heart"></i>
                <span>Tus Favoritos</span>
            </div>
            <div class="nav-item" data-view="recent">
                <i class="nav-icon fas fa-history"></i>
                <span>Recientes</span>
            </div>
            <div class="nav-item" data-view="playlists">
                <i class="nav-icon fas fa-list"></i>
                <span>Playlists</span>
            </div>
        </aside>
        
        <header class="header glass">
            <div style="display: flex; align-items: center; gap: 12px;">
                <button class="menu-toggle" aria-label="Abrir menú" onclick="toggleSidebar()">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="search-bar">
                    <input type="text" class="search-input" placeholder="Buscar canciones, artistas...">
                </div>
                <button class="upload-btn glass" id="upload-btn">
                    <i class="fas fa-cloud-upload-alt"></i> Subir música
                </button>
            </div>
            <div class="user-section" id="user-section">
                <!-- Aquí se carga la info del usuario -->
            </div>
        </header>
        
        <main class="main-content">
            <div id="main-content-area">
                <!-- Contenido dinámico -->
            </div>
        </main>
        
        <!-- Player principal -->
        <footer class="player glass">
            <div class="player-info">
                <img src="${songs[0]?.cover || LOGO_URL}" alt="Cover" class="player-cover">
                <div class="player-text">
                    <div class="player-title">${songs[0]?.title || 'Lista vacía'}</div>
                    <div class="player-artist">${songs[0]?.artist || ''}</div>
                </div>
            </div>
            
            <div class="player-controls">
                <div class="control-buttons">
                    <button class="control-btn" onclick="playPrevSong()">
                        <i class="fas fa-step-backward"></i>
                    </button>
                    <button class="control-btn play-btn" onclick="togglePlayPause()">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="control-btn" onclick="playNextSong()">
                        <i class="fas fa-step-forward"></i>
                    </button>
                </div>
                <div class="progress-container">
                    <span class="time current-time">0:00</span>
                    <div class="progress-bar" onclick="seekSong(event)">
                        <div class="progress"></div>
                    </div>
                    <span class="time duration">0:00</span>
                </div>
            </div>
            
            <div class="player-extra">
                <button class="control-btn" id="download-btn" title="Descargar canción" onclick="downloadCurrentSong()">
                    <i class="fas fa-download"></i>
                </button>
                <button class="control-btn volume-btn">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
        </footer>
        
        <!-- Mini player flotante -->
        <div class="mini-player glass">
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${songs[0]?.cover || LOGO_URL}" alt="Cover" style="width: 40px; height: 40px; border-radius: 8px;">
                <div>
                    <div style="font-size: 14px; font-weight: 600;">${songs[0]?.title || 'Sin canciones'}</div>
                    <div style="font-size: 12px; color: #b3b3b3;">${songs[0]?.artist || ''}</div>
                </div>
                <button class="control-btn" onclick="togglePlayPause()" style="margin-left: auto;">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(appContainer);
    
    
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(fontAwesome);
    
    initPlayer();
    
    setupEventListeners();
    setupFirebaseAuth();
    
    updateUserUI();
    
    navigateTo('home');
    
    window.addEventListener('scroll', updateMiniPlayer);
    
    setTimeout(() => {
        fadeIn(appContainer);
    }, 100);
};

const setupEventListeners = () => {

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            navigateTo(view);
        });
    });
    
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm.length > 2) {
                const filteredSongs = songs.filter(song => 
                    song.title.toLowerCase().includes(searchTerm) || 
                    song.artist.toLowerCase().includes(searchTerm)
                );
                renderSongs(filteredSongs, 'search');
            } else if (searchTerm.length === 0) {
                navigateTo(currentView);
            }
        });
    }

    updateUploadButton();

    document.addEventListener('click', (e) => {
        const dropdown = document.querySelector('.user-dropdown');
        const btn = document.querySelector('.user-menu-btn');
        if (!dropdown || !btn) return;
        if (dropdown.classList.contains('active') && !dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
};

const toggleUserMenu = (event) => {
    event.stopPropagation();
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
};

const updateUploadButton = () => {
    const uploadBtn = document.getElementById('upload-btn');
    if (!uploadBtn) return;
    if (currentUser) {
        uploadBtn.classList.remove('disabled');
        uploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Subir música';
        uploadBtn.onclick = openUploadModal;
    } else {
        uploadBtn.classList.add('disabled');
        uploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Inicia sesión para subir';
        uploadBtn.onclick = () => {
            showToast('Debes iniciar sesión para subir tu música.', 'error');
            handleLogin();
        };
    }
};

const closeUploadModal = () => {
    if (pendingUploadModal) {
        pendingUploadModal.classList.remove('active');
        setTimeout(() => {
            pendingUploadModal?.remove();
            pendingUploadModal = null;
            pendingUploadSubmit = false;
        }, 250);
    }
};

const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

const submitUploadSong = async () => {
    if (pendingUploadSubmit) return;
    if (!currentUser) {
        showToast('Debes iniciar sesión para subir tu música.', 'error');
        handleLogin();
        return;
    }
    const titleInput = document.getElementById('upload-title');
    const artistInput = document.getElementById('upload-artist');
    const audioInput = document.getElementById('upload-audio');
    const coverInput = document.getElementById('upload-cover');
    if (!titleInput || !artistInput || !audioInput || !coverInput) return;

    const title = (titleInput.value || '').trim();
    const artist = (artistInput.value || '').trim();
    const audioFile = audioInput.files?.[0];
    const coverFile = coverInput.files?.[0];

    if (!title || !artist) {
        showToast('Agrega el nombre de la canción y del autor.', 'error');
        return;
    }
    if (!audioFile) {
        showToast('Debes seleccionar un archivo .mp3', 'error');
        return;
    }
    if (!coverFile) {
        showToast('Debes seleccionar una imagen de portada.', 'error');
        return;
    }
    if (!audioFile.type.includes('audio')) {
        showToast('El archivo de audio debe ser .mp3', 'error');
        return;
    }
    if (audioFile.size > MAX_AUDIO_MB * 1024 * 1024) {
        showToast(`El audio no debe superar ${MAX_AUDIO_MB}MB`, 'error');
        return;
    }

    pendingUploadSubmit = true;
    const submitBtn = document.getElementById('upload-submit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
    }

    showToast('Tu música se subirá en segundo plano. Puedes seguir navegando.', 'info', 4000);

    closeUploadModal();

    try {
        const [audioData, coverVersions] = await Promise.all([
            readFileAsDataURL(audioFile),
            createCoverVersions(coverFile)
        ]);

        if (bytesFromDataUrl(audioData) > MAX_AUDIO_MB * 1024 * 1024) {
            throw new Error(`El audio supera ${MAX_AUDIO_MB}MB`);
        }

        const { db, ref, push, set, update } = window.firebaseServices || {};
        if (!db || !ref || !push || !set || !update) {
            throw new Error('Firebase no está listo.');
        }

        const metaRef = push(ref(db, SONGS_META_PATH));
        const id = metaRef.key;

        const metaPayload = {
            title,
            artist,
            cover: coverVersions.thumb,
            uploaderUid: currentUser.uid,
            uploaderName: currentUser.username || currentUser.displayName || 'Anónimo',
            createdAt: Date.now(),
            status: PROCESSING_STATUS
        };
        const mediaPayload = {
            audio: audioData,
            coverFull: coverVersions.full
        };

        addPendingUpload({ id, title, createdAt: metaPayload.createdAt });

        await Promise.all([
            set(metaRef, metaPayload),
            set(ref(db, `${SONGS_MEDIA_PATH}/${id}`), mediaPayload)
        ]);

        await update(ref(db, `${SONGS_META_PATH}/${id}`), { status: READY_STATUS });

        showToast('Tu música se publicó correctamente.', 'success');
        closeUploadModal();
    } catch (err) {
        console.error('Error al subir música', err);
        showToast(err?.message || 'No se pudo subir la música. Intenta de nuevo.', 'error');
    } finally {
        pendingUploadSubmit = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Publicar';
        }
    }
};

const openUploadModal = () => {
    if (!currentUser) {
        showToast('Debes iniciar sesión para subir tu música.', 'error');
        handleLogin();
        return;
    }

    if (pendingUploadModal) {
        closeUploadModal();
    }

    const modal = document.createElement('div');
    modal.className = 'modal glass';
    modal.innerHTML = `
        <div class="modal-content glass" style="max-width: 520px;">
            <h2 class="modal-title">Subir tu música</h2>
            <div class="pill-info"><i class="fas fa-clock"></i> La subida seguirá en segundo plano. Te avisaremos cuando esté lista.</div>
            <label class="modal-label">Nombre de la canción</label>
            <input type="text" class="modal-input" id="upload-title" placeholder="Ej: Mi canción" required>
            <label class="modal-label">Autor</label>
            <input type="text" class="modal-input" id="upload-artist" placeholder="Tu nombre artístico" value="${currentUser.username || currentUser.displayName || ''}" required>
            <label class="modal-label">Archivo de audio (.mp3)</label>
            <input type="file" class="modal-input" id="upload-audio" accept=".mp3,audio/mpeg" required>
            <label class="modal-label">Imagen de portada (logo)</label>
            <input type="file" class="modal-input" id="upload-cover" accept="image/*" required>
            <div class="modal-hint">El audio se procesará aunque cierres la pestaña. Peso máx ${MAX_AUDIO_MB}MB.</div>
            <div class="modal-warning"><i class="fas fa-exclamation-triangle"></i>Si tu música contiene contenido sexual u ofensivo, un administrador podrá eliminarla.</div>
            <div class="modal-buttons">
                <button class="modal-btn btn-secondary" id="upload-cancel">Cancelar</button>
                <button class="modal-btn btn-primary" id="upload-submit">Publicar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    pendingUploadModal = modal;
    setTimeout(() => modal.classList.add('active'), 10);

    modal.querySelector('#upload-cancel')?.addEventListener('click', closeUploadModal);
    modal.querySelector('#upload-submit')?.addEventListener('click', submitUploadSong);
};

const refreshSongsView = () => {
    navigateTo(currentView);
};

const subscribeSongs = () => {
    const services = window.firebaseServices || {};
    const { db, ref, onValue } = services;
    if (!db || !ref || !onValue) return;

    if (songsUnsubscribe) {
        songsUnsubscribe();
    }

    const songsRef = ref(db, SONGS_META_PATH);
    songsUnsubscribe = onValue(songsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const dynamicSongs = Object.entries(data).map(([id, song]) => ({
            id,
            ...song,
            cover: song.cover || LOGO_URL
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        dynamicSongs.forEach((song) => {
            lastStatusMap[song.id] = song.status || READY_STATUS;
            if (song.status === READY_STATUS && pendingUploads.some(p => p.id === song.id)) {
                showToast(`"${song.title}" ya está publicada.`, 'success');
                removePendingUpload(song.id);
                lastStatusMap[song.id] = 'notified';
            }
        });

        songs = [...PRESET_SONGS, ...dynamicSongs];

        if (currentSongIndex >= songs.length) {
            currentSongIndex = 0;
        }

        refreshSongsView();
        updatePlayerUI(currentSongIndex);
    }, (error) => {
        console.error('Error al escuchar canciones en tiempo real', error);
        showToast('Error al actualizar canciones en vivo.', 'error');
    });
};


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
