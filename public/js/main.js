document.addEventListener('DOMContentLoaded', () => {
    const animeContainer = document.getElementById('anime-container');
    const loadingIndicator = document.getElementById('loading');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const filterBy = document.getElementById('filter-by');
    
    let currentPage = 1;
    let isLoading = false;
    let currentFilter = 'airing';
    
    // Initial load
    fetchAnime(currentPage, currentFilter);
    
    // Filter change
    filterBy.addEventListener('change', () => {
        currentFilter = filterBy.value;
        currentPage = 1;
        animeContainer.innerHTML = '';
        fetchAnime(currentPage, currentFilter);
    });
    
    // Search functionality - redirect to search.html
    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    }
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Infinite scroll
    window.addEventListener('scroll', () => {
        if (isLoading) return;
        
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            currentPage++;
            fetchAnime(currentPage, currentFilter);
        }
    });
    
    async function fetchAnime(page, filter) {
        isLoading = true;
        loadingIndicator.style.display = 'block';
        
        try {
            const url = `https://api.jikan.moe/v4/top/anime?filter=${filter}&page=${page}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                displayAnime(data.data);
            } else if (page === 1) {
                animeContainer.innerHTML = '<p>No anime found.</p>';
            }
        } catch (error) {
            console.error('Error fetching anime:', error);
            if (page === 1) {
                animeContainer.innerHTML = '<p>Error loading anime. Please try again.</p>';
            }
        } finally {
            isLoading = false;
            loadingIndicator.style.display = 'none';
        }
    }
    
    function displayAnime(animeList) {
        animeList.forEach(anime => {
            const animeCard = document.createElement('div');
            animeCard.className = 'anime-card';
            animeCard.innerHTML = `
                <img src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/200x300'}" alt="${anime.title}">
                <div class="anime-info">
                    <h3>${anime.title}</h3>
                    <p>${anime.score ? `⭐ ${anime.score}` : 'No rating'}</p>
                </div>
            `;
            
            animeCard.addEventListener('click', () => {
                window.location.href = `details.html?id=${anime.mal_id}`;
            });
            
            animeContainer.appendChild(animeCard);
        });
    }
});