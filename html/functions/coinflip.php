<?php

function random() {

	// Random config

	$min = 1;
	$max = 100;
	$dec = 10000000;

	// End of random config

	$x = mt_rand( $min * $dec, $max * $dec ) / $dec / 100; // Generating random number
	$y = mt_rand( $min * $dec, $max * $dec ) / $dec / 100; // Generating random number
	$z = mt_rand( 1, 2 ); // Multiply or subtract

	if ( $z == 2 ) {
		echo '- <br>';
		if ( $x > $y && $x - $y > 0 ) { // Check what variable to subtract from
			$roll = $x - $y;
		} else if ( $y > $x && $y - $x > 0 ) {
			$roll = $y - $x;
		} else {
			$roll = $y;
		}
	} else {
		echo '+ <br>';
		if ( ( $x + $y ) < 1 ) { // Check if $x + $y is bigger than 1
			$roll = $x + $y;
		} else {
			$roll = $x;
		}
	}

	return ( $roll ); // Returns the result of the function
}

echo( random() );

?>