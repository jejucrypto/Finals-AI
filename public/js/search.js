document.addEventListener('DOMContentLoaded', () => {
    const animeContainer = document.getElementById('anime-container');
    const loadingIndicator = document.getElementById('loading');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const backBtn = document.getElementById('back-btn');
    
    let currentPage = 1;
    let isLoading = false;
    let searchQuery = '';
    
    // Check for search query in URL
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');
    
    if (initialQuery) {
        searchInput.value = initialQuery;
        performSearch(initialQuery);
    }
    
    // Search functionality
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            // Update URL without reload
            window.history.pushState({}, '', `search.html?q=${encodeURIComponent(query)}`);
            performSearch(query);
        }
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                window.history.pushState({}, '', `search.html?q=${encodeURIComponent(query)}`);
                performSearch(query);
            }
        }
    });
    
    backBtn.addEventListener('click', () => {
        window.history.back();
    });
    
    function performSearch(query) {
        if (!query) return;
        
        searchQuery = query;
        currentPage = 1;
        animeContainer.innerHTML = '';
        fetchSearchResults(currentPage, query);
    }
    
    async function fetchSearchResults(page, query) {
        isLoading = true;
        loadingIndicator.style.display = 'block';
        
        try {
            const url = `https://api.jikan.moe/v4/anime?q=${query}&page=${page}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                displayAnime(data.data);
                
                // Infinite scroll setup
                window.addEventListener('scroll', handleScroll);
            } else if (page === 1) {
                animeContainer.innerHTML = '<p>No anime found. Try a different search.</p>';
            }
        } catch (error) {
            console.error('Error fetching search results:', error);
            if (page === 1) {
                animeContainer.innerHTML = '<p>Error loading search results. Please try again.</p>';
            }
        } finally {
            isLoading = false;
            loadingIndicator.style.display = 'none';
        }
    }
    
    function handleScroll() {
        if (isLoading) return;
        
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            currentPage++;
            window.removeEventListener('scroll', handleScroll);
            fetchSearchResults(currentPage, searchQuery);
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