/*
 * 	Musec v2-Build 1
 * 	
 * 	By Jake Mcneill (https://absolutedouble.co.uk)
 *	
 *	Licenced Under: GNU AFFERO GENERAL PUBLIC LICENSE
 */


// Cross Browser Support for requestAnimationFrame
window.reqFrame = (function(){
	return window.requestAnimationFrame || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame || 
		window.oRequestAnimationFrame || 
		window.msRequestAnimationFrame || 
		function(callback){
			window.setTimeout(callback, 10 / 60);
		};
})();

// Code for the Music Visualiser
function MusicVisualizer() {
	console.log(Musec.MediaGlobals);
	this.analyser = Musec.MusecGlobals.AudioContext.createAnalyser();

	this.analyser.connect(Musec.MusecGlobals.AudioContext.destination);
	this.analyser.minDecibels = Musec.Variables.VisualiserConfig.MinimumDecibels;
	this.analyser.maxDecibels = Musec.Variables.VisualiserConfig.MaximumDecibels;
	this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
	this.times = new Uint8Array(this.analyser.frequencyBinCount);

	this.isPlaying = false;
	this.startTime = 0;
	this.startOffset = 0;
};
MusicVisualizer.prototype.togglePlayback = function() {
	if (this.isPlaying) {
		this.source[this.source.stop ? 'stop': 'noteOff'](0);
		this.startOffset += Musec.MusecGlobals.AudioContext.currentTime - this.startTime;
		console.log('(MusicVisualizer): Paused at', this.startOffset);
	} else {
		this.startTime = Musec.MusecGlobals.AudioContext.currentTime;
		console.log('Started at ', this.startOffset);
		if (!(Musec.MusecGlobals.AudioElement instanceof AudioNode)) {
			this.source = (Musec.MusecGlobals.AudioElement instanceof Audio || Musec.MusecGlobals.AudioElement instanceof HTMLAudioElement)
			? Musec.MusecGlobals.AudioContext.createMediaElementSource(Musec.MusecGlobals.AudioElement)
			: Musec.MusecGlobals.AudioContext.createMediaStreamSource(Musec.MusecGlobals.AudioElement)
		}
		//this.source = Musec.MusecGlobals.AudioContext.createMediaElementSource(Musec.MusecGlobals.AudioElement);
		
		// Connect graph
		this.source.connect(this.analyser);
		this.source.loop = false;
		// Start visualisation
		reqFrame(this.draw.bind(this));
	}
	this.isPlaying = !this.isPlaying;
};
MusicVisualizer.prototype.draw = function() {
	this.analyser.smoothingTimeConstant = Musec.Variables.VisualiserConfig.Smoothing;
	this.analyser.fftSize = Musec.Variables.VisualiserConfig.fftSize;

	this.analyser.getByteFrequencyData(this.freqs);
	this.analyser.getByteTimeDomainData(this.times);

	var width = Math.floor(1/this.freqs.length, 10);

	var canvas = document.querySelector('canvas');
	var drawContext = canvas.getContext('2d');
	canvas.width = Musec.Variables.VisualiserConfig.Width;
	canvas.height = Musec.Variables.VisualiserConfig.Height;
	
	for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
		var value = this.freqs[i];
		var percent = value / 512;
		var height = Musec.Variables.VisualiserConfig.Height * percent;
		var offset = Musec.Variables.VisualiserConfig.Height - height - 1;
		var barWidth = Musec.Variables.VisualiserConfig.Width/this.analyser.frequencyBinCount/2;
		
		if (Musec.Variables.VisualiserConfig.Style == "hsl") {
			var hue = i/this.analyser.frequencyBinCount * 360;
			drawContext.fillStyle = 'hsl(' + hue + ', 75%, 50%)';
		} else if (Musec.Variables.VisualiserConfig.Style == "splash") {
			if (typeof(Musec.Variables.VisualiserConfig.ColorSplash) != "undefined") {
				drawContext.fillStyle = Musec.Variables.VisualiserConfig.ColorSplash;
			} else {
				drawContext.fillStyle = 'rgba(255,255,255,0.9)';
			}
		} else {
			drawContext.fillStyle = 'rgba(255,255,255,0.9)';
		}
		drawContext.fillRect(i * barWidth*2.5, offset, barWidth, height);
	}
	
	if (this.isPlaying) {
		reqFrame(this.draw.bind(this));
	}
};
MusicVisualizer.prototype.getFrequencyValue = function(freq) {		
	var nyquist = Musec.MusecGlobals.AudioContext.sampleRate/2;		
	var index = Math.round(freq/nyquist * this.freqs.length);		
	return this.freqs[index];		
};

