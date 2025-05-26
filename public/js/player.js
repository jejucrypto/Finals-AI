document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('animeId');
    const episodeNum = urlParams.get('episode');
    
    if (!animeId || !episodeNum) {
        window.location.href = 'index.html';
        return;
    }

    // Player elements
    const backBtn = document.getElementById('back-btn');
    const videoPlayer = document.getElementById('video-player');
    const episodeTitle = document.getElementById('episode-title');
    const episodesList = document.getElementById('episodes-list');

    // Search elements (dynamically create if not in HTML)
    const headerContainer = document.querySelector('header .container');
    if (headerContainer && !document.getElementById('player-search-container')) {
        const searchContainer = document.createElement('div');
        searchContainer.id = 'player-search-container';
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" id="player-search-input" placeholder="Search anime...">
            <button id="player-search-btn">Search</button>
        `;
        headerContainer.appendChild(searchContainer);
    }

    // Search functionality
    const searchInput = document.getElementById('player-search-input');
    const searchBtn = document.getElementById('player-search-btn');
    
    if (searchBtn && searchInput) {
        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        };
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    // Back button functionality
    backBtn.addEventListener('click', () => {
        window.location.href = `details.html?id=${animeId}`;
    });

    // Initialize player
    fetchAnimeAndEpisodes(animeId, episodeNum);

    async function fetchAnimeAndEpisodes(id, episodeNumber) {
        try {
            // 1. Fetch anime details
            const animeResponse = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
            const animeData = await animeResponse.json();
            
            // 2. Fetch episodes list
            let episodes = [];
            try {
                const episodesResponse = await fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`);
                const episodesData = await episodesResponse.json();
                episodes = episodesData.data || [];
            } catch (e) {
                console.error('Error fetching episodes:', e);
            }

            // 3. Load video stream
            await loadVideoStream(animeData.data, episodeNumber);
            
            // 4. Display episode info and list
            displayPlayerInfo(animeData.data, episodes, episodeNumber);
            
        } catch (error) {
            console.error('Error initializing player:', error);
            showError('Failed to load player');
        }
    }

    async function loadVideoStream(anime, episodeNumber) {
        try {
            const response = await fetch('http://localhost:3001/api/get-stream-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    animeTitle: anime.title,
                    episodeNumber: episodeNumber
                }),
            });

            const data = await response.json();
            
            if (data.success && data.embedUrl) {
                videoPlayer.src = data.embedUrl;
                videoPlayer.onerror = () => showError('Video failed to load');
            } else {
                throw new Error(data.error || 'No stream URL available');
            }
        } catch (error) {
            console.error('Stream error:', error);
            showError(error.message);
        }
    }

    function displayPlayerInfo(anime, episodes, currentEpisodeNum) {
        // Set document title
        document.title = `${anime.title} - Episode ${currentEpisodeNum} | AnimeHub`;
        
        // Set episode title
        const currentEpisode = episodes.find(ep => ep.mal_id == currentEpisodeNum) || {
            title: `Episode ${currentEpisodeNum}`
        };
        episodeTitle.textContent = currentEpisode.title || `Episode ${currentEpisodeNum}`;
        
        // Populate episodes list
        episodesList.innerHTML = '';
        if (episodes.length > 0) {
            episodes.forEach(episode => {
                const episodeItem = document.createElement('div');
                episodeItem.className = `episode-item ${episode.mal_id == currentEpisodeNum ? 'active' : ''}`;
                episodeItem.innerHTML = `
                    <p>Episode ${episode.mal_id}</p>
                    <small>${episode.title || 'Untitled Episode'}</small>
                `;
                
                episodeItem.addEventListener('click', () => {
                    if (episode.mal_id != currentEpisodeNum) {
                        window.location.href = `player.html?animeId=${anime.mal_id}&episode=${episode.mal_id}`;
                    }
                });
                
                episodesList.appendChild(episodeItem);
            });
        } else {
            episodesList.innerHTML = '<p>No episode information available.</p>';
        }
    }

    function showError(message) {
        console.error('Player error:', message);
        episodeTitle.textContent += ` (Error: ${message})`;
        videoPlayer.src = '';
        // Optionally show an error message in the UI
    }
});