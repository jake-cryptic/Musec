// IndexedDB
var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
	IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
	dbVersion = 1.0;

// Create/open database
var request = indexedDB.open("offlineMusic", dbVersion),
	db,
	createObjectStore = function (dataBase) {
		// Create an objectStore
		console.log("Creating objectStore")
		dataBase.createObjectStore("songs");
	},

	getImageFile = function () {
		// Create XHR
		var xhr = new XMLHttpRequest(),
			blob;

		xhr.open("GET", "resources/music/aTest/mvTest.mp3", true);
		// Set the responseType to blob
		xhr.responseType = "blob";

		xhr.addEventListener("load", function () {
			if (xhr.status === 200) {
				console.log("Image retrieved");
				
				// Blob as response
				blob = xhr.response;
				console.log("Blob:" + blob);
				// Put the received blob into IndexedDB
				dbPut(blob);
			}
		}, false);
		// Send XHR
		xhr.send();
	},

	dbPut = function (blob) {
		console.log("Putting songs in IndexedDB");

		// Open a transaction to the database
		var readWriteMode = typeof IDBTransaction.READ_WRITE == "undefined" ? "readwrite" : IDBTransaction.READ_WRITE;
		var transaction = db.transaction(["songs"], readWriteMode);

		// Put the blob into the dabase
		var put = transaction.objectStore("songs").put(blob, "image");

		// Retrieve the file that was just stored
		transaction.objectStore("songs").get("image").onsuccess = function (event) {
			var imgFile = event.target.result;
			console.log("Got song!" + imgFile);

			// Get window.URL object
			var URL = window.URL || window.webkitURL;

			// Create and revoke ObjectURL
			var imgURL = URL.createObjectURL(imgFile);

			tiles.nextSong(imgURL);
			console.log(imgURL);
			// Revoking ObjectURL
			//imgElephant.onload = function() {
			//   window.URL.revokeObjectURL(this.src);
			//}
		};
	};

request.onerror = function (event) {
	console.log("Error creating/accessing IndexedDB database");
};

request.onsuccess = function (event) {
	console.log("Success creating/accessing IndexedDB database");
	db = request.result;
		
	db.onerror = function (event) {
		console.log("Error creating/accessing IndexedDB database");
	};
		
	// Interim solution for Google Chrome to create an objectStore. Will be deprecated
	if (db.setVersion) {
		if (db.version != dbVersion) {
			var setVersion = db.setVersion(dbVersion);
			setVersion.onsuccess = function () {
				createObjectStore(db);
				getImageFile();
			};
		} else {
			getImageFile();
		}
	} else {
		getImageFile();
	}
}
	
// For future use. Currently only in latest Firefox versions
request.onupgradeneeded = function (event) {
	createObjectStore(event.target.result);
};