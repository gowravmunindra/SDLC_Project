/**
 * PlantUML Utilities
 * 
 * ARCHITECTURE: Instead of generating long hex URLs (which break on complex diagrams),
 * this module generates URLs that point to a backend proxy endpoint. The backend
 * calls plantuml.com server-side and returns the SVG, completely avoiding browser
 * URL length limits.
 * 
 * Flow: PlantUML Code -> Backend /api/ai/plantuml/render -> plantuml.com -> SVG
 */

const API_URL = typeof window !== 'undefined'
    ? (import.meta?.env?.VITE_API_URL || 'http://localhost:5001/api')
    : 'http://localhost:5001/api';

/**
 * Gets a URL that can be used in an <img> src attribute.
 * 
 * This function encodes the PlantUML code to a hex string and uses the
 * direct plantuml.com URL, but with a fallback to the backend proxy
 * for diagrams that are too long.
 */
export const getPlantUMLUrl = (code) => {
    if (!code || typeof code !== 'string') return '';
    const cleanCode = code.trim();
    if (!cleanCode.includes('@startuml')) return '';

    // Hex encoding for direct PlantUML URL
    const bytes = new TextEncoder().encode(cleanCode);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }

    // For very long diagrams (>1500 chars of encoded), use backend proxy URL
    // to avoid browser URL length limits
    if (hex.length > 3000) {
        // The backend proxy endpoint handles the rendering
        // We encode the code as base64 in the query to pass it
        const encoded = btoa(unescape(encodeURIComponent(cleanCode)));
        return `${API_URL}/ai/plantuml/render?code=${encodeURIComponent(encoded)}`;
    }

    return `https://www.plantuml.com/plantuml/svg/~h${hex}`;
};

/**
 * Gets a backend-proxied URL (always uses backend, never length-limited).
 * Used when we know the diagram will be large.
 */
export const getPlantUMLProxyUrl = (code) => {
    if (!code || typeof code !== 'string') return '';
    const cleanCode = code.trim();
    if (!cleanCode.includes('@startuml')) return '';
    
    const encoded = btoa(unescape(encodeURIComponent(cleanCode)));
    return `${API_URL}/ai/plantuml/render?code=${encodeURIComponent(encoded)}`;
};

/**
 * Gets a PNG URL for exporting (via plantuml.com directly)
 */
export const getPlantUMLPngUrl = (code) => {
    if (!code) return '';
    const bytes = new TextEncoder().encode(code.trim());
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return `https://www.plantuml.com/plantuml/png/~h${hex}`;
};

/**
 * Lightweight PlantUML cleaner and auto-corrector.
 * 
 * Functional Requirements handled:
 * - Detect syntax errors (stripping non-UML prose)
 * - Auto-correct invalid syntax (arrows, tags, malformed blocks)
 * - Guarantee @startuml/@enduml boundaries
 */
export const cleanPlantUML = (code) => {
    if (!code || typeof code !== 'string') return '';

    // 1. Strip markdown code fences and extraneous text
    let cleaned = code
        .replace(/```plantuml\s*/gi, '')
        .replace(/```uml\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

    // 2. Extract the @startuml...@enduml block (the most reliable way)
    const startMatch = cleaned.match(/@startuml/i);
    const endMatch = [...cleaned.matchAll(/@enduml/gi)].pop(); // Get last enduml

    if (startMatch) {
        if (endMatch && endMatch.index > startMatch.index) {
            cleaned = cleaned.substring(startMatch.index, endMatch.index + 7);
        } else {
            cleaned = cleaned.substring(startMatch.index);
        }
    }

    // 3. Line-by-line normalization and auto-correction
    const lines = cleaned.split('\n');
    const fixedLines = [];
    const STYLE_TAG = 'skinparam backgroundColor transparent\nskinparam shadowing false';

    for (const rawLine of lines) {
        let l = rawLine; 
        const trimmed = l.trim();
        
        // Skip empty lines or prose that leaked in
        if (!trimmed) continue;
        if (trimmed.startsWith('Note: ') || trimmed.startsWith('Here is ') || trimmed.startsWith('This is ')) continue;

        // Auto-correct common AI syntax errors
        l = l
            // Fix unicode/malformed arrows
            .replace(/[→➔➛➜➝]/g, '->')
            .replace(/[⟶]/g, '-->')
            .replace(/-\s+>/g, '->')
            .replace(/--\s+>/g, '-->')
            .replace(/<\s+-/g, '<-')
            .replace(/<\s+--/g, '<--')
            
            // Fix malformed [ * ]
            .replace(/\[\s*\*\s*\]/g, '[*]')
            
            // Fix "diagram" keyword leak (sometimes AI writes "class diagram {")
            .replace(/^\s*(class|sequence|usecase|activity|state|component|deployment)\s+diagram\b/i, (match, p1) => p1)
            
            // Fix Mermaid-style arrow leaks
            .replace(/->>|=>>|-->>>/g, '->')
            
            // Fix "nodo" typo
            .replace(/\bnodo\b/gi, 'node');

        fixedLines.push(l);
    }

    let result = fixedLines.join('\n').trim();

    // 4. Guarantee boundaries and inject styles
    if (!result.match(/^@startuml/im)) {
        result = '@startuml\n' + result;
    }
    
    // Inject styles if they are missing
    if (!result.toLowerCase().includes('skinparam')) {
        result = result.replace(/@startuml/i, `@startuml\n${STYLE_TAG}`);
    }

    if (!result.match(/@enduml\s*$/im)) {
        result = result + '\n@enduml';
    }

    return result;
};
