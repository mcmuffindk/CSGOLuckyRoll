<?php

require( './config.php' );

ini_set( 'display_errors', 0 );

$db_inventorys = mysqli_connect( $CONFIG[ 'inventory_db' ][ 'host' ], $CONFIG[ 'inventory_db' ][ 'user' ], $CONFIG[ 'inventory_db' ][ 'pass' ], $CONFIG[ 'inventory_db' ][ 'database' ] );

$db_main = mysqli_connect( $CONFIG[ 'main_db' ][ 'host' ], $CONFIG[ 'main_db' ][ 'user' ], $CONFIG[ 'main_db' ][ 'pass' ], $CONFIG[ 'main_db' ][ 'database' ] );

if ( !$db_inventorys ) {
	die( "Connection failed: " . mysqli_connect_error() );
}

if ( !$db_main ) {
	die( "Connection failed: " . mysqli_connect_error() );
}

if ( $_GET[ 'steamid' ] ) {
	$steamid = $_GET[ 'steamid' ];
} else {
	$steamid = $steamprofile[ "steamid" ];
}

$result = mysqli_query( $db_inventorys, "SELECT name, assetid, icon_url FROM `" . $steamid . "`" );

$items = array();

$sorted_items = array();

if ( mysqli_num_rows( $result ) > 0 ) {

	while ( $row = mysqli_fetch_assoc( $result ) ) {
		array_push( $items, array( "name" => $row[ "name" ], "assetid" => $row[ "assetid" ], "icon_url" => $row[ "icon_url" ] ) );
	}

	for ( $i = 0; $i < count( $items ); $i++ ) {

		$result2 = mysqli_query( $db_main, "SELECT price FROM `pricing` WHERE name = '" . $items[ $i ][ "name" ] . "'" );
		if ( mysqli_num_rows( $result2 ) > 0 ) {

			while ( $row = mysqli_fetch_assoc( $result2 ) ) {

				if ( $row[ "price" ] > $CONFIG[ 'min_deposit' ] && $row[ "price" ] < $CONFIG[ 'max_deposit' ] ) {

					array_push( $sorted_items, array( "name" => $items[ $i ][ "name" ], "assetid" => $items[ $i ][ "assetid" ], "icon_url" => $items[ $i ][ "icon_url" ], "price" => $row[ "price" ] ) );
				}
			}
		}
	}

	for ( $i = 0; $i < count( $sorted_items ); $i++ ) {
		$v = $i + 1;
		$ver = floor( $v / 2 );
		$hor;

		if ( $i % 2 == 0 ) {
			$hor = 1;
		} else {
			$hor = 2;
		}

		echo '<a id="' . $sorted_items[ $i ][ "assetid" ] . '" class="ver-' . $ver . ' hor-' . $hor . '" data-assetid="' . $sorted_items[ $i ][ "assetid" ] . '" onclick="additem(this.dataset.assetid);"><div style="width: 100%; text-align: center;">';
		print_r( "<img style=\"width: 100%; height: auto;\" alt=\"" . $sorted_items[ $i ][ "name" ] . "\" src=\"https://steamcommunity-a.akamaihd.net/economy/image/" . $sorted_items[ $i ][ "icon_url" ] . "/256fx256f\">" );
		echo '<h3 style="margin: 0px">';
		print_r( $sorted_items[ $i ][ "name" ] );
		echo '</h3>';
		echo '<h6 style="margin: 1%;">';
		print_r( '$' . $sorted_items[ $i ][ "price" ] / 100 );
		echo '</h6>';
		echo '</div></a>';
	}

} else {
	echo "No items to display, try refresh your inventory";
}

?>
