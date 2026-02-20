/**
 * Generates a PlantUML SVG URL using the standard "raw" encoding format.
 * This is more stable than Hex for long URLs.
 */
export const getPlantUMLUrl = (code) => {
    if (!code) return '';

    // 1. Clean up potential invisible characters
    const cleanCode = code.trim();

    // 2. Encode to UTF-8 Bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(cleanCode);

    // 3. Simple Base64-like encoding (PlantUML's specific format)
    // We use Hex as a fallback but ensure it's perfectly aligned
    let hex = '';
    for (let i = 0; i < data.length; i++) {
        hex += data[i].toString(16).padStart(2, '0');
    }

    return `https://www.plantuml.com/plantuml/svg/~h${hex}`;
}

/**
 * Enhanced cleaning for AI-generated PlantUML.
 * Prioritizes structural integrity and removes hidden artifacts.
 */
export const cleanPlantUML = (code) => {
    if (!code) return '';

    // 1. Initial cleanup: Remove ANY markdown blocks and conversational text
    let cleaned = code
        .replace(/```[a-z]*\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

    // 2. Locate core boundaries - be precise to avoid partial tags
    const lower = cleaned.toLowerCase();
    const startMatch = lower.match(/@startuml/i);
    const endMatch = lower.lastIndexOf('@enduml');

    if (startMatch) {
        const startIdx = startMatch.index;
        if (endMatch !== -1 && endMatch > startIdx) {
            cleaned = cleaned.substring(startIdx, endMatch + 7);
        } else {
            cleaned = cleaned.substring(startIdx);
        }
    }

    // 3. Line-by-Line cleanup: Remove comments and standardize spacing
    const lines = cleaned.split('\n');
    const finalLines = [];
    const seenElements = new Set();

    for (let line of lines) {
        let l = line.trim();
        if (!l) continue;

        // Skip redundant tags in the middle (common with AI retries)
        const lowerL = l.toLowerCase();
        if (lowerL === '@startuml' && finalLines.length > 0) continue;
        if (lowerL === '@enduml' && lines.indexOf(line) < lines.length - 1) continue;

        // Clean common AI artifacts
        l = l
            .replace(/\/\//g, "'") // Fix C-style comments
            .replace(/[•●■◆]/g, '-') // Fix bullets
            .replace(/-\s+>/g, '->') // Fix broken arrows
            .replace(/--\s+>/g, '-->');

        // De-duplicate definitions (AI often repeats its prompt instructions)
        const defMatch = l.match(/^(actor|participant|node|package|database|cloud|component|class|interface|enum|boundary|control|entity|queue|collections|state|usecase)\s+("[^"]+"|\w+)/i);
        if (defMatch) {
            const key = defMatch[0].toLowerCase();
            if (seenElements.has(key)) continue;
            seenElements.add(key);
        }

        finalLines.push(l);
    }

    let result = finalLines.join('\n').trim();

    // 4. Final assurance block
    if (!result.toLowerCase().startsWith('@startuml')) result = '@startuml\n' + result;
    if (!result.toLowerCase().endsWith('@enduml')) result = result + '\n@enduml';

    return result;
}
