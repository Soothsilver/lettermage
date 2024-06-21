export class Session {
    constructor() {
        this.yourName = null;
        this.yourGrid = null;
        this.yourStartTime = null;
        this.yourGameName = null;
        this.holdingMouse = false;
        this.inGame = false;
        this.volumeMuted = false;
        this.volume = 1;
        /**
         * @type {string}
         */
        this.formedWordViaKeyboard = "";
        /**
         * @type {Letter[]}
         */
        this.ephemeralPathfoundFormedWordViaKeyboard = [];
        /**
         * @type {Letter[]}
         */
        this.formedWordViaMouse = [];
        /**
         * @type {Letter[]}
         */
        this.letters = [];
        /**
         *
         * @type {Letter[][]}
         */
        this.letterGrid = [];
        /**
         * @type {Promise<Dictionary>}
         */
        this.dictionaryPromise = undefined;
        /**
         * @type {string[]}
         */
        this.wordsAlreadyUsed = [];
    }

    async dictionary() {
        return await this.dictionaryPromise;
    }

    wordToString() {
        let word = "";
        if (this.formedWordViaMouse.length > 0) {
            for (const letter of this.formedWordViaMouse) {
                word += letter.letter;
            }
        } else if (this.ephemeralPathfoundFormedWordViaKeyboard.length > 0) {
            for (const letter of this.ephemeralPathfoundFormedWordViaKeyboard) {
                word += letter.letter;
            }
        }
        return word;
    }
}

export class Letter {
    /**
     * @param x {int}
     * @param y {int}
     * @param letter {string}
     * @param letterDiv {HTMLDivElement}
     * @param letterInnerDiv {HTMLDivElement}
     */
    constructor(x, y, letter, letterDiv, letterInnerDiv) {
        this.x = x;
        this.y = y;
        this.letter = letter;
        this.letterDiv = letterDiv;
        this.letterInnerDiv = letterInnerDiv;
    }

    /**
     * @param newLetter {Letter}
     * @returns {boolean}
     */
    canReach(newLetter) {
        return Math.abs(newLetter.x - this.x) <= 1
        && Math.abs(newLetter.y - this.y) <= 1;
    }
}