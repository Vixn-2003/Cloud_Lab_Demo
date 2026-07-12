import { v4 as uuidv4 } from "uuid";

export class PlagiarismService {
  /**
   * Tokenize code for structural analysis:
   * Strips comments and string literals, then matches alphanumeric tokens.
   */
  static getTokens(code: string): string[] {
    if (!code) return [];
    
    // Strip comments & strings
    const cleanCode = code
      .replace(/#.*$/gm, '') // python/shell comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // c-style multiline comments
      .replace(/\/\/.*$/gm, '') // c-style single line comments
      .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '') // double quoted strings
      .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, ''); // single quoted strings

    const matches = cleanCode.match(/\w+/g);
    return matches ? matches.map((m) => m.toLowerCase()) : [];
  }

  /**
   * Calculate Cosine Similarity between two source codes based on token frequencies.
   * Returns a value between 0.0 and 1.0.
   */
  static calculateCosineSimilarity(code1: string, code2: string): number {
    const tokens1 = this.getTokens(code1);
    const tokens2 = this.getTokens(code2);

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const freq1: Record<string, number> = {};
    const freq2: Record<string, number> = {};
    const allTokens = new Set<string>();

    for (const t of tokens1) {
      freq1[t] = (freq1[t] || 0) + 1;
      allTokens.add(t);
    }
    for (const t of tokens2) {
      freq2[t] = (freq2[t] || 0) + 1;
      allTokens.add(t);
    }

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (const t of allTokens) {
      const val1 = freq1[t] || 0;
      const val2 = freq2[t] || 0;
      dotProduct += val1 * val2;
      mag1 += val1 * val1;
      mag2 += val2 * val2;
    }

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  /**
   * Scan best submissions in a session for copy cases.
   * Returns an array of plagiarism cases matching or exceeding threshold.
   */
  static scanSessionSubmissions(sessionId: string, bestSubmissions: any[], threshold = 0.7): any[] {
    const cases: any[] = [];
    const now = new Date().toISOString();

    // Group submissions by labId
    const subsByLab: Record<string, any[]> = {};
    for (const sub of bestSubmissions) {
      if (!subsByLab[sub.lab_id]) {
        subsByLab[sub.lab_id] = [];
      }
      subsByLab[sub.lab_id].push(sub);
    }

    // Compare pairs for each lab
    for (const labId of Object.keys(subsByLab)) {
      const list = subsByLab[labId];
      if (list.length < 2) continue;

      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const subA = list[i];
          const subB = list[j];

          // Skip if same student (should not happen anyway)
          if (subA.user_id === subB.user_id) continue;

          const similarity = this.calculateCosineSimilarity(subA.code, subB.code);

          if (similarity >= threshold) {
            cases.push({
              id: uuidv4(),
              sessionId,
              labId,
              studentAId: subA.user_id,
              studentBId: subB.user_id,
              similarityScore: parseFloat(similarity.toFixed(4)),
              codeA: subA.code,
              codeB: subB.code,
              status: 'pending',
              createdAt: now
            });
          }
        }
      }
    }

    return cases;
  }
}
