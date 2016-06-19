// Fix browser vendor issues
window.AnimateFrame = (function(){return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||  function(callback){window.setTimeout(callback, 250 / 60);}; })();

var AudioHelper = {
	CTX: null,
	BFR: null,
	MSC: {
		AV_W: window.innerWidth*2,
		AV_H: (window.innerHeight*2)-200,
		isPlaying:false,
		loopSetting:false,
		startOffset:0,
		playBackTime:0
	},
	sortContext: function() {
		if (!AudioHelper.CTX.createGain)
			AudioHelper.CTX.createGain = AudioHelper.CTX.createGainNode;
		if (!AudioHelper.CTX.createDelay)
			AudioHelper.CTX.createDelay = AudioHelper.CTX.createDelayNode;
		if (!AudioHelper.CTX.createScriptProcessor)
			AudioHelper.CTX.createScriptProcessor = AudioHelper.CTX.createJavaScriptNode;
	},
	getAudioFile: function(file) {
		xhr = new XMLHttpRequest();
		xhr.open('GET', file, true);
		xhr.responseType = "arraybuffer";
		
		// Function calls
		xhr.onload = AudioHelper.decodeAudio;
		xhr.onloadstart = AudioHelper.loadingAudio;
		xhr.onerror = AudioHelper.loadError;
		xhr.onprogress = AudioHelper.handleProgress;
		xhr.send();
	},
	decodeAudio: function() {
		tiles.folder.html(tiles.songName);
		AudioHelper.CTX.decodeAudioData(xhr.response, AudioHelper.playAudio, AudioHelper.decodeError);
	},
	loadingAudio: function() {
		tiles.folder.html("Loading Audio");
	},
	loadError: function() {
		alert("Error - RIP");
	},
	handleProgress: function(e) {
		var percent = Math.round(e.loaded * 100 / e. total);
		tiles.dev("Progress-> Loaded: " + percent + "%");
		tiles.folder.css({background:"linear-gradient(to right, white " + percent + "%, rgba(0,0,0,0.5))"});
	},
	decodeError: function() {
		alert("Error - RIP");
	},
	playAudio: function(buffer) {
		AudioHelper.BFR = buffer;
		AudioHelper.SRC = AudioHelper.CTX.createBufferSource();
		AudioHelper.SRC.buffer = buffer;
		
		AudioHelper.SRC.connect(AudioHelper.CTX.destination);
		AudioHelper.SRC.loop = AudioHelper.MSC.loopSetting;
		
		AudioHelper.SRC[AudioHelper.SRC.start ? 'start' : 'noteOn'](0);
		AudioHelper.MSC.contextCreate = AudioHelper.CTX.currentTime;
		
		AudioHelper.MSC.isPlaying = true;
		AudioHelper.MSC.playBackTime = Date.now();
		AudioHelper.SRC.startTime = AudioHelper.CTX.currentTime;
	},
	togglePlayback: function() {
		if (AudioHelper.MSC.isPlaying) {
			AudioHelper.SRC[AudioHelper.SRC.stop ? 'stop': 'noteOff'](0);
			AudioHelper.MSC.startOffset += AudioHelper.CTX.currentTime - AudioHelper.SRC.startTime;
			console.log('(MusicVisualizer): Paused at', AudioHelper.MSC.startOffset);
		} else {
			AudioHelper.SRC.startTime = AudioHelper.CTX.currentTime;
			console.log('Started at', AudioHelper.MSC.startOffset);
			AudioHelper.SRC = AudioHelper.CTX.createBufferSource();
			
			// Connect graph
			//this.source.connect(this.analyser);
			
			AudioHelper.SRC.buffer = AudioHelper.BFR;
			AudioHelper.SRC.connect(AudioHelper.CTX.destination);
			AudioHelper.SRC.loop = AudioHelper.MSC.loopSetting;
			
			// Start playback, but make sure we stay in bound of the buffer.
			AudioHelper.SRC[AudioHelper.SRC.start ? 'start' : 'noteOn'](0, AudioHelper.MSC.startOffset % AudioHelper.BFR.duration);
			AudioHelper.SRC.startTime = AudioHelper.CTX.currentTime;
			AudioHelper.MSC.contextCreate = (AudioHelper.CTX.currentTime+AudioHelper.MSC.contextCreate); // FIX!
			
			// Start visualizer.
			//requestAnimFrame(this.draw.bind(this));
		}
		AudioHelper.MSC.isPlaying = !AudioHelper.MSC.isPlaying;
	},
	seekPlayback: function(t) {
		tiles.dev("Seeking to: " + t);
		AudioHelper.SRC[AudioHelper.SRC.stop ? 'stop': 'noteOff'](0);
		AudioHelper.SRC.startTime = AudioHelper.CTX.currentTime;
		AudioHelper.SRC = AudioHelper.CTX.createBufferSource();
		
		// Connect graph
		//this.source.connect(this.analyser);
		
		AudioHelper.SRC.buffer = AudioHelper.BFR;
		AudioHelper.SRC.connect(AudioHelper.CTX.destination);
		AudioHelper.SRC.loop = AudioHelper.MSC.loopSetting;
		
		// Start playback, but make sure we stay in bound of the buffer.
		AudioHelper.SRC[AudioHelper.SRC.start ? 'start' : 'noteOn'](0, t);
		AudioHelper.SRC.startTime = AudioHelper.CTX.currentTime;
	},
	stopPreviousPlayback: function() {
		if (AudioHelper.MSC.isPlaying == true) {
			tiles.dev("Audio playing.... Clearing");
			AudioHelper.SRC[AudioHelper.SRC.stop ? 'stop': 'noteOff'](0);
			AudioHelper.CTX = new (window.AudioContext || window.webkitAudioContext)();
			AudioHelper.BFR = null;
			AudioHelper.SRC = null;
		} else {
			AudioHelper.CTX = new (window.AudioContext || window.webkitAudioContext)();
			tiles.dev("No Audio to clear");
		}
	},
	assignEvents: function() {
		setInterval(tiles.updateMediaInfo,1000);
		tiles.mediaStateTrigger.addEventListener("click",tiles.changeMediaState);
		//AudioHelper.SRC.onended = function(){tiles.songEnd();};
		AudioHelper.CTX.onstatechange = function() {
			console.log(AudioHelper.CTX.state);
		};
		tiles.PlayBackSlider.addEventListener("change",tiles.songSeek,false);
	}
};