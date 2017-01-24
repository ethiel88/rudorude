/*
ACEDEVEL NETWORKS S.R.L.
COCHABAMBA - BOLIVIA 2017
*/
var game = new Phaser.Game(568, 320, Phaser.AUTO, "gameDiv");
var dude, suelo, obstaculos, enemigos, musica, enemigosDerrotados, flag= 0;

var mainState = {

	preload: function() {
		if(!game.device.desktop) {
			game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
			game.scale.setMinMax(game.width/2, game.height/2, game.width, game.height);
		} else {
			game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		}
		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;

		//game.stage.backgroundColor = '#000';

		game.load.spritesheet('dude', 'assets/arevalo.png', 68.5, 92);
		game.load.image('fondo', 'assets/cocha.jpg');
		game.load.image('bloqueSuelo', 'assets/grass.png');
		game.load.image('reloj', 'assets/reloj.png');
		game.load.spritesheet('perrito', 'assets/DogRun.png', 128.67, 70);

		game.load.audio('jump', 'assets/jump.wav');

		game.load.audio('musicaFondo', ['assets/sample.mp3', 'assets/sample.ogg']);
	},

	create: function() {
		var bloqueSuelo;
		enemigosDerrotados = 0;
		//atributos del juego
		this.sizeBloque = 70;
		this.nivelVelocidad = -250;
		this.alturadude = 92;
		this.probCliff = 0.4;
		this.probVertical = 0.4;
		this.probMoreVertical = 0.5;

		musica = game.add.audio('musicaFondo');
    	musica.play();

		//agregar fondo al juego
		this.fondoJuego = game.add.tileSprite(0, 
        	0, 
        	game.width, 
        	game.cache.getImage('fondo').height, 'fondo');
		//fondoJuego = game.add.tileSprite(0, 0, 'fondo');


		//agregar el suelo
		suelo = game.add.group();
		suelo.enableBody = true;
		for(var i=0; i<12; ++i){
			x = i * this.sizeBloque;
			y = this.game.height - this.sizeBloque;
			bloqueSuelo = suelo.create(x, y, 'bloqueSuelo');
			bloqueSuelo.body.immovable = true;
			bloqueSuelo.body.velocity.x = this.nivelVelocidad;
		}
		this.lastFloor = bloqueSuelo;
		this.lastCliff = false;
		this.lastVertical = false;


		//agregar al dude
		x = 200;
		y = game.height-(this.sizeBloque+this.alturadude);
		dude = game.add.sprite(x, y, 'dude');
		game.physics.arcade.enable(dude);
		//dude.body.bounce.y = 0.2;
		dude.body.gravity.y = 1000;
		dude.anchor.setTo(0.5, 1);
		//game.camera.follow(dude);
		//dude.body.collideWorldBounds = true;
		dude.animations.add('yell', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], 30, true);
		dude.animations.add('right', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 30, true);
		dude.animations.play('right');


		///obstáculos
		obstaculos = game.add.group();
		obstaculos.enableBody = true;
		obstaculos.createMultiple(12, 'reloj');
		obstaculos.setAll('checkWorldBounds', true);
		obstaculos.setAll('outOfBoundsKill', true);


		//enemigos
		enemigos = game.add.group();


		//temporizadores
		this.timer = game.time.events.loop(2500, this.agregarEnemigo, this);


		//controles
		var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		spaceKey.onDown.add(this.saltar, this);
		game.input.onDown.add(this.saltar, this);
	},

	update: function() {
		this.fondoJuego.tilePosition.x -= 0.05;
		game.physics.arcade.collide(dude, suelo);
		game.physics.arcade.collide(dude, obstaculos);
		game.physics.arcade.collide(dude, enemigos, this.gritar, null, this);
		//game.physics.arcade.overlap(dude, pipes, this.choque, null, this);

		if(dude.alive){
			if(dude.body.touching.down){
				game.add.tween(dude).to({angle: -0}, 100).start();
				dude.body.velocity.x = -this.nivelVelocidad;
				if(flag==0)
					dude.animations.play('right');
				else
					dude.animations.play('yell');

			} else{
				dude.body.velocity.x = 0;
				dude.animations.stop();
				dude.frame = 8;
			}

			if(flag>0)flag--;

			//restart the game if reaching the edge
			/*if(dude.x <= -this.sizeBloque) {
				game.state.start('main');
			}*/
			if(dude.y >= game.height + this.sizeBloque) {
				console.log("GAME OVER");
				musica.pause();
				//alert("PERRUNOS QUE INTENTARON MORDER A NUESTRO HEROE: "+enemigosDerrotados);
				game.state.start('main');
			}
		}

		//generate further terrain
		this.generar_camino();
	},

	saltar: function() {
		if (dude.alive == false)
			return;

		if(dude.body.touching.down){
			dude.body.velocity.y = -550;
			game.add.tween(dude).to({angle: -20}, 100).start();
		}

		// Play sound
		//this.jumpSound.play();
	},

	agregarEnemigo: function(){
		var perro = game.add.sprite(game.width, game.height-this.sizeBloque-62, 'perrito');
		enemigos.add(perro);
		game.physics.arcade.enable(perro);
		perro.body.velocity.x = this.nivelVelocidad - 100;
		perro.animations.add('left', [2, 1, 0, 5, 4, 3, 8, 7, 6], 15, true);
		perro.animations.play('left');
		enemigosDerrotados++;

		if(enemigosDerrotados >= 25){
			game.paused = true;
			alert("FELICIDADES LLEGASTE AL COLEGIO");
			document.getElementById('gameDiv').style.display = 'none';
			document.getElementById('congratulaciones').style.display = 'block';
		}
	},

	generar_camino: function(){
		var i, delta = 0, block;
		for(i = 0; i < suelo.length; i++) {
			if(suelo.getAt(i).body.x <= -this.sizeBloque) {
				if(Math.random() < this.probCliff && !this.lastCliff && !this.lastVertical) {
					delta = 1;
					this.lastCliff = true;
					this.lastVertical = false;
				}
				else if(Math.random() < this.probVertical && !this.lastCliff) {
					this.lastCliff = false;
					this.lastVertical = true;
					block = obstaculos.getFirstExists(false);
					//block.reset(this.lastFloor.body.x + this.sizeBloque, game.height - 3 * this.sizeBloque);
					block.reset(game.width, game.height - (3*this.sizeBloque));
					block.body.velocity.x = this.nivelVelocidad;
					block.body.immovable = true;

					/*if(Math.random() < this.probMoreVertical) {
						block = obstaculos.getFirstExists(false);
						if(block) {
							//block.reset(this.lastFloor.body.x + this.sizeBloque, game.height - 4 * this.sizeBloque);
							block.reset(game.width, game.height - (4 * this.sizeBloque));
							block.body.velocity.x = this.nivelVelocidad;
							block.body.immovable = true;
						}
					}*/
				}
				else {
					this.lastCliff = false;
					this.lastVertical = false;
				}

				suelo.getAt(i).body.x = this.lastFloor.body.x + this.sizeBloque + delta * this.sizeBloque * 1.5;
				this.lastFloor = suelo.getAt(i);
				break;
			}
		}
	},

	gritar: function(){
		console.log("ONDAS PODEROSAS DE VOZ ACTIVENSE!!!");
		flag = 50;
		dude.animations.play('yell');
	},
};

game.state.add('main', mainState);
//game.state.start('main');
