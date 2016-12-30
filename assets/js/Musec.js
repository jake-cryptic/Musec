/*
 * 	Musec v2-Build 1
 * 	
 * 	By Jake Mcneill (https://absolutedouble.co.uk)
 *	
 *	Licenced Under: GNU AFFERO GENERAL PUBLIC LICENSE
 */


// Cross Browser Support for requestAnimationFrame
window.reqFrame = (function(){
	return window.requestAnimationFrame 	|| 
		window.webkitRequestAnimationFrame	|| 
		window.mozRequestAnimationFrame 	|| 
		window.oRequestAnimationFrame 		|| 
		window.msRequestAnimationFrame 		|| 
		function(callback){
			window.setTimeout(callback, 10 / 60);
		};
})();

// Code for the Music Visualiser
function MusecVisualiser() {
	console.log(Musec.MediaGlobals);
	console.log(Musec.MediaGlobals.AudioContext);
	this.analyser = Musec.MediaGlobals.AudioContext.createAnalyser();

	this.analyser.connect(Musec.MediaGlobals.AudioContext.destination);
	this.analyser.minDecibels = Musec.Variables.VisualiserConfig.MinimumDecibels;
	this.analyser.maxDecibels = Musec.Variables.VisualiserConfig.MaximumDecibels;
	this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
	this.times = new Uint8Array(this.analyser.frequencyBinCount);

	this.isPlaying = false;
	this.startTime = 0;
	this.startOffset = 0;
};
MusecVisualiser.prototype.togglePlayback = function() {
	if (this.isPlaying) {
		this.source[this.source.stop ? 'stop': 'noteOff'](0);
		this.startOffset += Musec.MediaGlobals.AudioContext.currentTime - this.startTime;
		console.log('(MusecVisualiser): Paused at', this.startOffset);
	} else {
		this.startTime = Musec.MediaGlobals.AudioContext.currentTime;
		console.log('Started at ', this.startOffset);
		if (!(Musec.MediaGlobals.AudioElement instanceof AudioNode)) {
			this.source = (Musec.MediaGlobals.AudioElement instanceof Audio || Musec.MediaGlobals.AudioElement instanceof HTMLAudioElement)
			? Musec.MediaGlobals.AudioContext.createMediaElementSource(Musec.MediaGlobals.AudioElement)
			: Musec.MediaGlobals.AudioContext.createMediaStreamSource(Musec.MediaGlobals.AudioElement)
		}
		//this.source = Musec.MediaGlobals.AudioContext.createMediaElementSource(Musec.MediaGlobals.AudioElement);
		
		// Connect graph
		this.source.connect(this.analyser);
		this.source.loop = false;
		// Start visualisation
		reqFrame(this.draw.bind(this));
	}
	this.isPlaying = !this.isPlaying;
};
MusecVisualiser.prototype.draw = function() {
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
MusecVisualiser.prototype.getFrequencyValue = function(freq) {		
	var nyquist = Musec.MediaGlobals.AudioContext.sampleRate/2;		
	var index = Math.round(freq/nyquist * this.freqs.length);		
	return this.freqs[index];		
};

/*
 *
 *	Main Musec Object
 *
 */
var Musec = {
	// Important Musec variables
	Variables:{
		Path:window.defaultPath != undefined ? window.defaultPath : "/",
		LoadTime:Math.floor(Date.now() / 1000),
		IsMobileDevice:false,		// Innocent until proven mobile
		NotificationDuration:7500,	// 7.5s
		Notif:undefined,			// Current notification
		Index:undefined,			// Music Index (Songs & Albums)
		// ColourThief is spelt the right way here
		ColourThief:new ColorThief(),
		ColourThiefImage:new Image(),
		ColourThiefPalette:[],
		ColourThiefProgressUI:[],
		// Making my life so much easier (not)
		Current:{
			Song:"",
			Folder:"",
			Colours:[],
			IsOffline:false,
			Location:"",
			ThumbMove:true,
			UserTyping:false
		},
		VisualiserConfig:{
			Width:(window.innerWidth),
			Height:(window.innerHeight),
			Smoothing:0.69,
			fftSize:512,			// Adjustable
			MinimumDecibels:-170,	// -130, -140, -100, -200
			MaximumDecibels:35, 	// 70, 0, 0, 70
			Style:"splash",
			ColorSplash:""
		}
	},
	// Functions to assist Core
	Helpers:{
		// Check if n is numeric
		isNumeric: function(n){
			return !isNaN(parseFloat(n)) && isFinite(n);
		},
		// Captialise society.. I mean strings
		Capitalise: function(t){
			return t.replace(/\w\S*/g,function(s){
				return s.charAt(0).toUpperCase()+s.substr(1).toLowerCase();
			});
		},
		// Check browser
		Compatibility: function(){
			if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) ||
				/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4)))
				Musec.Variables.IsMobileDevice = true;
			
		}
	},
	// Musec's Core functionality
	Core:{
		// Network Functions
		Network:{
			LoadIndex:function(callback){
				Musec.Core.View.Views.main.html("<h1>Loading Index...</h1>");
				
				// Loads the Musec Index via AJAX
				$.get(Musec.Variables.Path + "resources/music_index.json", function(data) {
					Musec.Variables.Index = data;
					Musec.Core.View.Views.main.html("");
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
				"statusbar":$("#folder"),
				"musicvisualiser":$("#mvContainer")
			},
			// When the window loads
			Start:function(){
				Musec.Helpers.Compatibility();							// Check what we are using
				Musec.Core.Events.UI();									// Assign UI Events
				Musec.Core.View.ChangeView("main");						// Set main page
				Musec.Core.Network.LoadIndex(Musec.Core.View.Tiles);	// Load the index
				Musec.Core.Events.SetStatusbar("");						// Clear the status bar
				Musec.Extra.RequestPermission();						// Request permission for Notifications
			},
			// Assign UI Events
			UI:function(){
				// UI Events
				var TriggerObj = Musec.Core.Events.Elements;
				
				TriggerObj.musicvisualiser.click(function(event) {
					event.preventDefault();
				});
				TriggerObj.back.click(function(){
					Musec.Core.View.GoBack();
				});
				TriggerObj.queue.click(function(){
					Musec.Core.View.OpenQueue();
				});
				TriggerObj.downloads.click(function(){
					Musec.Core.View.ChangeView("offline");
				});
				TriggerObj.search.click(Musec.Core.View.SearchBar);
				
				// Window events (keyboard shortcuts & music visualiser)
				$(window).resize(function() {
					Musec.Variables.VisualiserConfig.Width = (window.innerWidth * 2);
					Musec.Variables.VisualiserConfig.Height = (window.innerHeight * 2);
				});
				$(window).keydown(Musec.Extra.KeyboardEvent);
				
				// Polyfills
				$(function() {
					FastClick.attach(document.body);
				});
				PointerEventsPolyfill.initialize({});
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
			GoBack:function() {
				if (Musec.Core.View.CurrentView.attr("id") === Musec.Core.View.Views.main.attr("id")) {
					// Go to settings
					console.warn("Not implemented");
				}
				
				if (Musec.Core.View.CurrentView.attr("id") === Musec.Core.View.Views.songs.attr("id")) {
					Musec.Core.Events.Elements.back.html("R");
					Musec.Core.View.CurrentView = Musec.Core.View.Views.main;
					Musec.Core.View.BeforeView = Musec.Core.View.Views.songs;
					Musec.Core.View.BeforeView.hide();
					Musec.Core.View.CurrentView.show();
				}
				
				if (Musec.Core.View.CurrentView.attr("id") === Musec.Core.View.Views.queue.attr("id") 
				||  Musec.Core.View.CurrentView.attr("id") === Musec.Core.View.Views.offline.attr("id")) {
					if (Musec.Core.View.BeforeView.attr("id") === Musec.Core.View.Views.songs.attr("id")){
						Musec.Core.Events.Elements.back.html("<-");
						Musec.Core.View.CurrentView = Musec.Core.View.Views.songs;
						Musec.Core.View.BeforeView = Musec.Core.View.Views.main;
					} else {
						Musec.Core.Events.Elements.back.html("R");
						Musec.Core.View.CurrentView = Musec.Core.View.Views.main;
						Musec.Core.View.BeforeView = Musec.Core.View.Views.main;
					}
					
					Musec.Core.View.BeforeView.hide();
					Musec.Core.View.CurrentView.show();
				}
			},
			// Modify the view [string]
			ChangeView:function(to) {
				console.info("State being set to " + to);
				
				if (to !== "main") {
					Musec.Core.Events.Elements.back.html("<-");
				} else {
					Musec.Core.Events.Elements.back.html("R");
				}
				Musec.Core.View.BeforeView = Musec.Core.View.CurrentView;
				
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
					case "offline":
						Musec.Core.View.CurrentView = Musec.Core.View.Views.offline;
						Musec.Core.View.Views.offline.html("");
						Musec.Core.View.BeforeView.hide();
						Musec.Core.View.CurrentView.show();
					break;
				}
			},
			ColourUI:function(album) {
				if (typeof(Musec.Variables.ColourThief) !== "object") {
					return false;
				}
				
				// Get the colour palette using ColorThief
				var backgroundSource = Musec.Variables.Path + "resources/artwork/" + album + ".jpg";
				
				try {
					Musec.Variables.ColourThiefImage.src = backgroundSource;
					Musec.Variables.ColourThiefPalette[0] = Musec.Variables.ColourThief.getPalette(Musec.Variables.ColourThiefImage, 5);
					Musec.Variables.ColourThiefPalette[1] = Musec.Variables.ColourThief.markBoomColors(Musec.Variables.ColourThiefPalette[0]);
				} catch (e) {
					return false;
				}
				
				var colourArray = [], totalsArray = [];
				for (var i = 0; i < Musec.Variables.ColourThiefPalette[1].length; i++) {
					// Get the RGB values from certain points
					var r = Musec.Variables.ColourThiefPalette[1][i][0];
					var g = Musec.Variables.ColourThiefPalette[1][i][1];
					var b = Musec.Variables.ColourThiefPalette[1][i][2];
					
					var totalsStr = r + g + b;
					var colorsStr = r.toString() + "," + g.toString() + "," + b.toString();
					
					colourArray.splice(Musec.Variables.ColourThiefPalette[1][i].boomRank, 0, colorsStr);
					totalsArray.push(totalsStr);
				}
				
				// Set values
				Musec.Variables.ColourThiefProgressUI = ["rgb(" + colourArray[2] + ")", "rgb(" + colourArray[1] + ")"];
				Musec.Variables.VisualiserConfig.ColorSplash = "rgb(" + colourArray[1] + ")";
				$("#pageTop").css({
					background: "rgb(" + colourArray[1] + ")"
				});
				$("#pageTop").css({
					color: "rgb(" + colourArray[0] + ")"
				});
				$("#pageCenter").css({
					background: "rgb(" + colourArray[0] + ")"
				});
				$("#pageBottom").css({
					background: "rgb(" + colourArray[1] + ")"
				});
				$("#pageBottom").css({
					color: "rgb(" + colourArray[0] + ")"
				});
				$(".song_longclick").css({
					background: "rgb(" + colourArray[2] + ")"
				});
				$(".song_longclick").css({
					color: "#fff"
				});
				$("#folder").css({
					background: "rgb(" + colourArray[1] + ")"
				});
			},
			// Generate the queue
			OpenQueue:function(){
				Musec.Core.View.ChangeView("queue");
				
				Musec.Core.View.Views.queue.html("\
					<table>\
						<thead>\
							<tr>\
								<th>Song</th>\
								<th>Action</th>\
							</tr>\
						</thead>\
						<tbody id=\"queue_list\"></tbody>\
					</table>\
				");
				
				if (Musec.MediaGlobals.SongQueue.length == 0) {
					$("#queue_list").html('\
						<tr>\
							<td colspan=\"2\">\
								<h2>Queue is empty</h2>\
							</td>\
						</tr>\
						<tr>\
							<td colspan=\"2\">\
								<button class="qcircle" onclick="alert(\'Not Implemented\')">Load a Playlist</button>\
							</td>\
						</tr>\
					');
				} else {
					//var queueActions = '<button class="qcircle" onclick="alert(\'Not Implemented\')">Save Queue</button> ';
					//queueActions += '<button class="qcircle" onclick="alert(\'Not Implemented\')">Load Queue</button> ';
					var queueActions = '<button class="qcircle" onclick="tiles.wipeQueue(0);">Clear Queue</button> ';
					queueActions += '<button class="qcircle" onclick="tiles.wipeQueue(1);">Clear History</button>';

					$("#queue_list").html("<tr><td colspan=\"2\">" + queueActions + "</td></tr>");
					for (var i = 0; i < (Musec.MediaGlobals.SongQueue.length); i++) {
						console.log(Musec.MediaGlobals.SongQueue[i]);
						console.log("Parsing queue data for song id " + i + " which is " + Musec.MediaGlobals.SongQueue[i]);
						
						// Move up, Play next, Play now, Remove, Move down, Repeat?
						queueCtrls = "<span class='clickable' onclick=\"tiles.alterQueue('delete'," + i + ")\">Remove</span>";
						queueAltr = "<span class='clickable qro_button' id=\"qro_' + i + '\">☰</span>";
						
						if (Musec.MediaGlobals.CurrentID - 1 == i) {
							stat = "queueCurrentSong";
						} else {
							stat = "queueSong";
						}
						
						sB = "<tr class='" + stat + " draggable_qro'>\
							<td class='clickable qro_button' onclick='tiles.goToSong(" + i + ")'>" + Musec.MediaGlobals.SongQueue[i].display + "</td>\
							<td>" + queueCtrls + "</td>\
						</tr>";

						$("#queue_list").append(sB);
					}
					/*Sortable.create(document.getElementById("queue_list"), {
						draggable: ".draggable_qro",
						handle: ".qro_button",
						onSort: function(event) {
							tiles.alterQueue("rearrange", [event.oldIndex, event.newIndex]);
						}
					});*/
				}
			},
			// Create Album Tiles
			Tiles:function(x){
				if (!x) alert("Musec failed to load fully");
				var keys = Object.keys(Musec.Variables.Index.data);
				var view = Musec.Core.View.Views.main;
				
				Musec.Core.Events.SetStatusbar("Musec");
				
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
				Musec.Core.View.ColourUI(album);
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
						Musec.MediaGlobals.Controls.Slider.val(
							parseFloat(Musec.MediaGlobals.AudioElement.currentTime * (100 / Musec.MediaGlobals.AudioElement.duration))
						);
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
				if (Musec.Variables.ColourThiefProgressUI.length == 0) {
					var colours = ["black", "white"];
				} else {
					var colours = Musec.Variables.ColourThiefProgressUI;
				}
				
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
					document.title = "Playing";
				} else {
					Musec.MediaGlobals.Controls.PlayPause.html("&#9658;");
					document.title = "Paused";
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
						Musec.MediaGlobals.AudioVisualiser = new MusecVisualiser();
						Musec.MediaGlobals.AudioVisualiser.togglePlayback();
					} catch(e) {
						// It failed? That's fine ;-;
						console.error(e);
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
				Musec.MediaGlobals.Controls.Slider.on("change", Musec.Media.ControlEvents.SeekSong);
				
				// Stop seeker moving when user is interacting
				Musec.MediaGlobals.Controls.Slider.on("mousedown touchstart", function() {
					Musec.Variables.Current.ThumbMove = false;
				});
				
				// When user stops interacting allow slider movement
				Musec.MediaGlobals.Controls.Slider.on("mouseup touchend", function() {
					Musec.Variables.Current.ThumbMove = true;
				});
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
		RequestPermission:function() {
			if (!("Notification" in window)) {
				console.warn("No Notification Support");
			} else if (Notification.permission !== 'denied') {
				Notification.requestPermission(function(permission) {
					if (permission === "granted")
						console.info("Notification Permission Granted");
					else
						console.warn("Notification Permission Denied");
				});
			}
		},
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
		},
		KeyboardEvent:function(event) {
			if (Musec.Variables.Current.UserTyping === true || Musec.Variables.IsMobileDevice === true) {
				return true;
			}
			
			console.log("Key Pressed:" + event.keyCode);
			
			switch (event.keyCode) {
				case 8: 					// Backspace
					event.preventDefault();
					Musec.Core.View.GoBack();
					break;
				case 32:					 // Space bar
					Musec.Media.ControlEvents.ToggleMedia();
					break;
				case 81: 					// Letter Q
					Musec.Variables.VisualiserConfig.fftSize = 256;
					break;
				case 87: 					// Letter W
					Musec.Variables.VisualiserConfig.fftSize = 512;
					break;
				case 69: 					// Letter E
					Musec.Variables.VisualiserConfig.fftSize = 1024;
					break;
				case 82: 					// Letter R
					Musec.Variables.VisualiserConfig.fftSize = 2048;
					break;
				default:					// Unknown key
					console.warn("No action taken for key");
					break;
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
