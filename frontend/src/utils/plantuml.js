/**
 * Encodes a string to Hex for PlantUML Server (~h format).
 * PlantUML Server expects a URL-safe string.
 * Format ~h<HEX_STRING_OF_UTF8_BYTES>
 */

// Proper UTF-8 Hex Encoder
function toHex(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i].toString(16);
        hex += (byte.length === 1 ? '0' : '') + byte;
    }
    return hex;
}

/**
 * Generates a PlantUML SVG URL from code
 * @param {string} code - The PlantUML code
 * @returns {string} - The URL to the SVG image
 */
export const getPlantUMLUrl = (code) => {
    if (!code) return '';
    const hex = toHex(code);
    return `https://www.plantuml.com/plantuml/svg/~h${hex}`;
}

/**
 * Cleans user-generated or AI-generated PlantUML code
 * Removes markdown code blocks and ensures @startuml/@enduml
 * @param {string} code 
 * @returns {string}
 */
export const cleanPlantUML = (code) => {
    if (!code) return '';

    // Remove markdown code blocks (allow for indentation and language tags)
    let clean = code.replace(/^\s*```[a-z]*\s*$/gm, '').replace(/^\s*```\s*$/gm, '').trim();

    // Ensure @startuml and @enduml
    const startIdx = clean.indexOf('@startuml');
    if (startIdx !== -1) {
        clean = clean.substring(startIdx);
    }

    const endIdx = clean.lastIndexOf('@enduml');
    if (endIdx !== -1) {
        clean = clean.substring(0, endIdx + 7);
    }

    return clean;
}
