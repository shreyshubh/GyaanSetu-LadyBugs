/**
 * YouTube Data API v3 service with fallback to search URL.
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Search for YouTube videos on a topic.
 * Falls back to a YouTube search URL if API key is missing or quota exceeded.
 * @param {string} query - search query
 * @param {number} maxResults - max videos (default 3)
 * @returns {Array} [{title, url, channel, thumbnail}]
 */
const searchVideos = async (query, maxResults = 3) => {
  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' tutorial for beginners')}`;
  
  if (!YOUTUBE_API_KEY) {
    return [{ title: `Search: ${query}`, url: fallbackUrl, channel: 'YouTube Search', thumbnail: null }];
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' tutorial')}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('YouTube API error, using fallback URL');
      return [{ title: `Search: ${query}`, url: fallbackUrl, channel: 'YouTube Search', thumbnail: null }];
    }

    const data = await response.json();
    
    return (data.items || []).map(item => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || null
    }));
  } catch (error) {
    console.error('YouTube API error:', error);
    return [{ title: `Search: ${query}`, url: fallbackUrl, channel: 'YouTube Search', thumbnail: null }];
  }
};

module.exports = { searchVideos };
