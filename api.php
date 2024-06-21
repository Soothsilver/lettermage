<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header("Access-Control-Allow-Headers: X-Requested-With");

require_once 'frequencies.php';

const gameDuration = 90;

$mysqli = new mysqli("localhost", "lettermage", "[PASSWORD SNIPPED]", "lettermage");
$action = $_GET["action"];
$gameName = $_GET["gameName"];
$yourName = $_GET["playerName"];
$boardType = $_GET["board"];
if (!$boardType) $boardType = "good";
if ($boardType != "elite" && $boardType != "good" && $boardType != "random") $boardType = "good";

function getGameFromName($gameName)
{
    global $mysqli;
    $query = $mysqli->prepare("SELECT * FROM lm_games WHERE name = ?");
    $query->bind_param("s", $gameName);
    $query->execute();
    $result = $query->get_result();
    $row = $result->fetch_array(MYSQLI_ASSOC);
    return $row;
}
function getGameIdFromName($gameName)
{
    $game = getGameFromName($gameName);
    return $game["id"];
}

if ($action == "host") {
    $gameName = generateRandomString();
    $statement = $mysqli->prepare("INSERT INTO lm_games (name, lettergrid) VALUES (?, ?)");
    $newBoard = generateNewBoard();
    $statement->bind_param("ss", $gameName, $newBoard);
    $result = $statement->execute();
    echo json_encode([ "success" => $result, "gameName" => $gameName, "error" => $statement->error ], JSON_PRETTY_PRINT);
}
else if ($action == "endTheGame") {
    $gameId = getGameIdFromName($gameName);
    $currentTime = "2023-01-01 10:00:00";//date("Y-m-d H:i:s", );
    $statement = $mysqli->prepare("UPDATE lm_games SET starttime = ? WHERE id = ?");
    $statement->bind_param("si", $currentTime, $gameId);
    $statement->execute();
    echo json_encode([ "success" => true]);
}
else if ($action == "restartTheGame") {
    $gameId = getGameIdFromName($gameName);
    $newBoard = generateNewBoard();
    $currentTime = date("Y-m-d H:i:s");
    $resetStatement = $mysqli->prepare("UPDATE lm_players SET points = 0 WHERE gameid = ?");
    $resetStatement->bind_param("i", $gameId);
    $resetStatement->execute();
    $statement = $mysqli->prepare("UPDATE lm_games SET starttime = ?, lettergrid = ? WHERE id = ?");
    $statement->bind_param("ssi", $currentTime, $newBoard, $gameId);
    $statement->execute();
    echo json_encode([ "success" => true]);
}
else if ($action == "join") {
    $gameId = getGameIdFromName($gameName);
    $statement = $mysqli->prepare("INSERT INTO lm_players (gameid, name, points) VALUES (?, ?, 0)");
    $statement->bind_param("is", $gameId, $yourName);
    $result = $statement->execute();
    echo json_encode([ "success" => $result, "error" => $statement->error]);
}
else if ($action == "commenceTheGame") {
    $gameId = getGameIdFromName($gameName);
    $currentTime = date("Y-m-d H:i:s");
    $statement = $mysqli->prepare("UPDATE lm_games SET starttime = ? WHERE id = ? AND starttime IS NULL");
    $statement->bind_param("si", $currentTime, $gameId);
    $statement->execute();
    echo json_encode([ "success" => true]);
}
else if ($action == "lobbyTick") {
    $game = getGameFromName($gameName);
    $gameId = $game["id"];
    $query = $mysqli->prepare("SELECT * FROM lm_players WHERE gameid = ?");
    $query->bind_param("i", $gameId);
    $query->execute();
    $result = $query->get_result();
    $players = [];
    while ($row = $result->fetch_array(MYSQLI_ASSOC))
    {
        $players[] = $row["name"];
    }
    $arr = ["success" => true, "players" => $players, "numberOfPlayers" => count($players)];
    if ($game["starttime"]) {
        $startTimeTimestamp = strtotime($game["starttime"]);
        $endTimeTimestamp = $startTimeTimestamp + gameDuration;
        $arr["starttime"] = date("c", $startTimeTimestamp);
        $arr["endtime"] = date("c", $endTimeTimestamp);
        $arr["lettergrid"] = $game["lettergrid"];
    }
    echo json_encode($arr);
}
else if ($action == "sendWord") {
    $game = getGameFromName($gameName);
    $gameId = $game["id"];
    $addPoints = $_GET["points"];
    $word = $_GET["word"];
    $statement = $mysqli->prepare("UPDATE lm_players SET points = points + ? WHERE gameid = ? AND name = ?");
    $statement->bind_param("iis", $addPoints, $gameId, $yourName);
    $succeeded = $statement->execute();
    $qr = $mysqli->prepare("SELECT * FROM lm_players WHERE gameid = ? AND name = ?");
    $qr->bind_param("is", $gameId, $yourName);
    $qr->execute();
    $qrResult = $qr->get_result()->fetch_array(MYSQLI_ASSOC);
    $playerId = $qrResult["id"];
    $statement2 = $mysqli->prepare("INSERT INTO lm_words (playerid, word, points) VALUES (?, ?, ?)");
    $statement2->bind_param("isi", $playerId, $word, $addPoints);
    $succeeded &= $statement2->execute();
    echo json_encode([ "success" => $succeeded, "gameid" => $gameId, "name" => $yourName, "addPoints" => $addPoints]);
}
else if ($action == "gameplayTick") {
    $game = getGameFromName($gameName);
    $gameId = $game["id"];
    $query = $mysqli->prepare("SELECT players.name AS playerName, players.points AS playerPoints, words.word AS word, words.points AS wordPoints FROM `lm_words` AS words JOIN lm_players AS players ON words.playerid = players.id WHERE players.gameid = ? ORDER BY players.points DESC");
    $query->bind_param("i", $gameId);
    $query->execute();
    $result = $query->get_result();
    $players = [];
    while ($row = $result->fetch_array(MYSQLI_ASSOC))
    {
        $playerName = $row["playerName"];
        $playerPoints = $row["playerPoints"];
        $word = $row["word"];
        $wordPoints = $row["wordPoints"];
        if (!array_key_exists($playerName, $players))
        {
            $players[$playerName] = [
                "name" => $playerName,
                "points" => $playerPoints,
                "words" => []
            ];
        }
        $players[$playerName]["words"][] = [
            "word" => $word,
            "points" => $wordPoints
        ];
    }
    $arr = ["success" => true, "players" => $players, "numberOfPlayers" => count($players), "g" => $game];
    if ($game["starttime"]) {
        $startTimeTimestamp = strtotime($game["starttime"]);
        $endTimeTimestamp = $startTimeTimestamp + gameDuration;
        $arr["starttime"] = date("c", $startTimeTimestamp);
        $arr["endtime"] = date("c", $endTimeTimestamp);
        $arr["lettergrid"] = $game["lettergrid"];
        $arr["ended"] = $endTimeTimestamp < time();
    }
    echo json_encode($arr);
}
else {
    echo json_encode(["success"=>false]);
}

function generateRandomString($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, $charactersLength - 1)];
    }
    return $randomString;
}