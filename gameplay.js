import {makeJsonCall} from "./utils.js";
import {ScrabblePoints} from "./scrabblePoints.js";
import {Letter} from "./Session.js";
import {findLetterPath} from "./dfs.js";
import {getAllBestWordsAsString, getThreeBestWords} from "./wordsort.js";
import {playSoundEffect} from "./sfx.js";

let startTimeTimestamp = undefined;
let endTimeTimestamp = undefined;
let gameplayClock = undefined;
let gameplayEnded = false;

async function gameplayTick() {
    const currentTime = Date.now();
    const timeRemaining = endTimeTimestamp - currentTime;
    const response = await makeJsonCall("action=gameplayTick&gameName=" + window.session.yourGameName);
    if (response.ended) {
        if (!gameplayEnded) {
            playSoundEffect("sfx/Victory.wav");
            document.getElementById("divIngame").style.display = "none";
            document.getElementById("ulFinalPlayerList").innerHTML = "";
            const allWords = [];
            let playerIndex = 0;
            for (const [playerName, player] of Object.entries(response.players)) { 
                const name = player.name;
                const points = player.points;
                if (points > 0) {
                    const li = document.createElement("li");
                    allWords.push(...player.words);
                    let fontSize = "13.3";
                    if (playerIndex == 0) fontSize = "22";
                    else if (playerIndex == 1) fontSize = "20";
                    else if (playerIndex == 2) fontSize = "18";
                    li.innerHTML = "<span style='font-size:" + fontSize + "px'><b>" + name + ":</b> " + points + " points <small>(" + getThreeBestWords(player.words) + ")</small></span>";
                    document.getElementById("ulFinalPlayerList").append(li);
                    playerIndex++;
                }
            }
            document.getElementById("spanBestWords").innerHTML = getAllBestWordsAsString(allWords);
            gameplayEnded = true;
            window.session.inGame = false;
            document.getElementById("divFinalLeaderboard").style.display = "block";
        }
    } else {
        if (gameplayEnded) {
            gameplayEnded = false;
            document.getElementById("divFinalLeaderboard").style.display = "none";
            document.getElementById("divIngame").style.display = "block";
            window.session.yourGrid = response["lettergrid"];
            window.session.yourStartTime = response["starttime"];
            beginGameplay(response.lettergrid, response.starttime, response.endtime);
        }
        let secondsRemaining = Math.round(timeRemaining / 1000);
        let timeLeftHtml = secondsRemaining > 0 ? ("Time left: " + secondsRemaining + "s") : "The game is about to end...";
        document.getElementById("divTimeRemaining").innerHTML = timeLeftHtml;
    }
}


export function beginGameplay(lettergrid, startTime, endTime) {
    const grid = document.getElementById("divGrid");
    grid.innerHTML = "";
    let letterIndex = 0;
    let x = 0;
    let y = 0;
    const session = window.session;
    session.letters = [];
    session.wordsAlreadyUsed = [];
    session.letterGrid = [[], [], [], []];
    for (const letterString of lettergrid) {
        // Outer div
        const letterDiv = document.createElement("div");
        letterDiv.className = "letter";
        letterDiv.innerHTML = letterString;
        // Inner div
        const letterInnerDiv = document.createElement("div");
        letterInnerDiv.className = "letterInner";
        letterDiv.append(letterInnerDiv);
        // Weight div
        const letterWeightDiv = document.createElement("div");
        letterWeightDiv.className = "letterWeight";
        letterWeightDiv.innerHTML = ScrabblePoints.points[letterString];
        letterDiv.append(letterWeightDiv);
        // Full letter
        const letter = new Letter(x, y, letterString, letterDiv, letterInnerDiv);
        session.letters.push(letter);
        session.letterGrid[y].push(letter);
        letterInnerDiv.onpointermove = async function () {
            holdMouseOver(letter);
        };
        grid.append(letterDiv);
        letterIndex++;
        x++;
        if (letterIndex % 4 === 0) {
            grid.append(document.createElement("br"));
            x = 0;
            y++;
        }
    }
    startTimeTimestamp = Date.parse(startTime);
    endTimeTimestamp = Date.parse(endTime);
    window.session.inGame = true;
    gameplayClock = setInterval(gameplayTick, 200);
}

export function beginHoldingMouse() {
    for (const formLetter of window.session.letters) {
        formLetter.letterDiv.classList.remove("highlightedLetter", "fadingLetter", "repeatedLetter", "successfulLetter", "failedLetter");
    }
    window.session.holdingMouse = true;
}

