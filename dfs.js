/**
 * @param word {string}
 * @param letterGrid {Letter[][]}
 */
export function findLetterPath(word, letterGrid) {
    const used = [
        [false,false,false,false],
        [false,false,false,false],
        [false,false,false,false],
        [false,false,false,false]
    ];
    for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 4; y++) {
            const path = findPath(word, letterGrid, 0, x, y, used);
            if (path) return path;
        }
    }
    return null;
}

/**
 * Finds a path in the grid, starting from the current wordIndex.
 *
 * @param word {string} The word that we're searching for in the grid.
 * @param letterGrid {Letter[][]} The letter grid.
 * @param wordIndex {int} The index of the character in the word that we want to place on the coordinates
 * @param x {int} X coordinate of where we want to place the character
 * @param y {int} Y coordinate of where we want to place the character
 * @param lettersUsedSoFar {boolean[][]} Which letters have been used by the search algorithm so far, with backtracking.
 * @return {Letter[]} Path from this index to the rest of the word, if possible.
 */
function findPath(word, letterGrid, wordIndex, x, y, lettersUsedSoFar) {
    if (x < 0 || y < 0 || x >= 4 || y >= 4) return null;
    const targetLetter = letterGrid[x][y];
    // Is unusable?
    if (targetLetter.letter !== word[wordIndex]) return null;
    if (lettersUsedSoFar[x][y]) return null;
    // Move there:
    lettersUsedSoFar[x][y] = true;
    wordIndex++;
    // Are we at the end?
    if (wordIndex === word.length) {
        return [targetLetter];
    }
    // Go to the next letter...
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const targetX = x + dx;
            const targetY = y + dy;
            const pathThroughHere = findPath(word, letterGrid, wordIndex, targetX, targetY, lettersUsedSoFar);
            if (pathThroughHere) {
                return [targetLetter, ...pathThroughHere];
            }
        }
    }
    lettersUsedSoFar[x][y] = false;
    return null;
}