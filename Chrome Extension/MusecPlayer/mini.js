document.addEventListener('DOMContentLoaded', function(){
	window._musecMini = {
		d:document.getElementById("text"),
		ConnectMusec:function(t){
			console.info("Connected to: " + t);
			_musecMini.d.innerHTML = "<div id='name'></div><div id='time'></div>";
			document.getElementById("artwork").style.display = "block";
			chrome.runtime.onMessageExternal.addListener(function(req,sender,sendResponse){
				console.log(req);
				if (req.time == false){
					_musecMini.UpdateMini(req.song,"","",true,"#fff","#000");
				} else {
					_musecMini.UpdateMini(req.song,req.time,req.art,req.playing,req.textColour,req.interfaceColour);
				}
			});
		},
		UpdateMini:function(song,time,art,playing,tcol,icol){
			document.getElementById("name").innerHTML = "<h2>"+song+"</h2>";
			document.getElementById("time").innerHTML = "<h2>"+time+"</h2>";
			if (art != "" && art != document.getElementById("artimg").src){
				document.getElementById("artimg").src = art;
			}
			document.body.style.backgroundColor = icol;
			document.body.style.color = tcol;
		}
	};
	chrome.tabs.query({url:"*://site.localhost/*"}, function(tabs) {
		if (tabs.length == 1){
			_musecMini.d.innerHTML = "<h1>Connecting...</h1>";
			_musecMini.ConnectMusec(tabs[0].id);
		} else if (tabs.length == 0){
			chrome.tabs.create({url:"http://site.localhost/projects/musec/"});
		} else {
			_musecMini.d.innerHTML = "Currently, we only support 1 musec instance at a time.";
		}
	});
});