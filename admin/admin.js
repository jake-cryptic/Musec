$activeView = $("#home");

function changeView(newView) {
	$activeView.fadeOut(500);
	newView.delay(500).fadeIn(500);
	$activeView = newView;
}

$("#admin_link_upl").click(function() {
	changeView($("#upload"));
});
$("#admin_link_ind").click(function() {
	changeView($("#index"));
});
$(".admin_pg_title").click(function() {
	changeView($("#home"));
});

var admin = {
	triggerIndexReload:function() {
		var status = $("#index_reload_status");
		var button = $("#admin_index_button");
		var pretty = document.getElementById("prettyp").checked;
		var fast = document.getElementById("estiInd").checked;
		
		var dataStr = "trigger=yes";
		if (fast == true){
			dataStr += "&doitfast=yes";
		}
		if (pretty == true){
			dataStr += "&pretty_print=yes";
		}
		$.ajax({
			url:"createIndex.php",
			type:"POST",
			data:dataStr,
			beforeSend:function() {
				button.attr("disabled", true);
				status.html("Indexing... (This will take a while)");
			},
			success:function(r){
				status.html(r);
				button.attr("disabled", false);
			},
			error:function(e){
				status.html(e);
				button.attr("disabled", false);
			}
		});
	},
	loadUploadDirs:function() {
		var dirBox = $("#upl_dirs");
		$.ajax({
			url:"uploader.php",
			type:"POST",
			data:"do=getDirs",
			beforeSend:function() {
				dirBox.html("<h2>Loading Directories</h2>");
			},
			success:function(r){
				dirBox.html(r);
			},
			error:function(e){
				dirBox.html("<h2>There was a problem</h2>Check the console for details");
			}
		});
	}
};