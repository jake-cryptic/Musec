/* Musec - Build 17 */
var tiles = {
	cacheVersion:17,
	backendUrl:"",
	songQueue:[],
	currentSong:0,
	queueDelay:250, // milliseconds
	connDelays:[3,5,10,15,30,60,"reload"],
	connAttempt:0,
	cfn:undefined,
	lastSearchVal:"",
	appLoadTime:Math.floor(Date.now() / 1000),
	db:true,
	m:false,
	allowKeyBoardEvents:true,
	isTypingMsg:false,
	uMix:false,
	idleTimeout:true,
	visuSupport:true,
	idleTime:0,
	supportsFS: /Chrome|Opera|BB10/.test(navigator.userAgent),
	fsHasQuota:true,
	
	dev:function(log){
		if (tiles.db === true) { console.log(log); } //"Musec-> " + 
	},
	sAlert:function(m,i,d){
		tiles.dev("Alerted: '" + m + "' for " + (d*3) + "ms with image " + i);
		$("#sAlertImg").attr("src","assets/img/i/" + i);
		$("#sAlertTxt").html(m);
		
		$("#sAlert").fadeIn(d);
		setTimeout(function(){
			$("#sAlert").fadeOut(d);
		},d*3);
	},
	desktopNotify:function(t,b,i){
		tiles.dev("Notifying User..");
		var options = {
			body:b,
			icon:i
		};
		
		if (!("Notification" in window)) {
			tiles.dev("No Notification support");
		} else if (Notification.permission === "granted") {
			tiles.notif = new Notification(t,options);
			setTimeout(tiles.notif.close.bind(tiles.notif),7500);
		} else if (Notification.permission !== 'denied') {
			tiles.dev("Requesting permssion");
			Notification.requestPermission(function (permission) {
				if (permission === "granted") {
					tiles.notif = new Notification(t,options);
					setTimeout(tiles.notif.close.bind(tiles.notif),7500);
				}
			});
		}
	},
	load:function(sendData,rmBlur){
		tiles.dev(sendData);
		if (navigator.onLine) {
			$.ajax({
				url:tiles.backendUrl + "backend.php",
				type:"POST",
				data:sendData,
				success:function(r){
					if (rmBlur === true){
						$(".tile_bg").removeClass("blur");
					}
					
					try {
						var decoded = JSON.parse(r);
					} catch(e) {
						tiles.sAlert("Server Error","sad.svg",300);
						return false;
					}
					
					if (decoded.response == "lsdir"){
						tiles.showFolder(decoded);
					} else if (decoded.response == "lsfiles") {
						tiles.showSongs(decoded,1);
					} else if (decoded.response == "tfiles") {
						tiles.backgroundAdd(decoded);
					} else if (decoded.response == "sresult") {
						tiles.showSongs(decoded,2);
					} else if (decoded.response == "elog") {
						tiles.dev("EReport success!");
					} else if (decoded.response == "version") {
						tiles.handleCacheErrors(decoded);
					} else {
						tiles.showError(decoded,2,sendData);
					}
				},
				error:function(e){
					$(".tile_bg").addClass("blur");
					tiles.showError(e,1,sendData);
					return false;
				}
			});
		} else {
			alert("You don't seem to be online.");
		}
	},
	loadSongs:function(folder){
		var folderName = $("#tile_id_" + folder).prop("folder");

		tiles.dev("Tile number " + folder + " is " + folderName);
		$("#tile_id_" + folder + "_bg").addClass("blur");

		tiles.load("t=s&d=" + btoa("/" + folderName),true);
		tiles.cfn = folderName;
		tiles.cfd = folderName;
		tiles.cfc = capitalise(folderName.replace(/_/g," ")); // Replace all _'s
	},
	showFolder:function(folderData){
		$("#musicFolders").html("");
		if (folderData.data.length == 0) {
			$("#musicFolders").html("<h2>There is no music in the resources folder</h2>");
		} else {
			for (i=0;i<folderData.data.length;i++) {
				var x = folderData.data[i];
				var temp = '<div class="tile tile_longclick" folder="' + x + '" id="tile_id_' + i + '"><div class="tile_content" id="tile_id_' + i + '_c"> </div>';
				temp += '<div class="tile_bg" id="tile_id_' + i + '_bg"> </div></div>';

				$("#musicFolders").append(temp);
				document.getElementById("tile_id_" + i + "_bg").style.background = 'url("' + tiles.backendUrl + 'resources/artwork/' + x + '.jpg")';
				document.getElementById("tile_id_" + i + "_bg").style.backgroundSize = 'cover';
				tiles.songData = x;
				$("#tile_id_" + i).prop("folder",x);
			}
			$(".tile_longclick").each(function(x){
				$("#tile_id_" + x + "_bg").contextmenu(function(evn){evn.preventDefault();tiles.showTileMenu(x);});
				$("#tile_id_" + x + "_bg").longclick(300,function(){tiles.showTileMenu(x);});
				$("#tile_id_" + x + "_bg").click(function(){tiles.loadSongs(x);});
			});
		}
	},
	showSongs:function(folderData,responseType){
		$("#musicFolders").hide();
		$sf = $("#songFolder");
		$sf.show();
		tiles.bB.html("<");
		tiles.bB.prop("do","back");
		tiles.activeView = $sf;
		
		if (typeof(tiles.currentMediaState) == "undefined") {
			tiles.folder.html(tiles.cfc);
		} else {
			tiles.folder.html(tiles.cfc);
			document.title = "Musec - " + tiles.songName;
		}
		
		if (folderData.data.length == 0) {
			$sf.html("<h2>Couldn't find any music in this directory</h2>"); return;
		}
		
		if (responseType == 1) {
			$sf.html("<table><thead><tr><th>Song</th></tr></thead><tbody id=\"song_list\"></tbody></table>");
		
			for (i=0;i<folderData.data.length;i++) {
				var file = folderData.data[i].split('/').pop();
				var x = tiles.removeSongNumbers(file.replace(".m4a", "").replace(".mp3", ""));
				var temp = '<tr song="' + btoa(folderData.data[i]) + '" id="song_' + i + '" class="song_longclick"><td id="song_inner_' + i + '"><span id="song_name_' + i + '" class="__song_AllowSearch">' + x + '</span></td></tr>';
				$("#song_list").append(temp);
			}
		} else {
			tiles.isTyping = false;
			$sf.html("<table><thead><tr><th>Search Results</th></tr></thead><tbody id=\"search_r_lst\"><tr><td><h2>Found " + folderData.count + " result(s)</h2></td></tr></tbody></table>");
			for(var i = 1;i < (folderData.count+1);i++) {
				var file = folderData.data[i][0];
				var x = tiles.removeSongNumbers(file.replace(".m4a", "").replace(".mp3", ""));
				var temp = '<tr song="' + btoa("/" + folderData.data[i][1] + "/" + folderData.data[i][0]) + '" id="song_' + (i-1) + '" class="song_longclick"><td id="song_inner_' + (i-1) + '"><span id="song_name_' + (i-1) + '" class="__song_AllowSearch">' + x + '</span></td></tr>';
				$("#search_r_lst").append(temp);
				tiles.dev(i + "/" + Object.keys(folderData.data).length + "-> " + folderData.data[i][1] + "/" + folderData.data[i][0]);
			}
			
			var eW = tiles.widthCheck();
			tiles.folder.fadeIn(300,function(){tiles.folder.animate({width:eW,opacity:1},500);});
			$("#search_container").fadeOut(300,function(){$("#search_container").animate({width:"0",opacity:0.2},500);});
		}
		
		$(".song_longclick").each(function(x){
			$(this).contextmenu(function(evn){
				evn.preventDefault();
				tiles.showSongMenu("#song_" + x);
			});
			$(this).longclick(500,function(){
				tiles.showSongMenu("#song_" + x);
			});
			$(this).click(function(){
				if($(this).hasClass('disabled__')) return;
				tiles.alterQueue("playnow","#song_" + x);
				tiles.nextSong();
			});
		});
	},
	removeSongNumbers:function(songName){
		var s1 = songName.substring(0,1);
		var s2 = songName.substring(1,2);
		var s3 = songName.substring(2,3);
		
		if (isNumeric(s1) && isNumeric(s2) && !isNumeric(s3)) {
			if (s3 == "." || s3 == " ") {
				newSongName = songName.substring(3);
			} else {
				newSongName = songName.substring(2);
			}
			tiles.dev("Song " + songName + " has a song int, cleaned to: " + newSongName);
		} else {
			tiles.dev(s1 + " & " + s2 + " of string " + songName);
			newSongName = songName;
		}
		
		return newSongName;
	},
	checkPlayback:function(ae){
		return !ae.paused;
	},
	nextSong:function(sP){
		if (typeof(sP) == "object") {
			// Local Song
			var loc = sP["l"];
			tiles.songName = sP["n"];
			tiles.songAlbum = sP["a"];
			tiles.isPlayingOfflineSong = true;
		} else {
			if (!navigator.onLine) {
				alert("You aren't connected to the internet :(");
				return false;
			}
			tiles.isPlayingOfflineSong = false;
			var loc = tiles.songQueue[tiles.currentSong*2];
			tiles.songName = tiles.songQueue[(tiles.currentSong*2)+1];
			tiles.songAlbum = tiles.songQueue[(tiles.currentSong*2)].split("/")[2];
			
			if (tiles.currentSong*2 > tiles.songQueue.length || typeof(loc) == "undefined") {
				tiles.sAlert("Fixing","broom.svg",250);
				tiles.currentSong = tiles.songQueue.length/2;
				loc = tiles.songQueue[tiles.currentSong*2];
				tiles.songName = tiles.songQueue[(tiles.currentSong*2)+1];
			}
			loc = tiles.backendUrl + loc;
		}
		
		tiles.dev("playSong called with loc: " + loc);
		
		if (typeof(tiles.AudioElement) == "undefined") {
			tiles.folder.html("Loading Song");
			try {
				tiles.AudioElement = new Audio();
				try {
					tiles.AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
					
					if (!tiles.AudioCtx.createGain)
						tiles.AudioCtx.createGain = tiles.AudioCtx.createGainNode;
					if (!tiles.AudioCtx.createDelay)
						tiles.AudioCtx.createDelay = tiles.AudioCtx.createDelayNode;
					if (!tiles.AudioCtx.createScriptProcessor)
						tiles.AudioCtx.createScriptProcessor = tiles.AudioCtx.createJavaScriptNode;
					
					tiles.dev("Audio Context Created!");
				} catch(e) {
					// Audio Context isn't supported? No problem..
					tiles.dev(e);
					tiles.visuSupport = false;
				}
			} catch(e) {
				alert("Error creating audio element");
				tiles.dev(e);
				return false;
			}
			tiles.dev("Audio Element Created!");
			
			if (tiles.visuSupport == true) {
				var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
				if (!iOS){
					tiles.MusicVisualizerObj = new MusicVisualizer();
					tiles.MusicVisualizerObj.togglePlayback();
				}
			}
		} else {
			tiles.folder.html("Loading next song");
		}
		tiles.dev("Audio Element:"  + loc);
		
		tiles.AudioElement.addEventListener('loadeddata',function(){
			tiles.AudioElement.play();
			if (tiles.m != true) { // Give desktop browsers a hint
				setTimeout("tiles.AudioElement.pause()", 10);
				setTimeout("tiles.AudioElement.play()", 20);
			}
			
			document.title = "Musec - " + tiles.songName;
			tiles.folder.html(tiles.songName);
			tiles.folder.css({"font-size":"1.25em"});
			tiles.mediaStateTrigger.innerHTML = "&#10074;&#10074;";
			
			$("#mediacontrols").html('<input id="playbackslider" class="msicSldr" type="range" min="0" max="100" value="0" step="1"> <span id="mediaCtime">00:00</span>/<span id="mediaTtime">00:00</span>');
			tiles.PlayBackSlider = document.getElementById("playbackslider");
			tiles.MediaCurrentTime = document.getElementById("mediaCtime");
			tiles.MediaTotalTime = document.getElementById("mediaTtime");
			
			tiles.PlayBackSlider.addEventListener("change",tiles.songSeek,false);
			tiles.PlayBackSlider.addEventListener("mousedown",function(){tiles.AudioElement.pause();},false);
			tiles.PlayBackSlider.addEventListener("touchstart",function(){tiles.AudioElement.pause();},false);
			tiles.PlayBackSlider.addEventListener("mouseup",function(){tiles.AudioElement.play();},false);
			tiles.PlayBackSlider.addEventListener("touchend",function(){tiles.AudioElement.play();},false);
			
			tiles.AudioElement.addEventListener("timeupdate",tiles.updateMediaInfo,false);
			
			tiles.currentMediaState = true;
		},false);
		tiles.AudioElement.addEventListener('error',function(e){
			console.error(e);
			alert('Error Loading Data');
			tiles.folder.html("Error");
		},false);
		tiles.AudioElement.addEventListener("ended",tiles.songEnd,false);
		tiles.AudioElement.addEventListener("progress",tiles.songLoadProgress,false);
		tiles.AudioElement.addEventListener("waiting",tiles.songBuffering,false);
		
		tiles.AudioElement.src = loc;
		tiles.dev("SRV:" + loc);
		if (tiles.m == true) {
			tiles.AudioElement.play(); // Give mobile browsers a hint
		}
		tiles.currentSong++;
		var dtNotifMsg = "Now playing: " + tiles.songName;
		var dtNotifIco = "resources/artwork/" + tiles.songAlbum + ".jpg";
		tiles.desktopNotify("Musec",dtNotifMsg,dtNotifIco);
	},
	updateMediaInfo:function(){
		if (typeof(tiles.AudioElement.duration) == "undefined" || tiles.AudioElement.duration == null || isNaN(tiles.AudioElement.duration)) {
			tiles.dev("It seems that duration isn't playing nice... Poly fill");
			tiles.MediaCurrentTime.innerHTML = "00:00";
			tiles.MediaTotalTime.innerHTML = "00:00";
		} else {
			tiles.PlayBackSlider.value = (tiles.AudioElement.currentTime * (100 / tiles.AudioElement.duration));
			
			var currentMinutes = Math.floor(tiles.AudioElement.currentTime / 60);
			var currentSeconds = Math.floor(tiles.AudioElement.currentTime - currentMinutes * 60);
			var totalMinutes = Math.floor(tiles.AudioElement.duration / 60);
			var totalSeconds = Math.floor(tiles.AudioElement.duration - totalMinutes * 60);
			
			if(currentSeconds < 10){ currentSeconds = "0" + currentSeconds; }
			if(totalSeconds < 10){ totalSeconds = "0" + totalSeconds; }
			if(currentMinutes < 10){ currentMinutes = "0" + currentMinutes; }
			if(totalMinutes < 10){ totalMinutes = "0" + totalMinutes; }
			
			tiles.MediaCurrentTime.innerHTML = currentMinutes + ":" + currentSeconds;
			tiles.MediaTotalTime.innerHTML = totalMinutes + ":" + totalSeconds;
			
			//tiles.songLoadProgress(tiles.AudioElement);
		}
	},
	songEnd:function(){
		if (tiles.isPlayingOfflineSong == true) {
			tiles.changeMediaState();
			tiles.sAlert("End","stop.svg",300);
			tiles.desktopNotify("Musec","Song Finished","assets/img/Musec!3.jpg");
			return;
		}
		if (tiles.songQueue.length == (tiles.currentSong*2)) {
			tiles.changeMediaState();
			tiles.sAlert("End of Queue","stop.svg",500);
			tiles.desktopNotify("Musec","End of Queue","assets/img/Musec!3.jpg");
		} else {
			tiles.nextSong();
			if ($("#queueFolder").is(":visible")) {
				tiles.reloadQueueView();
			}
			if (tiles.m == true) {
				if (!tiles.checkPlayback(tiles.AudioElement)) {
					setTimeout(function(){
						tiles.changeMediaState();
						setTimeout(function(){
							tiles.changeMediaState();
						},500);
					},500);
				}
			}
		}
	},
	songSeek:function(){
		tiles.AudioElement.currentTime = (tiles.AudioElement.duration * (tiles.PlayBackSlider.value / 100));
	},
	changeMediaState:function(){
		tiles.dev("Changing state..");
		if (typeof(tiles.currentMediaState) == "undefined") {
			tiles.dev("changeMediaState->Path->1");
			if (tiles.songQueue.length != 0) {
				tiles.dev("changeMediaState->Path->1->1");
				if (tiles.currentSong >= tiles.songQueue.length) {
					tiles.dev("changeMediaState->Path->1->1->1");
					tiles.currentSong = 0;
					tiles.nextSong();
				} else {
					tiles.dev("changeMediaState->Path->1->1->2");
					tiles.nextSong();
				}
			} else {
				tiles.dev("changeMediaState->Path->1->2");
				if (typeof(tiles.AudioElement) != "undefined") {
					tiles.AudioElement.pause();
					tiles.currentMediaState = false;
					document.title = "Paused - " + tiles.songName;
				}
			}
		} else if (tiles.currentMediaState == false) {
			tiles.dev("changeMediaState->Path->2");
			tiles.currentMediaState = true;
			tiles.AudioElement.play();
			tiles.mediaStateTrigger.innerHTML = "&#10074;&#10074;";
			document.title = "Musec - " + tiles.songName;
		} else {
			tiles.dev("changeMediaState->Path->3");
			tiles.currentMediaState = false;
			tiles.AudioElement.pause();
			tiles.mediaStateTrigger.innerHTML = "&#9658;";
			document.title = "Paused - " + tiles.songName;
		}
	},
	songLoadProgress: function(){
		tiles.songRawTime = tiles.AudioElement.currentTime;
		if (typeof(tiles.AudioElement.duration) == "undefined") {
			tiles.songRawDuration = 0;
		} else {
			tiles.songRawDuration = tiles.AudioElement.duration;
		}
		try {
			tiles.songRawBuffer = tiles.AudioElement.buffered.end(tiles.AudioElement.buffered.length-1);
		} catch(e) {
			tiles.songRawBuffer = 0;
		}
		percentLoaded = Math.round((tiles.songRawTime / tiles.songRawBuffer) * 100);
		percentPlayed = Math.round((tiles.songRawTime / tiles.songRawDuration) * 100);
		percentTest = Math.round((tiles.songRawBuffer / tiles.songRawDuration) * 100);

		//tiles.dev("Progress-> RawBuff(" + tiles.songRawBuffer + ") - RawDur(" + tiles.songRawDuration + ") - RawTim(" + tiles.songRawTime + "); Loaded: " + percentLoaded + "% Played: " + percentPlayed + "% Test: " + percentTest + "%");
		if (isNaN(percentTest)) {
			tiles.folder.css({background:"linear-gradient(to right, white 0%, rgba(0,0,0,0.5))"});
		} else {
			tiles.folder.css({background:"linear-gradient(to right, white " + percentTest + "%, rgba(0,0,0,0.5))"});
		}
	},
	songBuffering:function(){
		tiles.dev("Warning! Buffering at " + tiles.songRawBuffer);
	},
	showSongMenu:function(song_id){
		var innerID = song_id.replace("song","song_inner");
		tiles.dev("Showing song menu for " + song_id + "; LSSM: " + $(song_id).attr("song"));
		$(song_id).addClass("disabled__");
		currentContent = $(innerID).html().substring(-5);

		if (typeof(tiles.lastSongMenu) == "undefined" && typeof(tiles.lastMenuSong) == "undefined") {
			tiles.lastSongMenu = currentContent;
			tiles.lastMenuSong = innerID;
			tiles.dev("showSongMenu->Path->1");
		} else {
			if ($(tiles.lastMenuSong).length) {
				$(tiles.lastMenuSong).html(tiles.lastSongMenu);
				arr = tiles.lastMenuSong.split("_");
				$("#song_" + arr[arr.length-1]).removeClass("disabled__");
				tiles.dev("showSongMenu->Path->2->1");
				if (innerID == tiles.lastMenuSong) {
					tiles.dev("showSongMenu->Path->2->1->1");
					tiles.lastMenuSong = undefined;
					tiles.lastSongMenu = undefined;
					return false;
				}
			}
			tiles.lastSongMenu = currentContent;
			tiles.lastMenuSong = innerID;
		}

		var newContent = currentContent;
		newContent += "<br /><button class='bcircle' onclick='tiles.alterQueue(\"playnext\",\"" + song_id + "\");'>Play Next</button>";
		newContent += " <button class='bcircle' onclick='tiles.alterQueue(\"add\",\"" + song_id + "\");'>Add to queue</button>";
		//newContent += " <button class='bcircle' onclick='tiles.showLyrics(\"" + song_id + "\");'>Lyrics</button></td>";
		newContent += " <button class='bcircle' onclick='tiles.alterQueue(\"playnow\",\"" + song_id + "\");tiles.nextSong();'>Play Now</button></td>";
		if (tiles.supportsFS){
			newContent += " <button class='bcircle' onclick='tiles.makeAvailableOffline(\"" + song_id + "\");'>Download</button></td>";
		}

		$(innerID).html(newContent);
	},
	showTileMenu:function(song_id){
		$(".tile_bg").removeClass("blur");
		if (typeof(tiles.cWt) == "undefined") {
			tiles.cWt = $("#tile_id_" + song_id + "_c");
			tiles.cWtI = song_id;
			tiles.cWtS = $("#tile_id_" + song_id).prop("folder");
			var title = capitalise($("#tile_id_" + song_id).prop("folder").replace(/_/g," "));
			tiles.dev("STM: " + song_id + " && " + tiles.cWtS);
			
			tiles.cWt.unbind();

			$("#tile_id_" + song_id + "_bg").addClass("blur");

			tmp = '<div class="tile_table"><div class="tileTrow tileTitle">' + title + '</div>';
			tmp += '<div class="tileTrow tileAct" onclick="tiles.showTileMenu(\'' + song_id + '\');tiles.loadSongs(\'' + song_id + '\');">Open Folder</div>';
			tmp += '<div class="tileTrow tileAct" onclick="tiles.tileMenuDo(\'atq\',\'' + $("#tile_id_" + song_id).prop("folder") + '\')">Add all to queue</div>';
			tmp += '<div class="tileTrow tileAct" onclick="tiles.tileMenuDo(\'fav\',\'' + $("#tile_id_" + song_id).prop("folder") + '\')">Add to favourites</div></div>';
			tiles.cWt.html(tmp);
			tiles.cWt.fadeIn(500);
			
			tiles.cWt.contextmenu(function(evn){evn.preventDefault();tiles.showTileMenu(song_id);});
			tiles.cWt.longclick(300,function(){tiles.showTileMenu(song_id);});
		} else {
			tiles.cWt.fadeOut(500);
			tiles.dev("Count on account of " + song_id);
			tiles.cWt = undefined;
			tiles.cWtS = undefined;
			if (tiles.cWtI != song_id) {
				tiles.showTileMenu(song_id);
			}
		}
	},
	tileMenuDo:function(whatDo,folder){
		if (whatDo == "atq") {
			tiles.load("t=b&d=" + btoa(folder),false);
		} else if (whatDo == "fav") {
			tiles.sAlert("Unavailable","sad.svg",550);
		} else {
			alert("Not Implemented");
		}
	},
	backgroundAdd:function(dataArray){
		if (dataArray.data.length == 0) {
			tiles.sAlert("Nothing Added","plus.svg",250);
		} else {
			tiles.dev("Adding " + dataArray.data.length + " item(s) to queue from folder " + dataArray.folder);
			tiles.dev(dataArray);
			
			for(var i = 0;i < (dataArray.count);i++) {
				x = tiles.removeSongNumbers(dataArray.data[i].replace(".m4a", "").replace(".mp3", ""));
				loc = "resources/music/" + dataArray.folder + "/" + dataArray.data[i];
				
				tiles.songQueue.push(loc);
				tiles.songQueue.push(x);
			}
			tiles.sAlert(i + " Added","plus.svg",200);
			//alert("Added all songs from " + capitalise(dataArray.folder.replace(/_/g," ")) + " to queue");
		}
	},
	alterQueue:function(whatDo,songID){
		if (whatDo == "add") {
			if (tiles.m == true) {
				loc = "resources/music" + atob($(songID).attr("song"));
				if (tiles.songQueue[tiles.songQueue.length-2] == loc) {
					tiles.dev("Song not added - Duplicate");
					return false;
				}
			}
			if (tiles.songQueue.length == 1) {
				l = (tiles.songQueue.length-1)/2;
			} else {
				l = (tiles.songQueue.length+1)/2;
			}
			
			loc = $(songID).attr("song");
			songname = tiles.removeSongNumbers(atob(loc).split('/').pop().replace(".m4a", "").replace(".mp3", ""));
			tiles.dev("Song " + songname + " added to queue");
			loc = "resources/music" + atob(loc);
			
			tiles.songQueue.push(loc);
			tiles.songQueue.push(songname);
			tiles.sAlert("Added","plus.svg",250);
		} else if (whatDo == "playnow") {
			if (tiles.songQueue.length == 1) {
				l = (tiles.songQueue.length-1)/2;
			} else {
				l = (tiles.songQueue.length+1)/2;
			}
			
			loc = $(songID).attr("song");
			songname = tiles.removeSongNumbers(atob(loc).split('/').pop().replace(".m4a", "").replace(".mp3", ""));
			tiles.dev("Song " + songname + " playing now");
			loc = "resources/music" + atob(loc);
			
			tiles.songQueue.splice(tiles.currentSong*2, 0, loc);
			tiles.songQueue.splice((tiles.currentSong*2)+1, 0, songname);
			
			tiles.sAlert("Playing","play.svg",250);
		} else if (whatDo == "playnext") {
			if (tiles.songQueue.length == 1) {
				l = ((tiles.songQueue.length-1)/2)+2;
			} else {
				l = ((tiles.songQueue.length+1)/2)+2;
			}
			
			loc = $(songID).attr("song");
			songname = tiles.removeSongNumbers(atob(loc).split('/').pop().replace(".m4a", "").replace(".mp3", ""));
			tiles.dev("Song " + songname + " playing next");
			loc = "resources/music" + atob(loc);
			
			tiles.songQueue.splice(tiles.currentSong*2, 0, loc);
			tiles.songQueue.splice((tiles.currentSong*2)+1, 0, songname);
			
			tiles.sAlert("Playing Next","play.svg",250);
		} else if (whatDo == "delete") {
			var yeah = confirm("Are you sure you wish to delete " + tiles.songQueue[(songID*2)+1] + "?");
			if (yeah == true) {
				tiles.dev(tiles.songQueue);
				spliceAt = songID*2;
				tiles.dev("Altering queue: " + whatDo + " songID " + songID + " songName " + tiles.songQueue[(songID*2)]);
				
				tiles.songQueue.splice(spliceAt,2);
				if (tiles.currentSong > songID) {
					tiles.currentSong -= 1;
				}
				tiles.dev(tiles.songQueue);
				tiles.reloadQueueView();
				tiles.sAlert("Removed","cross.svg",300);
			} else {
				tiles.dev("Deletion cancelled");
				tiles.sAlert("Cancelled","cross.svg",250);
			}
		} else {
			alert("Error: Not implemented");
			tiles.reloadQueueView();
		}
	},
	wipeQueue:function(part){
		if (part == 0) {
			if (typeof(tiles.AudioElement) != "undefined") {
				if (tiles.checkPlayback(tiles.AudioElement)) {
					tiles.changeMediaState();
				}
			}
			tiles.AudioElement = undefined;
			tiles.AudioCtx = undefined;
			
			tiles.songQueue = [];
			localStorage.setItem("M_LSQ","");
			
			tiles.reloadQueueView();
		} else if (part == 1) {
			/*
			if (tiles.songQueue.length == 0 || (tiles.currentSong) == 1) {
				tiles.dev("Nope");
				return false;
			}
			tiles.dev("R: "+(tiles.currentSong*2)+" S: ");
			
			var newQueue = [];
			for (var w = (tiles.songQueue.length-1);w > tiles.currentSong;w--) {
				newQueue.push(tiles.songQueue[w]);
				tiles.currentSong = tiles.currentSong - 0.5;
			}
			tiles.songQueue = newQueue;
			
			tiles.reloadQueueView();
			*/
		} else {
			return false;
		}
	},
	makeAvailableOffline:function(song_id){
		var userConsents = confirm("This feature is in beta and is very buggy at this stage. Do you wish to continue?");
		if (!userConsents) {
			return;
		}
		var data = atob($(song_id).attr("song"));
		var name = tiles.removeSongNumbers(data.split('/').pop().replace(".m4a", "").replace(".mp3", ""));
		var albm = data.split("/")[1];
		var loca = "resources/music" + data;
		tiles.dev("Downloading: " + name + "; Album: " + albm + "; fl: " + loca);
		MusecOffline.autoStore([name,albm,loca]);
	},
	goToSong:function(song_id){
		tiles.currentSong = song_id;
		tiles.nextSong();
		tiles.queueView();
	},
	reloadQueueView:function(){
		$("#queueFolder").animate({opacity:0.25},tiles.queueDelay);
		setTimeout(function(){tiles.queueView();},tiles.queueDelay);
		$("#queueFolder").delay(tiles.queueDelay).animate({opacity:1},tiles.queueDelay);
	},
	queueView:function(){
		tiles.bB.html("<");
		tiles.bB.prop("do","back");
		
		var rQ = $("#queueFolder");
		rQ.html("<table><thead><tr><th>Song</th><th>Action</th></tr></thead><tbody id=\"queue_list\"></tbody></table>");
		
		if (tiles.songQueue.length == 0) {
			tiles.dev("Queue is empty!");
			$("#queue_list").html('<tr><td colspan=\"2\"><h2>Queue is empty</h2></td></tr><tr><td colspan=\"2\"><button class="qcircle" onclick="alert(\'Not Implemented\')">Load a Playlist</button></td></tr>');
		} else {
			tiles.dev("Queue has " + (tiles.songQueue.length) + " values! Which means " + (tiles.songQueue.length/2) + " songs");
			
			var queueActions = '<button class="qcircle" onclick="alert(\'Not Implemented\')">Save Queue</button> ';
			queueActions += '<button class="qcircle" onclick="alert(\'Not Implemented\')">Load Queue</button> ';
			queueActions += '<button class="qcircle" onclick="tiles.wipeQueue(0);">Clear Queue</button> ';
			//queueActions += '<button class="qcircle" onclick="tiles.wipeQueue(1);">Clear History</button>';
			
			$("#queue_list").html("<tr><td colspan=\"2\">" + queueActions + "</td></tr>");
			for(var i = 0;i < ((tiles.songQueue.length-1)/2);i++) {
				tiles.dev("Parsing queue data for song id " + i + " which is " + tiles.songQueue[(i*2)+1]);
				
				// Move up, Play next, Play now, Remove, Move down, Repeat?
				queueCtrls = "<span class='clickable' onclick=\"tiles.alterQueue('delete'," + i + ")\">Remove</span>";
				//queueCtrls += "<span class='clickable' onclick=\"tiles.alterQueue('moveup'," + i + ")\">Move up</span>";
				
				if (tiles.currentSong-1 == i) {
					stat = "queueCurrentSong";
				} else {
					stat = "queueSong";
				}
				
				sB = "<tr class='" + stat + "'><td class='clickable' onclick='tiles.goToSong(" + i + ")'>" + tiles.songQueue[(i*2)+1] + "</td><td>" + queueCtrls + "</td></tr>";
				
				$("#queue_list").append(sB);
			}
		}
	},
	reloadOfflineView:function(){
		$("#offlineFolder").animate({opacity:0.25},tiles.queueDelay);
		setTimeout(function(){tiles.offlineView();},tiles.queueDelay);
		$("#offlineFolder").delay(tiles.queueDelay).animate({opacity:1},tiles.queueDelay);
	},
	offlineView:function(){
		tiles.bB.html("<");
		tiles.bB.prop("do","back");
		
		var oF = $("#offlineFolder");
		oF.html("<table><thead><tr><th>Album</th><th>Song</th><th>Action</th></tr></thead><tbody id=\"offlineSongs\"></tbody></table>");
		
		if (MusecOffline.Store == null || typeof(MusecOffline.Store) == "undefined" || !tiles.supportsFS){
			$("#offlineSongs").html("<tr><td colspan=\"3\">Your browser doesn't support downloading songs for offline use, at this time only Chrome and Opera support it.</td></tr>");
			return false;
		} else {
			if (tiles.fsHasQuota == false) {
				$("#offlineSongs").html("<tr><td colspan=\"3\">You have not allowed offline storage. Please allow this website to write to your hard drive if you wish to use this feature.</td></tr>");
				return;
			}
			$("#offlineSongs").html("<tr><td colspan=\"3\" id=\"dlSongCount\"></td></tr>");
			MusecOffline.Store.usedAndRemaining(function (s_used,s_remain) {
				var s_total = (s_used+s_remain);
				var progressElement = "<progress id=\"uArPbar\" min=\"0\" max=\"" + s_total + "\" value=\"" + s_used + "\"></progress>";
				$("#dlSongCount").append(progressElement);
			});
			var songs = [];
			MusecOffline.Store.getDir("/audio", {create: true}, function(){
				MusecOffline.Store.ls("/audio", function(arr) {
					var length = arr.length;
					
					if (typeof(arr) == "undefined" || length == 0) {
						$("#offlineSongs").html('<tr><td colspan=\"3\"><h2>No Downloaded Music</h2></td></tr>');
					} else {
						var sB = "", cleanName = "";
						
						for(var i = 0;i < length;i++){
							console.log("Found: ",arr[i].name);
							
							tiles.isPlayingOfflineSong = true;
							cleanAlbum = capitalise(arr[i].name.split(".")[0].replace(/_/g," "))
							cleanName = arr[i].name.split(".").slice(1, -1);
							sB += "<tr><td class='clickable' onclick='tiles.playOfflineSong(\"" + btoa(arr[i].name) + "\")'>" + cleanAlbum + "</td>";
							sB += "<td class='clickable' onclick='tiles.playOfflineSong(\"" + btoa(arr[i].name) + "\")'>" + cleanName + "</td>";
							sB += "<td><span class='clickable' onclick='tiles.deleteOfflineSong(\"" + arr[i].name + "\")'>Delete</span></td></tr>";
						}
						$("#dlSongCount").prepend("<h2>Downloaded: " + i + "</h2>");
						$("#offlineSongs").append(sB);
					}
				});
			});
		}
	},
	playOfflineSong:function(osn){
		console.log(osn);
		MusecOffline.Store.getFile("audio/" + atob(osn), {create: false}, function(fileEntry){
			var url = fileEntry.toURL();
			var name = atob(osn).split(".").slice(1, -1);
			var alb = atob(osn).split(".")[0];
			
			tiles.dev("Playing: " + url);
		
			tiles.nextSong({"l":url,"n":name,"a":alb});
		});
	},
	deleteOfflineSong:function(osn){
		console.log(osn);
		MusecOffline.Store.deleteFile("audio/" + osn);
		MusecOffline.editIndex(osn);
		tiles.reloadOfflineView();
	},
	showLyrics:function(song_id){
		var innerID = song_id.replace("song","song_name");
		songName = $(innerID).html();
		
		tiles.dev("Getting lyrics for " + songName);
		
		openWindow = "http://www.lyricsfreak.com/search.php?a=search&type=song&q=" + songName;
	
		window.open(openWindow,"_blank");
	},
	showError:function(edata,errorFrom,sendData){
		if (errorFrom == 1) {
			if (edata.status == 0) {
				// Will handle connection errors
				var cSec = tiles.connDelays[tiles.connAttempt];
				tiles.connAttempt++;
				if (cSec == "reload") {
					location.reload();
				} else {
					tiles.activeView.html("<h1>Connection Error (" + tiles.connAttempt + ")</h1><h2>Will retry in " + cSec + " seconds</h2>");
					var reconInt = setInterval(function(){
						if ((cSec-1) == 0) {
							tiles.activeView.html("<h1>Connection Error (" + tiles.connAttempt + ")</h1><h2>Attempting Connection...</h2>");
							tiles.load(sendData,true);
							clearInterval(reconInt);
						} else {
							if ((cSec-1) == 1) {
								tiles.activeView.html("<h1>Connection Error (" + tiles.connAttempt + ")</h1><h2>Will retry in 1 second</h2>");
							} else {
								tiles.activeView.html("<h1>Connection Error (" + tiles.connAttempt + ")</h1><h2>Will retry in " + (cSec-1) + " seconds<br /></h2>");
							}
							cSec--;
						}
					},1000);
				}
			} else {
				alert("Backend error - " + edata.status);
				
				console.warn("Error!");
				console.warn(edata);
				console.warn("(" + edata.status + ") " + edata.statusText);
			}
		} else {
			alert(edata.error);
			console.warn("Error!");
			console.warn(edata);
		}
	},
	preemptSearch:function(){
		tiles.isTypingMsg = true;
		if (tiles.lastSearchVal != tiles.searchBox.val()) { // Ignore keys such as CTRL etc
			tiles.searchDo.html("Typing");
			if (tiles.searchTypeEndInterval) {
				clearTimeout(tiles.searchTypeEndInterval);
			}
			tiles.searchTypeEndInterval = setTimeout(function(){
				if (tiles.searchBox.val() == "" || tiles.searchBox.val().length < 2) {
					tiles.searchDo.html("Search");
					tiles.dev("Preempt->Search->No " + tiles.searchBox.val());
				} else {
					tiles.dev("Preempt->Search->Yes " + tiles.searchBox.val());
					// Search pre-empt
					tiles.searchDo.html("Search");
					tiles.lastSearchVal = tiles.searchBox.val();
				}
			},500);
		}
		if ($("#songFolder").is(":visible")) {
			tiles.dev("Searching songfolder");
			$(".__song_AllowSearch").fadeOut(50);
			var term = tiles.searchBox.val();
			$(".__song_AllowSearch").each(function() {
				if($(this).text().toUpperCase().indexOf(term.toUpperCase()) != -1){
					$(this).fadeIn(50);
				} else {
					tiles.dev("No results for search term: " + tiles.searchBox.val());
				}
			});
		} else {
			tiles.dev("Regular preempt");
		}
	},
	doSearch:function(){
		if (tiles.searchBox.val() == "" || tiles.searchBox.val().length < 2) {
			tiles.sAlert("Invalid","exclamation.svg",400);
		} else {
			var searchPattern = /([0-9A-Za-z .])/;
			if (searchPattern.test(tiles.searchBox.val())) {
				tiles.lastMenuSong = undefined;
				tiles.lastSongMenu = undefined;
				
				tiles.activeView.fadeOut(500);
				tiles.load("t=l&s=" + btoa(tiles.searchBox.val()),true);
				tiles.activeView.fadeIn(500);
			} else {
				alert("Illegal characters!");
			}
		}
	},
	handleCacheErrors:function(verData){
		if (verData.total == tiles.cacheVersion) {
			tiles.dev("No caching validation errors");
		} else if (verData.total > tiles.cacheVersion) {
			window.location.reload(true); // Clears cache
		} else {
			tiles.dev("Nice try");
		}
	},
	saveCurrentQueue:function(){
		if (tiles.songQueue.length > 0) {
			localStorage.setItem("M_LSQ",JSON.stringify(tiles.songQueue));
		}
	},
	loadLastQueue:function(){
		if (localStorage.getItem("M_LSQ") != null) {
			var q = JSON.parse(localStorage.getItem("M_LSQ"));
			var c = confirm("Do you want to load the last queue containing " + q.length/2 + " songs");
			
			localStorage.removeItem("M_LSQ");
			if (c == true) {
				tiles.songQueue = q;
				// Then remove queue from localStorage
			} else {
				return false;
			}
		}
		return true;
	},
	fix:function(){
		tiles.togglePanel();
		tiles.sAlert("Clearing","broom.svg",500);
		tiles.db = true;
		tiles.dev("Musec->Forced Reset");
		
		tiles.activeView.fadeOut(500);
		
		$("#musicFolders").html("<h1>Loading Content...</h1>");
		$("#songFolder").html("Loading Songs...");
		$("#queueFolder").html("");
		
		$("#pageCenter").css("background-color","rgba(0,0,0,1)");
		setTimeout(function(){
			if (typeof(tiles.AudioElement) != "undefined") {
				tiles.AudioElement.pause();
			}
			tiles.AudioElement = undefined;
			tiles.currentSong = 0;
			tiles.songQueue = [];
			tiles.activeView = $("#musicFolders");
			
			tiles.load("t=f&d=" + btoa("/"),true);
			tiles.load("t=v",true);
			
			tiles.folder.html("Music");
			tiles.bB.prop("do","refresh");
			tiles.qB.prop("do","showQ");
			tiles.dB.prop("do","showF");
			$("#pageCenter").css("background-color","rgba(0,0,0,0.8)");
			tiles.activeView.fadeIn(500);
		},1000);
	},
	togglePanel:function(){
		if ($("#optionsPanel").is(":visible")) {
			$("#optionsPanel").fadeOut(500);
			$("#pageTop").delay(500).fadeIn(500);
			$("#pageCenter").delay(500).fadeIn(500);
			$("#pageBottom").delay(500).fadeIn(500);
			setTimeout(function(){$("body").css({backgroundColor:"#fff"});},1000);
		} else {
			$("body").css({backgroundColor:"rgba(0,0,0,0.8)"});
			$("#pageTop").fadeOut(500);
			$("#pageCenter").fadeOut(500);
			$("#pageBottom").fadeOut(500);
			$("#optionsPanel").delay(500).fadeIn(400);
		}
	},
	widthCheck:function(){
		if ($(document).width() <= 440) {eW = "100%";} else if ($(document).width() < 770 && $(document).width() > 440) {eW = "64%";} else {eW = "80%";}
		return eW;
	},
	keyBoardEvents:function(k){
		if (tiles.allowKeyBoardEvents == true && tiles.m != true && tiles.isTypingMsg == false) {
			tiles.dev("KeyPress! - " + k.keyCode);
			switch(k.keyCode) {
				case 8: // Backspace
					k.preventDefault();
					tiles.bB.click();
					break;
				case 32: // Space bar
					tiles.changeMediaState();
					break;
				case 81: // Letter Q
					vConf.fft_size = 256;
					break;
				case 87: // Letter W
					vConf.fft_size = 512;
					break;
				case 69: // Letter E
					vConf.fft_size = 1024;
					break;
				case 82: // Letter R
					vConf.fft_size = 2048;
					break;
				default:
					break;
			}
		}
	},
	idleTimer:function(){
		if (tiles.idleTimeout == false){
			$("#mvContainer").css({opacity:1});
			return;
		}
		
		tiles.idleTime = tiles.idleTime + 1;
		if (tiles.idleTime > 0) {
			if (typeof(tiles.AudioElement) != "undefined") {
				if (tiles.checkPlayback(tiles.AudioElement) == true && tiles.visuSupport == true) {
					$("#mvContainer").css({opacity:1});
				}
			}
			$(document).mousemove(function(e){
				$("#mvContainer").css({opacity:0.5});
			});
			$(document).keypress(function(e){
				$("#mvContainer").css({opacity:0.5});
			});
		}
	}
};
var MusecOffline = {
	Store:null,
	DB:[],
	com:"",
	conf:{
		fsSize:100*(1048576) // 100 MB
	},
	listAll:function(){
		var data = [];
		
		
		console.log(data);
		return data;
	},
	makeOffline:function(url,nm){
		console.log("Retrieving data from " + url);
		MusecOffline.Store.getData(url, function(data){
			console.log("Bytes Received from " + url + ": " + data.byteLength);
			MusecOffline.Store.getDir("audio",{create: true}, function(){
				MusecOffline.Store.write("audio/" + nm,"audio/mp3",data,{create: true});
			});
		});
	},
	makeFilesystem:function(){
		try {
			MusecOffline.Store = new window.ChromeStore();
			MusecOffline.Store.init(MusecOffline.conf.fsSize, function(cstore){
				console.log("Chromestore initialized");
				//if (typeof(grantedBytes) == "undefined" || grantedBytes == 0) {
				//	tiles.fsHasQuota = false;
				//}
			});
			return true;
		} catch(e) {
			try {
				window.requestFileSystem(PERSISTENT, MusecOffline.conf.fsSize, function(myFs) {
					fs = myFs;
					cwd = fs.root;
					console.log('<p>Opened <em>' + fs.name, + '</em></p>');
				}, function(e) {
					console.log(e);
				});
			} catch(e) {
				tiles.dev("Filesystem API not supported");
				//alert("Your device browser doesn't support this");
				return false;
			}
		}
	},
	autoStore:function(file){
		MusecOffline.createIndex();
		var fsSupport = MusecOffline.makeFilesystem();
		if (!fsSupport) return false;
		
		
		var fsL = file[1] + "." + file[0] + "." + file[2].split(".").pop();
		var indexItem = {
			name:file[0],
			album:file[1],
			loc:file[2],
			fsloc:fsL
		};
		tiles.dev("[MusecOffline]: Will now download and store file...");
		
		var inIndex = MusecOffline.indexSong(indexItem);
		if (inIndex) return false;
		
		MusecOffline.makeOffline(indexItem.loc,indexItem.fsloc);
	},
	updateDB:function(){
		var newDB = JSON.stringify(MusecOffline.DB);
		localStorage.setItem("OfflineDB",newDB);
	},
	createIndex:function(){
		if (typeof(Storage) !== "undefined") {
			if (localStorage.getItem("OfflineDB") != null) {
				tiles.dev("Offline Database found!");
				MusecOffline.DB = JSON.parse(localStorage.getItem("OfflineDB"));
			} else {
				MusecOffline.DB = [];
				MusecOffline.updateDB();
			}
		} else {
			return false;
		}
	},
	indexSong:function(item){
		for (var i = 0;i < MusecOffline.DB.length;++i) {
			if (MusecOffline.DB[i].fsloc == item.fsloc) {
				alert("Song has already been downloaded");
				return true;
			}
		}
		MusecOffline.DB.push(item);
		MusecOffline.updateDB();
		return false;
	},
	editIndex:function(item){
		MusecOffline.createIndex();
		var removeIndex = "";
		for (var i = 0;i < MusecOffline.DB.length;++i) {
			if (MusecOffline.DB[i].fsloc == item){
				removeIndex = i;
				break;
			}
		}
		MusecOffline.DB.splice(removeIndex,1);
		console.log(item);
		console.log(MusecOffline.DB);
		MusecOffline.updateDB();
	}
};
$(document).ready(function(){
	tiles.load("t=v",true);
	tiles.load("t=f&d=" + btoa("/"),true);
	tiles.mediaStateTrigger = document.getElementById("playpause");
	tiles.qB = $("#queue");
	tiles.dB = $("#down");
	tiles.bB = $("#back");
	tiles.sB = $("#search");
	tiles.searchBox = $("#search_box");
	tiles.searchDo = $("#do_search");
	
	tiles.folder = $("#folder");
	tiles.folder.html("Music");
	document.title = "Musec!";
	
	$(function() {
		FastClick.attach(document.body);
		tiles.dev("FastClick Attached to document.body");
	});
	PointerEventsPolyfill.initialize({});
	
	settings.loadSettings();
	settings.enableSettings();
	
	tiles.folder.longclick(1000,function(){tiles.togglePanel();});
	tiles.folder.contextmenu(function(evn){evn.preventDefault();tiles.togglePanel();});
	
	tiles.mediaStateTrigger.addEventListener("click",tiles.changeMediaState,false);
	tiles.searchBox.keyup(function(){tiles.preemptSearch();});
	tiles.searchBox.keypress(function(k){if(k.which == 13){tiles.doSearch();}}); // Enter to do search
	tiles.searchDo.click(function(){tiles.doSearch();});
	
	tiles.bB.prop("do","refresh");
	tiles.qB.prop("do","showQ");
	tiles.dB.prop("do","showF");
	tiles.activeView = $("#musicFolders");

	// Mobile Browser Detection
	if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
		|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) tiles.m = true;
	
	if (tiles.m === true) {
		tiles.sAlert("Beta","../Musec!3.jpg",500);
	}
	window.addEventListener("keydown",tiles.keyBoardEvents);
	$(window).resize(function(){
		eW = tiles.widthCheck();
		if (tiles.folder.is(":visible")) {
			tiles.folder.css({width:eW});
		} else {
			$("#search_container").css({width:eW});
		}
		vConf.w = (window.innerWidth*2);
		vConf.h = (window.innerHeight*2);
		tiles.dev("Window Resize - " + $(window).width() + "x" + $(window).height());
	});
	$("#mvContainer").click(function(e){
		e.preventDefault();
	});
	tiles.bB.click(function(){
		tiles.dev("Action Button: " + tiles.bB.prop("do"));
		if (tiles.bB.prop("do") == "refresh") {
			tiles.load("t=f&d=" + btoa("/"),true);
			tiles.sAlert("Refreshed","refresh.svg",400);
			$("#queueFolder").hide();
			$("#offlineFolder").hide();
		} else {
			tiles.cfn = undefined;
			tiles.qB.prop("do","showQ");
			tiles.bB.prop("do","refresh");
			tiles.activeView = $("#musicFolders");
			$(".tile_bg").removeClass("blur");
			tiles.bB.html("&#x21bb;");
			$("#musicFolders").show();
			$("#songFolder").hide();
			$("#queueFolder").hide();
			$("#offlineFolder").hide();
		}
		if (typeof(tiles.lastSongMenu) != "undefined") {
			tiles.dev("Updating lastSongMenu value");
			tiles.lastSongMenu = undefined;
			tiles.lastMenuSong = undefined;
		}
		if (typeof(tiles.currentMediaState) == "undefined") {
			tiles.folder.html("Music");
		} else {
			tiles.folder.html("Music | " + tiles.songName);
			if (tiles.m === true) {
				tiles.folder.css({"font-size":"1.1em"});
				dE = document.getElementById("folder");
				if (dE.offsetHeight < dE.scrollHeight || dE.offsetWidth < dE.scrollWidth) {
					tiles.folder.css({"font-size":"1em"});
					tiles.dev("Bb: Overflow!");
				}
			}
		}
		document.title = "Musec!";
	});
	tiles.sB.click(function(){
		var sc = $("#search_container"), eW;
		if (tiles.folder.is(":visible")) {
			eW = tiles.widthCheck();
			tiles.dev("Action Button: Search show " + eW);
			
			tiles.folder.animate({width:"0vw",opacity:0.2},500,function(){tiles.folder.hide();});
			sc.animate({width:eW,opacity:1},500,function(){sc.fadeIn(300,function(){tiles.searchBox.focus();tiles.searchBox.click();});});
		} else {
			eW = tiles.widthCheck();
			tiles.dev("Action Button: Search hide " + eW);
			
			tiles.folder.fadeIn(300,function(){tiles.folder.animate({width:eW,opacity:1},500);});
			sc.fadeOut(300,function(){sc.animate({width:"0",opacity:0.2},500);});
		}
	});
	tiles.qB.click(function(){
		tiles.dev("Action Button: " + tiles.qB.prop("do"));
		if (tiles.qB.prop("do") == "showQ") {
			tiles.qB.attr("do","hideQ");
			$(".tile_content").hide();
			$(".tile_bg").removeClass("blur");
			tiles.cWt = undefined;
			tiles.cWtS = undefined;

			$("#offlineFolder").slideUp(500);
			tiles.activeView.slideUp(500);
			$("#queueFolder").delay(500).slideDown(500);
			tiles.queueView();
		} else {
			tiles.qB.attr("do","showQ");
			tiles.qB.html("&#9776;");
			$("#queueFolder").slideUp(500);
			tiles.activeView.delay(500).slideDown(500);
		}
		if (typeof(tiles.currentMediaState) == "undefined") {
			tiles.folder.html("Music");
		} else {
			tiles.folder.html("Music | " + tiles.songName);
		}
		document.title = "Musec!";
	});
	tiles.dB.click(function(){
		if (tiles.dB.prop("do") == "showF") {
			tiles.dB.attr("do","hideF");
			$(".tile_content").hide();
			$(".tile_bg").removeClass("blur");
			tiles.cWt = undefined;
			tiles.cWtS = undefined;

			$("#queueFolder").slideUp(500);
			tiles.activeView.slideUp(500);
			$("#offlineFolder").delay(500).slideDown(500);
			tiles.offlineView();
		} else {
			tiles.dB.attr("do","showF");
			tiles.dB.html("&#9660;");
			$("#offlineFolder").slideUp(500);
			tiles.activeView.delay(500).slideDown(500);
		}
		if (typeof(tiles.currentMediaState) == "undefined") {
			tiles.folder.html("Music");
		} else {
			tiles.folder.html("Music | " + tiles.songName);
		}
		document.title = "Musec!";
	});
	$("#pageCenter").click(function(){tiles.isTypingMsg = false;});
	$("#pageBottom").click(function(){tiles.isTypingMsg = false;});
	if (typeof(Storage) !== "undefined") {
		window.onbeforeunload = tiles.saveCurrentQueue;
	} else {
		tiles.dev("No Storage Support");
	}
	
	if (!("Notification" in window)){
		tiles.dev("No Notification support");
	} else if (Notification.permission !== 'denied') {
		Notification.requestPermission(function (permission) {
			if (permission === "granted") {
				tiles.dev("Notification permission granted");
			}
		});
	}
	tiles.loadLastQueue(); // Check if songQueue was previously saved
	
	MusecOffline.makeFilesystem();
	
	tiles.idleTimerInt = setInterval(tiles.idleTimer,1000);
	$(document).mousemove(function(e){
		tiles.idleTime = 0;
	});
	$(document).keypress(function(e){
		tiles.idleTime = 0;
	});
});

