<?php

ini_set('display_errors', '0');

header( 'Content-Type: application/json' );

require('./config.php');

$link = mysqli_connect($CONFIG[ 'main_db' ]['host'], $CONFIG[ 'main_db' ]['user'], $CONFIG[ 'main_db' ]['pass'], $CONFIG[ 'main_db' ]['database']);

if($_POST['write'] === 1){
	mysqli_query($link, "INSERT INTO chat (user, msg) VALUES (" . $_POST['user'] . ", '" . $_POST['msg'] . "')");
}

if($_POST['read'] === 1){
	$msgs = array();
	$msg = mysqli_query($link, "SELECT * FROM chat ORDER BY id DESC");
	if(mysqli_num_rows($msg) > 0){
		while($row = mysqli_fetch_assoc($msg)){
			array_push($msgs, '{"id": ' . $row['id'] . ',"user": ' . $row['user']  . ',"msg": "' . $row['msg'] . '"}');
		}
	}
	print_r(/*json_encode(*/$msgs/*, JSON_FORCE_OBJECT)*/);
}
?>