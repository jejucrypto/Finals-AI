const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const stringSimilarity = require('string-similarity');
const path = require('path');



const app = express();
const PORT = 3001;
const BASE_URL = 'https://www.animegg.org';

//for the chats
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Improved anime search with string similarity
async function searchAnime(title) {
    const searchUrl = `${BASE_URL}/search/?q=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl);
    const body = await res.text();
    const $ = cheerio.load(body);

    const potentialMatches = [];
    
    $('.page a.mse').each((_, el) => {
        const animeTitle = $(el).find('h2').text().trim();
        const animeUrl = BASE_URL + $(el).attr('href');
        potentialMatches.push({ title: animeTitle, url: animeUrl });
    });

    if (potentialMatches.length === 0) return null;

    // Find best match using string similarity
    const matches = stringSimilarity.findBestMatch(title, potentialMatches.map(m => m.title));
    const bestMatch = potentialMatches[matches.bestMatchIndex];
    
    console.log(`Matching "${title}" to "${bestMatch.title}" with score ${matches.bestMatch.rating}`);
    
    // Only return if similarity is good enough
    return matches.bestMatch.rating >= 0.6 ? bestMatch.url : null;
}

// Episode verification
async function getEmbedUrl(animeSlug, episodeNum) {
    const episodeUrl = `${BASE_URL}/${animeSlug}-episode-${episodeNum}`;
    const res = await fetch(episodeUrl);
    const body = await res.text();
    
    // Verify this is actually an episode page
    const $ = cheerio.load(body);
    const pageTitle = $('title').text().toLowerCase();
    
    if (!pageTitle.includes(`episode ${episodeNum}`) && 
        !pageTitle.includes(`ep ${episodeNum}`)) {
        throw new Error(`Page title doesn't match episode ${episodeNum}`);
    }

    const iframeSrc = $('#subbed-Animegg iframe').attr('src');
    if (!iframeSrc) {
        throw new Error('Embed iframe not found');
    }

    return `${BASE_URL}${iframeSrc}`;
}

// API endpoint to get streaming URL
app.post('/api/get-stream-url', async (req, res) => {
    const { animeTitle, episodeNumber } = req.body;
    
    if (!animeTitle || !episodeNumber) {
        return res.status(400).json({ error: 'Missing anime title or episode number' });
    }

    console.log(`Fetching: ${animeTitle} - Episode ${episodeNumber}`);
    
    try {
        // Step 1: Search for anime
        const animeUrl = await searchAnime(animeTitle);
        if (!animeUrl) {
            return res.status(404).json({ error: 'Anime not found' });
        }

        // Extract slug from URL (e.g., "series/one-piece" -> "one-piece")
        const animeSlug = animeUrl.split('/').pop();
        
        // Step 2: Get embed URL with verification
        const embedUrl = await getEmbedUrl(animeSlug, episodeNumber);
        
        res.json({ 
            success: true,
            embedUrl: embedUrl,
            animeSlug: animeSlug
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch stream URL',
            details: error.message
        });
    }
});

app.use(express.static(path.join(__dirname, 'public'))); 

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