// Preload resources
var i = 0;
var assets = ["broom.svg","cross.svg","exclamation.svg","play.svg","plus.svg","refresh.svg","sad.svg","stop.svg"];
for (i = 0;i<assets.length;i++) {
	hint = document.createElement("link");
	hint.setAttribute("rel","prefetch");
	hint.setAttribute("href","assets/img/i/" + assets[i]);
	document.getElementsByTagName("head")[0].appendChild(hint);
}

var settings = {
	AppPrefs: {},
	resetSettings: function(){
		settings.AppPrefs = {
			_ST_MV:"Enabled",
			_ST_CR:"hsl",
			_ST_DV:"Enabled",
			_ST_AM:"Disabled",
			_ST_TO:"Disabled",
			_ST_KE:"Enabled",
		};
		settings.saveSettings();
		settings.setValues();
	},
	saveSettings: function(){
		var newSettings = JSON.stringify(settings.AppPrefs);
		localStorage.setItem("AppPreferences",newSettings);
	},
	loadSettings: function(){
		if (typeof(Storage) !== "undefined") {
			if (localStorage.getItem("AppPreferences") != null) {
				tiles.dev("Settings found!");
				settings.AppPrefs = JSON.parse(localStorage.getItem("AppPreferences"));
			} else {
				// If no settings found, make defaults
				settings.AppPrefs = {
					_ST_MV:"Enabled",
					_ST_CR:"hsl",
					_ST_DV:"Enabled",
					_ST_AM:"Disabled",
					_ST_TO:"Disabled",
					_ST_KE:"Enabled"
				};
				settings.saveSettings();
			}
		} else {
			$("#appPrefs").html("<h2>Requires localstorage to work</h2>");
			return false;
		}
	},
	enableSettings: function(){
		tiles.dev("Settings Enabled");
		settings.setValues();
		settings.allowChange();
	},
	toggleButton: function(g,s){
		if (s == true) {
			g.addClass("stEnabled");
			g.removeClass("stDisabled");
			g.html("Enabled");
		} else {
			g.addClass("stDisabled");
			g.removeClass("stEnabled");
			g.html("Disabled");
		}
	},
	setValues: function(){
		var $mv = $("#_ST_MV");
		var $dv = $("#_ST_DV");
		var $am = $("#_ST_AM");
		var $to = $("#_ST_TO");
		var $ke = $("#_ST_KE");
		// Music Visualiser
		if (settings.AppPrefs._ST_MV == "Enabled") {
			tiles.visuSupport = true;
			settings.toggleButton($mv,true);
		} else {
			tiles.visuSupport = false;
			settings.toggleButton($mv,false);
		}
		// Visualiser Style
		vConf.style = settings.AppPrefs._ST_CR;
		// Dev mode
		if (settings.AppPrefs._ST_DV == "Enabled") {
			tiles.db = true;
			settings.toggleButton($dv,true);
		} else {
			tiles.db = false;
			settings.toggleButton($dv,false);
		}
		// Artist mode
		if (settings.AppPrefs._ST_AM == "Enabled") {
			tiles.uMix = true;
			settings.toggleButton($am,true);
		} else {
			tiles.uMix = false;
			settings.toggleButton($am,false);
		}
		// Timeouts
		if (settings.AppPrefs._ST_TO == "Enabled") {
			tiles.idleTimeout = true;
			settings.toggleButton($to,true);
		} else {
			tiles.idleTimeout = false;
			settings.toggleButton($to,false);
		}
		// Keyboard Events
		if (settings.AppPrefs._ST_KE == "Enabled") {
			tiles.allowKeyBoardEvents = true;
			settings.toggleButton($ke,true);
		} else {
			tiles.allowKeyBoardEvents = false;
			settings.toggleButton($ke,false);
		}
	},
	allowChange: function(){
		$("button#_ST_MV").click(function(){
			if ($(this).html() == "Enabled") {
				settings.updateSetting("_ST_MV","Disabled",true);
			} else {
				settings.updateSetting("_ST_MV","Enabled",true);
			}
		});
		$("select#_ST_CR").change(function(){
			$("select#_ST_CR option:selected").each(function(){
				var newOption = $(this).attr("value");
				settings.updateSetting("_ST_CR",newOption,false);
			});
		});
		$("button#_ST_DV").click(function(){
			if ($(this).html() == "Enabled") {
				settings.updateSetting("_ST_DV","Disabled",false);
			} else {
				settings.updateSetting("_ST_DV","Enabled",false);
			}
		});
		$("button#_ST_AM").click(function(){
			if ($(this).html() == "Enabled") {
				settings.updateSetting("_ST_AM","Disabled",false);
			} else {
				settings.updateSetting("_ST_AM","Enabled",false);
			}
		});
		$("button#_ST_TO").click(function(){
			if ($(this).html() == "Enabled") {
				settings.updateSetting("_ST_TO","Disabled",true);
			} else {
				settings.updateSetting("_ST_TO","Enabled",false);
			}
		});
		$("button#_ST_KE").click(function(){
			if ($(this).html() == "Enabled") {
				settings.updateSetting("_ST_KE","Disabled",false);
			} else {
				settings.updateSetting("_ST_KE","Enabled",false);
			}
		});
	},
	updateSetting: function(setting,value,reboot){
		settings.AppPrefs[setting] = value;
		settings.saveSettings();
		settings.setValues();
		settings.requiresRestart(reboot);
		tiles.dev("Saved setting " + setting + " as " + value);
	},
	requiresRestart: function(does){
		if (does) {
			$("#rebootMusec").show();
			$("#rebootMusec").click(function(){
				location.reload();
			});
		}
	},
	whatsThis: function(id){
		switch(id){
			case 1:
				alert("Music Visualiser:\nToggle on or off the music visualiser, requires reload.");
				break;
			case 2:
				alert("Visualiser Style:\nChange how the music visualiser looks.");
				break;
			case 3:
				alert("Developer Mode:\nToggle on/off console messages.");
				break;
			case 4:
				alert("Artist Mode:\nNot added yet...");
				break;
			case 5:
				alert("Timeouts:\nFade music visualiser when using Musec, requires reload to disable.");
				break;
			case 6:
				alert("Keyboard Events:\nAllow keyboard short cuts.");
				break;
			default:
				alert("Unknown");
				break;
		}
	}
};