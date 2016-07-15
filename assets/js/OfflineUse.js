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
			});
			return true;
		} catch(e) {
			alert("Your device browser doesn't support this");
			return false;
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
	}
};