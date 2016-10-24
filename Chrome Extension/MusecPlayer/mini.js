document.addEventListener('DOMContentLoaded', function(){
	window._musecMini = {
		d:document.getElementById("text"),
		ConnectMusec:function(t){
			_musecMini.d.innerHTML = "<div id='name'></div><div id='time'></div>";
			document.getElementById("artwork").style.display = "block";
			chrome.runtime.onMessageExternal.addListener(function(request,sender,sendResponse){
				console.log(request);
				if (request.time == false){
					_musecMini.UpdateMini(request.song,"","",true);
				} else {
					_musecMini.UpdateMini(request.song,request.time,request.art,request.playing);
				}
			});
		},
		UpdateMini:function(song,time,art,playing){
			document.getElementById("name").innerHTML = "<h2>"+song+"</h2>";
			document.getElementById("time").innerHTML = "<h2>"+time+"</h2>";
			if (art != "" && art != document.getElementById("artimg").src){
				document.getElementById("artimg").src = art;
			}
			if (playing == true){
				document.body.style.backgroundColor = "#fff";
				document.body.style.color = "#000";
			} else {
				document.body.style.backgroundColor = "#000";
				document.body.style.color = "#fff";
			}
		}
	};
	chrome.tabs.query({url:"*://site.localhost/*"}, function(tabs) {
		if (tabs.length == 1){
			_musecMini.d.innerHTML = "<h1>Connecting...</h1>";
			_musecMini.ConnectMusec(tabs[0].id);
		} else if (tabs.length == 0){
			chrome.tabs.create({url:"http://absolutedouble.co.uk/projects/musec/"});
		} else {
			_musecMini.d.innerHTML = "Currently, we only support 1 musec instance at a time.";
		}
	});
});