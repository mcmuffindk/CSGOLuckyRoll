<?php

require './steamauth/steamauth.php';
require './config.php';

$db_main = mysqli_connect( $CONFIG[ 'main_db' ][ 'host' ], $CONFIG[ 'main_db' ][ 'user' ], $CONFIG[ 'main_db' ][ 'pass' ], $CONFIG[ 'main_db' ][ 'database' ] );

if ( !$db_main ) {
	die( "Connection failed: " . mysqli_connect_error() );
}

if ( isset( $_POST[ 'url' ] ) ) {

	$result = mysqli_query( $db_main, "UPDATE users SET t_url = '" . $_POST[ 'url' ] . "' WHERE s_id = " . $steamprofile[ "steamid" ] );

	if ( $result ) {
		header( "Location: " . $CONFIG[ 'domain' ] );
		exit();
	}
}
?>