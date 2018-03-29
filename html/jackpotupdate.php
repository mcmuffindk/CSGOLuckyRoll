<?php

header( 'Content-Type: application/json' );

require( './config.php' );

// Create connection
$mysql = mysqli_connect( $CONFIG[ 'main_db' ][ 'host' ], $CONFIG[ 'main_db' ][ 'user' ], $CONFIG[ 'main_db' ][ 'pass' ], $CONFIG[ 'main_db' ][ 'database' ] );

// Check connection
if ( !$mysql ) {
	die( "Connection failed: " . mysqli_connect_error() );
}

$info = mysqli_query( $mysql, "SELECT * FROM pot_low_info ORDER BY round DESC LIMIT 1" );

if ( mysqli_num_rows( $info ) > 0 ) {
	while ( $row = mysqli_fetch_assoc( $info ) ) {
		$GLOBALS[ 'round' ] = $row[ 'round' ];
		$GLOBALS[ 'skinscount' ] = $row[ 'items' ];
		$GLOBALS[ 'price' ] = $row[ 'price' ];
		$GLOBALS[ 'time' ] = $row[ 'time' ];
		$GLOBALS[ 'playercount' ] = $row[ 'players' ];
		$GLOBALS[ 'hash' ] = $row[ 'hash' ];
		$GLOBALS[ 'players' ] = $row[ 'users' ];
	}
}

$users = array();
$players = json_decode($players);

for( $i = 0; $i < count($players); $i++ ) {
	$tmp = mysqli_query( $mysql, "SELECT * FROM users WHERE s_id = " . $players[$i] );
	if ( mysqli_num_rows( $tmp ) > 0 ) {
		while ( $row = mysqli_fetch_assoc( $tmp ) ) {
			array_push( $GLOBALS[ 'users' ], '{"id": ' . $row[ 's_id' ] . ',"name": "' . $row[ 'name' ] . '","img": "' . $row[ 'img' ] . '"}' );
		}
	}
}

//print_r($users);

print_r( json_encode( '{"round": ' . $round . ',"skinscount": ' . $skinscount . ',"price": ' . $price . ',"time": ' . $time . ',"playercount": ' . $playercount . ',"hash": "' . $hash . '","users": ' . json_encode($users, JSON_FORCE_OBJECT) . '}' ) );

?>