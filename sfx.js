/**
 * @type {Map<string, HTMLAudioElement>}
 */
let audios = new Map();

export function preloadAllSounds() {
    new Howl({src:["sfx/Button.mp3"]});
    new Howl({src:["sfx/Miss.wav"]});
    new Howl({src:["sfx/PickUp.wav"]});
    new Howl({src:["sfx/PositiveRing.wav"]});
    new Howl({src:["sfx/PutDown.wav"]});
    new Howl({src:["sfx/Unallowed.wav"]});
    new Howl({src:["sfx/Victory.wav"]});
}
export function playSoundEffect(sfxName) {
    var sound = new Howl({
        src: [sfxName]
    });
    sound.play();
    // if (!audios.has(sfxName)) {
    //     const audio = new Audio(sfxName);
    //     audios.set(sfxName, audio);
    // }
    // console.warn("PLAYING  FROM CACHE");
    // audios.get(sfxName).play();
}