<?php if (!isset($_COOKIE["beta"]) || $_COOKIE["beta"] < time()) { require("betalogin.php"); die(); } else { session_start(); } ?>
<!DOCTYPE HTML>
<html lang="en" dir="ltr">
	<head>
		
		<!-- Title and Metadata -->
		<title>Loading</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui">
		<meta name="author" content="Jake Mcneill" />
		<meta name="google" content="notranslate" />
		<meta name="description" content="" />
		<meta name="keywords" content="" />
		
		<!-- Links -->
		<link rel="manifest" href="assets/manifest.json" />
		<link rel="stylesheet" type="text/css" href="assets/css/global.css" media="screen" />
		<link rel="apple-touch-icon" sizes="250x250" href="assets/img/Musec!3.jpg">
		<link rel="icon" href="assets/img/Musec!.jpg" type="image/gif">
		
	</head>
	<body>
		<!--[if lte IE 8]>
			<h1 style="text-align:center;font-size:2.2em;">Browser Not Supported</h1>
			<h2 style="text-align:center;font-size:1.5em;">Please download a better browser</h2>
			<a href="https://www.google.com/chrome/">Chrome</a> | <a href="https://mozilla.org/firefox/">Firefox</a> | <a href="https://www.opera.com/">Opera</a>
			<div style="display:none">
		<!--<![endif]-->
		<div id="pageTop">
			<span id="back" do="refresh" class="impButton">&#x21bb;</span>
			<span id="search" class="impButton">&#x1f50e;</span>
			<span id="queue" do="showQ" class="impButton">&#9776;</span>
			<div id="search_container"><input type="text" id="search_box" placeholder="Search for a song" /><button id="do_search">Search All</button></div>
			<span id="folder">Please Wait</span>
		</div>
		<div id="pageCenter">
			<div id="musicFolders">
				<h1>Loading Content...</h1>
			</div>
			<div id="songFolder">
				<h1>Loading Songs...</h1>
			</div>
			<div id="queueFolder">
				<h1>Just a second...</h1>
			</div>
		</div>
		<div id="pageBottom">
			<span id="playpause" class="disabled impButton">&#9658;</span>
			<span id="mediacontrols">No Music Playing</span>
		</div>
		
		<div id="sAlert">
			<div class="container">
				<div class="txt">
					<img src="assets/img/Musec!.jpg" id="sAlertImg" alt="ActImg" /><br />
					<span id="sAlertTxt">Something</span>
				</div>
			</div>
			<div class="bo"></div>
		</div>
		
		<div id="optionsPanel">
			<div id="options">
				<h1>Musec Panel</h1>
				<button class="oButton" onclick="tiles.togglePanel()">Close</button> |
				<button class="oButton" onclick="tiles.fix()">Clean</button><br /><br />
				<h2>About</h2>
				<div>
					Musec was created by Jake :P<br />
					Because I was sick of not being able to find songs online when Youtube and any other decent streaming service is blocked<br />
				</div>
			</div>
		</div>
		
		<!-- Scripts and Libraries -->
		<script type="text/javascript" crossorigin="anonymous" src="https://code.jquery.com/jquery-2.2.0.min.js"></script>
		<script type="text/javascript" crossorigin="anonymous" src="https://cdnjs.cloudflare.com/ajax/libs/fastclick/1.0.6/fastclick.min.js"></script>
		<script type="text/javascript" src="assets/polyfills/modernizr-custom.js"></script>
		<script type="text/javascript">
			window.onload = function(){
				window.onerror = function (errorMsg, script, lineNumber, column, errorObj) {
					var eData = {msg:errorMsg,url:script,ln:lineNumber,col:column,st:errorObj};
					var sData = JSON.stringify(eData);
					tiles.load("t=e&e=" + btoa(sData));
					console.log(sData);
					alert('Error: ' + errorMsg + ' Script: ' + script + ' Line: ' + lineNumber + ' Column: ' + column + ' StackTrace: ' + errorObj);
				};
			};
			console.log("Musec: Loading...");
			if (typeof(jQuery) == "undefined"){document.write('<script src="assets/js/jquery-2.1.4.min.js" type="text/javascript"><\/script>');}
			if (typeof(FastClick) == "undefined"){document.write('<script src="assets/js/fastclick.js" type="text/javascript"><\/script>');}
			if (!Modernizr.atobbtoa){document.write('<script type="text/javascript" src="assets/polyfills/base64.min.js"><\/script>');}
			if (!Modernizr.json){document.write('<script type="text/javascript" src="assets/polyfills/json3.min.js"><\/script>');}
			function isNumeric(n){return !isNaN(parseFloat(n)) && isFinite(n);}
			function capitalise(t){return t.replace(/\w\S*/g, function(s){return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();});}
		</script>
		<script type="text/javascript" src="assets/js/jquery.longclick-min.js"></script>
		<script type="text/javascript" src="assets/js/tiles4.js"></script>
		<script type="text/javascript" src="assets/js/audioHelper.js"></script>
	</body>
</html>