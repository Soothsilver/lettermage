import {ScrabblePoints} from "./scrabblePoints.js";

export function getThreeBestWords(words) {
    return getAllBestWords(words).slice(0, 3).join(", ");
}

/**
 * Sorts words and removes duplicates.
 *
 * @param words {{points:int,word:string}[]}
 * @return {string[]}
 */
export function getAllBestWords(words) {
    words.sort(function (a,b){
        return -(a.points - b.points);
    });

    return words.map(w => w.word).filter((value,index,array)=>array.indexOf(value) === index);
}

export function getAllBestWordsAsString(words) {
    const sorted = getAllBestWords(words);
    return sorted.map(w => w + " <small>(" + ScrabblePoints.calculateWordPointWorth(w) + "pts)</small>").join(", ");
}