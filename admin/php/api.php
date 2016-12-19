<?php
/*
 *	Musec API
*/

namespace AbsoluteDouble\Musec;

class API {
	protected $version;
	protected $error;
	protected $utils;
	protected $ReqParameters = [];
	
	private $ClassDir = "classes/";
	
	public function LoadClasses(){
		require($this->ClassDir . "version.class.php");
		require($this->ClassDir . "error.class.php");
		require($this->ClassDir . "utils.class.php");
		
		$this->version = new Version;
		$this->error = new Error;
		$this->utils = new Utils;
	}
	public function HandleRequest(){
		$this->ReqParameters = $_POST;
		
		if (!isset($this->ReqParameters["t"])) {
			$this->error->Report();
		}
	}
}

$api = new API;
$api->LoadClasses();
$api->HandleRequest();

?>