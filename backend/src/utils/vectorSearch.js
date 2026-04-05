/**
 * Calculates the cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 is exactly identical.
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Ranks items based on the similarity of their embedding to the query embedding.
 * @param {number[]} queryEmbedding - The vector of the search query
 * @param {Array<{embedding: number[], [key: string]: any}>} items - List of items with their embeddings
 * @param {number} topK - Number of top results to return
 * @returns {Array} - The sorted, top K items
 */
function searchSimilar(queryEmbedding, items, topK = 5) {
    if (!items || items.length === 0) return [];
    
    const scored = items.map(item => ({
        ...item,
        score: cosineSimilarity(queryEmbedding, item.embedding || [])
    }));
    
    // Sort descending by score
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

module.exports = {
    cosineSimilarity,
    searchSimilar
};
