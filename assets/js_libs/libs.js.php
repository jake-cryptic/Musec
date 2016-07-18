<?php
header("Content-Type: text/javascript");
header("Cache-Control: max-age=2592000");

if (substr_count($_SERVER["HTTP_ACCEPT_ENCODING"], "gzip")) ob_start("ob_gzhandler"); else ob_start();

$files = [
	"base64.min.js",
	"fastclick.js",
	"chromestore.min.js",
	"json3.min.js",
	"jquery.longclick-min.js",
	"notification.js",
	"pointer_events.js",
	"visualizer.js"
];

foreach($files as $file) {
	$f = @file_get_contents($file);
	$t = preg_replace('/\t+/', '', $f);
	
	echo "$t\n\n";
}
?>