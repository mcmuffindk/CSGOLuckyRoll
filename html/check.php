<?php

require './config.php';

$db_main = mysqli_connect( $CONFIG[ 'main_db' ][ 'host' ], $CONFIG[ 'main_db' ][ 'user' ], $CONFIG[ 'main_db' ][ 'pass' ], $CONFIG[ 'main_db' ][ 'database' ] );

if ( !$db_main ) {
	die( "Connection failed: " . mysqli_connect_error() );
}

$result = mysqli_query( $db_main, "SELECT * FROM users WHERE s_id = " . $steamprofile[ "steamid" ] );

if ( mysqli_num_rows( $result ) > 0 ) {

	while ( $row = mysqli_fetch_assoc( $result ) ) {
		if ( !isset( $row[ "t_url" ] ) ) {
			echo '<div><p>Please set your trade link</p><br><p>You can find it <a href="https://steamcommunity.com/id/csgoluckyroll/tradeoffers/privacy#trade_offer_access_url" target="_blank">here</a><br></p><form method="post" action="/update.php"><input type="text" name="url"><input type="submit"></form></div>';
		}
		mysqli_query( $db_main, "UPDATE users SET img = '" . $steamprofile[ 'avatarfull' ] . "', name = '" . $steamprofile[ 'personaname' ] . "' WHERE s_id = " . $steamprofile[ 'steamid' ] );
	}

} else {
	mysqli_query( $db_main, "INSERT INTO users (s_id) VALUES (" . $steamprofile[ "steamid" ] . ")" );
	echo '<div><p>Please set your trade link</p><br><p>You can find it <a href="https://steamcommunity.com/id/csgoluckyroll/tradeoffers/privacy#trade_offer_access_url" target="_blank">here</a><br></p><form method="post" action="/update.php"><input type="text" name="url"><input type="submit"></form></div>';
	mysqli_query( $db_main, "UPDATE users SET img = '" . $steamprofile[ 'avatarfull' ] . "', name = '" . $steamprofile[ 'personaname' ] . "' WHERE s_id = " . $steamprofile[ 'steamid' ] );
}
?>