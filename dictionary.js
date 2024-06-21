import {makeJsonCall} from "./utils.js";

export class Dictionary {
    constructor() {
        this.words = new Set();
    }

    includesWord(word) {
        return this.words.has(word);
    }

    static async fetchDictionary() {
        const response = await fetch("https://hudecekpetr.cz/other/lettermage/dictionary.php");
        const responseAsText = await response.text();
        const lines = responseAsText.split('\n');
        const dictionary = new Dictionary();
        for (const line of lines) {
            const word = line.trim().toUpperCase();
            if (word && word.length >= 3) {
                dictionary.words.add(word);
            }
        }
        return dictionary;
    }
}