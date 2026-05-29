const audio = document.getElementById('audioEl');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const playerTrack = document.getElementById('playerTrack');
const playerArtist = document.getElementById('playerArtist');
const playerArt = document.getElementById('playerArt');
const tracksGrid = document.getElementById('tracksGrid');
const searchGrid = document.getElementById('searchGrid');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const queueList = document.getElementById('queueList');
const clearQueueBtn = document.getElementById('clearQueue');
const addToQueueBtn = document.getElementById('addToQueueBtn');
const muteBtn = document.getElementById('muteBtn');
const volIcon = document.getElementById('volIcon');
const muteIcon = document.getElementById('muteIcon');
const volumeBar = document.getElementById('volumeBar');
const volumeFill = document.getElementById('volumeFill');

let tracks = [];
let queue = [];
let currentIndex = -1;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let isMuted = false;
let volume = 0.7;
let currentTrack = null;
let searchTimeout = null;

audio.volume = volume;

const ITUNES_PROXY = 'https://itunes.apple.com/search?callback=callback&';

function fetchTracks(term, limit = 20) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('itunesScript');
    if (existing) existing.remove();

    window.callback = (data) => {
      const results = (data.results || []).filter(r => r.previewUrl);
      resolve(results);
    };

    const script = document.createElement('script');
    script.id = 'itunesScript';
    const params = new URLSearchParams({ term, media: 'music', limit, entity: 'song' });
    script.src = `https://itunes.apple.com/search?${params}&callback=callback`;
    script.onerror = () => reject(new Error('Fetch failed'));
    document.head.appendChild(script);
    setTimeout(() => reject(new Error('Timeout')), 8000);
  });
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function renderTracks(container, list) {
  if (!list.length) {
    container.innerHTML = '<p class="empty-state">No results found</p>';
    return;
  }
  container.innerHTML = list.map((t, i) => {
    const art = t.artworkUrl100.replace('100x100bb', '300x300bb');
    const isCurrentPlaying = currentTrack && currentTrack.trackId === t.trackId && isPlaying;
    return `
      <div class="track-card ${isCurrentPlaying ? 'playing' : ''}" data-index="${i}" data-id="${t.trackId}">
        <div class="track-card-art">
          <img src="${art}" alt="${t.trackName}" loading="lazy" />
          <div class="play-overlay">
            <button class="play-overlay-btn">
              ${isCurrentPlaying
                ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'}
            </button>
          </div>
        </div>
        <div class="track-name" title="${t.trackName}">${t.trackName}</div>
        <div class="track-artist" title="${t.artistName}">${t.artistName}</div>
      </div>`;
  }).join('');

  container.querySelectorAll('.track-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index);
      if (container === tracksGrid) {
        tracks = list;
        playTrackAt(idx);
      } else {
        tracks = list;
        playTrackAt(idx);
      }
    });
  });
}

