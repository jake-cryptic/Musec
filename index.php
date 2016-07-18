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
		<meta name="mobile-web-app-capable" content="yes">
		<meta name="apple-mobile-web-app-capable" content="yes">
		<meta name="apple-mobile-web-app-title" content="Musec!">
		<meta name="apple-mobile-web-app-status-bar-style" content="#000">
		
		<link rel="manifest" href="assets/manifest.json" />
		<link rel="apple-touch-icon" sizes="250x250" href="assets/img/Musec!3.jpg">
		<link rel="icon" href="assets/img/Musec!.jpg" type="image/gif">
		<style type="text/css">
		body,html{min-height:100%;margin:0;padding:0;font-weight:100;font-family:sans-serif;text-align:center;}
		#pageTop{z-index:15;position:fixed;top:0;height:7.5%;width:100%;background-color:rgba(255,255,255,0.95);}
		#pageCenter{position:fixed;overflow-y:scroll;-webkit-overflow-scrolling:touch;top:7.5%;bottom:12.5%;width:100%;background-color:rgba(0,0,0,0.8);color:white;}
		#pageBottom{z-index:15;position:fixed;bottom:0;height:12.5%;width:100%;background-color:rgba(255,255,255,0.95);}
		#optionsPanel{display:none;top:0;height:100%;width:100%;position:relative;color:#fff;font-size:1.1em;}
		</style>
		
	</head>
	<body>
		<!--[if lte IE 8]>
			<h1 style="text-align:center;font-size:2.2em;">Browser Not Supported</h1><h2 style="text-align:center;font-size:1.5em;">Please download a better browser</h2>
			<a href="https://www.google.com/chrome/">Chrome</a> | <a href="https://mozilla.org/firefox/">Firefox</a> | <a href="https://www.opera.com/">Opera</a><br /><br /><br />
			<?php echo $_SERVER["HTTP_USER_AGENT"]; ?><div style="display:none">
		<!--<![endif]-->
		<div id="pageTop">
			<span id="back" do="refresh" class="impButton">&#x21bb;</span>
			<span id="search" class="impButton">&#x1f50e;</span>
			<span id="queue" do="showQ" class="impButton">&#9776;</span>
			<span id="down" do="showF" class="impButton">&#9660;</span>
			<div id="search_container"><input type="text" id="search_box" placeholder="Search for a song" /><button id="do_search">Search All</button></div>
			<span id="folder">Please Wait</span>
		</div>
		<div id="pageCenter">
			<div id="mvContainer">
				<canvas id="musicVisualizer"></canvas>
			</div>
			<div id="musicFolders">
				<h1>Loading Content...<br /><progress id="__load" value="4" max="100"></progress></h1>
			</div>
			<div id="songFolder"></div>
			<div id="queueFolder"></div>
			<div id="offlineFolder"></div>
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
				<button class="oButton" onclick="tiles.fix()">Clean</button> |
				<button class="oButton" onclick="settings.resetSettings()">Reset</button><br />
				
				<h2>Preferences (Experimental)</h2>
				<div id="appPrefs"><button class="rebootButton" id="rebootMusec">Restart Musec</button>
					<table id="appPrefsTable"><thead><tr><th>Setting</th><th>Value</th></thead><tbody>
					<tr>
						<td onclick="settings.whatsThis(1);"><span class="optionName">Music Visualizer</span></td>
						<td><button class="settingsToggle" id="_ST_MV">Unknown</button></td>
					</tr>
					<tr>
						<td onclick="settings.whatsThis(2);"><span class="optionName">Visualizer Style</span></td>
						<td>
							<select class="settingsOption" id="_ST_CR">
								<option value="hsl">Rainbow</option>
								<option value="white">White</option>
							</select>
						</td>
					</tr>
					<tr>
						<td onclick="settings.whatsThis(3);"><span class="optionName">Developer Mode</span></td>
						<td><button class="settingsToggle" id="_ST_DV">Disabled</button></td>
					</tr>
					<tr>
						<td onclick="settings.whatsThis(4);"><span class="optionName">Artist Mode</span></td>
						<td><button class="settingsToggle" id="_ST_AM">Disabled</button></td>
					</tr>
					<tr>
						<td onclick="settings.whatsThis(5);"><span class="optionName">Timeouts</span></td>
						<td><button class="settingsToggle" id="_ST_TO">Enabled</button></td>
					</tr>
					<tr>
						<td onclick="settings.whatsThis(6);"><span class="optionName">Keyboard Events</span></td>
						<td><button class="settingsToggle" id="_ST_KE">Enabled</button></td>
					</tr>
					</tbody></table>
				</div>
			</div>
		</div>
		
		<link rel="stylesheet" type="text/css" href="assets/css/global.css" media="screen" onload="document.getElementById('__load').value+=15" />
		<script type="text/javascript">
		window.onload = function(){window.onerror = function(errorMsg,script,lineNumber,column,errorObj){
		var eData = {msg:errorMsg,url:script,ln:lineNumber,col:column,st:errorObj};var sData = JSON.stringify(eData);tiles.load("t=e&e=" + btoa(sData));console.log(sData);
		alert('Error: '+errorMsg+' Script: '+script+' Line: '+lineNumber+' Column: '+column+' StackTrace: '+errorObj);};};
		if(typeof(jQuery)=="undefined"){document.write('<script src="assets/js_libs/jquery-2.1.4.min.js" type="text/javascript"><\/script>');}
		function isNumeric(n){return !isNaN(parseFloat(n))&&isFinite(n);}
		function capitalise(t){return t.replace(/\w\S*/g,function(s){return s.charAt(0).toUpperCase()+s.substr(1).toLowerCase();});}
		window.reqFrame =(function(){return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||  function(callback){window.setTimeout(callback, 10 / 60);}; })();
		function isCordova(){return (window.cordova || window.PhoneGap || window.phonegap) && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent);}
		</script>
		<script type="text/javascript" crossorigin="anonymous" src="https://code.jquery.com/jquery-2.2.0.min.js" onload="document.getElementById('__load').value+=28"></script>
		<script type="text/javascript" src="assets/js_libs/libs.js.php" onload="document.getElementById('__load').value+=42"></script>
		<script type="text/javascript" src="assets/js/Musec.js" onload="document.getElementById('__load').innerHTML+=33" defer></script>
	</body>
</html>