var WIDTH = window.innerWidth*2;
var HEIGHT = (window.innerHeight*2)-200;
var SMOOTHING = 0.7;
var FFT_SIZE = 512;

function MusicVisualizer() {
	this.analyser = tiles.AudioCtx.createAnalyser();

	this.analyser.connect(tiles.AudioCtx.destination);
	this.analyser.minDecibels = -200; // -130, -140
	this.analyser.maxDecibels = 70; // 70, 0
	this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
	this.times = new Uint8Array(this.analyser.frequencyBinCount);

	this.isPlaying = false;
	this.startTime = 0;
	this.startOffset = 0;
}

MusicVisualizer.prototype.togglePlayback = function() {
	if (this.isPlaying) {
		// Stop playback
		this.source[this.source.stop ? 'stop': 'noteOff'](0);
		this.startOffset += tiles.AudioCtx.currentTime - this.startTime;
		console.log('(MusicVisualizer): Paused at', this.startOffset);
		// Save the position of the play head.
	} else {
		this.startTime = tiles.AudioCtx.currentTime;
		console.log('started at', this.startOffset);
		this.source = tiles.AudioCtx.createMediaElementSource(tiles.AudioElement);
		// Connect graph
		this.source.connect(this.analyser);
		//this.source.buffer = this.buffer;
		this.source.loop = false;
		// Start visualizer.
		reqFrame(this.draw.bind(this));
	}
	this.isPlaying = !this.isPlaying;
}

MusicVisualizer.prototype.draw = function() {
	this.analyser.smoothingTimeConstant = SMOOTHING;
	this.analyser.fftSize = FFT_SIZE;

	// Get the frequency data from the currently playing music
	this.analyser.getByteFrequencyData(this.freqs);
	this.analyser.getByteTimeDomainData(this.times);

	var width = Math.floor(1/this.freqs.length, 10);

	var canvas = document.querySelector('canvas');
	var drawContext = canvas.getContext('2d');
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
  
	for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
		var value = this.freqs[i];
		var percent = value / 512;
		var height = HEIGHT * percent;
		var offset = HEIGHT - height - 1;
		var barWidth = WIDTH/this.analyser.frequencyBinCount/2;
		var hue = i/this.analyser.frequencyBinCount * 360;
		drawContext.fillStyle = 'hsl(' + hue + ', 75%, 50%)';
		//drawContext.fillStyle = 'rgba(255,255,255,0.9)';
		drawContext.fillRect(i * barWidth*2.5, offset, barWidth, height);
	}

	if (this.isPlaying) {
		reqFrame(this.draw.bind(this));
	}
}

MusicVisualizer.prototype.getFrequencyValue = function(freq) {
	var nyquist = tiles.AudioCtx.sampleRate/2;
	var index = Math.round(freq/nyquist * this.freqs.length);
	return this.freqs[index];
}