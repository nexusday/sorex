const LOGO_URL = "https://i.ibb.co/GfG3bg4D/Background-Eraser-20251204-190859969.png";

const SONGS = [
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

let currentSongIndex = 0;
let isPlaying = false;
let currentAudio = null;
let currentUser = null;
let favorites = [];
let recentSongs = [];
let playlists = [];
let currentView = 'home';
let authUnsubscribe = null;
let pendingUsernameResolver = null;


const downloadCurrentSong = async () => {
    const currentSong = SONGS[currentSongIndex];
    if (!currentSong) return;

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
        alert('No se pudo descargar la canción. Intenta de nuevo más tarde.');
        
        
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
            downloadBtn.disabled = false;
        }
    }
};


window.downloadCurrentSong = downloadCurrentSong;

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
        alert('No se pudo iniciar sesión. Intenta de nuevo.');
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
    });
};


const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const loadFromLocalStorage = (key, defaultValue = []) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
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


const injectStyles = () => {};

// Sidebr
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

// Audio
const initPlayer = () => {
    const audio = new Audio();
    currentAudio = audio;
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', playNextSong);
    
    return audio;
};

const playSong = (songIndex) => {
    const song = SONGS[songIndex];
    
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
        console.error('Error al reproducir:', error);
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
    const nextIndex = (currentSongIndex + 1) % SONGS.length;
    playSong(nextIndex);
};

const playPrevSong = () => {
    const prevIndex = (currentSongIndex - 1 + SONGS.length) % SONGS.length;
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
    const song = SONGS[songIndex];
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
        const song = SONGS.find(s => s.id === songId);
        if (song) {
            favorites.push(song);
        }
    } else {
        favorites.splice(index, 1);
    }
    
    saveToLocalStorage('favorites', favorites);
    renderSongs(SONGS, currentView);
    
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
    const song = SONGS.find(s => s.id === songId);
    
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
            const index = SONGS.findIndex(s => s.id === song.id);
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
    SONGS.forEach(song => {
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
                <img src="${SONGS[0].cover}" alt="Cover" class="player-cover">
                <div class="player-text">
                    <div class="player-title">${SONGS[0].title}</div>
                    <div class="player-artist">${SONGS[0].artist}</div>
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
                <img src="${SONGS[0].cover}" alt="Cover" style="width: 40px; height: 40px; border-radius: 8px;">
                <div>
                    <div style="font-size: 14px; font-weight: 600;">${SONGS[0].title}</div>
                    <div style="font-size: 12px; color: #b3b3b3;">${SONGS[0].artist}</div>
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
                const filteredSongs = SONGS.filter(song => 
                    song.title.toLowerCase().includes(searchTerm) || 
                    song.artist.toLowerCase().includes(searchTerm)
                );
                renderSongs(filteredSongs, 'search');
            } else if (searchTerm.length === 0) {
                navigateTo(currentView);
            }
        });
    }

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


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
