<?php
require './steamauth/steamauth.php';
require './config.php';

if ( isset( $_SESSION[ 'steamid' ] ) ) {

	require './check.php';
	?>

	<!doctype html>
	<html>

	<head>
		<title>Jackpot</title>
		<?php require('meta.php'); ?>
		<script data-cfasync="false">
			"use strict";

			var items = [];

			function clearItems() {
				while ( items.length > 0 ) {
					var x = items.shift();
					document.getElementById( x ).style.backgroundColor = '';
					document.getElementById( x ).setAttribute( "onclick", "additem(this.dataset.assetid)" );
				}
			}

			function forceRefresh( delay ) {
				clearItems();
				$( '#refresh' ).attr( 'disabled', 'true' );
				$( '#deposit' ).attr( 'disabled', 'true' );
				$.ajax( {
					url: '<?php echo($CONFIG['
					domain ']);?>:<?php echo($CONFIG['
					inventory_port ']);?>/?id=<?php echo($steamprofile[ "steamid" ]); ?>',
					type: 'GET'
				} ).done( function ( data ) {
					var status = data.status;
					var msg = data.msg;
					if ( data.status === 'success' ) {
						setTimeout( function () {
							$.ajax( {
								url: '<?php echo($CONFIG["domain"]);?>/inventory.php?steamid=<?php echo($steamprofile[ "steamid" ]); ?>',
								type: 'GET',
							} ).done( function ( data ) {
								document.getElementById( 'inventory' ).innerHTML = data;

								$( '#refresh' ).removeAttr( 'disabled' );
								$( '#deposit' ).removeAttr( 'disabled' );
								if ( status ) {
									notify( status, msg );
								} else {
									notify( 'error', 'Could not refresh inventory' );
								}

							} ).fail( function ( data ) {
								notify( 'error', 'Could not get inventory' );
							} );
						}, delay );
					}
				} ).fail( function ( data ) {
					$( '#refresh' ).removeAttr( 'disabled' );
					$( '#deposit' ).removeAttr( 'disabled' );
					notify( 'error', 'Could not refresh inventory' );
				} );
			}

			function additem( assetid ) {
				if ( items.length < 10 ) {
					items.push( assetid );
					console.log( items );
					document.getElementById( assetid ).style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
					document.getElementById( assetid ).setAttribute( "onclick", "removeitem(this.dataset.assetid)" );
				} else {
					notify( 'error', 'You can not deposit more than 10 items' );
				}
			}


			function removeitem( assetid ) {
				items = items.filter( function ( item ) {
					return item !== assetid.toString();
				} );
				document.getElementById( assetid ).style.backgroundColor = '';
				document.getElementById( assetid ).setAttribute( "onclick", "additem(this.dataset.assetid)" );
			}

			function deposit() {
				$( '#deposit' ).attr( 'disabled', 'true' );
				$( '#refresh' ).attr( 'disabled', 'true' );
				if ( items.length > 0 && items.length <= 10 ) {
					var iitems = 'steamid=<?php echo($steamprofile[ "steamid" ]); ?>';
					for ( var i = 0; i < items.length; i++ ) {
						var x = i + 1;
						iitems += '&' + x + '=' + items[ i ];
					}

					$.ajax( {
						url: '<?php echo($CONFIG['
						domain ']);?>:<?php echo($CONFIG['
						deposit_port ']);?>?' + iitems,
						type: 'GET'
					} ).done( function ( data ) {
						$( '#deposit' ).removeAttr( 'disabled' );
						$( '#refresh' ).removeAttr( 'disabled' );
						notify( data.status, data.msg );
						clearItems();
					} ).fail( function ( data ) {
						$( '#deposit' ).removeAttr( 'disabled' );
						$( '#refresh' ).removeAttr( 'disabled' );
						notify( 'error', 'Could not deposit item(s)' );
					} );
				} else if ( items.length > 10 ) {
					$( '#deposit' ).removeAttr( 'disabled' );
					$( '#refresh' ).removeAttr( 'disabled' );
					notify( 'error', 'You can max deposit 10 items, you have tried to deposit  ' + items.length );
				} else {
					$( '#deposit' ).removeAttr( 'disabled' );
					$( '#refresh' ).removeAttr( 'disabled' );
					notify( 'error', 'Please select the item(s) you want to deposit' );
				}
			}
		</script>
		<script>
			var players = [];

			function update() {
				$.ajax( {
					dataType: "json",
					url: '<?php echo($CONFIG[ '
					domain ' ]);?>/jackpotupdate.php',
					type: 'GET'
				} ).done( function ( data ) {
					var info = JSON.parse( data );
					$( '#round' ).html( info.round );
					$( '#skinscount' ).html( info.skinscount );
					$( '#price' ).html( info.price );
					$( '#time' ).html( info.time );
					$( '#playercount' ).html( info.playercount );
					$( '#hash' ).html( info.hash );
					//var users = JSON.parse( info.users );
					for ( var i = 0; i < info.playercount; i++ ) {
						var user = JSON.parse( info.users[i] );
						if ( !players.includes( user.id ) ) {
							players.push( user.id );
							$( '#players' ).append( '<div id="' + user.id + '"><img class="user-img" src="' + user.img + '"><p>' + user.name + '</p><p>' + user.price + '</p></div>' );
						}
					}

					if ( info.time === 0 ) {
						// reset everything
					}

				} ).fail( function () {
					notify( 'Failed', 'Could not update jackpot' );
				} );
			}
			$( document ).ready(update);
			setInterval( update, 1000 );
		</script>
	</head>

	<body style="background-color: #1a1a1a; color: #FFFFFF">

		<?php include('navbar.php'); ?>

		<div id="notifications"></div>

		<div id="chat"></div>

		<div id="jackpot">

			<div id="players">

			</div>

			<p id="round"></p>

			<p id="skinscount"></p>

			<p id="price"></p>

			<p id="time"></p>

			<p id="playercount"></p>

			<p id="hash"></p>

		</div>

		<div id="inventory" style="display: none;">

			<?php require('inventory.php'); ?>

			<button id="refresh" onClick="forceRefresh(3000);">Force Refresh</button>

			<br>

			<br>

			<button id="deposit" onclick="deposit()">Deposit</button>

		</div>

	</body>

	</html>

	<?php
}
?>