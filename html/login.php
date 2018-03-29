<?php
set_include_path( $_SERVER[ 'DOCUMENT_ROOT' ] );
require( 'steamauth/steamauth.php' );

if ( isset( $_SESSION[ 'steamid' ] ) ) {

	header( "Location: " . $CONFIG[ 'domain' ] );
	exit();

} else {

	?>

	<!doctype html>
	<html>

	<head>
		<title>Login</title>
		<?php require('meta.php'); ?>
	</head>

	<body style="background-color: #1a1a1a; color: #FFFFFF">

		<?php loginbutton(); ?>

	</body>

	</html>

	<?php
}
?>