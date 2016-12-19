<?php
define("MUSIC_DIR", "../resources/");
define("INDEX_FILE", "../resources/music_index.json");
define("INCLUDES", "php/");

require(INCLUDES . "classes/mp3file.class.php");

$indexStartTime = time();
$allowedExtensions = ["mp3","m4a"];
$albums = scandir(MUSIC_DIR . "music/");
$results = array(
	"gen"=>time(),
	"data"=>array()
);

function CleanSongName($song){
	$song = str_replace(".mp3","",$song);
	$song = str_replace(".m4a","",$song);
	$song = str_replace("_"," ",$song);
	$song = ucwords($song);
	return $song;
}

if (!set_time_limit(300)){
	echo "Failed to set max exec time!";
}

foreach ($albums as $album) {
	if ($album != "." && $album != ".." && $album != ".htaccess") {
		$songs = scandir(MUSIC_DIR . "music/" . $album . "/");
		$songCount = 0;
		$results["data"][$album]["name"] = ucwords(str_replace("_", " ", $album));
		$results["data"][$album]["songs"] = array();
		
		foreach ($songs as $song) {
			$fileExtArr = explode(".",$song);
			$fileExt = end($fileExtArr);
			if (in_array($fileExt,$allowedExtensions)) {
				$mp3file = new MP3File(MUSIC_DIR . "music/" . $album . "/" . $song);
				
				if (isset($_POST["doitfast"])) {
					$duration = $mp3file->getDurationEstimate();
				} else {
					$duration = $mp3file->getDuration();
				}
				$dur = "$duration;" . MP3File::formatTime($duration);
				
				$results["data"][$album]["songs"][$songCount]["name"] = $song;
				$results["data"][$album]["songs"][$songCount]["disp"] = CleanSongName($song);
				$results["data"][$album]["songs"][$songCount]["dur"] = $dur;
				$songCount++;
			}
		}
	}
	
}
if (isset($_POST["pretty_print"]) && $_POST["pretty_print"] == "yes"){
	$jsonResults = json_encode($results, JSON_PRETTY_PRINT);
} else {
	$jsonResults = json_encode($results);
}

$indexFile = fopen(INDEX_FILE,"w+");
fwrite($indexFile, $jsonResults);
fclose($indexFile);

$indexEndTime = time();
echo "Index complete at :$indexEndTime.<br /><strong> Took " . date("i:s",($indexStartTime-$indexEndTime));
echo "</strong><br />Created index successfully!";
?>