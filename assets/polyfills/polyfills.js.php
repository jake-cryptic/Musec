<?php
//$lmod = gmdate('D, d M Y H:i:s ', $timestamp) . "GMT";
header("Content-Type: text/javascript");
//header("Last-Modified: " . $lmod);
header("Cache-Control: max-age=2592000");

if (substr_count($_SERVER["HTTP_ACCEPT_ENCODING"], "gzip")) ob_start("ob_gzhandler"); else ob_start();

$polyfills = [
	"base64.min.js",
	"fastclick.js",
	"json3.min.js",
	"jquery.longclick-min.js",
	"notification.js",
	"pointer_events.js"
];

foreach($polyfills as $polyfill) {
	echo @file_get_contents($polyfill);
	echo "\n";
}
?>