<?php
$betaKeysIssued = ["Bacon","NotBacon"];

if (isset($_COOKIE["beta"]) && $_COOKIE["beta"] > time()) {
	require("index.php");
	die();
} else {
	session_start();
}

if (isset($_POST["potential"])) {
	$p = trim($_POST["potential"]);
	if (in_array($p,$betaKeysIssued)) {
		setcookie("beta",time()+172800,time()+172800,"/"); // 2 Days
		$cont = "<h1>Beta login</h1><h2 class='s'>Success, click here to continue</h2><script>document.body.addEventListener(\"click\",function(){location.href='index.php';},false);</script>";
	} else {
		$cont = "<h1>Beta login</h1><h2 class='e'>Beta key invalid</h2>";
	}
} else {
	$cont = "<h1>Beta login</h1><h2 class='n'>Enter login information</h2>";
}
?>
<!DOCTYPE HTML>
<html lang="en" dir="ltr">
	<head>

		<!-- Title and Metadata -->
		<title>Musec! Beta</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
		<meta name="author" content="Jake Mcneill" />
		<meta name="google" content="notranslate" />
		<meta name="description" content="Please login" />

		<!-- Styles and Graphics -->
		<style type="text/css">
			h1,h2{width:100%;margin:15px 0;padding:7.5px 0;}.s{background-color:rgba(0,150,0,0.8);}.n{background-color:rgba(230,130,0,0.8);}.e{background-color:rgba(200,0,0,0.8);}body{color:#fff;background-color:rgba(0,0,0,0.8);}div.container{font-size:1.1em;font-family:sans-serif;font-weight:100;margin:5% 12.5%;width:75%;text-align:center}input[type=text]{display:inline-block;width:72.5%;height:1.5em;padding:6px 2.5%;font-size:14px;line-height:1em;color:#555;background-color:#fff;border:1px solid #000;border-radius:0;-webkit-box-shadow:inset 0 1px 1px rgba(0,0,0,.075);box-shadow:inset 0 1px 1px rgba(0,0,0,.075);-webkit-transition:border-color ease-in-out .15s,-webkit-box-shadow ease-in-out .15s;-o-transition:border-color ease-in-out .15s,box-shadow ease-in-out .15s;transition:border-color ease-in-out .15s,box-shadow ease-in-out .15s}input[type=submit]{background-color:rgba(0,0,0,.5);color:#fff!important;transition:background-color .2s ease-in-out;border:0;border-radius:0;cursor:pointer;display:inline-block;font-family:Helvetica,sans-serif;font-weight:500;height:2.6em;line-height:2.75em;padding:0 1vw;text-align:center;text-decoration:none;text-transform:uppercase;white-space:nowrap}input[type=submit]:hover{background-color:rgba(0,0,0,.9)}
		</style>
		<link rel="apple-touch-icon" sizes="250x250" href="assets/img/Musec!3.jpg">
		<link rel="icon" href="assets/img/Musec!.jpg" type="image/gif">

	</head>
	<body>
		<!--[if lte IE 8]><h1 style="text-align:center;font-size:2.2em;">Browser Not Supported</h1><h2 style="text-align:center;font-size:1.5em;">Please download a better browser</h2><a href="https://www.google.com/chrome/">Chrome</a> | <a href="https://mozilla.org/firefox/">Firefox</a> | <a href="https://www.opera.com/">Opera</a><div style="display:none"><!--<![endif]-->
		<div class="container">
			<?php echo $cont; ?>
			<form action="betalogin.php" name="beta_form" id="beta_form" method="post">
				<input type="text" placeholder="Beta Key" name="potential" id="potential" /><br /><br />
				<input type="submit" value="Login" name="do" id="do" />
			</form>
		</div>

		<!-- Scripts and Libraries -->
		<script type="text/javascript" src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
		<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/fastclick/1.0.6/fastclick.min.js"></script>
		<script type="text/javascript" src="assets/polyfills/modernizr-custom.js"></script>
		<script type="text/javascript">
			if (typeof(jQuery) == "undefined"){document.write('<script src="assets/libs/jquery-2.1.4.min.js" type="text/javascript"><\/script>');}
			if (typeof(FastClick) == "undefined"){document.write('<script src="assets/assets/js/fastclick.js" type="text/javascript"><\/script>');}
			if (!Modernizr.atobbtoa){document.write('<script type="text/javascript" src="assets/polyfills/base64.min.js"><\/script>');}
			if (!Modernizr.json){document.write('<script type="text/javascript" src="assets/polyfills/json3.min.js"><\/script>');}
			FastClick.attach(document.body);
		</script>
	</body>
</html>