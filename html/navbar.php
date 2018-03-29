<div id="navbar">

	<ul>
		<li><a href="/">Home</a>
		</li>
		<li><a href="jackpot.php">Jackpot</a>
		</li>
		<li><a href="support.php">Support</a>
		</li>
		<li class="user-dropdown">
			<a class="user-dropbtn"><img alt="Avatar" src="<?php echo($steamprofile[ 'avatarfull' ]); ?>"><?php echo($steamprofile[ 'personaname' ]); ?></a>
			<div class="user-dropdown-content">
				<a>Link 1</a>
				<a>Link 2</a>
				<a><?php logoutbutton(); ?></a>
			</div>
		</li>
	</ul>

</div>