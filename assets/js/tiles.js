var tiles = {
	songQueue: [],
	load: function(sendData) {
		console.log(sendData);
		$.ajax({
			url:"backend.php",
			type:"POST",
			data:sendData,
			success:function(r){
				$(".tile").removeClass("blur");
				
				var decoded = JSON.parse(r);
				if (decoded.response == "lsdir"){
					tiles.showFolder(decoded);
				} else if (decoded.response == "lsfiles") {
					tiles.showSongs(decoded);
				} else {
					tiles.showError(decoded);
				}
			},
			error:function(e){
				$(".tile").addClass("blur");
				tiles.showError(e);
				return false;
			}
		});
	},
	loadSongs: function(folder) {
		$("#id_" + folder).addClass("blur");
		tiles.load("t=s&d=" + btoa("/" + folder));
	},
	showFolder: function(folderData) {
		$("#musicFolders").html("");
		for (i=0;i<folderData.data.length;i++) {
			var x = folderData.data[i];
			var temp = '<div class="tile" onclick="tiles.loadSongs(\'' + x + '\')" id="id_' + x + '"> </div>';
			$("#musicFolders").append(temp);
			document.getElementById("id_" + x).style.background = 'url("resources/artwork/' + x + '.jpg")';
			document.getElementById("id_" + x).style.backgroundSize = '100%';
			tiles.songData = x;
		}
	},
	showSongs: function(folderData) {
		document.getElementById("musicFolders").style.display = "none";
		document.getElementById("songFolder").style.display = "block";
		$("#back").html("<");
		$("#back").prop("do","back");
		$("#songFolder").html("<table><thead><tr><th>Song</th></tr></thead><tbody id=\"song_list\"></tbody></table>");
		for (i=0;i<folderData.data.length;i++) {
			var file = folderData.data[i].split('/').pop();
			var x = tiles.removeSongNumbers(file.replace(".m4a", "").replace(".mp3", ""));
			var temp = '<tr song="' + btoa(folderData.data[i]) + '" id="song_' + i + '" class="song_longclick"><td id="song_inner_' + i + '"><span id="song_name_' + i + '">' + x + '</span></td></tr>';
			$("#song_list").append(temp);
		}
		$(".song_longclick").each(function(x){
			$("#song_" + x).longclick(500,function(){
				tiles.showSongMenu("#song_" + x);
			});
			$("#song_name_" + x).click(function(){
				tiles.playSong("#song_" + x);
			});
		});
	},
	removeSongNumbers: function(songName) {
		var s1 = songName.substring(0,1);
		var s2 = songName.substring(1,2);
		var s3 = songName.substring(2,3);
		
		if (isNumeric(s1) && isNumeric(s2) && !isNumeric(s3)) {
			newSongName = songName.substring(2);
			console.log("Song " + songName + " has a song int, cleaned to: " + newSongName);
		} else {
			console.log(s1 + " & " + s2 + " of string " + songName);
			newSongName = songName;
		}
		
		return newSongName;
	},
	playSong: function(song_id) {
		loc = $(song_id).attr("song");
		
		console.log("playSong called with loc: " + loc);
		tiles.songname = tiles.removeSongNumbers(atob(loc).split('/').pop().replace(".m4a", "").replace(".mp3", ""));
		console.log("Song Name: " + tiles.songname);
		loc = "resources/music" + atob(loc);
		
		if (typeof(tiles.AudioElement) != "undefined") {
			$("#folder").html("Unsetting");
			tiles.AudioElement.pause();
			tiles.AudioElement = null;
		}
		
		tiles.AudioElement = new Audio();
		console.log("Audio Element Created: 'resources/music" + loc + "'");
		
		tiles.AudioElement.addEventListener('loadeddata',function(){
			tiles.AudioElement.play();
			setTimeout("tiles.AudioElement.pause()", 10);
			setTimeout("tiles.AudioElement.play()", 20);
			document.title = "► " + tiles.songname;
			tiles.mediaStateTrigger.innerHTML = "||";
			
			$("#mediacontrols").html('<input id="playbackslider" type="range" min="0" max="100" value="0" step="1"> <span id="mediaCtime">00:00</span>/<span id="mediaTtime">00:00</span>');
			tiles.PlayBackSlider = document.getElementById("playbackslider");
			tiles.MediaCurrentTime = document.getElementById("mediaCtime");
			tiles.MediaTotalTime = document.getElementById("mediaTtime");
			
			tiles.PlayBackSlider.addEventListener("change",tiles.songSeek,false);
			
			tiles.AudioElement.addEventListener("timeupdate",tiles.updateMediaInfo,false);
			
			tiles.currentMediaState = true;
		},false);
		tiles.AudioElement.addEventListener('error',function(){
			alert('Error Loading Data');
			document.getElementById("folder").innerHTML = "Error";
		},false);
		tiles.AudioElement.addEventListener("progress",tiles.songLoadProgress,false);
		document.getElementById("playpause").addEventListener("click",tiles.changeMediaState,false);
		
		tiles.AudioElement.src = loc;
	},
	updateMediaInfo:function() {
		if (typeof(tiles.AudioElement.duration) == "undefined") {
			tiles.MediaCurrentTime.innerHTML = "00:00";
			tiles.MediaTotalTime.innerHTML = "00:00";
		} else {
			var nt = tiles.AudioElement.currentTime * (100 / tiles.AudioElement.duration);
			
			tiles.PlayBackSlider.value = nt;
			
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
			
			tiles.songLoadProgress(tiles.AudioElement);
		}
	},
	songEnd:function(){
		
	},
	songSeek:function(){
		var seekto = tiles.AudioElement.duration * (tiles.PlayBackSlider.value / 100);
		tiles.AudioElement.currentTime = seekto;
	},
	changeMediaState:function(){
		console.log("Changing state..");
		if (typeof(tiles.currentMediaState) == "undefined") {
			tiles.currentMediaState = false;
			tiles.AudioElement.pause();
			tiles.mediaStateTrigger.innerHTML = "<";
			document.title = "Paused - " + tiles.songname;
		} else if (tiles.currentMediaState == false) {
			tiles.currentMediaState = true;
			tiles.AudioElement.play();
			tiles.mediaStateTrigger.innerHTML = "||";
			document.title = "► " + tiles.songname;
		} else {
			tiles.currentMediaState = false;
			tiles.AudioElement.pause();
			tiles.mediaStateTrigger.innerHTML = "<";
			document.title = "Paused - " + tiles.songname;
		}
	},
	songLoadProgress: function(event){
		if (typeof(event.loaded) == "undefined" || typeof(event.total) == "undefined") {
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
			
			console.log("Progress-> " + tiles.songRawBuffer + " - " + tiles.songRawDuration + " - " + tiles.songRawTime + "; Loaded: " + percentLoaded + "% Played: " + percentPlayed + "%");
			if (percentPlayed == percentLoaded) {
				document.getElementById("folder").innerHTML = "Song Buffering...";
			} else {
				document.getElementById("folder").innerHTML = tiles.songname;
			}
			document.getElementById("folder").style.background = "linear-gradient(to left, green, yellow " + percentLoaded + "%, red 0%, orange)";
		} else {
			var percent = (event.loaded / event.total) * 100;
			//console.log(event);
			//console.log(event.loaded);
			//console.log(event.total);
			document.getElementById("folder").innerHTML = Math.round(percent) + "% loaded";
			document.getElementById("folder").style.background = "linear-gradient(to left, green, yellow " + Math.round(percent) + "%, red 20%, orange)";
		}
	},
	showSongMenu: function(song_id){
		var innerID = song_id.replace("song","song_inner");
		console.log("Showing song menu for " + song_id);
		
		currentContent = $(innerID).html().substring(-5);
		newContent = currentContent;
		newContent += "<br /><button class='bcircle' onclick='tiles.alterQueue(\"playnext\",\"" + song_id + "\")'>Play Next</button>";
		newContent += " <button class='bcircle' onclick='tiles.alterQueue(\"addQueue\",\"" + song_id + "\")'>Add to queue</button>";
		newContent += " <button class='bcircle' onclick='tiles.showLyrics(\"" + song_id + "\")'>Lyrics</button></td>";
		newContent += " <button class='bcircle' onclick='tiles.playSong(\"" + song_id + "\")'>Play Now</button></td>";
		
		$(innerID).html(newContent);
	},
	alterQueue: function(whatDo, songID) {
		
	},
	showLyrics: function(song_id){
		var innerID = song_id.replace("song","song_name");
		songName = $(innerID).html();
		
		console.log("Getting lyrics for " + songName);
		
		openWindow = "http://www.lyricsfreak.com/search.php?a=search&type=song&q=" + songName;
	
		window.open(openWindow,"_blank");
	},
	showError: function(folderData) {
		alert("Backend error - " + folderData.status);
		
		console.warn("Error!");
		console.warn(folderData);
		console.warn("(" + folderData.status + ") " + folderData.statusText);
	}
};
$(document).ready(function(){
	tiles.load("t=f&d=" + btoa("/"));
	tiles.mediaStateTrigger = document.getElementById("playpause");
	$("#folder").html("Music");
	document.title = "Musec!";
	$(function() {
		FastClick.attach(document.body);
		console.log("FastClick Attached to document.body");
	});
	$("#back").prop("do","refresh");
});
$("#back").click(function(){
	console.log("Action Button: " + $("#back").prop("do"));
	if ($("#back").prop("do") == "refresh") {
		tiles.load("t=f&d=" + btoa("/"));
	} else {
		$("#back").prop("do","refresh");
		$("#back").html("+");
		document.getElementById("musicFolders").style.display = "block";
		document.getElementById("songFolder").style.display = "none";
	}
	if (typeof(tiles.currentMediaState) == "undefined") {
		$("#folder").html("Music");
	} else {
		setInterval(function(){
			$("#folder").html("Music | " + tiles.songname);
		},2000);
	}
	document.title = "Musec!";
});