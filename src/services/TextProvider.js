// ═══════════════════════════════════════════════════════════
// TEXT PROVIDER — MONKEYTYPE-STYLE TEXT SOURCE SYSTEM
// ═══════════════════════════════════════════════════════════

class TextProvider {
  constructor() {
    this.cache = {
      words: {},
      quotes: {},
      numbers: null
    };
  }

  /**
   * Load words from a specific language file
   * @param {string} language - 'english', 'indonesian', 'programming'
   * @returns {Promise<string[]>}
   */
  async loadWords(language = 'english') {
    if (this.cache.words[language]) {
      return this.cache.words[language];
    }

    try {
      const module = await import(`../data/words/${language}.json`);
      const words = module.default?.words || module.words || [];
      this.cache.words[language] = words;
      return words;
    } catch (error) {
      console.error(`Failed to load words for language: ${language}`, error);
      return [];
    }
  }

  /**
   * Load quotes from a specific category
   * @param {string} category - 'english', 'indonesian', 'motivational'
   * @returns {Promise<Array>}
   */
  async loadQuotes(category = 'english') {
    if (this.cache.quotes[category]) {
      return this.cache.quotes[category];
    }

    try {
      const module = await import(`../data/quotes/${category}.json`);
      const quotes = module.default?.quotes || module.quotes || [];
      this.cache.quotes[category] = quotes;
      return quotes;
    } catch (error) {
      console.error(`Failed to load quotes for category: ${category}`, error);
      return [];
    }
  }

  /**
   * Load numbers data
   * @returns {Promise<Object>}
   */
  async loadNumbers() {
    if (this.cache.numbers) {
      return this.cache.numbers;
    }

    try {
      const module = await import('../data/numbers/numbers.json');
      const numbers = module.default || module;
      this.cache.numbers = numbers;
      return numbers;
    } catch (error) {
      console.error('Failed to load numbers', error);
      return { patterns: {} };
    }
  }

  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array
   * @returns {Array}
   */
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get random words for typing test
   * @param {string} language - 'english', 'indonesian', 'programming'
   * @param {number} count - Number of words needed
   * @returns {Promise<string[]>}
   */
  async getRandomWords(language = 'english', count = 50) {
    const words = await this.loadWords(language);
    if (words.length === 0) return [];

    // If we need more words than available, repeat and shuffle
    const shuffled = this.shuffle(words);
    const result = [];
    
    while (result.length < count) {
      const batch = this.shuffle(words);
      result.push(...batch);
    }

    return result.slice(0, count);
  }

  /**
   * Get a random quote
   * @param {string} category - 'english', 'indonesian', 'motivational'
   * @returns {Promise<Object|null>} - { id, text, author }
   */
  async getRandomQuote(category = 'english') {
    const quotes = await this.loadQuotes(category);
    if (quotes.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }

  /**
   * Get random numbers for typing test
   * @param {string} pattern - 'simple', 'double', 'triple', 'large', 'decimal', 'negative', 'mixed'
   * @param {number} count - Number of numbers needed
   * @returns {Promise<string[]>}
   */
  async getRandomNumbers(pattern = 'mixed', count = 50) {
    const numbersData = await this.loadNumbers();
    const patternData = numbersData.patterns?.[pattern] || numbersData.patterns?.simple || [];
    
    if (patternData.length === 0) return [];

    const result = [];
    while (result.length < count) {
      const batch = this.shuffle(patternData);
      result.push(...batch);
    }

    return result.slice(0, count);
  }

  /**
   * Generate infinite word stream based on duration
   * Ensures text never runs out before timer ends
   * @param {string} mode - 'words', 'quotes', 'numbers'
   * @param {string} subType - language for words, category for quotes, pattern for numbers
   * @param {number} duration - Expected duration in seconds
   * @returns {Promise<string[]>}
   */
  async generateInfiniteText(mode = 'words', subType = 'english', duration = 30) {
    // Estimate: average typing speed ~40 WPM = 200 CPM
    // At 200 CPM for 30 seconds = 100 characters
    // Average word length ~ 5 chars = ~20 words per 30 seconds for average typist
    // We'll generate 3x the estimated need to ensure never running out
    const estimatedWPM = 60; // Assume moderate-fast typist
    const wordsNeeded = Math.ceil((estimatedWPM * duration) / 60) * 3;

    switch (mode) {
      case 'quotes': {
        // For quotes, return the quote text split into words
        const quote = await this.getRandomQuote(subType);
        if (!quote) return [];
        return quote.text.split(' ');
      }

      case 'numbers': {
        return await this.getRandomNumbers(subType, wordsNeeded);
      }

      case 'words':
      default: {
        return await this.getRandomWords(subType, wordsNeeded);
      }
    }
  }

  /**
   * Get available categories for auto-detection
   * @returns {Object}
   */
  getAvailableCategories() {
    return {
      words: ['english', 'indonesian', 'programming'],
      quotes: ['english', 'indonesian', 'motivational'],
      numbers: ['simple', 'double', 'triple', 'large', 'decimal', 'negative', 'mixed']
    };
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache() {
    this.cache = {
      words: {},
      quotes: {},
      numbers: null
    };
  }
}

// Export singleton instance
export default new TextProvider();
export { TextProvider };
