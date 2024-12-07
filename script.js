document.addEventListener('DOMContentLoaded', () => {
  const songList = document.getElementById('songList');
  const audioPlayer = document.getElementById('audioPlayer');
  const songTitle = document.getElementById('songTitle');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const loopBtn = document.getElementById('loopBtn');
  const fileInput = document.getElementById('fileInput');
  const fileLabel = document.getElementById('fileLabel');
  const searchInput = document.getElementById('searchInput');

  let songs = [];
  let filteredSongs = [];
  let currentIndex = 0;
  let isShuffling = false;
  let isLooping = false;

  // Fetch available songs from the server
  const fetchSongs = async () => {
    try {
      const response = await fetch('http://localhost:3000/songs');
      const data = await response.json();
      if (data && Array.isArray(data.songs)) {
        songs = data.songs; // Extract songs array from backend response
        filteredSongs = songs; // Set initial filtered songs
        updateSongList();
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (err) {
      console.error('Error fetching songs:', err);
    }
  };

  // Update the song list in the UI
  const updateSongList = () => {
    songList.innerHTML = '';
    if (filteredSongs.length === 0) {
      songList.innerHTML = '<li>Not found</li>'; // Display 'Not found' if no songs match
    } else {
      filteredSongs.forEach((song, index) => {
        const li = document.createElement('li');
        li.textContent = song;
        li.classList.add('song-item');
        li.addEventListener('click', () => playSong(index));
        songList.appendChild(li);
      });
    }
  };

  // Filter song list based on search input
  const filterSongs = () => {
    const query = searchInput.value.toLowerCase();
    filteredSongs = songs.filter(song => song.toLowerCase().includes(query));
    updateSongList();
  };

  // Play selected song
  const playSong = (index) => {
    currentIndex = index;
    audioPlayer.src = `http://localhost:3000/music/${filteredSongs[currentIndex]}`;
    songTitle.textContent = filteredSongs[currentIndex];
    audioPlayer.play();
    highlightCurrentSong();
    playPauseBtn.innerHTML = `<i class="fas fa-pause"></i>`;
  };

  // Highlight current song in list
  const highlightCurrentSong = () => {
    document.querySelectorAll('.song-item').forEach((item, index) => {
      item.classList.toggle('selected', index === currentIndex);
    });
  };

  // Play/Pause button event
  playPauseBtn.addEventListener('click', () => {
    if (audioPlayer.paused) {
      audioPlayer.play();
      playPauseBtn.innerHTML = `<i class="fas fa-pause"></i>`;
    } else {
      audioPlayer.pause();
      playPauseBtn.innerHTML = `<i class="fas fa-play"></i>`;
    }
  });

  // Previous song button event
  prevBtn.addEventListener('click', () => {
    currentIndex = currentIndex > 0 ? currentIndex - 1 : filteredSongs.length - 1;
    playSong(currentIndex);
  });

  // Next song button event
  nextBtn.addEventListener('click', () => {
    if (isShuffling) {
      currentIndex = Math.floor(Math.random() * filteredSongs.length);
    } else {
      currentIndex = (currentIndex + 1) % filteredSongs.length;
    }
    playSong(currentIndex);
  });

  // Shuffle button event
  shuffleBtn.addEventListener('click', () => {
    isShuffling = !isShuffling;
    shuffleBtn.style.color = isShuffling ? '#39FF14' : '#fff';
  });

  // Loop button event
  loopBtn.addEventListener('click', () => {
    isLooping = !isLooping;
    audioPlayer.loop = isLooping;
    loopBtn.style.color = isLooping ? '#39FF14' : '#fff';
  });

  // Handle file selection and update label
  fileInput.addEventListener('change', () => {
    const fileName = fileInput.files[0]?.name || 'No file chosen';
    fileLabel.textContent = fileName ? 'Upload Song' : 'Choose File';
  });

  // Upload song event
  fileLabel.addEventListener('click', async () => {
    if (fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        fetchSongs(); // Refresh song list after upload
      } else {
        console.error('Error uploading file:', await response.text());
      }
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  });

  // Automatically play the next song when the current one ends
  audioPlayer.addEventListener('ended', () => {
    nextBtn.click();
  });

  // Search input event listener
  searchInput.addEventListener('input', filterSongs);

  // Initialize and fetch songs when page loads
  fetchSongs();
});
