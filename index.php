<?php

if (session_status() == PHP_SESSION_NONE)
	session_start();
function __autoload($class) {
	$class = strtolower($class);
	$file = $class . '.php';
	if (file_exists($file))
		include $file;
}

class MyDB extends SQLite3 {
	function __construct() {
		$this->open('sample.db');}
}

$db = new MyDB();
if(!$db)
  echo $db->lastErrorMsg();

error_reporting(E_ALL);

?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>Lenskit Home</title>
	<link href = "Style.css" rel = "stylesheet"/>
	<script src="jquery-3.1.1.min.js"></script>
	<script src="sorttable.js"></script>
	<script src="dropdown.js"></script>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
</head>
<body>
    <div class="lenskit-status">
    	<h3>Lenskit Status</h3>
    </div>
	
	<div class="dropdown">
	  <button onclick="dropdownFunction()" class="dropbtn">Dropdown Test</button>
	  <div id="myDropdown" class="dropdown-content">
	    <a href="#">Link 1</a>
	    <a href="#">Link 2</a>
	    <a href="#">Link 3</a>
	  </div>
	</div>
	
	
    <table class="sortable table-fill">
      <thead><tr>
        <th>Job</th>
        <th>Algorithm</th>
        <th>Data Set</th>
        <th>Status</th>
		<th>Start Time</th>
		<th>Run Time</th>
        <th>Progress</th>
      </tr></thead>
	  <tbody>
		<?php 
		$sql ="SELECT * from JOBS";
		$ret = $db->query($sql);
		while($row = $ret->fetchArray(SQLITE3_ASSOC)) {
			$jid = $row["id"];
			$name = $row["description"];
			$dataset = $row["type"];
			$status = $row["completed"];
			$starttime = $row["startTime"];
			echo "<td>$jid</td>";
			echo "<td>$name</td>";
			echo "<td>$dataset</td>";
			echo "<td>$status</td>";
			echo "<td>$starttime</td>";
			echo "<td></td>";
			echo "<td></td>";
			echo "</tr>";
		}
		$db->close();
		?>
	</tbody>
  </table>
</body>
</html>
