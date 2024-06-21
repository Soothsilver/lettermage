import {beginGameplay, beginHoldingMouse, pressCharacter, releaseMouse} from "./gameplay.js";
import {makeJsonCall} from "./utils.js";
import {Session} from "./Session.js";
import {Dictionary} from "./dictionary.js";
import {playSoundEffect, preloadAllSounds} from "./sfx.js";

window.session = new Session();

let lobbyInterval = undefined;

document.getElementById("formChooseYourName").onsubmit = async function (event) {
    playSoundEffect("sfx/Button.mp3");
    event.preventDefault();
    const playerName = document.getElementById("tbYourName").value;
    window.localStorage.setItem("yourName", playerName);
    const response = await makeJsonCall("action=join&playerName=" + playerName + "&gameName=" + window.session.yourGameName);
    if (response.success) {
        window.session.yourName = playerName;
        document.getElementById("divYourName").style.display = "none";
    }
    else {
        document.getElementById("lblChooseYourNameError").innerHTML = response.error.startsWith("Duplicate entry") ? "There is a player named '" + playerName + "' already in the lobby. Choose another name." : response.error;
    }
}
document.getElementById("bStartForEveryone").onclick = async function () {
    playSoundEffect("sfx/Button.mp3");
    await makeJsonCall("action=commenceTheGame&gameName=" + window.session.yourGameName);
};
document.getElementById("bFinishThisGame").onclick = async function () {
    playSoundEffect("sfx/Button.mp3");
    await makeJsonCall("action=endTheGame&gameName=" + window.session.yourGameName);
};
document.getElementById("bRestartGame").onclick = async function () {
    playSoundEffect("sfx/Button.mp3");
    await makeJsonCall("action=restartTheGame&gameName=" + window.session.yourGameName);
};
document.getElementById("aCopyLobbyNameToClipboard").onclick = function() {
    playSoundEffect("sfx/PickUp.wav");
    navigator.clipboard.writeText("https://hudecekpetr.cz/other/lettermage/#" + window.session.yourGameName);
    return false;
};
document.body.onpointerdown = async function(event) {
    beginHoldingMouse();
};
document.body.onpointerup = async function(event) {
    await releaseMouse();
};
document.body.onkeydown = async function (event) {
    await pressCharacter(event.key);
};

function updateVolume() {
    Howler.mute(window.session.volumeMuted);
    Howler.volume(window.session.volume)
}

function updateMuteButton() {
    if (window.session.volumeMuted) {
        document.getElementById("imgMute").src = "art/enable-sound.png";
        document.getElementById("rangeVolume").disabled = true;
    } else {
        document.getElementById("imgMute").src = "art/audio.png";
        document.getElementById("rangeVolume").disabled = false;
    }
}

document.getElementById("rangeVolume").oninput = async function(event) {
    const volume = Number(document.getElementById("rangeVolume").value);
    window.session.volume = volume/100;
    window.localStorage.setItem("volume", volume.toString());
    updateVolume();
};
document.getElementById("rangeVolume").onchange = async function(event) {
    playSoundEffect("sfx/PickUp.wav");
}
document.getElementById("bMute").onclick = async function () {
    // Toggle mute
    window.session.volumeMuted = !window.session.volumeMuted;
    window.localStorage.setItem("volumeMuted", window.session.volumeMuted ? "true" : "false");
    updateVolume();
    updateMuteButton();
};

async function lobbyTick() {
    const response = await makeJsonCall("action=lobbyTick&playerName=" + window.session.yourName + "&gameName=" + window.session.yourGameName);
    const {starttime, numberOfPlayers, players} = response;
    if (window.session.yourName) {
        preloadAllSounds();
        document.getElementById("bStartForEveryone").disabled = false;
        if (numberOfPlayers > 1) {
            document.getElementById("bStartForEveryone").value = "Start the game for all " + numberOfPlayers + " players now";
        } else {
            document.getElementById("bStartForEveryone").value = "Start a single-player game for yourself only";
        }
    } else {
        document.getElementById("bStartForEveryone").disabled = true;
        document.getElementById("bStartForEveryone").value = "You can't start the game if you're not in it yourself.";
    }
    let innerUl = "";
    for (const player of players) {
        innerUl += "<li>" + player + "</li>";
    }
    if (starttime && window.session.yourName) {
        document.getElementById("divLobby").style.display = "none";
        document.getElementById("divIngame").style.display = "block";
        window.session.yourGrid = response["lettergrid"];
        window.session.yourStartTime = response["starttime"];
        clearInterval(lobbyInterval);
        beginGameplay(window.session.yourGrid, window.session.yourStartTime, response["endtime"]);
    }
    document.getElementById("ulPlayerList").innerHTML = innerUl;
}

function loadLobby() {
    document.getElementById("spanLobbyGameName").innerHTML = window.session.yourGameName;
    document.getElementById("divLobby").style.display = "block";
    window.location.hash = "#" + window.session.yourGameName;
    document.getElementById("tbYourName").focus();
    lobbyInterval = setInterval(lobbyTick, 500);
}

if (window.location.hash) {
    window.session.yourGameName = window.location.hash.substring(1);
    console.log("The game name of the game you joined is " + window.session.yourGameName);
    loadLobby();
} else {
    // host
    const newGame = await makeJsonCall("action=host");
    console.log("The game name of the created game is " + window.session.yourGameName);
    const {gameName} = newGame;
    window.session.yourGameName = gameName;
    loadLobby();
}
window.session.dictionaryPromise = Dictionary.fetchDictionary();

// Load local storage
document.getElementById("tbYourName").value = window.localStorage.getItem("yourName");
window.session.volumeMuted = window.localStorage.getItem("volumeMuted") === "true";
let volume = window.localStorage.getItem("volume");
if (volume === null) {
    volume = "100";
}
window.session.volume = Number(volume/100);
document.getElementById("rangeVolume").value = Number(volume);
updateMuteButton();
updateVolume();