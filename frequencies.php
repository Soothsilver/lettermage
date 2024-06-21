<?php
$frequencies =
    [
        "A" => 0.08167,
        "B" => 0.01492,
        "C" => 0.02782,
        "D" => 0.04253,
        "E" => 0.12702,
        "F" => 0.02228,
        "G" => 0.02015,
        "H" => 0.06094,
        "I" => 0.06966,
        "J" => 0.00153,
        "K" => 0.00772,
        "L" => 0.04025,
        "M" => 0.02406,
        "N" => 0.06749,
        "O" => 0.07507,
        "P" => 0.01929,
        "Q" => 0.00095,
        "R" => 0.05987,
        "S" => 0.06327,
        "T" => 0.09056,
        "U" => 0.02758,
        "V" => 0.00978,
        "W" => 0.02360,
        "X" => 0.00150,
        "Y" => 0.01974,
        "Z" => 0.00074,
    ];
$boggleDice = 
    [
        ["A",  "A",  "E",  "E",  "G",  "N"],
        ["E",  "L",  "R",  "T",  "T",  "Y"],
        ["A",  "O",  "O",  "T",  "T",  "W"],
        ["A",  "B",  "B",  "J",  "O",  "O"],
        ["E",  "H",  "R",  "T",  "V",  "W"],
        ["C",  "I",  "M",  "O",  "T",  "U"],
        ["D",  "I",  "S",  "T",  "T",  "Y"],
        ["E",  "I",  "O",  "S",  "S",  "T"],
        ["D",  "E",  "L",  "R",  "V",  "Y"],
        ["A",  "C",  "H",  "O",  "P",  "S"],
        ["H",  "I",  "M",  "N",  "S",  "U"],
        ["E",  "E",  "I",  "N",  "S",  "U"],
        ["E",  "E",  "G",  "H",  "N",  "W"],
        ["A",  "F",  "F",  "K",  "P",  "S"],
        ["H",  "L",  "N",  "N",  "R",  "Z"],
        ["D",  "E",  "I",  "L",  "R",  "X"]
    ];

function generateNewBoardUsingBoggleDice(): string
{
    global $boggleDice;
    $randomString = "";
    foreach ($boggleDice as $boggleDieArray) {
        $randomString .= $boggleDieArray[random_int(0, 5)];
    }
    return str_shuffle($randomString);
}

function generateNewBoardUsingFrequencies(): string
{
    global $frequencies;
    $sumOfFrequencies = 0;
    foreach ($frequencies as $letter => $frequency) {
        $sumOfFrequencies += $frequency;
    }

    $characters = 'ABCDEFGHIJKLMNOPRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < 16; $i++) {
        $randomIndex = $sumOfFrequencies * mt_rand() / mt_getrandmax();
        $sumOfFrequenciesSoFar = 0;
        $chosenLetter = "A";
        foreach ($frequencies as $letter => $frequency) {
            $sumOfFrequenciesSoFar += $frequency;
            if ($randomIndex < $sumOfFrequenciesSoFar) {
                $chosenLetter = $letter;
                break;
            }
        }
        $randomString .= $chosenLetter;
    }
    return $randomString;
}
function generateNewBoard(): string
{
    global $boardType;
    if ($boardType == "random") {
        return generateNewBoardUsingBoggleDice();
    }
    else if ($boardType == "good") {
        return getRandomFromFile("good-boards.txt");
    }
    else if ($boardType == "elite") {
        return getRandomFromFile("elite-boards.txt");
    }
    else throw new Exception("Wrong board type.");
}

function getRandomFromFile(string $filename)
{
    $boardsText = file_get_contents($filename);
    $boardsLines = explode("\n", $boardsText);
    $trueLines = [];
    foreach ($boardsLines as $line) {
        $boardString = explode(" ", trim($line))[0];
        if ($boardString && strlen($boardString) == 16) {
            $trueLines[] = $boardString;
        }
    }
    return $trueLines[array_rand($trueLines)];
}
