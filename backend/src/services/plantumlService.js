/**
 * PlantUML Rendering Service
 * 
 * This service renders PlantUML code server-side by forwarding it to the
 * official plantuml.com server. This approach:
 *   1. Bypasses browser URL length limits (hex URLs can exceed 2KB for complex diagrams)
 *   2. Provides server-side retry logic for transient failures  
 *   3. Caches rendered SVGs to avoid re-rendering the same code
 *   4. Returns SVG data as base64 for embedding directly in <img> tags
 */
const axios = require('axios');

// Simple in-memory cache: code_hash -> svgBase64
const svgCache = new Map();

/**
 * Encode PlantUML code to the standard hex format (~h prefix)
 */
function toHex(code) {
    let hex = '';
    const bytes = Buffer.from(code, 'utf8');
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return `~h${hex}`;
}

/**
 * Render PlantUML code to SVG by calling plantuml.com server-side.
 * Returns the SVG content as a string, or throws an error.
 */
async function renderSVG(code) {
    if (!code || typeof code !== 'string') {
        throw new Error('No PlantUML code provided');
    }

    const crypto = require('crypto');
    const cleanCode = code.trim();

    // Check cache first - Use MD5 hash of the ENTIRE code to ensure uniqueness
    // The previous 64-char slice caused collisions for diagrams with identical headers
    const cacheKey = crypto.createHash('md5').update(cleanCode).digest('hex');
    if (svgCache.has(cacheKey)) {
        return svgCache.get(cacheKey);
    }

    const encoded = toHex(cleanCode);
    const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;

    try {
        const response = await axios.get(url, {
            timeout: 30000, // 30 seconds for rendering
            responseType: 'text',
            headers: {
                'Accept': 'image/svg+xml,*/*',
                'User-Agent': 'SDLC-Platform/1.0'
            }
        });

        const svgContent = response.data;

        // Validate we actually got SVG content
        if (!svgContent || !svgContent.includes('<svg')) {
            throw new Error('PlantUML server returned non-SVG content');
        }

        // Cache the result (limit cache to 100 entries)
        if (svgCache.size >= 100) {
            const firstKey = svgCache.keys().next().value;
            svgCache.delete(firstKey);
        }
        svgCache.set(cacheKey, svgContent);

        return svgContent;
    } catch (error) {
        if (error.response?.status === 400) {
            throw new Error('Invalid PlantUML syntax. Check the generated code.');
        }
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            throw new Error('PlantUML server timed out. Try regenerating.');
        }
        throw new Error(`PlantUML rendering failed: ${error.message}`);
    }
}

module.exports = { renderSVG, toHex };
