<!DOCTYPE HTML>
<html>
	<head>
		<title>Admin | Musec</title>
		<meta charset="UTF-8" />
		<link rel="stylesheet" type="text/css" href="../assets/css/global.css" media="all" />
		<link rel="stylesheet" type="text/css" href="../assets/css/admin.css" media="screen" />
	</head>
	<body>
	
		<div id="home" class="display">
			<div id="admin_welcome" class="admin_pg_title">Musec Admin Panel</div>
			<div id="admin_welcome_links">
				<div id="admin_link_upl" class="admin_welcome_link">Upload new music</div>
				<div id="admin_link_ind" class="admin_welcome_link">Update index</div>
			</div>
		</div>

		<div id="upload" class="display hidden">
			<div id="upload_title" class="admin_pg_title">Upload new music</div>
			<div id="upl_dirs">
				<button class="action_button" onclick="admin.loadUploadDirs()" id="admin_index_button">Click here to begin</button>
			</div>
		</div>
		
		<div id="index" class="display hidden">
			<div id="index_title" class="admin_pg_title">Reload the index</div>
			<div id="index_reload_status" class="message_box">Press the button below to reload.</div><br />
			<input type="checkbox" id="estiInd" />Use inaccurate time data(faster)<br />
			<input type="checkbox" id="prettyp" />Pretty Print File (Larger file)<br />
			<button class="action_button" onclick="admin.triggerIndexReload()" id="admin_index_button">Reload Index</button>
		</div>
		
		<script type="text/javascript">
		if(typeof(jQuery)=="undefined"){document.write('<script src="../assets/js_libs/jquery-2.1.4.min.js" type="text/javascript"><\/script>');}
		</script>
		<script src="admin.js" type="text/javascript"></script>
		
	</body>
</html>