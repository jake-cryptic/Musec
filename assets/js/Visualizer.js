var vConf = {
	w:(window.innerWidth*2),
	h:(window.innerHeight*2),
	smoothing:0.7,
	fft_size:512,
	minDec:-200, // -130, -140, -100, -200
	maxDec:25 // 70, 0, 0, 70
};

function MusicVisualizer() {
	this.analyser = tiles.AudioCtx.createAnalyser();

	this.analyser.connect(tiles.AudioCtx.destination);
	this.analyser.minDecibels = vConf.minDec;
	this.analyser.maxDecibels = vConf.maxDec;
	this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
	this.times = new Uint8Array(this.analyser.frequencyBinCount);

	this.isPlaying = false;
	this.startTime = 0;
	this.startOffset = 0;
}

MusicVisualizer.prototype.togglePlayback = function() {
	if (this.isPlaying) {
		this.source[this.source.stop ? 'stop': 'noteOff'](0);
		this.startOffset += tiles.AudioCtx.currentTime - this.startTime;
		console.log('(MusicVisualizer): Paused at', this.startOffset);
	} else {
		this.startTime = tiles.AudioCtx.currentTime;
		console.log('Started at ', this.startOffset);
		this.source = tiles.AudioCtx.createMediaElementSource(tiles.AudioElement);
		// Connect graph
		this.source.connect(this.analyser);
		this.source.loop = false;
		// Start visualisation
		reqFrame(this.draw.bind(this));
	}
	this.isPlaying = !this.isPlaying;
}

MusicVisualizer.prototype.draw = function() {
	this.analyser.smoothingTimeConstant = vConf.smoothing;
	this.analyser.fftSize = vConf.fft_size;

	// Get the frequency data from the currently playing music
	this.analyser.getByteFrequencyData(this.freqs);
	this.analyser.getByteTimeDomainData(this.times);

	var width = Math.floor(1/this.freqs.length, 10);

	var canvas = document.querySelector('canvas');
	var drawContext = canvas.getContext('2d');
	canvas.width = vConf.w;
	canvas.height = vConf.h;
  
	for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
		var value = this.freqs[i];
		var percent = value / 512;
		var height = vConf.h * percent;
		var offset = vConf.h - height - 1;
		var barWidth = vConf.w/this.analyser.frequencyBinCount/2;
		var hue = i/this.analyser.frequencyBinCount * 360;
		drawContext.fillStyle = 'hsl(' + hue + ', 75%, 50%)';
		//drawContext.fillStyle = 'rgba(255,255,255,0.9)';
		drawContext.fillRect(i * barWidth*2.5, offset, barWidth, height);
	}
	
	if (this.isPlaying) {
		reqFrame(this.draw.bind(this));
	}
}