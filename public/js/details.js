document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id');
    
    if (!animeId) {
        window.location.href = 'index.html';
        return;
    }
    
    const backBtn = document.getElementById('back-btn');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    // Back button functionality
    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Search functionality - redirect to search.html
    searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value.trim());
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value.trim());
        }
    });
    
    function performSearch(query) {
        if (!query) return;
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
    
    // Load anime details
    fetchAnimeDetails(animeId);
    
    async function fetchAnimeDetails(id) {
        try {
            // Fetch anime info
            const animeResponse = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
            const animeData = await animeResponse.json();
            
            // Fetch episodes
            let episodes = [];
            try {
                const episodesResponse = await fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`);
                const episodesData = await episodesResponse.json();
                if (episodesData.data) {
                    episodes = episodesData.data;
                }
            } catch (e) {
                console.log('Could not fetch episodes:', e);
            }
            
            displayAnimeDetails(animeData.data, episodes);
        } catch (error) {
            console.error('Error fetching anime details:', error);
            document.getElementById('anime-details').innerHTML = `
                <p>Error loading anime details. Please try again later.</p>
            `;
        }
    }
    
    function displayAnimeDetails(anime, episodes) {
        document.title = `${anime.title} | AnimeHub`;
        
        const animeImage = document.getElementById('anime-image');
        const animeTitle = document.getElementById('anime-title');
        const animeSynopsis = document.getElementById('anime-synopsis');
        const animeScore = document.getElementById('anime-score');
        const animeStatus = document.getElementById('anime-status');
        const animeEpisodes = document.getElementById('anime-episodes');
        const animeAired = document.getElementById('anime-aired');
        const episodesContainer = document.getElementById('episodes-container');
        
        // Set anime info
        animeImage.src = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x450';
        animeImage.alt = anime.title;
        animeTitle.textContent = anime.title;
        
        // Clean up synopsis
        const cleanSynopsis = anime.synopsis?.replace(/\n\n/g, '<br><br>') || 'No synopsis available.';
        animeSynopsis.innerHTML = cleanSynopsis;
        
        // Set meta info
        animeScore.textContent = `Score: ${anime.score || 'N/A'}`;
        animeStatus.textContent = `Status: ${anime.status || 'Unknown'}`;
        animeEpisodes.textContent = `Episodes: ${anime.episodes || 'Unknown'}`;
        animeAired.textContent = `Aired: ${anime.aired?.string || 'Unknown'}`;
        
        // Display episodes
        if (episodes.length > 0) {
            episodes.forEach(episode => {
                const episodeCard = document.createElement('div');
                episodeCard.className = 'episode-card';
                episodeCard.innerHTML = `
                    <h4>Episode ${episode.mal_id}</h4>
                    <p>${episode.title || 'Untitled Episode'}</p>
                `;
                
                episodeCard.addEventListener('click', () => {
                    window.location.href = `player.html?animeId=${anime.mal_id}&episode=${episode.mal_id}`;
                });
                
                episodesContainer.appendChild(episodeCard);
            });
        } else {
            episodesContainer.innerHTML = '<p>No episode information available.</p>';
        }
    }
});