function renderQueue() {
  if (!queue.length) {
    queueList.innerHTML = '<p class="empty-state">Your queue is empty. Add tracks to get started.</p>';
    return;
  }
  queueList.innerHTML = queue.map((t, i) => {
    const art = t.artworkUrl100;
    return `
      <div class="queue-item ${i === currentIndex ? 'current' : ''}" data-index="${i}">
        <span class="queue-item-num">${i + 1}</span>
        <div class="queue-art"><img src="${art}" alt="${t.trackName}" /></div>
        <div class="queue-info">
          <div class="queue-name">${t.trackName}</div>
          <div class="queue-artist">${t.artistName}</div>
        </div>
        <button class="queue-remove icon-btn" data-index="${i}" title="Remove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
  }).join('');

  queueList.querySelectorAll('.queue-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.queue-remove')) return;
      const idx = parseInt(item.dataset.index);
      tracks = queue;
      playTrackAt(idx, true);
    });
  });

  queueList.querySelectorAll('.queue-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      queue.splice(idx, 1);
      if (currentIndex >= idx && currentIndex > 0) currentIndex--;
      renderQueue();
    });
  });
}

function playTrackAt(index, fromQueue = false) {
  const list = fromQueue ? queue : tracks;
  if (!list[index]) return;

  currentIndex = index;
  currentTrack = list[index];

  if (!fromQueue) {
    const alreadyInQueue = queue.find(q => q.trackId === currentTrack.trackId);
    if (!alreadyInQueue) queue.push(currentTrack);
  }

  const art = currentTrack.artworkUrl100.replace('100x100bb', '300x300bb');
  playerTrack.textContent = currentTrack.trackName;
  playerArtist.textContent = currentTrack.artistName;
  playerArt.innerHTML = `<img src="${art}" alt="${currentTrack.trackName}" />`;

  audio.src = currentTrack.previewUrl;
  audio.volume = isMuted ? 0 : volume;
  audio.play();
  isPlaying = true;
  updatePlayBtn();
  addToQueueBtn.style.opacity = '1';
  renderQueue();

  document.querySelectorAll('.track-card').forEach(c => c.classList.remove('playing'));
  document.querySelectorAll(`.track-card[data-id="${currentTrack.trackId}"]`).forEach(c => c.classList.add('playing'));
}

function updatePlayBtn() {
  playIcon.style.display = isPlaying ? 'none' : 'block';
  pauseIcon.style.display = isPlaying ? 'block' : 'none';
}

playBtn.addEventListener('click', () => {
  if (!currentTrack) return;
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play();
    isPlaying = true;
  }
  updatePlayBtn();
});

nextBtn.addEventListener('click', () => {
  if (!tracks.length) return;
  let next = currentIndex + 1;
  if (isShuffle) next = Math.floor(Math.random() * tracks.length);
  if (next >= tracks.length) next = 0;
  playTrackAt(next);
});

prevBtn.addEventListener('click', () => {
  if (!tracks.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  let prev = currentIndex - 1;
  if (prev < 0) prev = tracks.length - 1;
  playTrackAt(prev);
});

audio.addEventListener('ended', () => {
  if (isRepeat) { audio.currentTime = 0; audio.play(); return; }
  nextBtn.click();
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = pct + '%';
  progressThumb.style.left = pct + '%';
  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration);
});

progressBar.addEventListener('click', (e) => {
  const rect = progressBar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle('active', isRepeat);
});

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  audio.volume = isMuted ? 0 : volume;
  volIcon.style.display = isMuted ? 'none' : 'block';
  muteIcon.style.display = isMuted ? 'block' : 'none';
  volumeFill.style.width = isMuted ? '0%' : (volume * 100) + '%';
});

volumeBar.addEventListener('click', (e) => {
  const rect = volumeBar.getBoundingClientRect();
  volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audio.volume = volume;
  isMuted = false;
  volIcon.style.display = 'block';
  muteIcon.style.display = 'none';
  volumeFill.style.width = (volume * 100) + '%';
});

addToQueueBtn.addEventListener('click', () => {
  if (!currentTrack) return;
  const already = queue.find(q => q.trackId === currentTrack.trackId);
  if (!already) {
    queue.push(currentTrack);
    renderQueue();
  }
});

clearQueueBtn.addEventListener('click', () => {
  queue = [];
  currentIndex = -1;
  renderQueue();
});

// Search
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  clearBtn.style.display = q ? 'flex' : 'none';
  clearTimeout(searchTimeout);
  if (!q) {
    searchGrid.innerHTML = '<p class="empty-state">Type something to search</p>';
    return;
  }
  showView('search');
  searchGrid.innerHTML = '<div class="track-skeleton"></div>'.repeat(6);
  searchTimeout = setTimeout(async () => {
    try {
      const results = await fetchTracks(q, 24);
      renderTracks(searchGrid, results);
    } catch {
      searchGrid.innerHTML = '<p class="empty-state">Search failed. Try again.</p>';
    }
  }, 500);
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearBtn.style.display = 'none';
  searchGrid.innerHTML = '<p class="empty-state">Type something to search</p>';
  showView('home');
});

// Navigation
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${name}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-view="${name}"]`);
  if (navItem) navItem.classList.add('active');
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    showView(item.dataset.view);
    if (item.dataset.view === 'queue') renderQueue();
  });
});

// Genre pills
document.querySelectorAll('.genre-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    loadGenre(pill.dataset.genre);
  });
});

async function loadGenre(genre) {
  tracksGrid.innerHTML = '<div class="track-skeleton"></div>'.repeat(6);
  document.getElementById('tracksHeading').textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
  try {
    const results = await fetchTracks(genre, 18);
    tracks = results;
    renderTracks(tracksGrid, results);
  } catch {
    tracksGrid.innerHTML = '<p class="empty-state">Failed to load. Check your connection.</p>';
  }
}

// Init
loadGenre('pop');