async function confirmWord() {
    // Determine word status
    if (!window.session.inGame) return;
    const dictionary = await window.session.dictionary();
    const yourWord = window.session.wordToString();
    let newCssClass = "";
    if (session.wordsAlreadyUsed.includes(yourWord)) {
        newCssClass = "repeatedLetter";
        playSoundEffect("sfx/Unallowed.wav");
    } else if (dictionary.includesWord(yourWord)) {
        playSoundEffect("sfx/PositiveRing.wav");
        window.session.wordsAlreadyUsed.push(yourWord);
        newCssClass = "successfulLetter";
        // Add points for the word
        const points = ScrabblePoints.calculateWordPointWorth(yourWord);
        makeJsonCall("action=sendWord&gameName=" + window.session.yourGameName + "&playerName=" + window.session.yourName + "&points=" + points + "&word=" + yourWord).then();
    } else {
        playSoundEffect("sfx/Miss.wav");
        newCssClass = "failedLetter";
    }

    for (const formLetter of window.session.formedWordViaMouse) {
        formLetter.letterDiv.classList.add(newCssClass, "fadingLetter");
        formLetter.letterDiv.classList.remove("highlightedLetter");
    }
    for (const formLetter of window.session.ephemeralPathfoundFormedWordViaKeyboard) {
        formLetter.letterDiv.classList.add(newCssClass, "fadingLetter");
        formLetter.letterDiv.classList.remove("highlightedLetter");
    }
    // Clear everything
    window.session.formedWordViaKeyboard = "";
    window.session.ephemeralPathfoundFormedWordViaKeyboard = [];
    window.session.formedWordViaMouse = [];
    document.getElementById("divFormedWord").innerHTML = "";
}
export async function releaseMouse() {
    await confirmWord();
    window.session.holdingMouse = false;
}

/**
 * @param mouseOverLetter {Letter}
 */
function holdMouseOver(mouseOverLetter) {
    if (!window.session.holdingMouse) return;

    const session = window.session;
    const isAnyLetterSelectedByMouse = session.formedWordViaMouse.length > 0;
    /** @type {Letter} */
    let newLetter = undefined;
    if (isAnyLetterSelectedByMouse) {
        const lastLetter = session.formedWordViaMouse.at(-1);
        if (lastLetter === mouseOverLetter) {
            // We haven't moved out of the last letter yet, no need to do anything...
        } else if (session.formedWordViaMouse.includes(mouseOverLetter)) {
            // The letter is already in our word.
            if (session.formedWordViaMouse.length >= 2 && session.formedWordViaMouse.at(-2) === mouseOverLetter) {
                lastLetter.letterDiv.classList.remove("highlightedLetter");
                session.formedWordViaMouse.pop();
                playSoundEffect("sfx/PickUp.wav");
            }
        } else if (lastLetter.canReach(mouseOverLetter)) {
            newLetter = mouseOverLetter;
        }
    } else {
        newLetter = mouseOverLetter;
    }
    if (newLetter) {
        playSoundEffect("sfx/PutDown.wav");
        if (session.ephemeralPathfoundFormedWordViaKeyboard.length > 0) {
            for (let letter of session.ephemeralPathfoundFormedWordViaKeyboard) {
                letter.letterDiv.classList.remove("highlightedLetter");
            }
            session.ephemeralPathfoundFormedWordViaKeyboard = [];
            session.formedWordViaKeyboard = "";
        }
        session.formedWordViaMouse.push(mouseOverLetter);
        newLetter.letterDiv.classList.add("highlightedLetter");
        document.getElementById("divFormedWord").innerHTML = session.wordToString();
    }
}

export async function pressCharacter(character) {
    if (!window.session.inGame) return;
    if (window.session.formedWordViaMouse.length > 0) {
        for (let letter of window.session.formedWordViaMouse) {
            letter.letterDiv.classList.remove("highlightedLetter");
        }
        window.session.formedWordViaMouse = [];
    }
    if (character === "Enter") {
        // Confirm keyboard word
        if (window.session.ephemeralPathfoundFormedWordViaKeyboard.length > 0) {
            await confirmWord();
        }
        return;
    }
    if (character === "Backspace") {
        if (window.session.formedWordViaKeyboard.length > 0) {
            // Backspace
            window.session.formedWordViaKeyboard = window.session.formedWordViaKeyboard.substring(0, window.session.formedWordViaKeyboard.length - 1);
            window.session.ephemeralPathfoundFormedWordViaKeyboard.at(-1).letterDiv.classList.remove("highlightedLetter");
            window.session.ephemeralPathfoundFormedWordViaKeyboard.pop();
            document.getElementById("divFormedWord").innerHTML = window.session.formedWordViaKeyboard;
            playSoundEffect("sfx/PickUp.wav");
        }
        return;
    }
    if (character.length !== 1) return;
    character = character.toUpperCase();
    if (!character.match(/[A-Z]/)) return;

    // Add letter
    if (window.session.ephemeralPathfoundFormedWordViaKeyboard.length === 0) {
        for (const formLetter of window.session.letters) {
            formLetter.letterDiv.classList.remove("highlightedLetter", "fadingLetter", "repeatedLetter", "successfulLetter", "failedLetter");
        }
    }
    const newWord = window.session.formedWordViaKeyboard + character;
    const path = findLetterPath(newWord, session.letterGrid);
    if (path) {
        playSoundEffect("sfx/PutDown.wav");
        window.session.formedWordViaKeyboard = newWord;
        for (let letter of window.session.ephemeralPathfoundFormedWordViaKeyboard) {
            letter.letterDiv.classList.remove("highlightedLetter");
        }
        window.session.ephemeralPathfoundFormedWordViaKeyboard = path;
        for (let letter of window.session.ephemeralPathfoundFormedWordViaKeyboard) {
            letter.letterDiv.classList.add("highlightedLetter");
        }
        document.getElementById("divFormedWord").innerHTML = newWord;
    }
}