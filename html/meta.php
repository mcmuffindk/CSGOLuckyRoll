<?php require('./config.php') ?>
<meta charset="utf-8">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<link rel="stylesheet" href="css/navbar.css">
<script>
	function notify( status, msg ) {
		var id = +new Date();
		$( "#notifications" ).append( '<div id="' + id + '" class="' + status + ' notification"><h3>' + status + '</h3><h5>' + msg + '</h5></div>' );
		$( "#" + id ).fadeIn( "slow" );
		setTimeout( function () {
			$( "#" + id ).fadeOut( "slow" )
			setTimeout( function () {
				$( "#" + id ).remove();
			}, 400 );
		}, 5000 );
	}

	function session( time ) {
		setInterval(
			function () {
				$.ajax( {
					url: '<?php echo($CONFIG[ 'domain' ]); ?>/session.php',
					cache: false
				} );
			},
			time
		);
	}
	session( 600000 ); // 10 mins
</script>
<script src="/js/chat.js" data-cfasync="false"></script>
<script>

	var config = {
		domain: '<?php echo($CONFIG[ 'domain' ]); ?>',
		steamid: '<?php echo($steamprofile['steamid']); ?>'
	};

</script>
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-116115409-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-116115409-1');
</script>
