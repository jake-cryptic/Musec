<?php
/*
 *	Musec API - Error
*/

namespace AbsoluteDouble\Musec;

class Error extends API {
	protected function Report(){
		//$data = base64_decode($_POST["e"]);
		//$arr = (array)json_decode($data);
		$arr = array("15"=>2);
		print_r($this);
		$string = ArrayToCsv($arr);
		
		$eLog = fopen("errorlog.csv", "a") or die('{"response":"error","error":"Error reporting failed :("}');
		fwrite($eLog,$string . "\n");
		fclose($eLog);
		die('{"response":"elog","result":1}');
	}
	private function ArrayToCSV(array &$fields, $delimiter = ',', $enclosure = '"', $encloseAll = false, $nullToMysqlNull = false) {
		$delimiter_esc = preg_quote($delimiter,'/');
		$enclosure_esc = preg_quote($enclosure,'/');

		$output = array(time());	
		foreach ($fields as $field) {
			if ($field === null && $nullToMysqlNull) {
				$output[] = 'NULL';
				continue;
			}
			if (end($fields) == $field) { 
				$field = json_encode($field);
			}
			if ($encloseAll || preg_match("/(?:${delimiter_esc}|${enclosure_esc}|\s)/", $field) ) {
				$output[] = $enclosure . str_replace($enclosure, $enclosure . $enclosure, $field) . $enclosure;
			} else {
				$output[] = $field;
			}
		}

		return implode($delimiter, $output);
	}
}

?>