// Musec Main
var Musec = {
	// Important Musec variables
	Variables:{
		Path:window.defaultPath != undefined ? window.defaultPath : "/",
		LoadTime:Math.floor(Date.now() / 1000),
		NotificationDuration:7500,	// 7.5s
		Notif:undefined,			// Current notification
		Index:undefined,			// Music Index (Songs & Albums)
		// Making my life so much easier (not)
		Current:{
			Song:"",
			Folder:"",
			Colours:[],
			IsOffline:false,
			Location:"",
			ThumbMove:true
		},
		VisualiserConfig:{
			Width:(window.innerWidth*2),
			Height:(window.innerHeight*2),
			Smoothing:0.69,
			fftSize:512,			// Adjustable
			MinimumDecibels:-170,	// -130, -140, -100, -200
			MaximumDecibels:35, 	// 70, 0, 0, 70
			Style:"hsl",
			ColorSplash:undefined
		}
	},
	// Functions to assist Core
	Helpers:{
		// Check if n is numeric
		isNumeric: function(n){
			return !isNaN(parseFloat(n)) && isFinite(n);
		},
		// Captialise society.. I mean strings
		capitalise: function(t){
			return t.replace(/\w\S*/g,function(s){
				return s.charAt(0).toUpperCase()+s.substr(1).toLowerCase();
			});
		},
		// Check browser
		compatibility: function(){
			if (/Chrome|Opera|BB10|Firefox|Vivaldi/.test(navigator.userAgent)) 
				return true;
			else
				return false;
		}
	},
	// Musec's Core functionality
	Core:{
		// Network Functions
		Network:{
			LoadIndex:function(callback){
				$.get(Musec.Variables.Path + "resources/music_index.json", function(data) {
					Musec.Variables.Index = data;
					callback(true);
				}).fail(function() {
					callback(false);
				});
			}
		},
		// Events
		Events:{
			// Elements
			Elements:{
				"back":$("#back"),
				"search":$("#search"),
				"queue":$("#queue"),
				"downloads":$("#down"),
				"statusbar":$("#folder")
			},
			// When the window loads
			Start:function(){
				Musec.Core.View.ChangeView("main");
				Musec.Core.Events.UI();
				Musec.Core.Network.LoadIndex(Musec.Core.View.Tiles);
				Musec.Core.Events.SetStatusbar("");
			},
			// Assign UI Events
			UI:function(){
				var TriggerObj = Musec.Core.Events.Elements;
				
				TriggerObj.back.click(function(){
					Musec.Core.View.ChangeView("back");
				});
				TriggerObj.queue.click(function(){
					Musec.Core.View.ChangeView("queue");
				});
				TriggerObj.downloads.click(function(){
					Musec.Core.View.ChangeView("offline");
				});
				TriggerObj.search.click(Musec.Core.View.SearchBar);
			},
			// Sets the statusbar text
			SetStatusbar:function(text){
				// Check for media playback
				var s = Musec.Core.Events.Elements.statusbar;
				if (text == ""){
					s.html("");
				} else {
					s.html(text);
				}
			}
		},
		// Handles UI
		View:{
			// Current View
			CurrentView:$("#musicFolders"),
			BeforeView:$("#musicFolders"),
			// Possible Views
			Views:{
				"songs":$("#songFolder"),
				"main":$("#musicFolders"),
				"queue":$("#queueFolder"),
				"offline":$("#offlineFolder")
			},
			SetBackState:function(to){
				if (to !== "main") 
					Musec.Core.Events.Elements.back.html("<-");
				else
					Musec.Core.Events.Elements.back.html("R");
			},
			// Modify the view [string]
			ChangeView:function(to){
				if (to === "back") {
					Musec.Core.View.CurrentView.hide();
					Musec.Core.View.BeforeView.show();
					Musec.Core.View.CurrentView = Musec.Core.View.BeforeView;
					return;
				}
				Musec.Core.View.BeforeView = Musec.Core.View.CurrentView;
				Musec.Core.View.SetBackState(to);
				
				switch (to){
					case "main":
						Musec.Core.View.CurrentView = Musec.Core.View.Views.main;
						Musec.Core.View.Views.main.html("");
						Musec.Core.View.BeforeView.hide();
						Musec.Core.View.CurrentView.show();
						break;
					case "songs":
						Musec.Core.View.CurrentView = Musec.Core.View.Views.songs;
						Musec.Core.View.Views.songs.html("");
						Musec.Core.View.BeforeView.hide();
						Musec.Core.View.CurrentView.show();
						break;
					case "queue":
						Musec.Core.View.CurrentView = Musec.Core.View.Views.queue;
						Musec.Core.View.Views.queue.html("");
						Musec.Core.View.BeforeView.hide();
						Musec.Core.View.CurrentView.show();
						break;
				}
			},
			OpenQueue:function(){
				
			},
			// Create Album Tiles
			Tiles:function(){
				var keys = Object.keys(Musec.Variables.Index.data);
				var view = Musec.Core.View.Views.main;
				
				Musec.Core.Events.SetStatusbar("Musec");
				Musec.Core.View.ChangeView("main");
				if (keys.length == 0) {
					view.html("<h2>Couldn't find anything</h2>");
					return;
				}
				
				// Cycle Albums
				var i = 0;
				for (album in Musec.Variables.Index.data) {
					var bgurl = Musec.Variables.Path + "resources/artwork/" + album + ".jpg";
					Musec.Core.View.Views.main.append(
						$("<div/>",{
							"class":"tile tile_longclick",
							"id":"tile_id_" + i,
							"data-album":album
						}).append(
							$("<div/>",{
								"class":"tile_content",
								"id":"tile_id_" + i + "_content"
							}),
							$("<div/>",{
								"class":"tile_bg",
								"id":"tile_id_" + i + "_background"
							}).css({
								"background":"url('" + bgurl + "')",
								"background-size":"cover"
							}).contextmenu(function(event) {
								event.preventDefault();
								Musec.Core.View.TileMenu(event.currentTarget);
							}).longclick(250,function(event) {
								Musec.Core.View.TileMenu(event.currentTarget);
							}).click(function(event) {
								Musec.Core.View.Songs(event.currentTarget);
							})
						)
					);
					i++;
				}
			},
			// Display a tile menu [HTML Element]
			TileMenu:function(elem){
				if (typeof(Musec.Variables.CurrentTile) !== "undefined"){
					$("#" + Musec.Variables.CurrentTile.id + "_content").fadeOut(500);
					if (Musec.Variables.CurrentTile.id != elem.id) {
						Musec.Variables.CurrentTile = undefined;
						return;
					}
				}
				
				Musec.Variables.CurrentTile = elem;
			},
			// Display songs [HTML Element]
			Songs:function(elem){
				// I'm so sorry, this is gonna get messy
				var album = $(elem).parent().data("album");
				var keys = Object.keys(Musec.Variables.Index.data[album].songs);
				var view = Musec.Core.View.Views.songs;
				var i = 0;
				
				console.info("Loading songs from album: " + album);
				Musec.Core.Events.SetStatusbar(Musec.Variables.Index.data[album].name);
				Musec.Core.View.ChangeView("songs");
				if (keys.length == 0) {
					view.html("<h2>Couldn't find anything</h2>");
					return false;
				}
				
				var song_list_html = "\
				<table>\
					<thead>\
						<tr>\
							<th>\
								<button onclick='' class='acircle'>Add all to Queue</button>\
							</th>\
						</tr>\
					</thead>\
					<tbody id='songs_list'></tbody>\
				</table>";
				
				Musec.Core.View.Views.songs.html(song_list_html);
				for (data in Musec.Variables.Index.data[album].songs){
					var reference = album + "_" + i;
					$("#songs_list").append(
						$("<tr/>",{
							"class":"song_longclick",
							"id":"song_row_" + i,
							"data-ref":reference
						}).contextmenu(function(event) {
							event.preventDefault();
							Musec.Core.View.SongMenu(event.currentTarget);
						}).longclick(250,function(event) {
							Musec.Core.View.SongMenu(event.currentTarget);
						}).click(function(event) {
							Musec.Media.SongClick(event.currentTarget);
						}).append(
							$("<td/>",{
								"id":"song_row_inner_" + i
							}).append(
								$("<span/>",{
									"id":"song_row_name_" + i,
									"class":"__song_AllowSearch song_lc_name"
								}).text(Musec.Variables.Index.data[album].songs[data].disp)
							)
						)
					);
					Musec.Variables.Index.data[album].songs[data];
					i++;
				}
			},
			// Displays search results (similar to Musec->Core->View->Songs)
			SearchResults:function(elem){
				
			}
		},
		// Song Queue
		Queue:{
			CurrentSong:false
		}
	},
	MediaGlobals:{
		// Important Objects
		AudioElement:undefined,
		AudioContext:undefined,
		AudioVisualiser:undefined,
		// Controls
		Controls:{
			"PlayPause":$("#playpause"),	// Play/Pause
			"Slider":$("#playbackslider"),	// Seeker
			"MediaCT":$("#mediaCtime"),		// Media Current Time
			"MediaTT":$("#mediaTtime")		// Media Total Time
		},
		SongQueue:[],
		CurrentID:0,
		VisualiserSupported:true // Assume true until false
	},
	// Media Functions (Play/Pause/Update/Seek/Visualise)
	Media:{
		// Minipulate Queue [Element, Action]
		QueueAction:function(elem,action){
			
		},
		// Control Playback
		ControlEvents:{
			// Updates UI time
			TimeUpdate:function(){
				if (typeof(Musec.MediaGlobals.AudioElement) == "undefined") {
					return;
				}
				if (typeof(Musec.MediaGlobals.AudioElement.duration) == "undefined" || !Musec.Helpers.isNumeric(Musec.MediaGlobals.AudioElement.duration)) {
					Musec.MediaGlobals.Controls.MediaCT.html("00:00");
					Musec.MediaGlobals.Controls.MediaTT.html("00:00");
				} else {
					if (Musec.Variables.Current.ThumbMove == true) {
						Musec.MediaGlobals.Controls.Slider.val((Musec.MediaGlobals.AudioElement.currentTime * (100 / Musec.MediaGlobals.AudioElement.duration)));
					}
					
					// Calculate current and total times
					var currentMinutes = Math.floor(Musec.MediaGlobals.AudioElement.currentTime / 60);
					var currentSeconds = Math.floor(Musec.MediaGlobals.AudioElement.currentTime - currentMinutes * 60);
					var totalMinutes = Math.floor(Musec.MediaGlobals.AudioElement.duration / 60);
					var totalSeconds = Math.floor(Musec.MediaGlobals.AudioElement.duration - totalMinutes * 60);
					
					// Should we add a 0 beforehand?
					if (currentSeconds < 10)
						currentSeconds = "0" + currentSeconds;
					if (totalSeconds < 10)
						totalSeconds = "0" + totalSeconds;
					if (currentMinutes < 10)
						currentMinutes = "0" + currentMinutes;
					if (totalMinutes < 10)
						totalMinutes = "0" + totalMinutes;
					
					// Update time text
					Musec.MediaGlobals.Controls.MediaCT.html(currentMinutes + ":" + currentSeconds);
					Musec.MediaGlobals.Controls.MediaTT.html(totalMinutes + ":" + totalSeconds);
					
					// Update statusbar
					if (currentSeconds % 3 == 0 || currentSeconds === totalSeconds) {
						Musec.Media.ControlEvents.UILoadProgress();
					}
				}
			},
			// Song Progress UI indication
			UILoadProgress:function(){
				// Check if AudioElement is defined
				if (typeof(Musec.MediaGlobals.AudioElement) == "undefined" || typeof(Musec.MediaGlobals.AudioElement.duration) == "undefined") {
					var rawDuration = 0;
				} else {
					var rawDuration = Musec.MediaGlobals.AudioElement.duration;
				}
				// Get raw buffer
				try {
					var rawBuffer = Musec.MediaGlobals.AudioElement.buffered.end(Musec.MediaGlobals.AudioElement.buffered.length - 1);
				} catch(e) {
					var rawBuffer = 0;
				}
				
				var percent = Math.round((rawBuffer / rawDuration) * 100);
				var colours = ["black", "white"];
				
				if (isNaN(percent)) {
					Musec.Core.Events.Elements.statusbar.css({
						background: "linear-gradient(to right, " + colours[1] + " 0%, " + colours[0]
					});
				} else {
					Musec.Core.Events.Elements.statusbar.css({
						background: "linear-gradient(to right, " + colours[1] + " " + percent + "%, " + colours[0]
					});
				}
			},
			// Seeks song
			SeekSong:function(){
				Musec.MediaGlobals.AudioElement.currentTime = (
					Musec.MediaGlobals.AudioElement.duration * (Musec.MediaGlobals.Controls.Slider.val() / 100)
				);
			},
			// Pause and play functions
			ToggleMedia:function() {
				if (typeof(Musec.MediaGlobals.AudioElement) == "undefined") {
					return;
				}
				console.info("Type to see status: " + "Musec.MediaGlobals.AudioElement.paused");
				if (Musec.MediaGlobals.AudioElement.paused) {
					Musec.MediaGlobals.AudioElement.play();
				} else {
					Musec.MediaGlobals.AudioElement.pause();
				}
			},
			ToggleMediaUI:function(state){
				if (typeof(Musec.MediaGlobals.AudioElement) == "undefined") {
					return;
				}
				if (state === true){
					Musec.MediaGlobals.Controls.PlayPause.html("&#10074;&#10074;");
					//document.title = "Musec - " + tiles.songName;
				} else {
					Musec.MediaGlobals.Controls.PlayPause.html("&#9658;");
					//document.title = "Paused - " + tiles.songName;
				}
			}
		},
		Playback:{
			BuildObjects:function(){
				// Try to create an AudioElement
				if (typeof(Musec.MediaGlobals.AudioElement) === "undefined"){
					try {
						Musec.MediaGlobals.AudioElement = new Audio();
					} catch(e) {
						alert("Your browser doesn't support HTML 5 Audio");
						return false;
					}
				}
				
				// Try to create an AudioContext
				try {
					Musec.MediaGlobals.AudioContext = new (window.AudioContext || window.webkitAudioContext)();
					
					if (!Musec.MediaGlobals.AudioContext.createGain)
						Musec.MediaGlobals.AudioContext.createGain = Musec.MediaGlobals.AudioContext.createGainNode;
					if (!Musec.MediaGlobals.AudioContext.createDelay)
						Musec.MediaGlobals.AudioContext.createDelay = Musec.MediaGlobals.AudioContext.createDelayNode;
					if (!Musec.MediaGlobals.AudioContext.createScriptProcessor)
						Musec.MediaGlobals.AudioContext.createScriptProcessor = Musec.MediaGlobals.AudioContext.createJavaScriptNode;
					
					console.info("AudioContext Successfully created!");
					
					// Try build the visualiser
					var visu = Musec.Media.Playback.BuildVisualiser();
					if (!visu) console.warn("Visualiser Creation Failed");
				} catch(e) {
					// It failed? No problem
					Musec.MediaGlobals.VisualiserSupported = false;
				}
			},
			// Create the Music Visualiser if we can
			BuildVisualiser:function(){
				if (typeof(Musec.MediaGlobals.AudioContext) == "undefined")
					return false;
				
				if (Musec.MediaGlobals.VisualiserSupported === true && Musec.Preferences.Current["mv"] === true) {
					try {
						Musec.MediaGlobals.AudioVisualiser = new MusicVisualizer();
						Musec.MediaGlobals.AudioVisualiser.togglePlayback();
					} catch(e) {
						// It failed? Thats fine
						return false;
					}
				}
			},
			// Connect events to UI elements
			ConnectElements:function(){
				// Update time (CT & TT)
				Musec.MediaGlobals.AudioElement.addEventListener("timeupdate", Musec.Media.ControlEvents.TimeUpdate, false);
				
				// Error event
				Musec.MediaGlobals.AudioElement.addEventListener("error", function(e) {
					console.error(e);
					alert("Error Loading Data");
				}, false);
				
				// Play/Pause (Will only modify UI)
				Musec.MediaGlobals.AudioElement.addEventListener("play", function() {
					Musec.Media.ControlEvents.ToggleMediaUI(true);
				}, false);
				Musec.MediaGlobals.AudioElement.addEventListener("pause", function() {
					Musec.Media.ControlEvents.ToggleMediaUI(false);
				}, false);
				
				// Play/Pause (UI Link)
				Musec.MediaGlobals.Controls.PlayPause.unbind("click");
				Musec.MediaGlobals.Controls.PlayPause.on("click", function() {
					Musec.Media.ControlEvents.ToggleMedia();
				});
				
				// Allow song to be seeked
				Musec.MediaGlobals.Controls.Slider.on("change", Musec.Media.ControlEvents.SeekSong, false);
				
				// Stop seeker moving when user is interacting
				Musec.MediaGlobals.Controls.Slider.on("mousedown", function() {
					Musec.Variables.Current.ThumbMove = false;
				}, false);
				Musec.MediaGlobals.Controls.Slider.on("touchstart", function() {
					Musec.Variables.Current.ThumbMove = false;
				}, false);
				
				// When user stops interacting allow slider movement
				Musec.MediaGlobals.Controls.Slider.on("mouseup", function() {
					Musec.Variables.Current.ThumbMove = true;
				}, false);
				Musec.MediaGlobals.Controls.Slider.on("touchend", function() {
					Musec.Variables.Current.ThumbMove = true;
				}, false);
			},
			// Plays next song in queue
			Song:function(){
				// Check queue
				var songObj = Musec.MediaGlobals.SongQueue[Musec.MediaGlobals.CurrentID];
				
				// Move queue
				Musec.MediaGlobals.CurrentID++;
				
				// Build Elements
				Musec.Media.Playback.BuildObjects();
				
				// Assign Events upon data loading
				Musec.MediaGlobals.AudioElement.addEventListener("loadeddata",function(){
					// Immediately commence playback
					Musec.MediaGlobals.AudioElement.play();
					
					// Assign Events
					Musec.Media.Playback.ConnectElements();
				});
				
				// Load & Play
				Musec.MediaGlobals.AudioElement.src = songObj.source;
				
				// Notify
				Musec.Extra.Notifications.Browser([
					"Musec | Now Playing",
					songObj.display,
					"resources/artwork/" + songObj.album + ".jpg"
				]);
			}
		},
		SongClick:function(elem){
			var songRef = $(elem).data("ref");
			console.info("Getting information for:" + songRef);
			
			// Decode data from element
			var deco = songRef.split("_");
			var id = deco.pop();
			var album = deco.join("_");
			
			// Find song data in Index
			var songData = Musec.Variables.Index.data[album].songs[id];
			var albumData = Musec.Variables.Index.data[album].name;
			
			// Build media path
			var src = "resources/music/" + album + "/" + songData.name;
			
			// Put data into queue format
			var queueData = {
				"name":songData.name,
				"display":songData.disp,
				"duration":songData.dur,
				"folder":albumData,
				"album":album,
				"source":src
			};
			
			// Add to queue
			console.info(queueData);
			Musec.MediaGlobals.SongQueue.push(queueData);
			
			// Play song
			Musec.Media.Playback.Song();
		}
	},
	// Offline Functionality
	Offline:{
		
	},
	// Extra functionality
	Extra:{
		Notifications:{
			// Browser Notifications [Title,Message,Icon]
			Browser:function(info){
				var options = {
					body: info[1],
					icon: window.defaultPath + info[2]
				};
				
				try {
					if (!("Notification" in window)) {
						console.warn("No Notification Support");
					} else if (Notification.permission === "granted") {
						Musec.Variables.Notif = new Notification(info[0],options);
						setTimeout(
							Musec.Variables.Notif.close.bind(Musec.Variables.Notif),
							Musec.Variables.NotificationDuration
						);
					} else if (Notification.permission !== 'denied') {
						Notification.requestPermission(function(permission) {
							if (permission === "granted")
								Musec.Extra.Notifications.Browser(info);
						});
					}
				} catch (e) {
					if (e.name != "TypeError") // Firefox throws this sometimes
						throw new Error(e);
				}
			},
			// Window Notifications [Message,Image,Duration]
			Window:function(info){
				$("#sAlertImg").attr("src", Musec.Variables.Path + "assets/img/i/" + info[1]);
				$("#sAlertTxt").html(info[0]);
				
				$("#sAlert").fadeIn(info[2]);
				setTimeout(function() {
					$("#sAlert").fadeOut(info[2]);
				},info[2]*3);
			}
		}
	},
	Preferences:{
		Current:{
			"mv":true,		// MusicVisualizer
			"cs":true		// Colour Splash
		}
	}
}

$(document).ready(Musec.Core.Events.Start);
