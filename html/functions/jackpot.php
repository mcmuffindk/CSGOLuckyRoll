<?php

function random() {

	$tnot = 9874231238; // Total number of tickets

	// Random config

	$min = 1;
	$max = 100;
	$dec = 10000000;

	// End of random config

	$wp = mt_rand( $min * $dec, $max * $dec ) / $dec; // Winning percentage

	$res = floor( ( $tnot - 0.0000000001 ) * ( $wp / 100 ) ); // Winning ticket

	return array( $wp, $res );

}

echo( random()[ 0 ] );
echo '<br><br>';
echo( random()[ 1 ] );

?>