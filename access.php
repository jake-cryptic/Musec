<?php
header("X-Content-Type-Options: nosniff");

$betaKeysIssued = ["IsBacon","MaybeBacon","NotBacon"];

if (isset($_GET["eternal"]) && $_GET["eternal"] == "true"){
	$domain = ($_SERVER['HTTP_HOST'] != 'localhost') ? $_SERVER['HTTP_HOST'] : false;
	setcookie("MusecAccess",time()+62208000,time()+62208000,"/",$domain,false,true); // 2 Years
	$cont = "<h1>You are eternal</h1><h2 class='e' onclick='window.location.href=\"index.php\"'>Click here</h2><div style='display:none'>";
}

if (isset($_COOKIE["MusecAccess"]) && $_COOKIE["MusecAccess"] > time()) {
	require("index.php");
	die();
} else {
	session_start();
}

if (!function_exists("getBase")) {
	function getBase($path) {
		$pArr = explode("/",$path);
		array_pop($pArr);
		return implode("/",$pArr);
	}
}
$_BASE = getBase($_SERVER["PHP_SELF"]);

if (!isset($cont)){
	if (isset($_POST["potential"])) {
		$p = trim($_POST["potential"]);
		if (in_array($p,$betaKeysIssued)) {
			$domain = ($_SERVER['HTTP_HOST'] != 'localhost') ? $_SERVER['HTTP_HOST'] : false;
			setcookie("MusecAccess",time()+1814400,time()+1814400,"/",$domain,false,true); // 3 Weeks
			$cont = "<h1>Login</h1><h2 class='s'>Success, click here to continue</h2><script>document.body.addEventListener(\"click\",function(){location.href='index.php';},false);</script>";
		} else {
			$cont = "<h1>Login</h1><h2 class='e'>Key invalid</h2>";
		}
	} else {
		$cont = "<h1>Login</h1><h2 class='n'>Enter login information</h2>";
	}
}
?>
<!DOCTYPE HTML>
<html lang="en" dir="ltr">
	<head>

		<!-- Title and Metadata -->
		<title>Musec!</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
		<meta name="author" content="Jake Mcneill" />
		<meta name="google" content="notranslate" />
		<meta name="description" content="Please login before continuing" />

		<!-- Styles and Graphics -->
		<style type="text/css">h1,h2{width:100%;margin:15px 0;padding:7.5px 0;}.s{background-color:rgba(0,150,0,0.8);}.n{background-color:rgba(230,130,0,0.8);}.e{background-color:rgba(200,0,0,0.8);}body{color:#fff;background-color:rgba(0,0,0,0.8);}div.container{font-size:1.1em;font-family:sans-serif;font-weight:100;margin:5% 12.5%;width:75%;text-align:center}input[type=text]{display:inline-block;width:72.5%;height:1.5em;padding:6px 2.5%;font-size:14px;line-height:1em;color:#555;background-color:#fff;border:1px solid #000;border-radius:0;-webkit-box-shadow:inset 0 1px 1px rgba(0,0,0,.075);box-shadow:inset 0 1px 1px rgba(0,0,0,.075);-webkit-transition:border-color ease-in-out .15s,-webkit-box-shadow ease-in-out .15s;-o-transition:border-color ease-in-out .15s,box-shadow ease-in-out .15s;transition:border-color ease-in-out .15s,box-shadow ease-in-out .15s}input[type=submit]{background-color:rgba(0,0,0,.5);color:#fff!important;transition:background-color .2s ease-in-out;border:0;border-radius:0;cursor:pointer;display:inline-block;font-family:Helvetica,sans-serif;font-weight:500;height:2.6em;line-height:2.75em;padding:0 1vw;text-align:center;text-decoration:none;text-transform:uppercase;white-space:nowrap}input[type=submit]:hover{background-color:rgba(0,0,0,.9)}</style>
		<link rel="apple-touch-icon" sizes="250x250" href="<?php echo $_BASE; ?>/assets/img/Musec!3.jpg">
		<link rel="icon" href="<?php echo $_BASE; ?>/assets/img/Musec!.jpg" type="image/gif">

	</head>
	<body>
		<!--[if lte IE 8]><h1 style="text-align:center;font-size:2.2em;">Browser Not Supported</h1><h2 style="text-align:center;font-size:1.5em;">Please download a better browser</h2><a href="https://www.google.com/chrome/">Chrome</a> | <a href="https://mozilla.org/firefox/">Firefox</a> | <a href="https://www.opera.com/">Opera</a><div style="display:none"><!--<![endif]-->
		<div class="container">
			<?php echo $cont; ?>
			<form action="<?php echo $_BASE; ?>/access.php" name="beta_form" id="beta_form" method="post">
				<input type="text" placeholder="Beta Key" name="potential" id="potential" /><br /><br />
				<input type="submit" value="Login" name="do" id="do" />
			</form>
		</div>

		<!-- Scripts and Libraries -->
		<script src="https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.4.2/Sortable.min.js" integrity="sha384-cGoVZug22kU0KaYbL6jI8BRsGIAXIYe00lYKPHCwEqD9gwUjxaOBG3X/4mjG6xau" crossorigin="anonymous"></script>
		<script type="text/javascript" crossorigin="anonymous" integrity="sha256-ihAoc6M/JPfrIiIeayPE9xjin4UWjsx2mjW/rtmxLM4=" src="https://code.jquery.com/jquery-2.2.0.min.js"></script>
		<script type="text/javascript" src="<?php echo $_BASE; ?>/assets/js_libs/libs.js.php"></script>
		<script type="text/javascript">
			if (typeof(jQuery) == "undefined"){document.write('<script src="<?php echo $_BASE; ?>/assets/js_libs/jquery-2.1.4.min.js" type="text/javascript"><\/script>');}
			FastClick.attach(document.body);
			var i = 0;
			var assets = ["broom.svg","cross.svg","down.svg","exclamation.svg","loader.gif","play.svg","plus.svg","refresh.svg","sad.svg","stop.svg"];
			for (i = 0;i<assets.length;i++) {
				hint = document.createElement("link");
				hint.setAttribute("rel","prefetch");
				hint.setAttribute("href","<?php echo $_BASE; ?>/assets/img/i/" + assets[i]);
				document.getElementsByTagName("head")[0].appendChild(hint);
			}
		</script>
	</body>
</html>