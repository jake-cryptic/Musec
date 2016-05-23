<?php
error_reporting(0);
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: X-PINGOTHER, Content-Type");
header("Access-Control-Max-Age: 86400");


function arrayToCsv(array &$fields, $delimiter = ',', $enclosure = '"', $encloseAll = false, $nullToMysqlNull = false) {
    $delimiter_esc = preg_quote($delimiter, '/');
    $enclosure_esc = preg_quote($enclosure, '/');

    $output = array(time());
    foreach ($fields as $field) {
        if ($field === null && $nullToMysqlNull) {
            $output[] = 'NULL';
            continue;
        }

        // Enclose fields containing $delimiter, $enclosure or whitespace
        if ($encloseAll || preg_match("/(?:${delimiter_esc}|${enclosure_esc}|\s)/", $field) ) {
            $output[] = $enclosure . str_replace($enclosure, $enclosure . $enclosure, $field) . $enclosure;
        } else {
            $output[] = $field;
        }
    }

    return implode($delimiter, $output);
}

if (isset($_POST)) {
	
	if (isset($_POST["t"])) {
		$type = trim($_POST["t"]);
	} else {
		die('{"response":"error","error":"The backend could not understand your request"}');
	}
	if (isset($_POST["d"])) {
		$dir = base64_decode($_POST["d"]);
	} else {
		$dir = "";
	}
	
	if ($type == "f") {
		// Folders (List directories of music)
		$dirs = array_filter(glob('resources/music/*'), 'is_dir');
		$data = '{"response":"lsdir","data":[';
		foreach ($dirs as $directory) {
			if (end($dirs) == $directory) {
				$data .= '"' . str_replace("resources/music/","",$directory) . '"';
			} else {
				$data .= '"' . str_replace("resources/music/","",$directory) . '",';
			}
		}
		echo "$data]}";
		
	} elseif ($type == "s" || $type == "b") {
		// Song (List songs in directory)
		$allowedExtensions = ["mp3","m4a"];
		
		$_SESSION["folder"] = $dir;
		$files = scandir("resources/music/" . $dir);
		if ($type == "b") {
			$data = '{"response":"tfiles","folder":"' . $dir . '","d":[';
		} else {
			$data = '{"response":"lsfiles","data":[';
		}
		$count = 0;
		foreach ($files as $file) {
			if ($file != "." && $file != "..") {
				$fileExtArr = explode(".",$file);
				$fileExt = end($fileExtArr);
				if (in_array($fileExt,$allowedExtensions)) {
					if (end($files) == $file) {
						if ($type == "b") {
							$data .= '"' . $file . '"';
						} else {
							$data .= '"' . $dir . "/" . $file . '"';
						}
					} else {
						if ($type == "b") {
							$data .= '"' . $file . '",';
						} else {
							$data .= '"' . $dir . "/" . $file . '",';
						}
					}
					$count++;
				}
			}
		}
		if ($type == "b") {
			echo "$data],\"count\":\"$count\"}";
		} else {
			usleep(500000); // .5 Seconds
			echo "$data]}";
		}
		
	} elseif ($type == "l") {
		// Lookup (Search for song in all folders)
		$forbiddenSearches = ["mp3","m4a"];
		$it = new RecursiveDirectoryIterator("resources/music/",RecursiveDirectoryIterator::SKIP_DOTS);
		
		if (isset($_POST["s"])){
			$searchTerm = base64_decode($_POST["s"]);
			$searchTerm = strtolower($searchTerm);
			
			if (in_array($searchTerm,$forbiddenSearches)){
				die('{"response":"error","error":"Invalid Search"}');
			}
			if (preg_match("/([0-9A-Za-z .])/", $searchTerm)) {
				$searchTerm = htmlspecialchars(stripslashes(trim($searchTerm)));
			} else {
				die('{"response":"error","error":"Your search must be alphanumeric"}');
			}
		} else {
			die('{"response":"error","error":"Search Failed"}');
		}
		
		$count = 0;
		$results = array("response"=>"sresult");
		$currentdir = getcwd();
		if (strpos($currentdir,"\\") !== false) {
			$xplChar = "\\";
		} else {
			$xplChar = "/";
		}
		foreach(new RecursiveIteratorIterator($it) as $f) {
			$dataArray = explode($xplChar,$f);
			
			$file = $dataArray[count($dataArray)-1];
			$dir = $dataArray[count($dataArray)-2];
			
			if (strpos(strtolower($file),$searchTerm) !== false) {
				$count++;
				$results["r"][$count] = array($file,$dir);
			}
		}
		$results["count"] = $count;
		echo @json_encode($results);
		
	} elseif ($type == "v") {
		// Version (Returns cache version)
		die('{"response":"version","total":10}');
	} elseif ($type == "e") {
		if (isset($_POST["e"])) {
			$data = @base64_decode($_POST["e"]);
			$arr = @(array)json_decode($data);
			
			$string = arrayToCsv($arr);
			
			$eLog = @fopen("errorlog.csv", "a") or die('{"response":"error","error":"Error reporting failed :("}');
			@fwrite($eLog,$string . "\n");
			@fclose($eLog);
			die('{"response":"elog","result":1}');
		} else {
			die('{"response":"error","error":"Error reporting failed :("}');
		}
	} else {
		die('{"response":"error","error":"The backend cannot process your request"}');
	}
} else {
	die('{"response":"error","error":"No data sent"}');
}

?>