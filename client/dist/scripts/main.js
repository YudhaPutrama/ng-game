(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = (function(Game) {

  Game.Prefabs.Bullet = function(game, x, y, player, handleKilledFn){
    this.BULLET_SPEED = 500;

    this.player = player;
    this.game = player.game;

    Phaser.Sprite.call(this, player.game, 0, 0, 'bullet');
    
    this.anchor.setTo(0.5, 0.5);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    this.angle = -Math.PI/2;
    this.kill(); // set dead at first

    this.laserSound = this.game.add.audio('laserFx');

    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;

    // this.events.onKilled.add(this.handleKilled, this);
    if (handleKilledFn) {
      this.events.onKilled.add(handleKilledFn, this);
    }
  }

  Game.Prefabs.Bullet.prototype = Object.create(Phaser.Sprite.prototype);
  Game.Prefabs.Bullet.constructor = Game.Prefabs.Bullet;

  Game.Prefabs.Bullet.prototype.shoot = function() {
    this.rotation = this.player.rotation;

    // var pt = this.game.input.activePointer.position;
    // laser.angle = this.game.physics.arcade.angleBetween(laser, pt);

    this.xVel = Math.cos(this.rotation) * this.BULLET_SPEED;
    this.yVel = Math.sin(this.rotation) * this.BULLET_SPEED;
    this.laserSound.play();
  };

  Game.Prefabs.Bullet.prototype.shootFrom = function(data) {
    this.rotation = data.rotation;

    this.xVel = Math.cos(this.rotation) * this.BULLET_SPEED;
    this.yVel = Math.sin(this.rotation) * this.BULLET_SPEED;
  };

  Game.Prefabs.Bullet.prototype.update = function() {
    var laser = this;
    laser.body.velocity.x = this.xVel;
    laser.body.velocity.y = this.yVel;
  }

});
},{}],2:[function(require,module,exports){
module.exports = (function(Game) {

  Game.Prefabs.Enemies = function(game, count, enemyDesc, hero, parent) {
    var desc = this.desc = enemyDesc;

    // Loading
    Phaser.Group.call(this, game, parent);

    this.count = count = count || 5;

    this.livingEnemies = count;

    this.killedAll = true;

    var enemy,
        padding = 10;
    // Not sure why there is a bug here... bah
    for (var i = 0; i < count; i++) {
      enemy = this.add(
        new Game.Prefabs.Enemy(this.game, 0, 0, desc, enemy || hero)
      );
      enemy.x = enemy ? enemy.x : this.game.rnd.integerInRange(enemy.width, game.width - enemy.width);
      enemy.y = -(this.game.height + enemy.height/2 + i * (enemy.height));
    }
  };

  Game.Prefabs.Enemies.prototype = Object.create(Phaser.Group.prototype);
  Game.Prefabs.Enemies.constructor = Game.Prefabs.Enemies;

  Game.Prefabs.Enemies.prototype.update = function() {
    this.callAll('update');
  };

  Game.Prefabs.Enemies.prototype.reset = function(from, to, speed) {
    this.exists = true;
    this.livingEnemies = this.count;
    this.killedAll = true;

    var i = 0;
    this.forEach(function(enemy) {
      if (i === 0) {
        enemy.resetTarget(to);
      }

      enemy.reload(i, from, speed);
      i++;
    }, this);
  };

  Game.Prefabs.Enemies.prototype.updateStatus = function(enemy, autoKill){
    this.livingEnemies--;

    if(autoKill){
      this.killedAll = false;
    }

    if(this.livingEnemies === 0){
      this.exists = false;

      // Randomly activate a bonus if killed all the enemies
      if(this.killedAll){
        var rdm = this.game.rnd.integerInRange(1, this.count);
        
        if(rdm === 1) {
          this.game.state.getCurrentState().addBonus(enemy);
        }
      }
    }
  };

});
},{}],3:[function(require,module,exports){
module.exports = (function(Game) {
  Game.Prefabs.Enemy = function(game, x, y, desc, target){
    var desc = this.desc = desc;

    var type = 'enemy_' + desc.type || '1';
    // Super call to Phaser.sprite
    Phaser.Sprite.call(this, game, x, y, type);

    // Speed
    this.speed = desc.speed;

    // Target
    this.target = target;

    // Dead - Can't use alive because enemies follow each other
    this.dead = false;

    // Min Distance
    this.minDistance = 10;

    // Explosion
    this.explosion = this.game.add.sprite(0,0, 'explosion');
    this.explosion.anchor.setTo(0.5, 0.5);
    this.explosion.alpha = 0;

    // Enable physics on this object
    this.anchor.setTo(0.5, 0.5);
      this.game.physics.enable(this, Phaser.Physics.ARCADE);

      // Out of bounds callback
      this.events.onOutOfBounds.add(function(){
        this.die(true);
      }, this);
  }

  Game.Prefabs.Enemy.prototype = Object.create(Phaser.Sprite.prototype);
  Game.Prefabs.Enemy.constructor = Game.Prefabs.Enemy;

  Game.Prefabs.Enemy.prototype.update = function(){
    if(!Game.paused){
      // Change velocity to follow the target
      var distance, rotation;
      distance = this.game.math.distance(this.x, this.y, 
        this.target.x, 
        this.target.y);

      if (distance > this.minDistance) {
        rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);

        this.body.velocity.x = Math.cos(rotation) * this.speed;
        this.body.velocity.y = -(Math.sin(rotation) * this.speed);
      } else {
        this.body.velocity.setTo(0, 0);
      }

      // Active enemy
      if(this.y < this.game.height && !this.checkWorldBounds) {
        this.checkWorldBounds = true;
      }
    }
  };

  Game.Prefabs.Enemy.prototype.die = function(autoKill){
    if(!this.dead){
      this.dead = true;
      this.alpha = 0;

      // Explosion
      if(!autoKill){
        this.explosion.reset(this.x, this.y);
        this.explosion.angle = this.game.rnd.integerInRange(0, 360);
        this.explosion.alpha = 0;
        this.explosion.scale.x = 0.2;
        this.explosion.scale.y = 0.2;
        this.game.add.tween(this.explosion)
          .to({alpha: 1, angle: "+30"}, 200, Phaser.Easing.Linear.NONE, true, 0).to({alpha: 0, angle: "+30"}, 300, Phaser.Easing.Linear.NONE, true, 0);
        this.game.add.tween(this.explosion.scale)
          .to({x:1.5, y:1.5}, 500, Phaser.Easing.Cubic.Out, true, 0);
      }

      // Update parent group
      this.parent.updateStatus(this, autoKill);
    }
  };

  Game.Prefabs.Enemy.prototype.pause = function(){
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
  };

  Game.Prefabs.Enemy.prototype.reload = function(i, from){
    // this.x = this.game.width + this.width/2 + i*(this.width + 10);
    this.x = from;
    this.checkWorldBounds = false;
    this.dead = false;
    this.alpha = 1;
    this.y = -this.height + i*(this.height); //this.game.height + this.height/2 + i*(this.height + 10); //from;
  };

  Game.Prefabs.Enemy.prototype.resetTarget = function(to){
    this.target = new Phaser.Point(this.x || this.game.width/2, to);
  };
});
},{}],4:[function(require,module,exports){
module.exports = (function(Game) {

  Game.Prefabs.GameoverPanel = function(game, parent){
    // Super call to Phaser.Group
    Phaser.Group.call(this, game, parent);

    // Add panel
    this.panel = this.game.add.sprite(0, 0, 'panel');
    this.panel.width = this.game.width/2;
    this.panel.height = 150;
    this.add(this.panel);

    // Pause text
    var headerText = Game.winner ? "You won!" : "You lost :(";

    this.textPause = this.game.add
      .bitmapText(game.width/2, -50, 'architectsDaughter', headerText, 28);
    this.textPause.position.x = 
      this.game.width/2 - this.textPause.textWidth/2;
    this.add(this.textPause);

    // Score text
    this.textScore = this.game.add
      .bitmapText(game.width/2, 80, 'architectsDaughter', 'Score : 0', 22);
    this.textScore.position.x = this.game.width/2 - this.textScore.textWidth/2;
    this.add(this.textScore);

    // Highscore text
    this.textHighScore = this.game.add
      .bitmapText(game.width/2, 105, 'architectsDaughter', 'High Score : 0', 22);
    this.textHighScore.position.x = this.game.width/2 - this.textHighScore.textWidth/2;
    this.add(this.textHighScore);

    // Group pos
    this.y = -80;
    this.x = 0;
    this.alpha = 0;

    // Play button
    this.btnReplay = this.game.add.button(this.game.width/2-32, 15, 'btn', this.replay, this, 3, 2, 3, 2);
    this.btnReplay.anchor.setTo(0.5, 0);
    this.add(this.btnReplay);

    // Btn Menu
    this.btnMenu = this.game.add.button(this.game.width/2+28, 15, 'btn', function(){
      this.game.state.getCurrentState().goToMenu();
    }, this, 5, 4, 5, 4);
    this.btnMenu.anchor.setTo(0.5, 0);
    this.add(this.btnMenu);
  };

  Game.Prefabs.GameoverPanel.prototype = Object.create(Phaser.Group.prototype);
  Game.Prefabs.GameoverPanel.constructor = Game.Prefabs.GameoverPanel;

  Game.Prefabs.GameoverPanel.prototype.show = function(score){
    score = score || 0;

    var highScore;
    var beated = false;

    console.log('winner', Game.winner);
    localStorage.setItem('highScore', 0);

    if(!!localStorage){
      highScore = parseInt(localStorage.getItem('highScore'), 10);

      if(!highScore || highScore < score){
        highScore = score;
        localStorage.setItem('highScore', highScore.toString());

        // Add new sprite if best score beated
        if(score > 0){
          beated = true;
          this.newScore = this.game.add.sprite(0, 120, 'new');
          this.newScore.anchor.setTo(0.5, 0.5);
          this.add(this.newScore);
        }
      }
    } else {
      highScore = 0;
    }

    this.textHighScore.setText('High Score: ' + highScore.toString());

    // Center text
    var scoreText = 'Score: ' + score.toString();
    this.textScore.setText(scoreText);

    this.textScore.update();
    this.textScore.position.x = this.game.width/2 - this.textScore.textWidth/2;

    this.textHighScore.update();
    this.textHighScore.position.x = this.game.width/2 - this.textHighScore.textWidth/2;

    this.panel.position.x = this.game.width/2  - this.panel.width/2;

    if(beated){
      this.newScore.x = this.textHighScore.position.x - 30;
    }

    // Show panel
    this.game.add.tween(this)
      .to({
          alpha:1, 
          y:this.game.height/2 - this.panel.height/2}, 
        1000, 
        Phaser.Easing.Exponential.Out, true, 0);
  };

  Game.Prefabs.GameoverPanel.prototype.replay = function(){
    // Start
    Game.reset();
    Game.multiplayer = true; // Hardcoded for demo
    this.game.state.start('Play');
  };
});
},{}],5:[function(require,module,exports){
module.exports = (function(Game) {

  require('./player')(Game);
  require('./gameover_panel')(Game);
  require('./pause_panel')(Game);

  require('./enemies')(Game);
  require('./enemy')(Game);

  require('./laser')(Game);
  require('./bullet')(Game);
});
},{"./bullet":1,"./enemies":2,"./enemy":3,"./gameover_panel":4,"./laser":6,"./pause_panel":7,"./player":8}],6:[function(require,module,exports){
module.exports = (function(Game) {
  Game.Prefabs.Laser = function(game, x, y){
    // Super call to Phaser.sprite
    Phaser.Sprite.call(this, game, x, y, 'laser');

    // Centered anchor
    this.anchor.setTo(0.5, 0.5);

    // Speed
    this.speed = 150;

    // Kill when out of world
    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;

    // Enable physics
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    this.tween = this.game.add.tween(this).to({angle:-360}, 3000, Phaser.Easing.Linear.NONE, true, 0, Number.POSITIVE_INFINITY);
  }

  Game.Prefabs.Laser.prototype = Object.create(Phaser.Sprite.prototype);
  Game.Prefabs.Laser.constructor = Game.Prefabs.Laser;

  Game.Prefabs.Laser.prototype.update = function(){
    if(!Game.paused){
      this.body.velocity.x = -this.speed;
    }else{
      this.body.velocity.x = 0;
    }
  };

  Game.Prefabs.Laser.prototype.reload = function(speed){
    this.alpha = 1;
    this.speed = speed;
    this.scale.x = 1;
    this.scale.y = 1;
  };

  Game.Prefabs.Laser.prototype.die = function(){
    this.game.add.tween(this).to({alpha: 0}, 150, Phaser.Easing.Cubic.Out, true, 0);
    this.game.add.tween(this.scale).to({x:1.5, y:1.5}, 150, Phaser.Easing.Cubic.Out, true, 0);
  };

  Game.Prefabs.Laser.prototype.pause = function(){
    this.tween.pause();
  };

  Game.Prefabs.Laser.prototype.resume = function(){
    this.tween.resume();
  };
});
},{}],7:[function(require,module,exports){
module.exports = (function(Game) {

  Game.Prefabs.PausePanel = function(game, parent){
    // Super call to Phaser.Group
    Phaser.Group.call(this, game, parent);

    // Add panel
    this.panel = this.game.add.sprite(0, 0, 'panel');
    this.panel.width = 480;
    this.panel.height = 80;
    this.add(this.panel);

    // Pause text
    this.textPause = this.game.add.bitmapText(game.width/2, -42, 'kenpixelblocks', 'Pause', 28);
    this.textPause.position.x = this.game.width/2 - this.textPause.textWidth/2;
    this.add(this.textPause);

    // Group pos
    this.y = -80;
    this.x = 0;
    this.alpha = 0;

    // Play button
    this.btnPlay = this.game.add.button(this.game.width/2-32, 15, 'btn', this.unPause, this, 3, 2, 3, 2);
    this.btnPlay.anchor.setTo(0.5, 0);
    this.add(this.btnPlay);

    // Btn Menu
    this.btnMenu = this.game.add.button(this.game.width/2+28, 15, 'btn', function(){
      this.game.state.getCurrentState().goToMenu();
    }, this, 5, 4, 5, 4);
    this.btnMenu.anchor.setTo(0.5, 0);
    this.add(this.btnMenu);
  };

  Game.Prefabs.PausePanel.prototype = Object.create(Phaser.Group.prototype);
  Game.Prefabs.PausePanel.constructor = Game.Prefabs.PausePanel;

  Game.Prefabs.PausePanel.prototype.show = function(){
    this.game.add.tween(this).to({alpha:1, y:this.game.height/2 - this.panel.height/2}, 1000, Phaser.Easing.Exponential.Out, true, 0);
  };

  Game.Prefabs.PausePanel.prototype.unPause = function(){
    this.game.add.tween(this).to({alpha:0, y:-80}, 1000, Phaser.Easing.Exponential.Out, true, 0);
    this.game.state.getCurrentState().playGame();
  };

});
},{}],8:[function(require,module,exports){
module.exports = (function(Game) {

  Game.Prefabs.Player = function(game, x, y, target, id) {
    this.id = id;
    if (target) {
      Phaser.Sprite.call(this, game, x, y, 'hero');
      // Target: mouse
      this.target     = target;

      // Follow pointer
      this.follow = false;

      // Minimum away
      this.minDistance = 10;

      // Speed
      this.speed      = 200;

      // Lives
      this.lives      = 3;

      // Shot delay
      this.shotDelay  = 100;

      // Number of bullets per shot
      this.numBullets   = 10;
      this.timerBullet;

      this.shieldsEnabled = false;
      this.timerShield;
      this.shield = this.game.add.sprite(0, 0, 'shield');
      this.shield.anchor.setTo(0.5, 0.5);
      this.shield.alpha = 0

      // Scale
      this.scale.setTo(1.2, 1.2);
    } else {
      Phaser.Sprite.call(this, game, x, y, 'hero');

      this.scale.setTo(0.5, 0.5);
      this.alpha = 0.8;
      this.x = x;
      this.y = y;

      // State queue
      this.stateQueue = [];
      this.minQueueSize = 10;
      this.maxQueueSize = 30;
      this.previousStateTime = 0;
    }

    // Explosion
    this.explosion = this.game.add.sprite(0,0, 'explosion');
    this.explosion.anchor.setTo(0.5, 0.5);
    this.explosion.alpha = 0;

    this.health = 100;
    // Anchor
    this.anchor.setTo(0.5, 0.5);
    // Rotate 90s so it's facing up
    this.rotation = -Math.PI/2;

    this.game.physics.enable(this, Phaser.Physics.ARCADE);
  };

  Game.Prefabs.Player.prototype   = Object.create(Phaser.Sprite.prototype);
  Game.Prefabs.Player.constructor = Game.Prefabs.Player;

  // Update
  Game.Prefabs.Player.prototype.update = function() {
    if (this.target) {
      this.updateHero();
    } else {
      this.updateRemote();
    }
  }

  Game.Prefabs.Player.prototype.onUpdateFromServer = function(data) {
    if (this.stateQueue.length > this.maxQueueSize) {
      this.stateQueue.splice(this.minQueueSize, this.maxQueueSize - this.minQueueSize);
    }
    this.stateQueue.unshift(data);
  };

  Game.Prefabs.Player.prototype.updateHero = function() {
    var distance, rotation;
      // Follow pointer
    if (this.follow) {
      distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);

      if (distance > this.minDistance) {
        rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);

        this.body.velocity.x = Math.cos(rotation) * this.speed * Math.min(distance / 120, 2);
        this.body.velocity.y = Math.sin(rotation) * this.speed * Math.min(distance / 120, 2);
        this.rotation = rotation;
      } else {
        this.body.velocity.setTo(0, 0);
      }
    } else {
      this.body.velocity.setTo(0, 0);
    }

    // Shields
    if (this.shieldsEnabled) {
      this.shield.x = this.x;
      this.shield.y = this.y;
      this.shield.rotation = this.rotation;
    }
  };

  Game.Prefabs.Player.prototype.updateRemote = function() {
    if (this.stateQueue.length > this.minQueueSize) {
      var earliestQueue = this.stateQueue.pop();

      
      if (!this.previousStateTime) {
        this.previousStateTime = new Date().getTime();
      }

      var tweenTime = Math.abs(this.previousStateTime - (earliestQueue.timestamp + 10));
      this.game.add.tween(this)
        .to({
          x: earliestQueue.x,
          y: earliestQueue.y,
          rotation: earliestQueue.rotation
        }, tweenTime, 
        Phaser.Easing.Linear.None, true, 0);

      this.previousStateTime = earliestQueue.timestamp;
    }
  };

  Game.Prefabs.Player.prototype.die = function(autoKill){
    if(!this.dead){
      this.dead = true;
      this.alpha = 0;

      // Explosion
      if(!autoKill){
        this.showExplosion();
      }
    }
  };

  Game.Prefabs.Player.prototype.wasHitBy = function(bullet, player) {
    if (!this.shieldsEnabled) {
      this.health -= 10;

      if (this.health <= 0) {
        this.die();
      } else {
        this.enableShield(0.3);
        this.showExplosion();
      }

      return true;
    }
  };

  Game.Prefabs.Player.prototype.showExplosion = function() {
    this.explosion.reset(this.x, this.y);
    this.explosion.alpha = 0;
    this.explosion.scale.x = 0.2;
    this.explosion.scale.y = 0.2;
    this.game.add.tween(this.explosion)
    .to({alpha: 1, angle: "+30"}, 200, Phaser.Easing.Linear.NONE, true, 0).to({alpha: 0, angle: "+30"}, 300, Phaser.Easing.Linear.NONE, true, 0);
    this.game.add.tween(this.explosion.scale)
    .to({x:1.5, y:1.5}, 500, Phaser.Easing.Cubic.Out, true, 0);
  };

  Game.Prefabs.Player.prototype.enableShield = function(duration) {
    this.shieldsEnabled = true;

    if (this.timerShield && !this.timerShield.expired) {
      this.timerShield.destroy();
    }

    this.timerShield = this.game.time.create(true);
    this.timerShield.add(Phaser.Timer.SECOND * duration, this.disableShield, this);
    this.timerShield.start();

    this.game.add.tween(this.shield)
      .to({alpha: 1}, 300, Phaser.Easing.Cubic.Out, true, 0);
  };

  Game.Prefabs.Player.prototype.disableShield = function() {
    this.game.add.tween(this.shield)
      .to({alpha: 0}, 300, 
        Phaser.Easing.Linear.NONE, 
        true,
        0, 6, true).onComplete.add(function() {
          this.shieldsEnabled = false;
        }, this);
  }
});
},{}],9:[function(require,module,exports){
angular.module('app.game')
.directive('gameCanvas', function($window, mySocket, $injector) {

  var linkFn = function(scope, ele, attrs) {
    var w = angular.element($window);
    w.bind('resize', function(evt) {
      // If the window is resized
    });

    mySocket.then(function(sock) {
      require('./main.js')(
        ele, scope, sock, 
        scope.ngModel, 
        scope.mapId, 
        $injector);
    });
  };

  return {
    scope: {
      ngModel: '=',
      mapId: '='
    },
    template: '<div id="game-canvas"></div>',
    compile: function(iEle, iAttrs) {
      return linkFn;
    }
  }
})
},{"./main.js":14}],10:[function(require,module,exports){
angular.module('app.game')
.controller('GameController', function($scope, $stateParams, mySocket, User) {
  $scope.players = [];
  $scope.mapId = $stateParams.id || '1';

  $scope.$on('game:getAvailablePlayers', function(players) {
    $scope.players = players;
  });

  $scope.$on('$destroy', function() {
    $scope.$emit('player leaving');
  });

});
},{}],11:[function(require,module,exports){
module.exports =
angular.module('app.game', ['ui.router', 'app.user'])
.config(function($stateProvider) {
  $stateProvider
    .state('game', {
      url: '/game',
      abstract: true,
      templateUrl: '/scripts/game/template.html'
    })
    .state('game.play', {
      url: '/:id',
      template: '<div>\
        <div id="gameCanvas" game-canvas="players" map-id="mapId"></div>\
      </div>',
      controller: 'GameController',
      onEnter: function(Game) {
        Game.playing = true;
      },
      onExit: function(Game) {
        Game.playing = false;
      }
    })
})

require('./game_controller.js')
require('./game_canvas.js');
},{"./game_canvas.js":9,"./game_controller.js":10}],12:[function(require,module,exports){
'use strict';


/**
* @author       Jeremy Dowell <jeremy@codevinsky.com>
* @license      {@link http://www.wtfpl.net/txt/copying/|WTFPL}
*/

/**
* Creates a new `Juicy` object.
*
* @class Phaser.Plugin.Juicy
* @constructor
*
* @param {Phaser.Game} game Current game instance.
*/

Phaser.Plugin.Juicy = function (game) {

  Phaser.Plugin.call(this, game);

  /**
  * @property {Phaser.Rectangle} _boundsCache - A reference to the current world bounds.
  * @private
  */
  this._boundsCache = Phaser.Utils.extend(false, {}, this.game.world.bounds);

  /**
  * @property {number} _shakeWorldMax - The maximum world shake radius
  * @private
  */
  this._shakeWorldMax = 20;

  /**
  * @property {number} _shakeWorldTime - The maximum world shake time
  * @private
  */
  this._shakeWorldTime = 0;

  /**
  * @property {number} _trailCounter - A count of how many trails we're tracking
  * @private
  */  
  this._trailCounter = 0;

  /**
  * @property {object} _overScales - An object containing overscaling configurations
  * @private
  */  
  this._overScales = {};

  /**
  * @property {number} _overScalesCounter - A count of how many overScales we're tracking
  * @private
  */  
  this._overScalesCounter = 0;
};


Phaser.Plugin.Juicy.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.Juicy.prototype.constructor = Phaser.Plugin.Juicy;



/**
* Creates a new `Juicy.ScreenFlash` object.
*
* @class Phaser.Plugin.Juicy.ScreenFlash
* @constructor
*
* @param {Phaser.Game} game -  Current game instance.
* @param {string} color='white' - The color to flash the screen.
* @memberof Phaser.Plugin.Juicy
*/
Phaser.Plugin.Juicy.ScreenFlash = function(game, color) {
  color = color || 'white';
  var bmd = game.add.bitmapData(game.width, game.height);
  bmd.ctx.fillStyle = 'white';
  bmd.ctx.fillRect(0,0, game.width, game.height);

  Phaser.Sprite.call(this, game, 0,0, bmd);
  this.alpha = 0;
};

Phaser.Plugin.Juicy.ScreenFlash.prototype = Object.create(Phaser.Sprite.prototype);
Phaser.Plugin.Juicy.ScreenFlash.prototype.constructor = Phaser.Plugin.Juicy.ScreenFlash;


/*
* Flashes the screen
*
* @param {number} [maxAlpha=1] - The maximum alpha to flash the screen to
* @param {number} [duration=100] - The duration of the flash in milliseconds
* @method Phaser.Plugin.Juicy.ScreenFlash.prototype.flash
* @memberof Phaser.Plugin.Juicy.ScreenFlash
*/
Phaser.Plugin.Juicy.ScreenFlash.prototype.flash = function(maxAlpha, duration) {
  maxAlpha = maxAlpha || 1;
  duration = duration || 100;
  var flashTween = this.game.add.tween(this).to({alpha: maxAlpha}, 100, Phaser.Easing.Bounce.InOut, true,0, 0, true);
  flashTween.onComplete.add(function() {
    this.alpha = 0;
  }, this);
};

/**
* Creates a new `Juicy.Trail` object.
*
* @class Phaser.Plugin.Juicy.Trail
* @constructor
*
* @param {Phaser.Game} game -  Current game instance.
* @param {number} [trailLength=100] - The length of the trail
* @param {number} [color=0xFFFFFF] - The color of the trail
* @memberof Phaser.Plugin.Juicy
*/
Phaser.Plugin.Juicy.Trail = function(game, trailLength, color) {
  Phaser.Graphics.call(this, game, 0,0);
  
  /**
  * @property {Phaser.Sprite} target - The target sprite whose movement we want to create the trail from
  */
  this.target = null;
  /**
  * @property {number} trailLength - The number of segments to use to create the trail
  */
  this.trailLength = trailLength || 100;
  /**
  * @property {number} trailWidth - The width of the trail
  */
  this.trailWidth = 15.0;

  /**
  * @property {boolean} trailScale - Whether or not to taper the trail towards the end
  */
  this.trailScaling = false;

  /**
  * @property {Phaser.Sprite} trailColor - The color of the trail
  */
  this.trailColor = color || 0xFFFFFF;
  
  /**
  * @property {Array<Phaser.Point>} _segments - A historical collection of the previous position of the target
  * @private
  */
  this._segments = [];
  /**
  * @property {Array<number>} _verts - A collection of vertices created from _segments
  * @private
  */
  this._verts = [];
  /**
  * @property {Array<Phaser.Point>} _segments - A collection of indices created from _verts
  * @private
  */
  this._indices = [];

};

Phaser.Plugin.Juicy.Trail.prototype = Object.create(Phaser.Graphics.prototype);
Phaser.Plugin.Juicy.Trail.prototype.constructor = Phaser.Plugin.Juicy.Trail;

/**
* Updates the Trail if a target is set
*
* @method Phaser.Plugin.Juicy.Trail#update
* @memberof Phaser.Plugin.Juicy.Trail
*/

Phaser.Plugin.Juicy.Trail.prototype.update = function() {
  if(this.target) {
    this.x = this.target.x;
    this.y = this.target.y;
    this.addSegment(this.target.x, this.target.y);
    this.redrawSegments(this.target.x, this.target.y);
  }
};

/**
* Adds a segment to the segments list and culls the list if it is too long
* 
* @param {number} [x] - The x position of the point
* @param {number} [y] - The y position of the point
* 
* @method Phaser.Plugin.Juicy.Trail#addSegment
* @memberof Phaser.Plugin.Juicy.Trail
*/
Phaser.Plugin.Juicy.Trail.prototype.addSegment = function(x, y) {
  var segment;

  while(this._segments.length > this.trailLength) {
    segment = this._segments.shift();
  }
  if(!segment) {
    segment = new Phaser.Point();
  }

  segment.x = x;
  segment.y = y;

  this._segments.push(segment);
};


/**
* Creates and draws the triangle trail from segments
* 
* @param {number} [offsetX] - The x position of the object
* @param {number} [offsetY] - The y position of the object
* 
* @method Phaser.Plugin.Juicy.Trail#redrawSegment
* @memberof Phaser.Plugin.Juicy.Trail
*/
Phaser.Plugin.Juicy.Trail.prototype.redrawSegments = function(offsetX, offsetY) {
  this.clear();
  var s1, // current segment
      s2, // previous segment
      vertIndex = 0, // keeps track of which vertex index we're at
      offset, // temporary storage for amount to extend line outwards, bigger = wider
      ang, //temporary storage of the inter-segment angles
      sin = 0, // as above
      cos = 0; // again as above

  // first we make sure that the vertice list is the same length as we we want
  // each segment (except the first) will create to vertices with two values each
  if (this._verts.length !== (this._segments.length -1) * 4) {
    // if it's not correct, we clear the entire list
    this._verts = [];
  }

  // now we loop over all the segments, the list has the "youngest" segment at the end
  var prevAng = 0;
  
  for(var j = 0; j < this._segments.length; ++j) {
    // store the active segment for convenience
    s1 = this._segments[j];

    // if there's a previous segment, time to do some math
    if(s2) {
      // we calculate the angle between the two segments
      // the result will be in radians, so adding half of pi will "turn" the angle 90 degrees
      // that means we can use the sin and cos values to "expand" the line outwards
      ang = Math.atan2(s1.y - s2.y, s1.x - s2.x) + Math.PI / 2;
      sin = Math.sin(ang);
      cos = Math.cos(ang);

      // now it's time to creat ethe two vertices that will represent this pair of segments
      // using a loop here is probably a bit overkill since it's only two iterations
      for(var i = 0; i < 2; ++i) {
        // this makes the first segment stand out to the "left" of the line
        // annd the second to the right, changing that magic number at the end will alther the line width
        offset = ( -0.5 + i / 1) * this.trailWidth;

        // if trail scale effect is enabled, we scale down the offset as we move down the list
        if(this.trailScaling) {
          offset *= j / this._segments.length;
        }

        // finally we put to values in the vert list
        // using the segment coordinates as a base we add the "extended" point
        // offsetX and offsetY are used her to move the entire trail
        this._verts[vertIndex++] = s1.x + cos * offset - offsetX;
        this._verts[vertIndex++] = s1.y + sin * offset - offsetY;
      }
    }
    // finally store the current segment as the previous segment and go for another round
    s2 = s1.copyTo({});
  }
  // we need at least four vertices to draw something
  if(this._verts.length >= 8) {
    // now, we have a triangle "strip", but flash can't draw that without 
    // instructions for which vertices to connect, so it's time to make those
    
    // here, we loop over all the vertices and pair them together in triangles
    // each group of four vertices forms two triangles
    for(var k = 0; k < this._verts.length; k++) {
      this._indices[k * 6 + 0] = k * 2 + 0;
      this._indices[k * 6 + 1] = k * 2 + 1;
      this._indices[k * 6 + 2] = k * 2 + 2;
      this._indices[k * 6 + 3] = k * 2 + 1;
      this._indices[k * 6 + 4] = k * 2 + 2;
      this._indices[k * 6 + 5] = k * 2 + 3;
    }
    this.beginFill(this.trailColor);
    this.drawTriangles(this._verts, this._indices);
    this.endFill();
    
  }
};






/**
* Add a Sprite reference to this Plugin.
* All this plugin does is move the Sprite across the screen slowly.
* @type {Phaser.Sprite}
*/

/**
* Begins the screen shake effect
* 
* @param {number} [duration=20] - The duration of the screen shake
* @param {number} [strength=20] - The strength of the screen shake
* 
* @method Phaser.Plugin.Juicy#redrawSegment
* @memberof Phaser.Plugin.Juicy
*/
Phaser.Plugin.Juicy.prototype.shake = function (duration, strength) {
  this._shakeWorldTime = duration || 20;
  this._shakeWorldMax = strength || 20;
  this.game.world.setBounds(this._boundsCache.x - this._shakeWorldMax, this._boundsCache.y - this._shakeWorldMax, this._boundsCache.width + this._shakeWorldMax, this._boundsCache.height + this._shakeWorldMax);
};


/**
* Creates a 'Juicy.ScreenFlash' object
*
* @param {string} color - The color of the screen flash
* 
* @type {Phaser.Plugin.Juicy.ScreenFlash}
*/

Phaser.Plugin.Juicy.prototype.createScreenFlash = function(color) {
    return new Phaser.Plugin.Juicy.ScreenFlash(this.game, color);
};


/**
* Creates a 'Juicy.Trail' object
*
* @param {number} length - The length of the trail
* @param {number} color - The color of the trail
* 
* @type {Phaser.Plugin.Juicy.Trail}
*/
Phaser.Plugin.Juicy.prototype.createTrail = function(length, color) {
  return new Phaser.Plugin.Juicy.Trail(this.game, length, color);
};


/**
* Creates the over scale effect on the given object
*
* @param {Phaser.Sprite} object - The object to over scale
* @param {number} [scale=1.5] - The scale amount to overscale by
* @param {Phaser.Point} [initialScale=new Phaser.Point(1,1)] - The initial scale of the object
* 
*/
Phaser.Plugin.Juicy.prototype.overScale = function(object, scale, initialScale) {
  scale = scale || 1.5;
  var id = this._overScalesCounter++;
  initialScale = initialScale || new Phaser.Point(1,1);
  var scaleObj = this._overScales[id];
  if(!scaleObj) {
    scaleObj = {
      object: object,
      cache: initialScale.copyTo({})
    };
  } 
  scaleObj.scale = scale;
  
  this._overScales[id] = scaleObj;
};

/**
* Creates the jelly effect on the given object
*
* @param {Phaser.Sprite} object - The object to gelatinize
* @param {number} [strength=0.2] - The strength of the effect
* @param {number} [delay=0] - The delay of the snap-back tween. 50ms are automaticallly added to whatever the delay amount is.
* @param {Phaser.Point} [initialScale=new Phaser.Point(1,1)] - The initial scale of the object
* 
*/
Phaser.Plugin.Juicy.prototype.jelly = function(object, strength, delay, initialScale) {
  strength = strength || 0.2;
  delay = delay || 0;
  initialScale = initialScale ||  new Phaser.Point(1, 1);
  
  this.game.add.tween(object.scale).to({x: initialScale.x + (initialScale.x * strength)}, 50, Phaser.Easing.Quadratic.InOut, true, delay)
  .to({x: initialScale.x}, 600, Phaser.Easing.Elastic.Out, true);

  this.game.add.tween(object.scale).to({y: initialScale.y + (initialScale.y * strength)}, 50, Phaser.Easing.Quadratic.InOut, true, delay + 50)
  .to({y: initialScale.y}, 600, Phaser.Easing.Elastic.Out, true);
};

/**
* Creates the mouse stretch effect on the given object
*
* @param {Phaser.Sprite} object - The object to mouse stretch
* @param {number} [strength=0.5] - The strength of the effect
* @param {Phaser.Point} [initialScale=new Phaser.Point(1,1)] - The initial scale of the object
* 
*/
Phaser.Plugin.Juicy.prototype.mouseStretch = function(object, strength, initialScale) {
    strength = strength || 0.5;
    initialScale = initialScale || new Phaser.Point(1,1);
    object.scale.x = initialScale.x + (Math.abs(object.x - this.game.input.activePointer.x) / 100) * strength;
    object.scale.y = initialScale.y + (initialScale.y * strength) - (object.scale.x * strength);
};

/**
* Runs the core update function and causes screen shake and overscaling effects to occur if they are queued to do so.
*
* @method Phaser.Plugin.Juicy#update
* @memberof Phaser.Plugin.Juicy
*/
Phaser.Plugin.Juicy.prototype.update = function () {
  var scaleObj;
  // Screen Shake
  if(this._shakeWorldTime > 0) { 
    var magnitude = (this._shakeWorldTime / this._shakeWorldMax) * this._shakeWorldMax;
    var x = this.game.rnd.integerInRange(-magnitude, magnitude);
    var y = this.game.rnd.integerInRange(-magnitude, magnitude);

    this.game.camera.x = x;
    this.game.camera.y = y;
    this._shakeWorldTime--;
    if(this._shakeWorldTime <= 0) {
      this.game.world.setBounds(this._boundsCache.x, this._boundsCache.x, this._boundsCache.width, this._boundsCache.height);
    }
  }

  // over scales
  for(var s in this._overScales) {
    if(this._overScales.hasOwnProperty(s)) {
      scaleObj = this._overScales[s];
      if(scaleObj.scale > 0.01) {
        scaleObj.object.scale.x = scaleObj.scale * scaleObj.cache.x;
        scaleObj.object.scale.y = scaleObj.scale * scaleObj.cache.y;
        scaleObj.scale -= this.game.time.elapsed * scaleObj.scale * 0.35;
      } else {
        scaleObj.object.scale.x = scaleObj.cache.x;
        scaleObj.object.scale.y = scaleObj.cache.y;
        delete this._overScales[s];
      }
    }
  }
};

// for browserify compatibility
if(module && module.exports) {
  module.exports = Phaser.Plugin.Juicy;
}



// Draw Triangles Polyfill for back compatibility
if(!Phaser.Graphics.prototype.drawTriangle) {
  Phaser.Graphics.prototype.drawTriangle = function(points, cull) {
      var triangle = new Phaser.Polygon(points);
      if (cull) {
          var cameraToFace = new Phaser.Point(this.game.camera.x - points[0].x, this.game.camera.y - points[0].y);
          var ab = new Phaser.Point(points[1].x - points[0].x, points[1].y - points[0].y);
          var cb = new Phaser.Point(points[1].x - points[2].x, points[1].y - points[2].y);
          var faceNormal = cb.cross(ab);
          if (cameraToFace.dot(faceNormal) > 0) {
              this.drawPolygon(triangle);
          }
      } else {
          this.drawPolygon(triangle);
      }
      return;
  };

  /*
  * Draws {Phaser.Polygon} triangles 
  *
  * @param {Array<Phaser.Point>|Array<number>} vertices - An array of Phaser.Points or numbers that make up the vertices of the triangles
  * @param {Array<number>} {indices=null} - An array of numbers that describe what order to draw the vertices in
  * @param {boolean} [cull=false] - Should we check if the triangle is back-facing
  * @method Phaser.Graphics.prototype.drawTriangles
  */

  Phaser.Graphics.prototype.drawTriangles = function(vertices, indices, cull) {

      var point1 = new Phaser.Point(),
          point2 = new Phaser.Point(),
          point3 = new Phaser.Point(),
          points = [],
          i;

      if (!indices) {
          if(vertices[0] instanceof Phaser.Point) {
              for(i = 0; i < vertices.length / 3; i++) {
                  this.drawTriangle([vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]], cull);
              }
          } else {
              for (i = 0; i < vertices.length / 6; i++) {
                  point1.x = vertices[i * 6 + 0];
                  point1.y = vertices[i * 6 + 1];
                  point2.x = vertices[i * 6 + 2];
                  point2.y = vertices[i * 6 + 3];
                  point3.x = vertices[i * 6 + 4];
                  point3.y = vertices[i * 6 + 5];
                  this.drawTriangle([point1, point2, point3], cull);
              }

          }
      } else {
          if(vertices[0] instanceof Phaser.Point) {
              for(i = 0; i < indices.length /3; i++) {
                  points.push(vertices[indices[i * 3 ]]);
                  points.push(vertices[indices[i * 3 + 1]]);
                  points.push(vertices[indices[i * 3 + 2]]);
                  if(points.length === 3) {
                      this.drawTriangle(points, cull);    
                      points = [];
                  }
                  
              }
          } else {
              for (i = 0; i < indices.length; i++) {
                  point1.x = vertices[indices[i] * 2];
                  point1.y = vertices[indices[i] * 2 + 1];
                  points.push(point1.copyTo({}));
                  if (points.length === 3) {
                      this.drawTriangle(points, cull);
                      points = [];
                  }
              }
          }
      }
  };
}
},{}],13:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
  } else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);
},{}],14:[function(require,module,exports){
module.exports =
(function(ele, scope, socket, maps, mapId, injector) {

  // Require lib
  require('./lib/juicy');
  var UUID = require('./lib/uuid');
  
  var height  = parseInt(ele.css('height'), 10),
      width   = parseInt(ele.css('width'), 10);
  var game = new Phaser.Game(width, height, Phaser.AUTO, 'game-canvas');

  var Game    = require('./states'),
      states  = Game.States;

  game.state.add('Boot', states.Boot);
  game.state.add('Preloader', states.Preloader);
  game.state.add('MainMenu', states.MainMenu);
  game.state.add('Play', states.Play);
  // game.state.add('Game', require('./states/game'));
  // game.state.add('NextLevel', require('./states/next_level'));
  game.state.add('GameOver', states.GameOver);

  game.mapId = mapId;
  game.socket = socket;
  game.scope  = scope;
  Game.maps           = maps;
  Game.remotePlayers = [];

  var user  = injector.get('User'),
      g     = Game;

  g.socket        = socket;
  g.mapId         = mapId;
  g.currentPlayer = user.getCurrentUser();

  // Turn off music
  scope.$on('game:toggleMusic', function() {
    game.state.states.Preloader.toggleMusic();
  });

  // Cleanup
  scope.$on('$destroy', function() {
    socket.emit('playerLeftMap', {
      playerId: g.sid,
      mapId: g.mapId
    });
    game.destroy();
  });

  // Network socket events
  Game.connected = true;
  console.log('connected data data', socket, g.currentPlayer);
  // g.sid     = data.id;
  g.playerName = 'Ari';
  // g.playerName = prompt("Please enter your name") || 'Player';
  g.socket.emit('setPlayerName', { name: g.playerName });

  g.socket.on('playerDetails', function(data) {
    g.sid = data.id;
    console.log('GAME GAME', game);
    game.state.start('Boot');
  });

});
},{"./lib/juicy":12,"./lib/uuid":13,"./states":17}],15:[function(require,module,exports){
module.exports = (function(Game) {

  Game.States.Boot = function(game) {};

  Game.States.Boot.prototype = {
    resizeCanvasToContainerElement: function() {
      var canvas = this.game.canvas;

      var canvas          = this.game.canvas,
          containerWidth  = canvas.clientWidth,
          containerHeight = canvas.clientHeight;

      var xScale = containerWidth / this.width;
      var yScale = containerHeight / this.height;
      var newScale = Math.min( xScale, yScale );

      this.scale.width = newScale * this.game.width;
      this.scale.height = newScale * this.game.height;
      this.scale.setSize(containerWidth, containerHeight);

      Game.width  = this.game.width;
      Game.height = this.game.height;
    },
    init: function () {
      this.input.maxPointers = 1;
      this.stage.disableVisibilityChange = true;

      if (this.game.device.desktop) {
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // this.scale.setMinMax(480, 260, 2048, 1536);
        // this.scale.pageAlignHorizontally = true;
        // this.scale.pageAlignVertically = true;
      } else {
        this.game.stage.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.stage.scale.minWidth =  480;
        this.game.stage.scale.minHeight = 260;
        this.game.stage.scale.maxWidth = 640;
        this.game.stage.scale.maxHeight = 480;
        this.game.stage.scale.forceLandscape = true;
        this.game.stage.scale.pageAlignHorizontally = true;
      }

      this.scale.setResizeCallback(this.handleResizeEvent, this);

      this.scale.setScreenSize(true);
      this.scale.refresh();
    },
    preload: function(){
              //  Here we load the assets required for our preloader (in this case a background and a loading bar)
      this.load.image('menu_background', 'assets/menu_background.jpg');
      this.load.image('preloader', 'assets/preloader.gif');
      this.load.json('levels', 'assets/levels.json');
    },

    create: function(){
      if (this.game.device.desktop) {
       this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; //always show whole game
        this.game.stage.scale.pageAlignHorizontally = true;
      } else {
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.forceLandscape = false;
        this.scale.pageAlignHorizontally = true;
      }
      this.resizeCanvasToContainerElement();
      Game.initialized = true;
      this.state.start('Preloader');
    },

    handleResizeEvent: function() {
      this.resizeCanvasToContainerElement();
    }
  }

});
},{}],16:[function(require,module,exports){
module.exports = (function(Game) {

  Game.States.GameOver = function(game) {

  };

  Game.States.GameOver.prototype.create = function() {
    if (Game.multiplayer) {
      // Gameover panel
      this.gameoverPanel = new Game.Prefabs.GameoverPanel(this.game);
      this.game.add.existing(this.gameoverPanel);

      this.gameoverPanel.show(Game.score);
    }
  };
});
},{}],17:[function(require,module,exports){
var Game = {
  name: 'ng-invader',
  // States of our game
  States: {},
  // Prefabs
  Prefabs: {},
  // Levels
  Levels: {},

  orientated: true,

  backgroundX: 0,
  backgroundY: 0,

  paused: true,

  multiplayer: true,

  // Map
  mapData: {},

  // Socket
  socket: {},
  remotePlayers: [],
  toAdd: [],
  toRemove: [],
  latency: 0,

  width: 800,
  height: 600,

  // Helpers
  cpc: function(x) {
    return x * 64 + 32;
  },

  playerById: function(id) {
    for (var i = 0; i < this.remotePlayers.length; i++) {
      if (this.remotePlayers[i].id === id) {
        return this.remotePlayers[i];
      }
    }
    return false;
  },

  resetCallbacks: [],
  reset: function() {
    _.map(Game.resetCallbacks, function(i,v) {
      Game.resetCallbacks[i].apply(this);
    });
  },

  winner: false
};

require('../entities')(Game);

require('./boot')(Game);
require('./preloader')(Game);
require('./mainmenu')(Game);
require('./play')(Game);
require('./game_over')(Game);

module.exports = Game;
},{"../entities":5,"./boot":15,"./game_over":16,"./mainmenu":18,"./play":19,"./preloader":20}],18:[function(require,module,exports){
/*
 * The MainMenu state is responsible for showing the
 * main menu of the game. 
 * 
 * The main menu has a scrolling background with two options
 * of new solo game or new multiplayer game. The difference
 * between the two is that `Game.multiplayer` is set to true
 * on the new mulitplayer option. 
 */
module.exports = (function(Game) {
  Game.States.MainMenu = function(game) {
    this.juicy;
    this.screenFlash;
  }

  Game.States.MainMenu.prototype = {
    create: function() {

      var game = this.game;

      this.startTime = game.time.now;
      
      var image = this.game.cache.getImage('logo'),
        centerX = this.world.centerX,
        centerY = this.world.centerY - image.height,
        endY    = this.world.height + image.height,
        textPadding = this.game.device.desktop ? 60 : 30;

      // Menu background
      this.background = game.add.tileSprite(0, 0, this.world.width, this.world.height, 'menu_background');
      this.background.autoScroll(-50, -20);
      this.background.tilePosition.x = 0;
      this.background.tilePosition.y = 0;

      // Add logo
      var sprite = game.add.sprite(centerX, centerY - textPadding, 'logo');
      sprite.anchor.set(0.5);

      if (this.game.device.desktop) {
        sprite.scale.set(2);
      }

      // Add new game
      var fontSize = (this.game.device.desktop ? '40px' : '20px');
      var newGame = this.newGame = this.add.text(this.world.centerX, 
        centerY + textPadding,
        "New game", 
        {
          font: fontSize + " Architects Daughter", 
          align:"center", 
          fill:"#fff"
        }); 
      newGame.inputEnabled = true;
      newGame.anchor.set(0.5);

      newGame.events.onInputOver.add(this.overNewgame, this);
      newGame.events.onInputOut.add(this.outNewgame, this);
      newGame.events.onInputDown.add(this.playGame, this);

      var multiGame = this.multiGame = 
        this.add.text(this.world.centerX, 
          centerY + textPadding + newGame.height,
        "New multiplayer game", 
        {
          font: fontSize + " Architects Daughter", 
          align:"center", 
          fill:"#fff"
        }); 
      multiGame.inputEnabled = true;
      multiGame.anchor.set(0.5);

      multiGame.events.onInputOver.add(this.overMultigame, this);
      multiGame.events.onInputOut.add(this.outMultigame, this);
      multiGame.events.onInputDown.add(this.playMultiGame, this);

      // Juicy
      this.juicy = game.plugins.add(Phaser.Plugin.Juicy);
      this.screenFlash = this.juicy.createScreenFlash();
      this.add.existing(this.screenFlash);

      // Music
      this.menu_music = game.add.audio('menu_music');
      this.dink       = game.add.audio('dink');
      this.menu_music.play();
    },

    playGame: function() {
      Game.multiplayer = false;
      this.menu_music.stop();
      this.game.state.start('Play');
    },

    playMultiGame: function() {
      Game.multiplayer = true;
      this.play();
    },

    overNewgame: function() {
      this.game.add.tween(this.newGame.scale)
        .to({x: 1.3, y: 1.3}, 300, Phaser.Easing.Exponential.Out, true)
      this.dink.play();
    },

    overMultigame: function() {
      this.game.add.tween(this.multiGame.scale)
        .to({x: 1.3, y: 1.3}, 300, Phaser.Easing.Exponential.Out, true)
      this.dink.play();
    },

    outMultigame: function() {
      this.game.add.tween(this.multiGame.scale)
        .to({x: 1, y: 1}, 300, Phaser.Easing.Exponential.Out, true)
      this.dink.play();
    },

    outNewgame: function() {
      this.game.add.tween(this.newGame.scale)
        .to({x: 1, y: 1}, 300, Phaser.Easing.Exponential.Out, true);
    }
  }
});

},{}],19:[function(require,module,exports){
module.exports = (function(Game) {
  var g = Game;
  Game.States.Play = function(game) {}

  Game.States.Play.prototype = {
    create: function() {
      var game = this.game;
      this.level      = Game.currentLevel || 0;
      this.levelData  = Game.Levels[this.level];
      this.points     = 0;

      // Background
      this.background = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'background' + this.level);
      this.background.autoScroll(1, 15);
      this.background.tilePosition.x = Game.backgroundX;
      this.background.tilePosition.y = Game.backgroundY;
      this.game.add.tween(this.background)
        .to({alpha: 0.3}, 
          5000, 
          Phaser.Easing.Linear.NONE, 
          true, 0, Number.POSITIVE_INFINITY, true);

      // FPS
      this.game.time.advancedTiming = true;
      this.fpsText = this.game.add.text(
          100, (this.game.height - 26), '', 
          { font: '16px Arial', fill: '#ffffff' }
      );

      // Enemy Lasers
      this.lasers         = game.add.group();
      // Enemies
      // this.enemies        = game.add.group();
      this.enemyGroups    = {}; //= game.add.group();
      this.enemyGroupsCount = 0;
      var levelEnemies = this.levelData.enemies;
      for (var i = 0; i <= levelEnemies.length; i++) {
        this.enemyGroups[i] = game.add.group();
        this.enemyGroupsCount++;
      };

      this.score = 0;
      // This player's bullets
      this.bullets        = game.add.group();
      // Other bullets
      this.remoteBullets  = game.add.group();
      // We have other players
      g.remotePlayers  = game.remotePlayers || [];

      // Setup shooting
      this.game.input.onDown.add(this.shootBullet, this);

      g.sio = g.socket;

      // We ALWAYS have us as a player
      g.hero = this.hero = new Game.Prefabs.Player(this.game, 
          this.game.width/2, 
          this.game.height + 60 + 20,
          this.game.input,
          true, g.sio);
      
      this.game.add.existing(this.hero);
      // this.game.add.tween(this.hero)
        // .to({
        //   y: this.game.height - (this.hero.height + 20)
        // }, 1500, Phaser.Easing.Exponential.Out, true);

      // Display lives
      this.livesGroup = this.game.add.group();
      this.livesGroup.add(this.game.add.sprite(0, 0, 'lives'));
      this.livesGroup.add(this.game.add.sprite(20, 3, 'num', 0));
      this.livesNum = this.game.add.sprite(35, 3, 'num', this.hero.lives+1);
      this.livesGroup.add(this.livesNum);
      this.livesGroup.x = this.game.width - 55;
      this.livesGroup.y = 5;
      this.livesGroup.alpha = 0;

      // Add bullets
      for(var i = 0; i<this.hero.numBullets; i++){
        var bullet = new Game.Prefabs.Bullet(this.game, 0, 0, this.hero);
        this.bullets.add(bullet);
      }

      // Score
      this.score = 0;
      this.scoreText = this.game.add.bitmapText(10, this.game.height - 27, 'architectsDaughter', 'Score: 0', 16);
      this.scoreText.alpha = 0;

      // Juicy
      this.juicy = this.game.plugins.add(Phaser.Plugin.Juicy);
      this.screenFlash = this.juicy.createScreenFlash();
      this.add.existing(this.screenFlash);
      
      this.game_music = game.add.audio('game_music');
      // this.game_music.play();

      // Enter play mode after init state
      this.timerInit = this.game.time.create(true);
      this.timerInit.add(Phaser.Timer.SECOND*1.5, this.initGame, this);
      this.timerInit.start();

      var gamePlay = this;
      var gamePlayer = _.extend(this.hero, {
        id: g.sid,
        name: 'You joined'
      })
      gamePlay.game.scope
          .$emit('game:newPlayer', gamePlayer);

      if (Game.multiplayer) {
        // Helpers
        var removePlayer = function(player, map) {
          g.remotePlayers.splice(g.remotePlayers.indexOf(player), 1);
          Game.toRemove.push(player);
          gamePlay.game.scope.$emit('game:removePlayer', {
            player: player,
            mapId: map
          });
        }

        // Handlers
        this.game.socket.on('gameUpdated:add', function(data) {
          console.log('gameUpdated:add');
          var allPlayers = data.allPlayers,
              newPlayers = [];
          
          for (var i = 0; i < allPlayers.length; i++) {
            var playerInQuestion = allPlayers[i];

            if (playerInQuestion.id === g.hero.id) {
              // Nope, we're already added
            } else if (Game.playerById(playerInQuestion.id)) {
              // Nope, we already know about 'em
            } else {
              g.toAdd.push(playerInQuestion);
              gamePlay.game.scope.$emit('game:newPlayer', playerInQuestion);
            }
          }
        });

        this.game.socket.on('gameUpdated:remove', function(data) {
          var allPlayers = g.remotePlayers,
              newPlayerList = data.allPlayers,
              newPlayers = [];

          var mapId = data.map;
          
          for (var i = 0; i < allPlayers.length; i++) {
            var playerInQuestion = allPlayers[i];

            if (playerInQuestion.id === g.hero.id) {
              // Nope, we're already added
            } else {
              var found = false;
              for (var i = 0; i < newPlayerList.length; i++) {
                if (newPlayerList[i].id === playerInQuestion.id) {
                  // The player is in the new player list
                  // so we don't have to remove them
                  found = true;
                }
              }
              if (!found) {
                // We can remove this player
                removePlayer(playerInQuestion, mapId);
              }
            }
          }
        });

        this.game.socket.on('updatePlayers', function(data) {
          var playersData = data.game.players;

          for (var i = 0; i < playersData.length; i++) {
            var playerData = playersData[i];
            var player;

            if (playerData.id !== g.sid) {
              player = Game.playerById(playerData.id);
              if (player) {
                player.onUpdateFromServer(playerData);
              }
            }

          }
        });

        this.game.socket.on('bulletShot', function(data) {
          var player = Game.playerById(data.id);

          if (player) {
            bullet = gamePlay.remoteBullets.getFirstExists(false);
            if(!bullet){
              bullet = new Game.Prefabs.Bullet(this.game, data.x, data.y, player);
              gamePlay.remoteBullets.add(bullet);
            }
            // Shoot the darn thing
            bullet.shoot();

            bullet.reset(data.x, data.y);
          }
        });

        this.game.socket.on('playerHit', function(data) {
          if (data.victim === g.sid) {
            // We were hit
            if (data.victimHealth === 0) {
              gamePlay.gameOver();
            }
          } else {
            var player = Game.playerById(data.victim);
            if (player) {
              if (data.victimHealth <= 0) {
                player.die();
              }
            }
          }
        });

        this.game.socket.on('gameOver', function(data) {
          var winnerId = data.winner.id;
          if (winnerId === g.sid) {
            // WE WON!
            Game.winner = true;
          } else {
            // We LOST :(
            Game.winner = false;
          }
          gamePlay.gameOver();
        });

        g.socket.emit('newPlayer', {
          mapId: Game.mapId,
          health: this.hero.health
        });
      }
    },

    update: function() {
      if(!Game.paused){
        // this.updatePlayer();

        this.addPlayers();
        this.removePlayers();
        // Run game loop thingy
        this.checkCollisions();

        this.fpsText.setText(this.game.time.fps + ' FPS');
      }
    },

    updateRemoteServer: function() {
      var game = this.game;

      g.socket.emit('updatePlayer', {
        x: this.hero.x,
        y: this.hero.y,
        xRel: this.hero.x / (Game.width === 0 ? 1 : Game.width),
        yRel: this.hero.y / (Game.height === 0 ? 1 : Game.height),
        health: this.hero.health,
        rotation: this.hero.rotation,
        timestamp: new Date().getTime()
      });

      this.updateRemoteServerTimer = this.game.time.events
        .add(
          20, // Every 100 miliseconds
          this.updateRemoteServer,
          this);
    },

    addPlayers: function() {
      while (g.toAdd.length !== 0) {
        var data = g.toAdd.shift();
        if (data) {
          var toAdd = 
            this.addPlayer(data.x, data.y, data.id);
          g.remotePlayers.push(toAdd);
        }
      }
    },

    addPlayer: function(x, y, id) {
      // We ALWAYS have us as a player
      var player = new Game.Prefabs.Player(this.game, this.game.width/2, 100, null, id);
      this.game.add.existing(player);

      return player;
    },

    removePlayers: function() {
      while (g.toRemove.length !== 0) {
        var toRemove = g.toRemove.shift();
        this.game.world.removeChild(toRemove, true);
      }
    },

    shutdown: function() {
      this.bullets.destroy();
      this.forEachEnemy(function(enemy) {
        enemy.destroy();
      });
      this.lasers.destroy();
      // this.updatePlayers.timer.pause();
      Game.paused = true;
    },

    goToMenu: function() {
      Game.backgroundX = this.background.tilePosition.x;
      Game.backgroundY = this.background.tilePosition.y;

      this.game.state.start('MainMenu');
    },

    initGame: function() {
        // Generate enemies
      // this.enemiesGenerator = this.game.time.events
        // .add(2000, this.generateEnemies, this);

      // Generate enemies laser
      // this.lasersGenerator = this.game.time.events
        // .add(1000, this.shootLaser, this);

      // Generate server updates
      this.updateRemoteServerTimer = this.game.time.events
        .add(200, this.updateRemoteServer, this);

      // Show UI
      // this.game.add.tween(this.livesGroup)
      //   .to({alpha:1}, 600, Phaser.Easing.Exponential.Out, true);
      // this.game.add.tween(this.scoreText)
      //   .to({alpha:1}, 600, Phaser.Easing.Exponential.Out, true);

      // Play
      this.playGame();
    },

    playGame: function() {
      if (Game.paused) {
        Game.paused = false;

        this.hero.follow = true;
        this.hero.body.collideWorldBounds = true;

        // NEED TO UPDATE THIS
        // this.enemiesGenerator.timer.resume();

        this.lasers.forEach(function(laser) {
          laser.resume();
        }, this);

        this.game.input.x = this.hero.x;
        this.game.input.y = this.hero.y;

      }
    },

    generateEnemies: function() {
      var levelEnemies = this.levelData.enemies;
      for (var i = 0; i < levelEnemies.length; i++) {

        var enemyGroup = this.enemyGroups[i],
            levelEnemy  = levelEnemies[i];
        var enemies = enemyGroup.getFirstExists(false);

        if(!enemies){
          enemies = new Game.Prefabs
            .Enemies(this.game, 
              levelEnemy.count || 10, 
              levelEnemy,
              this.hero,
              this.enemyGroups[i]);
        }
        // reset(fromY, toY, speed)
        enemies
          .reset(this.game.rnd.integerInRange(0, this.game.width), 
              this.game.rnd.integerInRange(0, this.game.width));
      }

      // Relaunch timer depending on level
      this.enemiesGenerator = this.game.time.events
        .add(
          this.game.rnd.integerInRange(20, 50) * 500/(this.level + 1), 
          this.generateEnemies, this);
    },

    shootBullet: function(){
      // Check delay time
      if(this.lastBulletShotAt === undefined) this.lastBulletShotAt = 0;
      if(this.game.time.now - this.lastBulletShotAt < this.hero.shotDelay){
        return;
      }
      this.lastBulletShotAt = this.game.time.now;

      // Create bullets
      var bullet, bulletPosY;
      bullet = this.bullets.getFirstExists(false);
      if(bullet) {

        bullet.reset(this.hero.x, this.hero.y);
        // Shoot the darn thing
        bullet.shoot();

        this.game.socket.emit('shotbullet', {
          id: g.sid,
          y: bullet.y,
          x: bullet.x,
          rotation: bullet.rotation
        });
      }
    },

    checkCollisions: function() {
      if (Game.multiplayer) {
        // g.remotePlayers.forEach(function(player) {
          this.game.physics.arcade.overlap(
              this.remoteBullets, 
              this.hero, this.killHero,
              null, this);

          g.remotePlayers.forEach(function(remotePlayer) {
            this.game.physics.arcade.overlap(
              this.bullets, remotePlayer, this.hitARemotePlayer, null, this);
          }, this);

        // }, this);
      } else {
        // Single player mode requires enemies
          var levelEnemies = this.enemyGroups;
          for (var i = 0; i < this.enemyGroupsCount; i++) {
            var enemies = levelEnemies[i];
            enemies.forEach(function(enemy) {
              this.game.physics.arcade.overlap(this.bullets, enemy, this.killEnemy, null, this);
            }, this);

            enemies.forEach(function(enemy) {
              this.game.physics.arcade.overlap(this.hero, enemy, this.killHero, null, this);
            }, this);
          }

          this.game.physics.arcade.overlap(this.hero, this.lasers, this.killHero, null, this);
          this.game.physics.arcade.overlap(this.hero, this.bonus, this.activeBonus, null, this);
        }
    },

    updateScore: function(enemy) {
      this.score += enemy.desc ? enemy.desc.maxHealth : 1;
      this.scoreText.setText('Score: ' + this.score + '');
    },

    killEnemy: function(bullet, enemy) {
      if (!enemy.dead && enemy.checkWorldBounds) {
        enemy.die();
        bullet.kill();
        this.updateScore(enemy);
      }
    },

    killHero: function(hero, enemy) {
      if(enemy instanceof Game.Prefabs.Laser || 
          (enemy instanceof Game.Prefabs.Enemy && 
            !enemy.dead && 
            enemy.checkWorldBounds)){
        this.hero.lives--;
        this.screenFlash.flash();

        if (this.hero.lives < 1) {
          this.gameOver();
        } else {
          this.hero.enableShield(2);
          this.game.add.tween(this.livesNum).to({alpha:0, y: 8}, 200, Phaser.Easing.Exponential.Out, true).onComplete.add(function(){
            this.livesNum.frame = this.hero.lives+1;
            this.livesNum.y = -2;
            this.game.add.tween(this.livesNum).to({alpha:1, y:3}, 200, Phaser.Easing.Exponential.Out, true);
          }, this);
        }

      } else if (enemy instanceof Game.Prefabs.Bullet) {
        
        var bullet = enemy,
            player = bullet.player;

        bullet.kill();

        if (this.hero.wasHitBy(bullet, player)) {
        // Shot by a player
          this.screenFlash.flash();

          // Notify server
          this.game.socket.emit('playerHit', {
            shooter: player.id,
            victim: g.sid,
            health: this.hero.health
          });
        }

        if (this.hero.health < 0) {
          this.gameOver();
        }

        // bullet.die();
      // } else {
        // enemy.die(true);
      }
    },

    hitARemotePlayer: function(player, bullet) {
      if (!player.shieldsEnabled) {
        player.showExplosion();
      }
      bullet.kill();
    },
    
    shootLaser: function(){
      var laser = this.lasers.getFirstExists(false);

      if(!laser){
        laser = new Game.Prefabs.Laser(this.game, 0, 0);
        this.lasers.add(laser);
      }
      laser.reset(
          this.game.width + laser.width/2, 
          this.game.rnd.integerInRange(20, this.game.height));
      laser.reload(100 + (this.level + 1)*30);

      // Relaunch bullet timer depending on level
      this.lasersGenerator = this.game.time.events
        .add(
          this.game.rnd.integerInRange(12, 20) * 250/(this.level + 1), 
          this.shootLaser, this);
    },

    gameOver: function() {
      // this.game.input.onDown.add(this.shootBullet, this);
      this.game.input.onDown.removeAll();

      this.gameover = true;

      this.juicy.shake(20, 5);

      this.game.add.tween(this.hero)
        .to({alpha: 0}, 500, Phaser.Easing.Exponential.Out, true);

      this.scoreText.alpha = 0;
      this.livesGroup.alpha = 0;

      this.pauseGame();

      // Clean up socket
      this.game.socket.removeAllListeners();

      // Show the gameover panel
      this.state.start('GameOver');
    },

    forEachEnemy: function(fn) {
      var levelEnemies = this.enemyGroups;
      for (var i = 0; i < this.enemyGroupsCount; i++) {
        var enemies = levelEnemies[i];
        enemies.forEach(fn, this);
      }
    },

    pauseGame: function() {
      if (!Game.paused) {
        Game.paused = true;
        this.hero.follow = false;

        if (Game.multiplayer) {}
        else {
          this.enemiesGenerator.timer.pause();

          this.forEachEnemy(function(group) {
            group.callAll('pause');
          });

          this.lasers.forEach(function(laser) {
            laser.pause();
          }, this);
        }

        if (!this.gameover) {
          // this.pausePanel.show();
        }
      }
    }
  }
});

},{}],20:[function(require,module,exports){
module.exports = (function(Game) {
  var g = Game;

  Game.States.Preloader = function (game) {
     this.asset = null;
     this.ready = false;

     WebFontConfig = {
        //  The Google Fonts we want to load (specify as many as you like in the array)
        google: {
          families: ['Revalia', 'Architects Daughter']
        }
    };
  };

  Game.States.Preloader.prototype = {

    preload: function () {
      this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
      this.asset = this.add.sprite(this.world.centerX, this.world.centerY, 'preloader');
      this.asset.anchor.setTo(0.5, 0.5);
      this.load.setPreloadSprite(this.asset);

      // Load the game levels
      var Levels = Game.Levels = this.game.cache.getJSON('levels');

      // Load level backgrounds
      for (var i in Levels) {
        var obj = Levels[i];
        this.load.image('background'+i, obj.background);
      }

      // Load fonts
      this.game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

      // Load menu
      this.load.image('logo', 'assets/logo.png');

      // Load player sprites
      this.load.image('hero', 'assets/player_blue.png');
      this.load.image('shield', 'assets/shield.png');
      this.load.image('player_green', 'assets/player_green.png');

      this.load.image('laser_red', 'assets/laser_red.png');
      this.load.image('laser_yellow', 'assets/laser_yellow.png');
      this.load.image('laser_orange', 'assets/laser_orange.png');
      this.load.image('laser_gray', 'assets/laser_gray.png');

      // Load enemies
      this.load.image('enemy_1', 'assets/enemy_1.png');
      this.load.image('enemy_2', 'assets/enemy_2.png');
      this.load.image('enemy_3', 'assets/enemy_3.png');

      // Next level and gameover graphics
      this.load.image('next_level', 'assets/levelcomplete-bg.png');
      this.load.image('gameover', 'assets/gameover-bg.png');
      this.load.image('new', 'assets/new.png');

      this.load.spritesheet('btnMenu', 'assets/btn-menu.png', 190, 49, 2);
      this.load.spritesheet('btn', 'assets/btn.png', 49, 49, 6);
      this.load.spritesheet('num', 'assets/num.png', 12, 11, 5);
      this.load.spritesheet('bonus', 'assets/bonus.png', 16, 16, 2);

      // Numbers
      this.load.image('num', 'assets/num.png');
      this.load.image('lives', 'assets/lives.png');
      this.load.image('panel', 'assets/panel.png');

      this.load.image('laser', 'assets/laser.png');
      this.load.image('bullet', 'assets/bullet.png');

      // Audio
      this.load.audio('laserFx', 'assets/laser_01.mp3');
      this.load.audio('dink', 'assets/dink.mp3');
      this.load.audio('menu_music', 'assets/menu_music.mp3');
      this.load.audio('game_music', 'assets/game_music.mp3');

      this.load.spritesheet('explosion', 'assets/explode.png', 128, 128, 16);

      // Fonts
      this.load.bitmapFont('architectsDaughter', 
        'assets/fonts/r.png', 
        'assets/fonts/r.fnt');

      // Finally, load the cached level, if there is one
      Game.currentLevel = 0;
      if (localStorage.getItem('currentLevel')) {
        Game.currentLevel = localStorage.getItem('currentLevel');
      }
    },

    create: function () {
      this.asset.cropEnabled = false;

      this.game.stage.backgroundColor = 0x2B3E42;
      var tween = this.add.tween(this.asset)
      .to({
        alpha: 0
      }, 500, Phaser.Easing.Linear.None, true);
      tween.onComplete.add(this.startMainMenu, this);

      // Load keyboard capture
      var game = this.game;
      Game.cursors = game.input.keyboard.createCursorKeys();
      // var music = this.game.add.audio('galaxy');
      // music.loop = true;
      // music.play('');
      // window.music = music;
    },

    startMainMenu: function() {
      if (!!this.ready) {
        if (Game.mapId) {
          this.game.state.start('Play');
        } else {
          this.game.state.start('MainMenu');
        }
        // this.game.state.start('Play');
        // this.game.state.start('NextLevel');
      }
    },

    toggleMusic: function() {
      if (this.musicIsPlaying = !this.musicIsPlaying) {
        music.stop();
      } else {
        music.play('');
      }
    },

    onLoadComplete: function () {
      this.ready = true;
    }
  };
});
},{}],21:[function(require,module,exports){
module.exports = 
angular.module('app.home')
.controller('HomeController', function($state, $scope){
    var _this = this;

    _this.mainOptions = {
        sectionsColor: ['#1bbc9b', '#4BBFC3', '#7BAABE'],
        navigation: true,
        navigationPosition: 'right',
        scrollingSpeed: 500
    }

    this.moog = function(merg){ console.log(merg); };

    this.slides = [
      {
        title: 'Simple',
        description: 'Easy to use. Configurable and customizable.',
        // src: 'images/1.png'
      },
      {
        title: 'Cool',
        description: 'It just looks cool. Impress everybody with a simple and modern web design!',
        // src: 'images/2.png'
      },
      {
        title: 'Compatible',
        description: 'Working in modern and old browsers too!',
        // src: 'images/3.png'
      }
    ];

    this.addSlide = function() {
      _this.slides.push({
        title: 'New Slide',
        description: 'I made a new slide!',
        // src: 'images/1.png'
      });

      //$compile(angular.element($('.slide')))($scope);
    };
});
},{}],22:[function(require,module,exports){
module.exports =
angular.module('app.home', ['ui.router'])
.config(function($stateProvider){
    $stateProvider
        .state('home', {
            abstract: true,
            templateUrl: 'scripts/home/template/base.html',
            controller: 'HomeController as vm'
        })
        .state('home.landing', {
            url: '/',
            templateUrl: 'scripts/home/template/landing.html',
        })
        .state('home.login', {
            url: '/login',
            templateUrl: 'scripts/home/template/landing.html'
        })
        .state('home.register', {
            url: '/register'
        })
        .state('home.forgot-password', {
            url: 'forgot-password'
        })
})

require('./fullPage_controller');
},{"./fullPage_controller":21}],23:[function(require,module,exports){

angular.module('app', [
  'ui.router',
  'fullPage.js',
  require('./home').name,
  require('./menu').name,
  require('./game').name,
  require('./user').name,
  require('./navbar').name,
  require('./overlay').name,
  require('./network').name,
])
.config(function($urlRouterProvider) {
  $urlRouterProvider
    .otherwise('/');
})

},{"./game":11,"./home":22,"./menu":24,"./navbar":27,"./network":30,"./overlay":34,"./user":37}],24:[function(require,module,exports){
module.exports = 
angular.module('app.menu', [
  require('./play_button').name
])
.config(function($stateProvider) {
  $stateProvider
    .state('menu', {
      abstract: true,
      templateUrl: 'scripts/menu/template.html',
      url: '/menu'
    })
    .state('menu.home', {
      url: '',
      templateUrl: 'scripts/menu/main.html',
      controller: 'MenuController as ctrl',
      onEnter: function(Room) {
        Room.queryForRooms();
      }
    })
})

require('./menu_controller');
},{"./menu_controller":25,"./play_button":26}],25:[function(require,module,exports){
angular.module('app.menu')
.controller('MenuController', function(mySocket, $scope, Room) {

  $scope.$on('map:update', function(evt, mapId) {
    ctrl.rooms = Room.getRooms();
  });

  var ctrl = this;

  ctrl.createId = function() {
    return new Date().getTime().toString();
  };

});
},{}],26:[function(require,module,exports){
module.exports =
angular.module('app.menu.playButton', [])
.directive('playButton', function() {
  return {
    scope: {
      onClick: '&'
    },
    template: '<div class="playButton"\
        ng-click="onClick()">\
      <i class="icon ion-play"></i>\
      <span class="play-text">play</span>\
    </div>'
  }
})
},{}],27:[function(require,module,exports){
module.exports =
angular.module('app.navbar', [])
.directive('navbar', function() {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: 'scripts/navbar/navbar.html',
    controller: 'NavbarController'
  }
})

require('./navbar_controller');
},{"./navbar_controller":28}],28:[function(require,module,exports){
angular.module('app.navbar')
.controller('NavbarController', function($scope, Game, players) {

  $scope.connectedPlayers = [];
  $scope.game = Game;

  $scope.$on('newPlayers', function(evt, players) {
    $scope.connectedPlayers = players;
  });

})
},{}],29:[function(require,module,exports){
angular.module('app.network')
.factory('FeedItem', function() {
  var FeedItem = function(eventName, data) {
    this.id = data.id;
    this.eventName = eventName;

    this.msg = data.name || eventName + ' happened';
  };

  return FeedItem;
})
.service('feed', function(mySocket, $rootScope, FeedItem) {
  
  // $rootScope.$on('')
  var service = this,
      list = [];

  this.list = list;
  this.maxLength = 10;

  var addToList = function(name, data) {
    $rootScope.$apply(function() {
      var item = new FeedItem(name, data);
      list.unshift(item);

      if (list.length > service.maxLength) {
        list.splice(service.maxLength, list.length - service.maxLength);
      }
    });
  }

  $rootScope.$on('game:removePlayer', function(evt, playerData) {
  });

  mySocket.then(function(socket) {
    // New player joined
    socket.on('newPlayer', function(data) {
      addToList("join", data);
    });

    // Player was hit
    socket.on('playerHit', function(data) {
      addToList("playerHit", data);
    });

  });

});

},{}],30:[function(require,module,exports){
require('./ioLoader');

module.exports =
angular.module('app.network', [
  'btford.socket-io',
  'app.loader'
])
.config(function(ioLoaderProvider) {
  console.log('ioLoader', ioLoaderProvider);
})

require('./ws');
require('./players');
require('./feed');
},{"./feed":29,"./ioLoader":31,"./players":32,"./ws":33}],31:[function(require,module,exports){
'use strict';

angular.module('app.loader', [])
.provider('ioLoader', function() {

  this.scriptUrl = window.location.origin+'/socket.io/socket.io.js';

  this.$get = ['$window', '$document', '$q', function($window, $document, $q) {

    var defer = $q.defer(),
      scriptUrl = this.scriptUrl;

    return {

      done: function(){

        var onScriptLoad = function(){
          return defer.resolve($window.io);
        };

        if($window.io){
          onScriptLoad();
        }
        else{
          var scriptTag = $document[0].createElement('script');

          scriptTag.type = 'text/javascript';
          scriptTag.async = true;
          scriptTag.src = scriptUrl;
          scriptTag.onreadystatechange = function () {
            if (this.readyState === 'complete') {
              onScriptLoad();
            }else{
              defer.reject();
            }
          };
          scriptTag.onload = onScriptLoad;
          var s = $document[0].getElementsByTagName('head')[0];
          s.appendChild(scriptTag);
        }

        return defer.promise;
      }
    };
  }];

  this.setScriptUrl = function(url) {
    this.scriptUrl = url;
  };


});

},{}],32:[function(require,module,exports){
angular.module('app.network')
// The player model
// We'll store the player and their name
.factory('Player', function() {
  var Player = function(data) {
    this.id = data.id;
    this.name = data.name;
  };

  return Player;
})
// The `players` service holds all of the current players
// for the game. We use it to manage any player-related data
.service('players', function(mySocket, $rootScope, Player, Room) {
  
  var service = this,
      listOfPlayers = [];

  var playerById = function(id) {
    var player;
    for (var i = 0; i < listOfPlayers.length; i++) {
      if (listOfPlayers[i].id === id) {
        return listOfPlayers[i];
      }
    }
  }

  // Socket listeners
  mySocket.then(function(socket) {
    socket.on('gameOver', function(data) {
      $rootScope.$apply(function() {
        listOfPlayers = [];
      });
    });

    socket.on('map:update', function(map) {
      console.log('players map:update', map);
    })
  });

  // Scope listeners
  $rootScope.$on('game:removePlayer', function(evt, playerData) {
    var player = playerById(playerData.id);
    var idx = listOfPlayers.indexOf(player);

    console.log('game:removePlayer players player', playerData.id, _.map(listOfPlayers, 'id'));
    listOfPlayers.splice(idx, 1);
    $rootScope.$broadcast('newPlayers', listOfPlayers);
  });
  // Do we have a new player?
  $rootScope.$on('game:newPlayer', function(evt, playerData) {
    var player = new Player(playerData);
    listOfPlayers.push(player);
    $rootScope.$broadcast('newPlayers', listOfPlayers);
  });

});

},{}],33:[function(require,module,exports){
angular.module('app.network')
.factory('mySocket', function(ioLoader, $q, socketFactory, User) {

  var mySocket = $q.defer();

  ioLoader.done().then(function(io) {
    var myIoSocket = io.connect(window.location.hostname+":8000");

    var aSock = socketFactory({
      ioSocket: myIoSocket
    });

    mySocket.resolve(aSock);
  });

  return mySocket.promise;
});

},{}],34:[function(require,module,exports){
module.exports =
angular.module('app.overlay', [])
.directive('overlayBar', function() {
  return {
    templateUrl: '/scripts/overlay/overlay.html',
    controller: 'OverlayController as ctrl'
  }
})

require('./overlay_controller.js');
},{"./overlay_controller.js":35}],35:[function(require,module,exports){
angular.module('app.overlay')
.controller('OverlayController', function($rootScope, $scope, players, feed) {
  var ctrl = this;

  ctrl.turnOffMusic = function() {
    $rootScope.$broadcast('game:toggleMusic');
  };

  ctrl.title = "Feed";

  ctrl.feed = feed.list;
  ctrl.feedLimit = 10;

  $scope.$on('newPlayers', function(evt, players) {
    $scope.players = players;
  });

})
},{}],36:[function(require,module,exports){
angular.module('app.user')
.service('Game', function() {

  this.playing = false;

});
},{}],37:[function(require,module,exports){
module.exports =
angular.module('app.user', [])

require('./user_service');
require('./room_service');
require('./game_service');
},{"./game_service":36,"./room_service":38,"./user_service":39}],38:[function(require,module,exports){
angular.module('app.user')
.service('Room', function($rootScope, $q, mySocket) {
  var service = this;
  var currentRooms = [],
      currentRoomCount = 0;

  this.queryForRooms = function() {
    mySocket.then(function(socket) {
      socket.emit('getMaps');
    });
  };

  mySocket.then(function(socket) {
    socket.on('getAllMaps', function(data) {
      currentRooms = data;
      $rootScope.$broadcast('map:update');
    });

    socket.on('global:newPlayer', function(data) {
      var mapId = data.map,
          map   = getRoomById(mapId);

      if (map) {
        map.players.push(data.player);
      }
    });

    socket.on('newMapCreated', function(newMap) {
      currentRooms.push(newMap);
      $rootScope.$broadcast('map:update', newMap);
    });

    socket.on('gameOver', function(data) {
      var mapId = data.mapId,
          map   = getRoomById(mapId);

      console.log('gameOver', data, map);
    });

    socket.on('global:playerLeftMap', function(data) {
      var mapId = data.mapId,
          map   = getRoomById(mapId);

      if (map) {
        var idx = getPlayerIndexById(data.id, map);
        map.players.splice(idx, 1);
      }
      $rootScope.$broadcast('map:update', map);
    });

    socket.on('global:removeMap', function(data) {
      var mapId = data.mapId,
          map   = getRoomById(mapId);

      if (map) {
        service.queryForRooms();
      }
      $rootScope.$broadcast('map:update', map);
    });

  });

  this.getRooms = function() {
    return currentRooms;
  };

  this.getRoom = function(id) {
    return getRoomById(id);
  };

  var getRoomById = function(id) {
    for (var i = 0; i < currentRooms.length; i++) {
      if (currentRooms[i].id === id) {
        return currentRooms[i];
      }
    }
    return false;
  };

  var getPlayerIndexById = function(id, map) {
    for (var i = 0; i < map.players.length; i++) {
      var player = map.players[i];
      if (player.id === id) {
        return i;
      }
    }
  };

});
},{}],39:[function(require,module,exports){
angular.module('app.user')
.service('User', function() {

  var currentUser =
    localStorage.getItem('currentUser');

  if (currentUser) {
    currentUser = JSON.parse(currentUser);
  };

  this.setCurrentUser = function(u) {
    localStorage.setItem('currentUser', JSON.stringify(u));
    currentUser = u;
  };

  this.getCurrentUser = function() {
    return currentUser;
  };

  this.modifyCurrentUser = function(opts) {
    var u = this.getCurrentUser();

    if (u) {
      for (var opt in opts) {
        u[opt] = opts[opt];
      }
      this.setCurrentUser(u);
    } else {
      this.setCurrentUser(opts);
    }

    return currentUser;
  };

});
},{}]},{},[23])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy95dWRoYXB1dHJhbWEvUHJvamVjdHMvUHJveWVrVGluZ2thdC9hbmd1bGFyLWdhbWUvY2xpZW50L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL2VudGl0aWVzL2J1bGxldC5qcyIsIi9Vc2Vycy95dWRoYXB1dHJhbWEvUHJvamVjdHMvUHJveWVrVGluZ2thdC9hbmd1bGFyLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvZW50aXRpZXMvZW5lbWllcy5qcyIsIi9Vc2Vycy95dWRoYXB1dHJhbWEvUHJvamVjdHMvUHJveWVrVGluZ2thdC9hbmd1bGFyLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvZW50aXRpZXMvZW5lbXkuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL2VudGl0aWVzL2dhbWVvdmVyX3BhbmVsLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9lbnRpdGllcy9pbmRleC5qcyIsIi9Vc2Vycy95dWRoYXB1dHJhbWEvUHJvamVjdHMvUHJveWVrVGluZ2thdC9hbmd1bGFyLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvZW50aXRpZXMvbGFzZXIuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL2VudGl0aWVzL3BhdXNlX3BhbmVsLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9lbnRpdGllcy9wbGF5ZXIuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL2dhbWVfY2FudmFzLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9nYW1lX2NvbnRyb2xsZXIuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL2luZGV4LmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9saWIvanVpY3kuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL2xpYi91dWlkLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9tYWluLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9zdGF0ZXMvYm9vdC5qcyIsIi9Vc2Vycy95dWRoYXB1dHJhbWEvUHJvamVjdHMvUHJveWVrVGluZ2thdC9hbmd1bGFyLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvc3RhdGVzL2dhbWVfb3Zlci5qcyIsIi9Vc2Vycy95dWRoYXB1dHJhbWEvUHJvamVjdHMvUHJveWVrVGluZ2thdC9hbmd1bGFyLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL2dhbWUvc3RhdGVzL2luZGV4LmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9zdGF0ZXMvbWFpbm1lbnUuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9nYW1lL3N0YXRlcy9wbGF5LmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvZ2FtZS9zdGF0ZXMvcHJlbG9hZGVyLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvaG9tZS9mdWxsUGFnZV9jb250cm9sbGVyLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvaG9tZS9pbmRleC5qcyIsIi9Vc2Vycy95dWRoYXB1dHJhbWEvUHJvamVjdHMvUHJveWVrVGluZ2thdC9hbmd1bGFyLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL21haW4uanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9tZW51L2luZGV4LmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvbWVudS9tZW51X2NvbnRyb2xsZXIuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9tZW51L3BsYXlfYnV0dG9uL2luZGV4LmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvbmF2YmFyL2luZGV4LmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvbmF2YmFyL25hdmJhcl9jb250cm9sbGVyLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvbmV0d29yay9mZWVkLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvbmV0d29yay9pbmRleC5qcyIsIi9Vc2Vycy95dWRoYXB1dHJhbWEvUHJvamVjdHMvUHJveWVrVGluZ2thdC9hbmd1bGFyLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL25ldHdvcmsvaW9Mb2FkZXIuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9uZXR3b3JrL3BsYXllcnMuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy9uZXR3b3JrL3dzLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvb3ZlcmxheS9pbmRleC5qcyIsIi9Vc2Vycy95dWRoYXB1dHJhbWEvUHJvamVjdHMvUHJveWVrVGluZ2thdC9hbmd1bGFyLWdhbWUvY2xpZW50L3NyYy9zY3JpcHRzL292ZXJsYXkvb3ZlcmxheV9jb250cm9sbGVyLmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvdXNlci9nYW1lX3NlcnZpY2UuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy91c2VyL2luZGV4LmpzIiwiL1VzZXJzL3l1ZGhhcHV0cmFtYS9Qcm9qZWN0cy9Qcm95ZWtUaW5na2F0L2FuZ3VsYXItZ2FtZS9jbGllbnQvc3JjL3NjcmlwdHMvdXNlci9yb29tX3NlcnZpY2UuanMiLCIvVXNlcnMveXVkaGFwdXRyYW1hL1Byb2plY3RzL1Byb3lla1RpbmdrYXQvYW5ndWxhci1nYW1lL2NsaWVudC9zcmMvc2NyaXB0cy91c2VyL3VzZXJfc2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oR2FtZSkge1xuXG4gIEdhbWUuUHJlZmFicy5CdWxsZXQgPSBmdW5jdGlvbihnYW1lLCB4LCB5LCBwbGF5ZXIsIGhhbmRsZUtpbGxlZEZuKXtcbiAgICB0aGlzLkJVTExFVF9TUEVFRCA9IDUwMDtcblxuICAgIHRoaXMucGxheWVyID0gcGxheWVyO1xuICAgIHRoaXMuZ2FtZSA9IHBsYXllci5nYW1lO1xuXG4gICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIHBsYXllci5nYW1lLCAwLCAwLCAnYnVsbGV0Jyk7XG4gICAgXG4gICAgdGhpcy5hbmNob3Iuc2V0VG8oMC41LCAwLjUpO1xuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuXG4gICAgdGhpcy5hbmdsZSA9IC1NYXRoLlBJLzI7XG4gICAgdGhpcy5raWxsKCk7IC8vIHNldCBkZWFkIGF0IGZpcnN0XG5cbiAgICB0aGlzLmxhc2VyU291bmQgPSB0aGlzLmdhbWUuYWRkLmF1ZGlvKCdsYXNlckZ4Jyk7XG5cbiAgICB0aGlzLmNoZWNrV29ybGRCb3VuZHMgPSB0cnVlO1xuICAgIHRoaXMub3V0T2ZCb3VuZHNLaWxsID0gdHJ1ZTtcblxuICAgIC8vIHRoaXMuZXZlbnRzLm9uS2lsbGVkLmFkZCh0aGlzLmhhbmRsZUtpbGxlZCwgdGhpcyk7XG4gICAgaWYgKGhhbmRsZUtpbGxlZEZuKSB7XG4gICAgICB0aGlzLmV2ZW50cy5vbktpbGxlZC5hZGQoaGFuZGxlS2lsbGVkRm4sIHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIEdhbWUuUHJlZmFicy5CdWxsZXQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuU3ByaXRlLnByb3RvdHlwZSk7XG4gIEdhbWUuUHJlZmFicy5CdWxsZXQuY29uc3RydWN0b3IgPSBHYW1lLlByZWZhYnMuQnVsbGV0O1xuXG4gIEdhbWUuUHJlZmFicy5CdWxsZXQucHJvdG90eXBlLnNob290ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yb3RhdGlvbiA9IHRoaXMucGxheWVyLnJvdGF0aW9uO1xuXG4gICAgLy8gdmFyIHB0ID0gdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIucG9zaXRpb247XG4gICAgLy8gbGFzZXIuYW5nbGUgPSB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuYW5nbGVCZXR3ZWVuKGxhc2VyLCBwdCk7XG5cbiAgICB0aGlzLnhWZWwgPSBNYXRoLmNvcyh0aGlzLnJvdGF0aW9uKSAqIHRoaXMuQlVMTEVUX1NQRUVEO1xuICAgIHRoaXMueVZlbCA9IE1hdGguc2luKHRoaXMucm90YXRpb24pICogdGhpcy5CVUxMRVRfU1BFRUQ7XG4gICAgdGhpcy5sYXNlclNvdW5kLnBsYXkoKTtcbiAgfTtcblxuICBHYW1lLlByZWZhYnMuQnVsbGV0LnByb3RvdHlwZS5zaG9vdEZyb20gPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhpcy5yb3RhdGlvbiA9IGRhdGEucm90YXRpb247XG5cbiAgICB0aGlzLnhWZWwgPSBNYXRoLmNvcyh0aGlzLnJvdGF0aW9uKSAqIHRoaXMuQlVMTEVUX1NQRUVEO1xuICAgIHRoaXMueVZlbCA9IE1hdGguc2luKHRoaXMucm90YXRpb24pICogdGhpcy5CVUxMRVRfU1BFRUQ7XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLkJ1bGxldC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhc2VyID0gdGhpcztcbiAgICBsYXNlci5ib2R5LnZlbG9jaXR5LnggPSB0aGlzLnhWZWw7XG4gICAgbGFzZXIuYm9keS52ZWxvY2l0eS55ID0gdGhpcy55VmVsO1xuICB9XG5cbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKEdhbWUpIHtcblxuICBHYW1lLlByZWZhYnMuRW5lbWllcyA9IGZ1bmN0aW9uKGdhbWUsIGNvdW50LCBlbmVteURlc2MsIGhlcm8sIHBhcmVudCkge1xuICAgIHZhciBkZXNjID0gdGhpcy5kZXNjID0gZW5lbXlEZXNjO1xuXG4gICAgLy8gTG9hZGluZ1xuICAgIFBoYXNlci5Hcm91cC5jYWxsKHRoaXMsIGdhbWUsIHBhcmVudCk7XG5cbiAgICB0aGlzLmNvdW50ID0gY291bnQgPSBjb3VudCB8fCA1O1xuXG4gICAgdGhpcy5saXZpbmdFbmVtaWVzID0gY291bnQ7XG5cbiAgICB0aGlzLmtpbGxlZEFsbCA9IHRydWU7XG5cbiAgICB2YXIgZW5lbXksXG4gICAgICAgIHBhZGRpbmcgPSAxMDtcbiAgICAvLyBOb3Qgc3VyZSB3aHkgdGhlcmUgaXMgYSBidWcgaGVyZS4uLiBiYWhcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgIGVuZW15ID0gdGhpcy5hZGQoXG4gICAgICAgIG5ldyBHYW1lLlByZWZhYnMuRW5lbXkodGhpcy5nYW1lLCAwLCAwLCBkZXNjLCBlbmVteSB8fCBoZXJvKVxuICAgICAgKTtcbiAgICAgIGVuZW15LnggPSBlbmVteSA/IGVuZW15LnggOiB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKGVuZW15LndpZHRoLCBnYW1lLndpZHRoIC0gZW5lbXkud2lkdGgpO1xuICAgICAgZW5lbXkueSA9IC0odGhpcy5nYW1lLmhlaWdodCArIGVuZW15LmhlaWdodC8yICsgaSAqIChlbmVteS5oZWlnaHQpKTtcbiAgICB9XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLkVuZW1pZXMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuR3JvdXAucHJvdG90eXBlKTtcbiAgR2FtZS5QcmVmYWJzLkVuZW1pZXMuY29uc3RydWN0b3IgPSBHYW1lLlByZWZhYnMuRW5lbWllcztcblxuICBHYW1lLlByZWZhYnMuRW5lbWllcy5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jYWxsQWxsKCd1cGRhdGUnKTtcbiAgfTtcblxuICBHYW1lLlByZWZhYnMuRW5lbWllcy5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbihmcm9tLCB0bywgc3BlZWQpIHtcbiAgICB0aGlzLmV4aXN0cyA9IHRydWU7XG4gICAgdGhpcy5saXZpbmdFbmVtaWVzID0gdGhpcy5jb3VudDtcbiAgICB0aGlzLmtpbGxlZEFsbCA9IHRydWU7XG5cbiAgICB2YXIgaSA9IDA7XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGVuZW15KSB7XG4gICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICBlbmVteS5yZXNldFRhcmdldCh0byk7XG4gICAgICB9XG5cbiAgICAgIGVuZW15LnJlbG9hZChpLCBmcm9tLCBzcGVlZCk7XG4gICAgICBpKys7XG4gICAgfSwgdGhpcyk7XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLkVuZW1pZXMucHJvdG90eXBlLnVwZGF0ZVN0YXR1cyA9IGZ1bmN0aW9uKGVuZW15LCBhdXRvS2lsbCl7XG4gICAgdGhpcy5saXZpbmdFbmVtaWVzLS07XG5cbiAgICBpZihhdXRvS2lsbCl7XG4gICAgICB0aGlzLmtpbGxlZEFsbCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmKHRoaXMubGl2aW5nRW5lbWllcyA9PT0gMCl7XG4gICAgICB0aGlzLmV4aXN0cyA9IGZhbHNlO1xuXG4gICAgICAvLyBSYW5kb21seSBhY3RpdmF0ZSBhIGJvbnVzIGlmIGtpbGxlZCBhbGwgdGhlIGVuZW1pZXNcbiAgICAgIGlmKHRoaXMua2lsbGVkQWxsKXtcbiAgICAgICAgdmFyIHJkbSA9IHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoMSwgdGhpcy5jb3VudCk7XG4gICAgICAgIFxuICAgICAgICBpZihyZG0gPT09IDEpIHtcbiAgICAgICAgICB0aGlzLmdhbWUuc3RhdGUuZ2V0Q3VycmVudFN0YXRlKCkuYWRkQm9udXMoZW5lbXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XG4gIEdhbWUuUHJlZmFicy5FbmVteSA9IGZ1bmN0aW9uKGdhbWUsIHgsIHksIGRlc2MsIHRhcmdldCl7XG4gICAgdmFyIGRlc2MgPSB0aGlzLmRlc2MgPSBkZXNjO1xuXG4gICAgdmFyIHR5cGUgPSAnZW5lbXlfJyArIGRlc2MudHlwZSB8fCAnMSc7XG4gICAgLy8gU3VwZXIgY2FsbCB0byBQaGFzZXIuc3ByaXRlXG4gICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIHgsIHksIHR5cGUpO1xuXG4gICAgLy8gU3BlZWRcbiAgICB0aGlzLnNwZWVkID0gZGVzYy5zcGVlZDtcblxuICAgIC8vIFRhcmdldFxuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuXG4gICAgLy8gRGVhZCAtIENhbid0IHVzZSBhbGl2ZSBiZWNhdXNlIGVuZW1pZXMgZm9sbG93IGVhY2ggb3RoZXJcbiAgICB0aGlzLmRlYWQgPSBmYWxzZTtcblxuICAgIC8vIE1pbiBEaXN0YW5jZVxuICAgIHRoaXMubWluRGlzdGFuY2UgPSAxMDtcblxuICAgIC8vIEV4cGxvc2lvblxuICAgIHRoaXMuZXhwbG9zaW9uID0gdGhpcy5nYW1lLmFkZC5zcHJpdGUoMCwwLCAnZXhwbG9zaW9uJyk7XG4gICAgdGhpcy5leHBsb3Npb24uYW5jaG9yLnNldFRvKDAuNSwgMC41KTtcbiAgICB0aGlzLmV4cGxvc2lvbi5hbHBoYSA9IDA7XG5cbiAgICAvLyBFbmFibGUgcGh5c2ljcyBvbiB0aGlzIG9iamVjdFxuICAgIHRoaXMuYW5jaG9yLnNldFRvKDAuNSwgMC41KTtcbiAgICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuXG4gICAgICAvLyBPdXQgb2YgYm91bmRzIGNhbGxiYWNrXG4gICAgICB0aGlzLmV2ZW50cy5vbk91dE9mQm91bmRzLmFkZChmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLmRpZSh0cnVlKTtcbiAgICAgIH0sIHRoaXMpO1xuICB9XG5cbiAgR2FtZS5QcmVmYWJzLkVuZW15LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xuICBHYW1lLlByZWZhYnMuRW5lbXkuY29uc3RydWN0b3IgPSBHYW1lLlByZWZhYnMuRW5lbXk7XG5cbiAgR2FtZS5QcmVmYWJzLkVuZW15LnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xuICAgIGlmKCFHYW1lLnBhdXNlZCl7XG4gICAgICAvLyBDaGFuZ2UgdmVsb2NpdHkgdG8gZm9sbG93IHRoZSB0YXJnZXRcbiAgICAgIHZhciBkaXN0YW5jZSwgcm90YXRpb247XG4gICAgICBkaXN0YW5jZSA9IHRoaXMuZ2FtZS5tYXRoLmRpc3RhbmNlKHRoaXMueCwgdGhpcy55LCBcbiAgICAgICAgdGhpcy50YXJnZXQueCwgXG4gICAgICAgIHRoaXMudGFyZ2V0LnkpO1xuXG4gICAgICBpZiAoZGlzdGFuY2UgPiB0aGlzLm1pbkRpc3RhbmNlKSB7XG4gICAgICAgIHJvdGF0aW9uID0gdGhpcy5nYW1lLm1hdGguYW5nbGVCZXR3ZWVuKHRoaXMueCwgdGhpcy55LCB0aGlzLnRhcmdldC54LCB0aGlzLnRhcmdldC55KTtcblxuICAgICAgICB0aGlzLmJvZHkudmVsb2NpdHkueCA9IE1hdGguY29zKHJvdGF0aW9uKSAqIHRoaXMuc3BlZWQ7XG4gICAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS55ID0gLShNYXRoLnNpbihyb3RhdGlvbikgKiB0aGlzLnNwZWVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS5zZXRUbygwLCAwKTtcbiAgICAgIH1cblxuICAgICAgLy8gQWN0aXZlIGVuZW15XG4gICAgICBpZih0aGlzLnkgPCB0aGlzLmdhbWUuaGVpZ2h0ICYmICF0aGlzLmNoZWNrV29ybGRCb3VuZHMpIHtcbiAgICAgICAgdGhpcy5jaGVja1dvcmxkQm91bmRzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLkVuZW15LnByb3RvdHlwZS5kaWUgPSBmdW5jdGlvbihhdXRvS2lsbCl7XG4gICAgaWYoIXRoaXMuZGVhZCl7XG4gICAgICB0aGlzLmRlYWQgPSB0cnVlO1xuICAgICAgdGhpcy5hbHBoYSA9IDA7XG5cbiAgICAgIC8vIEV4cGxvc2lvblxuICAgICAgaWYoIWF1dG9LaWxsKXtcbiAgICAgICAgdGhpcy5leHBsb3Npb24ucmVzZXQodGhpcy54LCB0aGlzLnkpO1xuICAgICAgICB0aGlzLmV4cGxvc2lvbi5hbmdsZSA9IHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoMCwgMzYwKTtcbiAgICAgICAgdGhpcy5leHBsb3Npb24uYWxwaGEgPSAwO1xuICAgICAgICB0aGlzLmV4cGxvc2lvbi5zY2FsZS54ID0gMC4yO1xuICAgICAgICB0aGlzLmV4cGxvc2lvbi5zY2FsZS55ID0gMC4yO1xuICAgICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMuZXhwbG9zaW9uKVxuICAgICAgICAgIC50byh7YWxwaGE6IDEsIGFuZ2xlOiBcIiszMFwifSwgMjAwLCBQaGFzZXIuRWFzaW5nLkxpbmVhci5OT05FLCB0cnVlLCAwKS50byh7YWxwaGE6IDAsIGFuZ2xlOiBcIiszMFwifSwgMzAwLCBQaGFzZXIuRWFzaW5nLkxpbmVhci5OT05FLCB0cnVlLCAwKTtcbiAgICAgICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLmV4cGxvc2lvbi5zY2FsZSlcbiAgICAgICAgICAudG8oe3g6MS41LCB5OjEuNX0sIDUwMCwgUGhhc2VyLkVhc2luZy5DdWJpYy5PdXQsIHRydWUsIDApO1xuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgcGFyZW50IGdyb3VwXG4gICAgICB0aGlzLnBhcmVudC51cGRhdGVTdGF0dXModGhpcywgYXV0b0tpbGwpO1xuICAgIH1cbiAgfTtcblxuICBHYW1lLlByZWZhYnMuRW5lbXkucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmJvZHkudmVsb2NpdHkueCA9IDA7XG4gICAgdGhpcy5ib2R5LnZlbG9jaXR5LnkgPSAwO1xuICB9O1xuXG4gIEdhbWUuUHJlZmFicy5FbmVteS5wcm90b3R5cGUucmVsb2FkID0gZnVuY3Rpb24oaSwgZnJvbSl7XG4gICAgLy8gdGhpcy54ID0gdGhpcy5nYW1lLndpZHRoICsgdGhpcy53aWR0aC8yICsgaSoodGhpcy53aWR0aCArIDEwKTtcbiAgICB0aGlzLnggPSBmcm9tO1xuICAgIHRoaXMuY2hlY2tXb3JsZEJvdW5kcyA9IGZhbHNlO1xuICAgIHRoaXMuZGVhZCA9IGZhbHNlO1xuICAgIHRoaXMuYWxwaGEgPSAxO1xuICAgIHRoaXMueSA9IC10aGlzLmhlaWdodCArIGkqKHRoaXMuaGVpZ2h0KTsgLy90aGlzLmdhbWUuaGVpZ2h0ICsgdGhpcy5oZWlnaHQvMiArIGkqKHRoaXMuaGVpZ2h0ICsgMTApOyAvL2Zyb207XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLkVuZW15LnByb3RvdHlwZS5yZXNldFRhcmdldCA9IGZ1bmN0aW9uKHRvKXtcbiAgICB0aGlzLnRhcmdldCA9IG5ldyBQaGFzZXIuUG9pbnQodGhpcy54IHx8IHRoaXMuZ2FtZS53aWR0aC8yLCB0byk7XG4gIH07XG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XG5cbiAgR2FtZS5QcmVmYWJzLkdhbWVvdmVyUGFuZWwgPSBmdW5jdGlvbihnYW1lLCBwYXJlbnQpe1xuICAgIC8vIFN1cGVyIGNhbGwgdG8gUGhhc2VyLkdyb3VwXG4gICAgUGhhc2VyLkdyb3VwLmNhbGwodGhpcywgZ2FtZSwgcGFyZW50KTtcblxuICAgIC8vIEFkZCBwYW5lbFxuICAgIHRoaXMucGFuZWwgPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSgwLCAwLCAncGFuZWwnKTtcbiAgICB0aGlzLnBhbmVsLndpZHRoID0gdGhpcy5nYW1lLndpZHRoLzI7XG4gICAgdGhpcy5wYW5lbC5oZWlnaHQgPSAxNTA7XG4gICAgdGhpcy5hZGQodGhpcy5wYW5lbCk7XG5cbiAgICAvLyBQYXVzZSB0ZXh0XG4gICAgdmFyIGhlYWRlclRleHQgPSBHYW1lLndpbm5lciA/IFwiWW91IHdvbiFcIiA6IFwiWW91IGxvc3QgOihcIjtcblxuICAgIHRoaXMudGV4dFBhdXNlID0gdGhpcy5nYW1lLmFkZFxuICAgICAgLmJpdG1hcFRleHQoZ2FtZS53aWR0aC8yLCAtNTAsICdhcmNoaXRlY3RzRGF1Z2h0ZXInLCBoZWFkZXJUZXh0LCAyOCk7XG4gICAgdGhpcy50ZXh0UGF1c2UucG9zaXRpb24ueCA9IFxuICAgICAgdGhpcy5nYW1lLndpZHRoLzIgLSB0aGlzLnRleHRQYXVzZS50ZXh0V2lkdGgvMjtcbiAgICB0aGlzLmFkZCh0aGlzLnRleHRQYXVzZSk7XG5cbiAgICAvLyBTY29yZSB0ZXh0XG4gICAgdGhpcy50ZXh0U2NvcmUgPSB0aGlzLmdhbWUuYWRkXG4gICAgICAuYml0bWFwVGV4dChnYW1lLndpZHRoLzIsIDgwLCAnYXJjaGl0ZWN0c0RhdWdodGVyJywgJ1Njb3JlIDogMCcsIDIyKTtcbiAgICB0aGlzLnRleHRTY29yZS5wb3NpdGlvbi54ID0gdGhpcy5nYW1lLndpZHRoLzIgLSB0aGlzLnRleHRTY29yZS50ZXh0V2lkdGgvMjtcbiAgICB0aGlzLmFkZCh0aGlzLnRleHRTY29yZSk7XG5cbiAgICAvLyBIaWdoc2NvcmUgdGV4dFxuICAgIHRoaXMudGV4dEhpZ2hTY29yZSA9IHRoaXMuZ2FtZS5hZGRcbiAgICAgIC5iaXRtYXBUZXh0KGdhbWUud2lkdGgvMiwgMTA1LCAnYXJjaGl0ZWN0c0RhdWdodGVyJywgJ0hpZ2ggU2NvcmUgOiAwJywgMjIpO1xuICAgIHRoaXMudGV4dEhpZ2hTY29yZS5wb3NpdGlvbi54ID0gdGhpcy5nYW1lLndpZHRoLzIgLSB0aGlzLnRleHRIaWdoU2NvcmUudGV4dFdpZHRoLzI7XG4gICAgdGhpcy5hZGQodGhpcy50ZXh0SGlnaFNjb3JlKTtcblxuICAgIC8vIEdyb3VwIHBvc1xuICAgIHRoaXMueSA9IC04MDtcbiAgICB0aGlzLnggPSAwO1xuICAgIHRoaXMuYWxwaGEgPSAwO1xuXG4gICAgLy8gUGxheSBidXR0b25cbiAgICB0aGlzLmJ0blJlcGxheSA9IHRoaXMuZ2FtZS5hZGQuYnV0dG9uKHRoaXMuZ2FtZS53aWR0aC8yLTMyLCAxNSwgJ2J0bicsIHRoaXMucmVwbGF5LCB0aGlzLCAzLCAyLCAzLCAyKTtcbiAgICB0aGlzLmJ0blJlcGxheS5hbmNob3Iuc2V0VG8oMC41LCAwKTtcbiAgICB0aGlzLmFkZCh0aGlzLmJ0blJlcGxheSk7XG5cbiAgICAvLyBCdG4gTWVudVxuICAgIHRoaXMuYnRuTWVudSA9IHRoaXMuZ2FtZS5hZGQuYnV0dG9uKHRoaXMuZ2FtZS53aWR0aC8yKzI4LCAxNSwgJ2J0bicsIGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLmdhbWUuc3RhdGUuZ2V0Q3VycmVudFN0YXRlKCkuZ29Ub01lbnUoKTtcbiAgICB9LCB0aGlzLCA1LCA0LCA1LCA0KTtcbiAgICB0aGlzLmJ0bk1lbnUuYW5jaG9yLnNldFRvKDAuNSwgMCk7XG4gICAgdGhpcy5hZGQodGhpcy5idG5NZW51KTtcbiAgfTtcblxuICBHYW1lLlByZWZhYnMuR2FtZW92ZXJQYW5lbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5Hcm91cC5wcm90b3R5cGUpO1xuICBHYW1lLlByZWZhYnMuR2FtZW92ZXJQYW5lbC5jb25zdHJ1Y3RvciA9IEdhbWUuUHJlZmFicy5HYW1lb3ZlclBhbmVsO1xuXG4gIEdhbWUuUHJlZmFicy5HYW1lb3ZlclBhbmVsLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24oc2NvcmUpe1xuICAgIHNjb3JlID0gc2NvcmUgfHwgMDtcblxuICAgIHZhciBoaWdoU2NvcmU7XG4gICAgdmFyIGJlYXRlZCA9IGZhbHNlO1xuXG4gICAgY29uc29sZS5sb2coJ3dpbm5lcicsIEdhbWUud2lubmVyKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaGlnaFNjb3JlJywgMCk7XG5cbiAgICBpZighIWxvY2FsU3RvcmFnZSl7XG4gICAgICBoaWdoU2NvcmUgPSBwYXJzZUludChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnaGlnaFNjb3JlJyksIDEwKTtcblxuICAgICAgaWYoIWhpZ2hTY29yZSB8fCBoaWdoU2NvcmUgPCBzY29yZSl7XG4gICAgICAgIGhpZ2hTY29yZSA9IHNjb3JlO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaGlnaFNjb3JlJywgaGlnaFNjb3JlLnRvU3RyaW5nKCkpO1xuXG4gICAgICAgIC8vIEFkZCBuZXcgc3ByaXRlIGlmIGJlc3Qgc2NvcmUgYmVhdGVkXG4gICAgICAgIGlmKHNjb3JlID4gMCl7XG4gICAgICAgICAgYmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLm5ld1Njb3JlID0gdGhpcy5nYW1lLmFkZC5zcHJpdGUoMCwgMTIwLCAnbmV3Jyk7XG4gICAgICAgICAgdGhpcy5uZXdTY29yZS5hbmNob3Iuc2V0VG8oMC41LCAwLjUpO1xuICAgICAgICAgIHRoaXMuYWRkKHRoaXMubmV3U2NvcmUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZ2hTY29yZSA9IDA7XG4gICAgfVxuXG4gICAgdGhpcy50ZXh0SGlnaFNjb3JlLnNldFRleHQoJ0hpZ2ggU2NvcmU6ICcgKyBoaWdoU2NvcmUudG9TdHJpbmcoKSk7XG5cbiAgICAvLyBDZW50ZXIgdGV4dFxuICAgIHZhciBzY29yZVRleHQgPSAnU2NvcmU6ICcgKyBzY29yZS50b1N0cmluZygpO1xuICAgIHRoaXMudGV4dFNjb3JlLnNldFRleHQoc2NvcmVUZXh0KTtcblxuICAgIHRoaXMudGV4dFNjb3JlLnVwZGF0ZSgpO1xuICAgIHRoaXMudGV4dFNjb3JlLnBvc2l0aW9uLnggPSB0aGlzLmdhbWUud2lkdGgvMiAtIHRoaXMudGV4dFNjb3JlLnRleHRXaWR0aC8yO1xuXG4gICAgdGhpcy50ZXh0SGlnaFNjb3JlLnVwZGF0ZSgpO1xuICAgIHRoaXMudGV4dEhpZ2hTY29yZS5wb3NpdGlvbi54ID0gdGhpcy5nYW1lLndpZHRoLzIgLSB0aGlzLnRleHRIaWdoU2NvcmUudGV4dFdpZHRoLzI7XG5cbiAgICB0aGlzLnBhbmVsLnBvc2l0aW9uLnggPSB0aGlzLmdhbWUud2lkdGgvMiAgLSB0aGlzLnBhbmVsLndpZHRoLzI7XG5cbiAgICBpZihiZWF0ZWQpe1xuICAgICAgdGhpcy5uZXdTY29yZS54ID0gdGhpcy50ZXh0SGlnaFNjb3JlLnBvc2l0aW9uLnggLSAzMDtcbiAgICB9XG5cbiAgICAvLyBTaG93IHBhbmVsXG4gICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzKVxuICAgICAgLnRvKHtcbiAgICAgICAgICBhbHBoYToxLCBcbiAgICAgICAgICB5OnRoaXMuZ2FtZS5oZWlnaHQvMiAtIHRoaXMucGFuZWwuaGVpZ2h0LzJ9LCBcbiAgICAgICAgMTAwMCwgXG4gICAgICAgIFBoYXNlci5FYXNpbmcuRXhwb25lbnRpYWwuT3V0LCB0cnVlLCAwKTtcbiAgfTtcblxuICBHYW1lLlByZWZhYnMuR2FtZW92ZXJQYW5lbC5wcm90b3R5cGUucmVwbGF5ID0gZnVuY3Rpb24oKXtcbiAgICAvLyBTdGFydFxuICAgIEdhbWUucmVzZXQoKTtcbiAgICBHYW1lLm11bHRpcGxheWVyID0gdHJ1ZTsgLy8gSGFyZGNvZGVkIGZvciBkZW1vXG4gICAgdGhpcy5nYW1lLnN0YXRlLnN0YXJ0KCdQbGF5Jyk7XG4gIH07XG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XG5cbiAgcmVxdWlyZSgnLi9wbGF5ZXInKShHYW1lKTtcbiAgcmVxdWlyZSgnLi9nYW1lb3Zlcl9wYW5lbCcpKEdhbWUpO1xuICByZXF1aXJlKCcuL3BhdXNlX3BhbmVsJykoR2FtZSk7XG5cbiAgcmVxdWlyZSgnLi9lbmVtaWVzJykoR2FtZSk7XG4gIHJlcXVpcmUoJy4vZW5lbXknKShHYW1lKTtcblxuICByZXF1aXJlKCcuL2xhc2VyJykoR2FtZSk7XG4gIHJlcXVpcmUoJy4vYnVsbGV0JykoR2FtZSk7XG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XG4gIEdhbWUuUHJlZmFicy5MYXNlciA9IGZ1bmN0aW9uKGdhbWUsIHgsIHkpe1xuICAgIC8vIFN1cGVyIGNhbGwgdG8gUGhhc2VyLnNwcml0ZVxuICAgIFBoYXNlci5TcHJpdGUuY2FsbCh0aGlzLCBnYW1lLCB4LCB5LCAnbGFzZXInKTtcblxuICAgIC8vIENlbnRlcmVkIGFuY2hvclxuICAgIHRoaXMuYW5jaG9yLnNldFRvKDAuNSwgMC41KTtcblxuICAgIC8vIFNwZWVkXG4gICAgdGhpcy5zcGVlZCA9IDE1MDtcblxuICAgIC8vIEtpbGwgd2hlbiBvdXQgb2Ygd29ybGRcbiAgICB0aGlzLmNoZWNrV29ybGRCb3VuZHMgPSB0cnVlO1xuICAgIHRoaXMub3V0T2ZCb3VuZHNLaWxsID0gdHJ1ZTtcblxuICAgIC8vIEVuYWJsZSBwaHlzaWNzXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuZW5hYmxlKHRoaXMsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG5cbiAgICB0aGlzLnR3ZWVuID0gdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzKS50byh7YW5nbGU6LTM2MH0sIDMwMDAsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5PTkUsIHRydWUsIDAsIE51bWJlci5QT1NJVElWRV9JTkZJTklUWSk7XG4gIH1cblxuICBHYW1lLlByZWZhYnMuTGFzZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuU3ByaXRlLnByb3RvdHlwZSk7XG4gIEdhbWUuUHJlZmFicy5MYXNlci5jb25zdHJ1Y3RvciA9IEdhbWUuUHJlZmFicy5MYXNlcjtcblxuICBHYW1lLlByZWZhYnMuTGFzZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYoIUdhbWUucGF1c2VkKXtcbiAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS54ID0gLXRoaXMuc3BlZWQ7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLmJvZHkudmVsb2NpdHkueCA9IDA7XG4gICAgfVxuICB9O1xuXG4gIEdhbWUuUHJlZmFicy5MYXNlci5wcm90b3R5cGUucmVsb2FkID0gZnVuY3Rpb24oc3BlZWQpe1xuICAgIHRoaXMuYWxwaGEgPSAxO1xuICAgIHRoaXMuc3BlZWQgPSBzcGVlZDtcbiAgICB0aGlzLnNjYWxlLnggPSAxO1xuICAgIHRoaXMuc2NhbGUueSA9IDE7XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLkxhc2VyLnByb3RvdHlwZS5kaWUgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcykudG8oe2FscGhhOiAwfSwgMTUwLCBQaGFzZXIuRWFzaW5nLkN1YmljLk91dCwgdHJ1ZSwgMCk7XG4gICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLnNjYWxlKS50byh7eDoxLjUsIHk6MS41fSwgMTUwLCBQaGFzZXIuRWFzaW5nLkN1YmljLk91dCwgdHJ1ZSwgMCk7XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLkxhc2VyLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy50d2Vlbi5wYXVzZSgpO1xuICB9O1xuXG4gIEdhbWUuUHJlZmFicy5MYXNlci5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLnR3ZWVuLnJlc3VtZSgpO1xuICB9O1xufSk7IiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oR2FtZSkge1xuXG4gIEdhbWUuUHJlZmFicy5QYXVzZVBhbmVsID0gZnVuY3Rpb24oZ2FtZSwgcGFyZW50KXtcbiAgICAvLyBTdXBlciBjYWxsIHRvIFBoYXNlci5Hcm91cFxuICAgIFBoYXNlci5Hcm91cC5jYWxsKHRoaXMsIGdhbWUsIHBhcmVudCk7XG5cbiAgICAvLyBBZGQgcGFuZWxcbiAgICB0aGlzLnBhbmVsID0gdGhpcy5nYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3BhbmVsJyk7XG4gICAgdGhpcy5wYW5lbC53aWR0aCA9IDQ4MDtcbiAgICB0aGlzLnBhbmVsLmhlaWdodCA9IDgwO1xuICAgIHRoaXMuYWRkKHRoaXMucGFuZWwpO1xuXG4gICAgLy8gUGF1c2UgdGV4dFxuICAgIHRoaXMudGV4dFBhdXNlID0gdGhpcy5nYW1lLmFkZC5iaXRtYXBUZXh0KGdhbWUud2lkdGgvMiwgLTQyLCAna2VucGl4ZWxibG9ja3MnLCAnUGF1c2UnLCAyOCk7XG4gICAgdGhpcy50ZXh0UGF1c2UucG9zaXRpb24ueCA9IHRoaXMuZ2FtZS53aWR0aC8yIC0gdGhpcy50ZXh0UGF1c2UudGV4dFdpZHRoLzI7XG4gICAgdGhpcy5hZGQodGhpcy50ZXh0UGF1c2UpO1xuXG4gICAgLy8gR3JvdXAgcG9zXG4gICAgdGhpcy55ID0gLTgwO1xuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy5hbHBoYSA9IDA7XG5cbiAgICAvLyBQbGF5IGJ1dHRvblxuICAgIHRoaXMuYnRuUGxheSA9IHRoaXMuZ2FtZS5hZGQuYnV0dG9uKHRoaXMuZ2FtZS53aWR0aC8yLTMyLCAxNSwgJ2J0bicsIHRoaXMudW5QYXVzZSwgdGhpcywgMywgMiwgMywgMik7XG4gICAgdGhpcy5idG5QbGF5LmFuY2hvci5zZXRUbygwLjUsIDApO1xuICAgIHRoaXMuYWRkKHRoaXMuYnRuUGxheSk7XG5cbiAgICAvLyBCdG4gTWVudVxuICAgIHRoaXMuYnRuTWVudSA9IHRoaXMuZ2FtZS5hZGQuYnV0dG9uKHRoaXMuZ2FtZS53aWR0aC8yKzI4LCAxNSwgJ2J0bicsIGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLmdhbWUuc3RhdGUuZ2V0Q3VycmVudFN0YXRlKCkuZ29Ub01lbnUoKTtcbiAgICB9LCB0aGlzLCA1LCA0LCA1LCA0KTtcbiAgICB0aGlzLmJ0bk1lbnUuYW5jaG9yLnNldFRvKDAuNSwgMCk7XG4gICAgdGhpcy5hZGQodGhpcy5idG5NZW51KTtcbiAgfTtcblxuICBHYW1lLlByZWZhYnMuUGF1c2VQYW5lbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5Hcm91cC5wcm90b3R5cGUpO1xuICBHYW1lLlByZWZhYnMuUGF1c2VQYW5lbC5jb25zdHJ1Y3RvciA9IEdhbWUuUHJlZmFicy5QYXVzZVBhbmVsO1xuXG4gIEdhbWUuUHJlZmFicy5QYXVzZVBhbmVsLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMpLnRvKHthbHBoYToxLCB5OnRoaXMuZ2FtZS5oZWlnaHQvMiAtIHRoaXMucGFuZWwuaGVpZ2h0LzJ9LCAxMDAwLCBQaGFzZXIuRWFzaW5nLkV4cG9uZW50aWFsLk91dCwgdHJ1ZSwgMCk7XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLlBhdXNlUGFuZWwucHJvdG90eXBlLnVuUGF1c2UgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcykudG8oe2FscGhhOjAsIHk6LTgwfSwgMTAwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUsIDApO1xuICAgIHRoaXMuZ2FtZS5zdGF0ZS5nZXRDdXJyZW50U3RhdGUoKS5wbGF5R2FtZSgpO1xuICB9O1xuXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XG5cbiAgR2FtZS5QcmVmYWJzLlBsYXllciA9IGZ1bmN0aW9uKGdhbWUsIHgsIHksIHRhcmdldCwgaWQpIHtcbiAgICB0aGlzLmlkID0gaWQ7XG4gICAgaWYgKHRhcmdldCkge1xuICAgICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIHgsIHksICdoZXJvJyk7XG4gICAgICAvLyBUYXJnZXQ6IG1vdXNlXG4gICAgICB0aGlzLnRhcmdldCAgICAgPSB0YXJnZXQ7XG5cbiAgICAgIC8vIEZvbGxvdyBwb2ludGVyXG4gICAgICB0aGlzLmZvbGxvdyA9IGZhbHNlO1xuXG4gICAgICAvLyBNaW5pbXVtIGF3YXlcbiAgICAgIHRoaXMubWluRGlzdGFuY2UgPSAxMDtcblxuICAgICAgLy8gU3BlZWRcbiAgICAgIHRoaXMuc3BlZWQgICAgICA9IDIwMDtcblxuICAgICAgLy8gTGl2ZXNcbiAgICAgIHRoaXMubGl2ZXMgICAgICA9IDM7XG5cbiAgICAgIC8vIFNob3QgZGVsYXlcbiAgICAgIHRoaXMuc2hvdERlbGF5ICA9IDEwMDtcblxuICAgICAgLy8gTnVtYmVyIG9mIGJ1bGxldHMgcGVyIHNob3RcbiAgICAgIHRoaXMubnVtQnVsbGV0cyAgID0gMTA7XG4gICAgICB0aGlzLnRpbWVyQnVsbGV0O1xuXG4gICAgICB0aGlzLnNoaWVsZHNFbmFibGVkID0gZmFsc2U7XG4gICAgICB0aGlzLnRpbWVyU2hpZWxkO1xuICAgICAgdGhpcy5zaGllbGQgPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnc2hpZWxkJyk7XG4gICAgICB0aGlzLnNoaWVsZC5hbmNob3Iuc2V0VG8oMC41LCAwLjUpO1xuICAgICAgdGhpcy5zaGllbGQuYWxwaGEgPSAwXG5cbiAgICAgIC8vIFNjYWxlXG4gICAgICB0aGlzLnNjYWxlLnNldFRvKDEuMiwgMS4yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIHgsIHksICdoZXJvJyk7XG5cbiAgICAgIHRoaXMuc2NhbGUuc2V0VG8oMC41LCAwLjUpO1xuICAgICAgdGhpcy5hbHBoYSA9IDAuODtcbiAgICAgIHRoaXMueCA9IHg7XG4gICAgICB0aGlzLnkgPSB5O1xuXG4gICAgICAvLyBTdGF0ZSBxdWV1ZVxuICAgICAgdGhpcy5zdGF0ZVF1ZXVlID0gW107XG4gICAgICB0aGlzLm1pblF1ZXVlU2l6ZSA9IDEwO1xuICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAzMDtcbiAgICAgIHRoaXMucHJldmlvdXNTdGF0ZVRpbWUgPSAwO1xuICAgIH1cblxuICAgIC8vIEV4cGxvc2lvblxuICAgIHRoaXMuZXhwbG9zaW9uID0gdGhpcy5nYW1lLmFkZC5zcHJpdGUoMCwwLCAnZXhwbG9zaW9uJyk7XG4gICAgdGhpcy5leHBsb3Npb24uYW5jaG9yLnNldFRvKDAuNSwgMC41KTtcbiAgICB0aGlzLmV4cGxvc2lvbi5hbHBoYSA9IDA7XG5cbiAgICB0aGlzLmhlYWx0aCA9IDEwMDtcbiAgICAvLyBBbmNob3JcbiAgICB0aGlzLmFuY2hvci5zZXRUbygwLjUsIDAuNSk7XG4gICAgLy8gUm90YXRlIDkwcyBzbyBpdCdzIGZhY2luZyB1cFxuICAgIHRoaXMucm90YXRpb24gPSAtTWF0aC5QSS8yO1xuXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuZW5hYmxlKHRoaXMsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLlBsYXllci5wcm90b3R5cGUgICA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xuICBHYW1lLlByZWZhYnMuUGxheWVyLmNvbnN0cnVjdG9yID0gR2FtZS5QcmVmYWJzLlBsYXllcjtcblxuICAvLyBVcGRhdGVcbiAgR2FtZS5QcmVmYWJzLlBsYXllci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMudGFyZ2V0KSB7XG4gICAgICB0aGlzLnVwZGF0ZUhlcm8oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51cGRhdGVSZW1vdGUoKTtcbiAgICB9XG4gIH1cblxuICBHYW1lLlByZWZhYnMuUGxheWVyLnByb3RvdHlwZS5vblVwZGF0ZUZyb21TZXJ2ZXIgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgaWYgKHRoaXMuc3RhdGVRdWV1ZS5sZW5ndGggPiB0aGlzLm1heFF1ZXVlU2l6ZSkge1xuICAgICAgdGhpcy5zdGF0ZVF1ZXVlLnNwbGljZSh0aGlzLm1pblF1ZXVlU2l6ZSwgdGhpcy5tYXhRdWV1ZVNpemUgLSB0aGlzLm1pblF1ZXVlU2l6ZSk7XG4gICAgfVxuICAgIHRoaXMuc3RhdGVRdWV1ZS51bnNoaWZ0KGRhdGEpO1xuICB9O1xuXG4gIEdhbWUuUHJlZmFicy5QbGF5ZXIucHJvdG90eXBlLnVwZGF0ZUhlcm8gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGlzdGFuY2UsIHJvdGF0aW9uO1xuICAgICAgLy8gRm9sbG93IHBvaW50ZXJcbiAgICBpZiAodGhpcy5mb2xsb3cpIHtcbiAgICAgIGRpc3RhbmNlID0gdGhpcy5nYW1lLm1hdGguZGlzdGFuY2UodGhpcy54LCB0aGlzLnksIHRoaXMudGFyZ2V0LngsIHRoaXMudGFyZ2V0LnkpO1xuXG4gICAgICBpZiAoZGlzdGFuY2UgPiB0aGlzLm1pbkRpc3RhbmNlKSB7XG4gICAgICAgIHJvdGF0aW9uID0gdGhpcy5nYW1lLm1hdGguYW5nbGVCZXR3ZWVuKHRoaXMueCwgdGhpcy55LCB0aGlzLnRhcmdldC54LCB0aGlzLnRhcmdldC55KTtcblxuICAgICAgICB0aGlzLmJvZHkudmVsb2NpdHkueCA9IE1hdGguY29zKHJvdGF0aW9uKSAqIHRoaXMuc3BlZWQgKiBNYXRoLm1pbihkaXN0YW5jZSAvIDEyMCwgMik7XG4gICAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS55ID0gTWF0aC5zaW4ocm90YXRpb24pICogdGhpcy5zcGVlZCAqIE1hdGgubWluKGRpc3RhbmNlIC8gMTIwLCAyKTtcbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IHJvdGF0aW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5ib2R5LnZlbG9jaXR5LnNldFRvKDAsIDApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmJvZHkudmVsb2NpdHkuc2V0VG8oMCwgMCk7XG4gICAgfVxuXG4gICAgLy8gU2hpZWxkc1xuICAgIGlmICh0aGlzLnNoaWVsZHNFbmFibGVkKSB7XG4gICAgICB0aGlzLnNoaWVsZC54ID0gdGhpcy54O1xuICAgICAgdGhpcy5zaGllbGQueSA9IHRoaXMueTtcbiAgICAgIHRoaXMuc2hpZWxkLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbjtcbiAgICB9XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLlBsYXllci5wcm90b3R5cGUudXBkYXRlUmVtb3RlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc3RhdGVRdWV1ZS5sZW5ndGggPiB0aGlzLm1pblF1ZXVlU2l6ZSkge1xuICAgICAgdmFyIGVhcmxpZXN0UXVldWUgPSB0aGlzLnN0YXRlUXVldWUucG9wKCk7XG5cbiAgICAgIFxuICAgICAgaWYgKCF0aGlzLnByZXZpb3VzU3RhdGVUaW1lKSB7XG4gICAgICAgIHRoaXMucHJldmlvdXNTdGF0ZVRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHR3ZWVuVGltZSA9IE1hdGguYWJzKHRoaXMucHJldmlvdXNTdGF0ZVRpbWUgLSAoZWFybGllc3RRdWV1ZS50aW1lc3RhbXAgKyAxMCkpO1xuICAgICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzKVxuICAgICAgICAudG8oe1xuICAgICAgICAgIHg6IGVhcmxpZXN0UXVldWUueCxcbiAgICAgICAgICB5OiBlYXJsaWVzdFF1ZXVlLnksXG4gICAgICAgICAgcm90YXRpb246IGVhcmxpZXN0UXVldWUucm90YXRpb25cbiAgICAgICAgfSwgdHdlZW5UaW1lLCBcbiAgICAgICAgUGhhc2VyLkVhc2luZy5MaW5lYXIuTm9uZSwgdHJ1ZSwgMCk7XG5cbiAgICAgIHRoaXMucHJldmlvdXNTdGF0ZVRpbWUgPSBlYXJsaWVzdFF1ZXVlLnRpbWVzdGFtcDtcbiAgICB9XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLlBsYXllci5wcm90b3R5cGUuZGllID0gZnVuY3Rpb24oYXV0b0tpbGwpe1xuICAgIGlmKCF0aGlzLmRlYWQpe1xuICAgICAgdGhpcy5kZWFkID0gdHJ1ZTtcbiAgICAgIHRoaXMuYWxwaGEgPSAwO1xuXG4gICAgICAvLyBFeHBsb3Npb25cbiAgICAgIGlmKCFhdXRvS2lsbCl7XG4gICAgICAgIHRoaXMuc2hvd0V4cGxvc2lvbigpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBHYW1lLlByZWZhYnMuUGxheWVyLnByb3RvdHlwZS53YXNIaXRCeSA9IGZ1bmN0aW9uKGJ1bGxldCwgcGxheWVyKSB7XG4gICAgaWYgKCF0aGlzLnNoaWVsZHNFbmFibGVkKSB7XG4gICAgICB0aGlzLmhlYWx0aCAtPSAxMDtcblxuICAgICAgaWYgKHRoaXMuaGVhbHRoIDw9IDApIHtcbiAgICAgICAgdGhpcy5kaWUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZW5hYmxlU2hpZWxkKDAuMyk7XG4gICAgICAgIHRoaXMuc2hvd0V4cGxvc2lvbigpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH07XG5cbiAgR2FtZS5QcmVmYWJzLlBsYXllci5wcm90b3R5cGUuc2hvd0V4cGxvc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZXhwbG9zaW9uLnJlc2V0KHRoaXMueCwgdGhpcy55KTtcbiAgICB0aGlzLmV4cGxvc2lvbi5hbHBoYSA9IDA7XG4gICAgdGhpcy5leHBsb3Npb24uc2NhbGUueCA9IDAuMjtcbiAgICB0aGlzLmV4cGxvc2lvbi5zY2FsZS55ID0gMC4yO1xuICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5leHBsb3Npb24pXG4gICAgLnRvKHthbHBoYTogMSwgYW5nbGU6IFwiKzMwXCJ9LCAyMDAsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5PTkUsIHRydWUsIDApLnRvKHthbHBoYTogMCwgYW5nbGU6IFwiKzMwXCJ9LCAzMDAsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5PTkUsIHRydWUsIDApO1xuICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5leHBsb3Npb24uc2NhbGUpXG4gICAgLnRvKHt4OjEuNSwgeToxLjV9LCA1MDAsIFBoYXNlci5FYXNpbmcuQ3ViaWMuT3V0LCB0cnVlLCAwKTtcbiAgfTtcblxuICBHYW1lLlByZWZhYnMuUGxheWVyLnByb3RvdHlwZS5lbmFibGVTaGllbGQgPSBmdW5jdGlvbihkdXJhdGlvbikge1xuICAgIHRoaXMuc2hpZWxkc0VuYWJsZWQgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMudGltZXJTaGllbGQgJiYgIXRoaXMudGltZXJTaGllbGQuZXhwaXJlZCkge1xuICAgICAgdGhpcy50aW1lclNoaWVsZC5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy50aW1lclNoaWVsZCA9IHRoaXMuZ2FtZS50aW1lLmNyZWF0ZSh0cnVlKTtcbiAgICB0aGlzLnRpbWVyU2hpZWxkLmFkZChQaGFzZXIuVGltZXIuU0VDT05EICogZHVyYXRpb24sIHRoaXMuZGlzYWJsZVNoaWVsZCwgdGhpcyk7XG4gICAgdGhpcy50aW1lclNoaWVsZC5zdGFydCgpO1xuXG4gICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLnNoaWVsZClcbiAgICAgIC50byh7YWxwaGE6IDF9LCAzMDAsIFBoYXNlci5FYXNpbmcuQ3ViaWMuT3V0LCB0cnVlLCAwKTtcbiAgfTtcblxuICBHYW1lLlByZWZhYnMuUGxheWVyLnByb3RvdHlwZS5kaXNhYmxlU2hpZWxkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLnNoaWVsZClcbiAgICAgIC50byh7YWxwaGE6IDB9LCAzMDAsIFxuICAgICAgICBQaGFzZXIuRWFzaW5nLkxpbmVhci5OT05FLCBcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgMCwgNiwgdHJ1ZSkub25Db21wbGV0ZS5hZGQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGhpcy5zaGllbGRzRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgfVxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5nYW1lJylcbi5kaXJlY3RpdmUoJ2dhbWVDYW52YXMnLCBmdW5jdGlvbigkd2luZG93LCBteVNvY2tldCwgJGluamVjdG9yKSB7XG5cbiAgdmFyIGxpbmtGbiA9IGZ1bmN0aW9uKHNjb3BlLCBlbGUsIGF0dHJzKSB7XG4gICAgdmFyIHcgPSBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdyk7XG4gICAgdy5iaW5kKCdyZXNpemUnLCBmdW5jdGlvbihldnQpIHtcbiAgICAgIC8vIElmIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxuICAgIH0pO1xuXG4gICAgbXlTb2NrZXQudGhlbihmdW5jdGlvbihzb2NrKSB7XG4gICAgICByZXF1aXJlKCcuL21haW4uanMnKShcbiAgICAgICAgZWxlLCBzY29wZSwgc29jaywgXG4gICAgICAgIHNjb3BlLm5nTW9kZWwsIFxuICAgICAgICBzY29wZS5tYXBJZCwgXG4gICAgICAgICRpbmplY3Rvcik7XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBzY29wZToge1xuICAgICAgbmdNb2RlbDogJz0nLFxuICAgICAgbWFwSWQ6ICc9J1xuICAgIH0sXG4gICAgdGVtcGxhdGU6ICc8ZGl2IGlkPVwiZ2FtZS1jYW52YXNcIj48L2Rpdj4nLFxuICAgIGNvbXBpbGU6IGZ1bmN0aW9uKGlFbGUsIGlBdHRycykge1xuICAgICAgcmV0dXJuIGxpbmtGbjtcbiAgICB9XG4gIH1cbn0pIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5nYW1lJylcbi5jb250cm9sbGVyKCdHYW1lQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBteVNvY2tldCwgVXNlcikge1xuICAkc2NvcGUucGxheWVycyA9IFtdO1xuICAkc2NvcGUubWFwSWQgPSAkc3RhdGVQYXJhbXMuaWQgfHwgJzEnO1xuXG4gICRzY29wZS4kb24oJ2dhbWU6Z2V0QXZhaWxhYmxlUGxheWVycycsIGZ1bmN0aW9uKHBsYXllcnMpIHtcbiAgICAkc2NvcGUucGxheWVycyA9IHBsYXllcnM7XG4gIH0pO1xuXG4gICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAgJHNjb3BlLiRlbWl0KCdwbGF5ZXIgbGVhdmluZycpO1xuICB9KTtcblxufSk7IiwibW9kdWxlLmV4cG9ydHMgPVxuYW5ndWxhci5tb2R1bGUoJ2FwcC5nYW1lJywgWyd1aS5yb3V0ZXInLCAnYXBwLnVzZXInXSlcbi5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpIHtcbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2dhbWUnLCB7XG4gICAgICB1cmw6ICcvZ2FtZScsXG4gICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgIHRlbXBsYXRlVXJsOiAnL3NjcmlwdHMvZ2FtZS90ZW1wbGF0ZS5odG1sJ1xuICAgIH0pXG4gICAgLnN0YXRlKCdnYW1lLnBsYXknLCB7XG4gICAgICB1cmw6ICcvOmlkJyxcbiAgICAgIHRlbXBsYXRlOiAnPGRpdj5cXFxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZUNhbnZhc1wiIGdhbWUtY2FudmFzPVwicGxheWVyc1wiIG1hcC1pZD1cIm1hcElkXCI+PC9kaXY+XFxcbiAgICAgIDwvZGl2PicsXG4gICAgICBjb250cm9sbGVyOiAnR2FtZUNvbnRyb2xsZXInLFxuICAgICAgb25FbnRlcjogZnVuY3Rpb24oR2FtZSkge1xuICAgICAgICBHYW1lLnBsYXlpbmcgPSB0cnVlO1xuICAgICAgfSxcbiAgICAgIG9uRXhpdDogZnVuY3Rpb24oR2FtZSkge1xuICAgICAgICBHYW1lLnBsYXlpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9KVxufSlcblxucmVxdWlyZSgnLi9nYW1lX2NvbnRyb2xsZXIuanMnKVxucmVxdWlyZSgnLi9nYW1lX2NhbnZhcy5qcycpOyIsIid1c2Ugc3RyaWN0JztcblxuXG4vKipcbiogQGF1dGhvciAgICAgICBKZXJlbXkgRG93ZWxsIDxqZXJlbXlAY29kZXZpbnNreS5jb20+XG4qIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHA6Ly93d3cud3RmcGwubmV0L3R4dC9jb3B5aW5nL3xXVEZQTH1cbiovXG5cbi8qKlxuKiBDcmVhdGVzIGEgbmV3IGBKdWljeWAgb2JqZWN0LlxuKlxuKiBAY2xhc3MgUGhhc2VyLlBsdWdpbi5KdWljeVxuKiBAY29uc3RydWN0b3JcbipcbiogQHBhcmFtIHtQaGFzZXIuR2FtZX0gZ2FtZSBDdXJyZW50IGdhbWUgaW5zdGFuY2UuXG4qL1xuXG5QaGFzZXIuUGx1Z2luLkp1aWN5ID0gZnVuY3Rpb24gKGdhbWUpIHtcblxuICBQaGFzZXIuUGx1Z2luLmNhbGwodGhpcywgZ2FtZSk7XG5cbiAgLyoqXG4gICogQHByb3BlcnR5IHtQaGFzZXIuUmVjdGFuZ2xlfSBfYm91bmRzQ2FjaGUgLSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCB3b3JsZCBib3VuZHMuXG4gICogQHByaXZhdGVcbiAgKi9cbiAgdGhpcy5fYm91bmRzQ2FjaGUgPSBQaGFzZXIuVXRpbHMuZXh0ZW5kKGZhbHNlLCB7fSwgdGhpcy5nYW1lLndvcmxkLmJvdW5kcyk7XG5cbiAgLyoqXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IF9zaGFrZVdvcmxkTWF4IC0gVGhlIG1heGltdW0gd29ybGQgc2hha2UgcmFkaXVzXG4gICogQHByaXZhdGVcbiAgKi9cbiAgdGhpcy5fc2hha2VXb3JsZE1heCA9IDIwO1xuXG4gIC8qKlxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBfc2hha2VXb3JsZFRpbWUgLSBUaGUgbWF4aW11bSB3b3JsZCBzaGFrZSB0aW1lXG4gICogQHByaXZhdGVcbiAgKi9cbiAgdGhpcy5fc2hha2VXb3JsZFRpbWUgPSAwO1xuXG4gIC8qKlxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBfdHJhaWxDb3VudGVyIC0gQSBjb3VudCBvZiBob3cgbWFueSB0cmFpbHMgd2UncmUgdHJhY2tpbmdcbiAgKiBAcHJpdmF0ZVxuICAqLyAgXG4gIHRoaXMuX3RyYWlsQ291bnRlciA9IDA7XG5cbiAgLyoqXG4gICogQHByb3BlcnR5IHtvYmplY3R9IF9vdmVyU2NhbGVzIC0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgb3ZlcnNjYWxpbmcgY29uZmlndXJhdGlvbnNcbiAgKiBAcHJpdmF0ZVxuICAqLyAgXG4gIHRoaXMuX292ZXJTY2FsZXMgPSB7fTtcblxuICAvKipcbiAgKiBAcHJvcGVydHkge251bWJlcn0gX292ZXJTY2FsZXNDb3VudGVyIC0gQSBjb3VudCBvZiBob3cgbWFueSBvdmVyU2NhbGVzIHdlJ3JlIHRyYWNraW5nXG4gICogQHByaXZhdGVcbiAgKi8gIFxuICB0aGlzLl9vdmVyU2NhbGVzQ291bnRlciA9IDA7XG59O1xuXG5cblBoYXNlci5QbHVnaW4uSnVpY3kucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuUGx1Z2luLnByb3RvdHlwZSk7XG5QaGFzZXIuUGx1Z2luLkp1aWN5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBoYXNlci5QbHVnaW4uSnVpY3k7XG5cblxuXG4vKipcbiogQ3JlYXRlcyBhIG5ldyBgSnVpY3kuU2NyZWVuRmxhc2hgIG9iamVjdC5cbipcbiogQGNsYXNzIFBoYXNlci5QbHVnaW4uSnVpY3kuU2NyZWVuRmxhc2hcbiogQGNvbnN0cnVjdG9yXG4qXG4qIEBwYXJhbSB7UGhhc2VyLkdhbWV9IGdhbWUgLSAgQ3VycmVudCBnYW1lIGluc3RhbmNlLlxuKiBAcGFyYW0ge3N0cmluZ30gY29sb3I9J3doaXRlJyAtIFRoZSBjb2xvciB0byBmbGFzaCB0aGUgc2NyZWVuLlxuKiBAbWVtYmVyb2YgUGhhc2VyLlBsdWdpbi5KdWljeVxuKi9cblBoYXNlci5QbHVnaW4uSnVpY3kuU2NyZWVuRmxhc2ggPSBmdW5jdGlvbihnYW1lLCBjb2xvcikge1xuICBjb2xvciA9IGNvbG9yIHx8ICd3aGl0ZSc7XG4gIHZhciBibWQgPSBnYW1lLmFkZC5iaXRtYXBEYXRhKGdhbWUud2lkdGgsIGdhbWUuaGVpZ2h0KTtcbiAgYm1kLmN0eC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICBibWQuY3R4LmZpbGxSZWN0KDAsMCwgZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQpO1xuXG4gIFBoYXNlci5TcHJpdGUuY2FsbCh0aGlzLCBnYW1lLCAwLDAsIGJtZCk7XG4gIHRoaXMuYWxwaGEgPSAwO1xufTtcblxuUGhhc2VyLlBsdWdpbi5KdWljeS5TY3JlZW5GbGFzaC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcblBoYXNlci5QbHVnaW4uSnVpY3kuU2NyZWVuRmxhc2gucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGhhc2VyLlBsdWdpbi5KdWljeS5TY3JlZW5GbGFzaDtcblxuXG4vKlxuKiBGbGFzaGVzIHRoZSBzY3JlZW5cbipcbiogQHBhcmFtIHtudW1iZXJ9IFttYXhBbHBoYT0xXSAtIFRoZSBtYXhpbXVtIGFscGhhIHRvIGZsYXNoIHRoZSBzY3JlZW4gdG9cbiogQHBhcmFtIHtudW1iZXJ9IFtkdXJhdGlvbj0xMDBdIC0gVGhlIGR1cmF0aW9uIG9mIHRoZSBmbGFzaCBpbiBtaWxsaXNlY29uZHNcbiogQG1ldGhvZCBQaGFzZXIuUGx1Z2luLkp1aWN5LlNjcmVlbkZsYXNoLnByb3RvdHlwZS5mbGFzaFxuKiBAbWVtYmVyb2YgUGhhc2VyLlBsdWdpbi5KdWljeS5TY3JlZW5GbGFzaFxuKi9cblBoYXNlci5QbHVnaW4uSnVpY3kuU2NyZWVuRmxhc2gucHJvdG90eXBlLmZsYXNoID0gZnVuY3Rpb24obWF4QWxwaGEsIGR1cmF0aW9uKSB7XG4gIG1heEFscGhhID0gbWF4QWxwaGEgfHwgMTtcbiAgZHVyYXRpb24gPSBkdXJhdGlvbiB8fCAxMDA7XG4gIHZhciBmbGFzaFR3ZWVuID0gdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzKS50byh7YWxwaGE6IG1heEFscGhhfSwgMTAwLCBQaGFzZXIuRWFzaW5nLkJvdW5jZS5Jbk91dCwgdHJ1ZSwwLCAwLCB0cnVlKTtcbiAgZmxhc2hUd2Vlbi5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICB0aGlzLmFscGhhID0gMDtcbiAgfSwgdGhpcyk7XG59O1xuXG4vKipcbiogQ3JlYXRlcyBhIG5ldyBgSnVpY3kuVHJhaWxgIG9iamVjdC5cbipcbiogQGNsYXNzIFBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWxcbiogQGNvbnN0cnVjdG9yXG4qXG4qIEBwYXJhbSB7UGhhc2VyLkdhbWV9IGdhbWUgLSAgQ3VycmVudCBnYW1lIGluc3RhbmNlLlxuKiBAcGFyYW0ge251bWJlcn0gW3RyYWlsTGVuZ3RoPTEwMF0gLSBUaGUgbGVuZ3RoIG9mIHRoZSB0cmFpbFxuKiBAcGFyYW0ge251bWJlcn0gW2NvbG9yPTB4RkZGRkZGXSAtIFRoZSBjb2xvciBvZiB0aGUgdHJhaWxcbiogQG1lbWJlcm9mIFBoYXNlci5QbHVnaW4uSnVpY3lcbiovXG5QaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsID0gZnVuY3Rpb24oZ2FtZSwgdHJhaWxMZW5ndGgsIGNvbG9yKSB7XG4gIFBoYXNlci5HcmFwaGljcy5jYWxsKHRoaXMsIGdhbWUsIDAsMCk7XG4gIFxuICAvKipcbiAgKiBAcHJvcGVydHkge1BoYXNlci5TcHJpdGV9IHRhcmdldCAtIFRoZSB0YXJnZXQgc3ByaXRlIHdob3NlIG1vdmVtZW50IHdlIHdhbnQgdG8gY3JlYXRlIHRoZSB0cmFpbCBmcm9tXG4gICovXG4gIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgLyoqXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IHRyYWlsTGVuZ3RoIC0gVGhlIG51bWJlciBvZiBzZWdtZW50cyB0byB1c2UgdG8gY3JlYXRlIHRoZSB0cmFpbFxuICAqL1xuICB0aGlzLnRyYWlsTGVuZ3RoID0gdHJhaWxMZW5ndGggfHwgMTAwO1xuICAvKipcbiAgKiBAcHJvcGVydHkge251bWJlcn0gdHJhaWxXaWR0aCAtIFRoZSB3aWR0aCBvZiB0aGUgdHJhaWxcbiAgKi9cbiAgdGhpcy50cmFpbFdpZHRoID0gMTUuMDtcblxuICAvKipcbiAgKiBAcHJvcGVydHkge2Jvb2xlYW59IHRyYWlsU2NhbGUgLSBXaGV0aGVyIG9yIG5vdCB0byB0YXBlciB0aGUgdHJhaWwgdG93YXJkcyB0aGUgZW5kXG4gICovXG4gIHRoaXMudHJhaWxTY2FsaW5nID0gZmFsc2U7XG5cbiAgLyoqXG4gICogQHByb3BlcnR5IHtQaGFzZXIuU3ByaXRlfSB0cmFpbENvbG9yIC0gVGhlIGNvbG9yIG9mIHRoZSB0cmFpbFxuICAqL1xuICB0aGlzLnRyYWlsQ29sb3IgPSBjb2xvciB8fCAweEZGRkZGRjtcbiAgXG4gIC8qKlxuICAqIEBwcm9wZXJ0eSB7QXJyYXk8UGhhc2VyLlBvaW50Pn0gX3NlZ21lbnRzIC0gQSBoaXN0b3JpY2FsIGNvbGxlY3Rpb24gb2YgdGhlIHByZXZpb3VzIHBvc2l0aW9uIG9mIHRoZSB0YXJnZXRcbiAgKiBAcHJpdmF0ZVxuICAqL1xuICB0aGlzLl9zZWdtZW50cyA9IFtdO1xuICAvKipcbiAgKiBAcHJvcGVydHkge0FycmF5PG51bWJlcj59IF92ZXJ0cyAtIEEgY29sbGVjdGlvbiBvZiB2ZXJ0aWNlcyBjcmVhdGVkIGZyb20gX3NlZ21lbnRzXG4gICogQHByaXZhdGVcbiAgKi9cbiAgdGhpcy5fdmVydHMgPSBbXTtcbiAgLyoqXG4gICogQHByb3BlcnR5IHtBcnJheTxQaGFzZXIuUG9pbnQ+fSBfc2VnbWVudHMgLSBBIGNvbGxlY3Rpb24gb2YgaW5kaWNlcyBjcmVhdGVkIGZyb20gX3ZlcnRzXG4gICogQHByaXZhdGVcbiAgKi9cbiAgdGhpcy5faW5kaWNlcyA9IFtdO1xuXG59O1xuXG5QaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLkdyYXBoaWNzLnByb3RvdHlwZSk7XG5QaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWw7XG5cbi8qKlxuKiBVcGRhdGVzIHRoZSBUcmFpbCBpZiBhIHRhcmdldCBpcyBzZXRcbipcbiogQG1ldGhvZCBQaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsI3VwZGF0ZVxuKiBAbWVtYmVyb2YgUGhhc2VyLlBsdWdpbi5KdWljeS5UcmFpbFxuKi9cblxuUGhhc2VyLlBsdWdpbi5KdWljeS5UcmFpbC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gIGlmKHRoaXMudGFyZ2V0KSB7XG4gICAgdGhpcy54ID0gdGhpcy50YXJnZXQueDtcbiAgICB0aGlzLnkgPSB0aGlzLnRhcmdldC55O1xuICAgIHRoaXMuYWRkU2VnbWVudCh0aGlzLnRhcmdldC54LCB0aGlzLnRhcmdldC55KTtcbiAgICB0aGlzLnJlZHJhd1NlZ21lbnRzKHRoaXMudGFyZ2V0LngsIHRoaXMudGFyZ2V0LnkpO1xuICB9XG59O1xuXG4vKipcbiogQWRkcyBhIHNlZ21lbnQgdG8gdGhlIHNlZ21lbnRzIGxpc3QgYW5kIGN1bGxzIHRoZSBsaXN0IGlmIGl0IGlzIHRvbyBsb25nXG4qIFxuKiBAcGFyYW0ge251bWJlcn0gW3hdIC0gVGhlIHggcG9zaXRpb24gb2YgdGhlIHBvaW50XG4qIEBwYXJhbSB7bnVtYmVyfSBbeV0gLSBUaGUgeSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRcbiogXG4qIEBtZXRob2QgUGhhc2VyLlBsdWdpbi5KdWljeS5UcmFpbCNhZGRTZWdtZW50XG4qIEBtZW1iZXJvZiBQaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsXG4qL1xuUGhhc2VyLlBsdWdpbi5KdWljeS5UcmFpbC5wcm90b3R5cGUuYWRkU2VnbWVudCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgdmFyIHNlZ21lbnQ7XG5cbiAgd2hpbGUodGhpcy5fc2VnbWVudHMubGVuZ3RoID4gdGhpcy50cmFpbExlbmd0aCkge1xuICAgIHNlZ21lbnQgPSB0aGlzLl9zZWdtZW50cy5zaGlmdCgpO1xuICB9XG4gIGlmKCFzZWdtZW50KSB7XG4gICAgc2VnbWVudCA9IG5ldyBQaGFzZXIuUG9pbnQoKTtcbiAgfVxuXG4gIHNlZ21lbnQueCA9IHg7XG4gIHNlZ21lbnQueSA9IHk7XG5cbiAgdGhpcy5fc2VnbWVudHMucHVzaChzZWdtZW50KTtcbn07XG5cblxuLyoqXG4qIENyZWF0ZXMgYW5kIGRyYXdzIHRoZSB0cmlhbmdsZSB0cmFpbCBmcm9tIHNlZ21lbnRzXG4qIFxuKiBAcGFyYW0ge251bWJlcn0gW29mZnNldFhdIC0gVGhlIHggcG9zaXRpb24gb2YgdGhlIG9iamVjdFxuKiBAcGFyYW0ge251bWJlcn0gW29mZnNldFldIC0gVGhlIHkgcG9zaXRpb24gb2YgdGhlIG9iamVjdFxuKiBcbiogQG1ldGhvZCBQaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsI3JlZHJhd1NlZ21lbnRcbiogQG1lbWJlcm9mIFBoYXNlci5QbHVnaW4uSnVpY3kuVHJhaWxcbiovXG5QaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsLnByb3RvdHlwZS5yZWRyYXdTZWdtZW50cyA9IGZ1bmN0aW9uKG9mZnNldFgsIG9mZnNldFkpIHtcbiAgdGhpcy5jbGVhcigpO1xuICB2YXIgczEsIC8vIGN1cnJlbnQgc2VnbWVudFxuICAgICAgczIsIC8vIHByZXZpb3VzIHNlZ21lbnRcbiAgICAgIHZlcnRJbmRleCA9IDAsIC8vIGtlZXBzIHRyYWNrIG9mIHdoaWNoIHZlcnRleCBpbmRleCB3ZSdyZSBhdFxuICAgICAgb2Zmc2V0LCAvLyB0ZW1wb3Jhcnkgc3RvcmFnZSBmb3IgYW1vdW50IHRvIGV4dGVuZCBsaW5lIG91dHdhcmRzLCBiaWdnZXIgPSB3aWRlclxuICAgICAgYW5nLCAvL3RlbXBvcmFyeSBzdG9yYWdlIG9mIHRoZSBpbnRlci1zZWdtZW50IGFuZ2xlc1xuICAgICAgc2luID0gMCwgLy8gYXMgYWJvdmVcbiAgICAgIGNvcyA9IDA7IC8vIGFnYWluIGFzIGFib3ZlXG5cbiAgLy8gZmlyc3Qgd2UgbWFrZSBzdXJlIHRoYXQgdGhlIHZlcnRpY2UgbGlzdCBpcyB0aGUgc2FtZSBsZW5ndGggYXMgd2Ugd2Ugd2FudFxuICAvLyBlYWNoIHNlZ21lbnQgKGV4Y2VwdCB0aGUgZmlyc3QpIHdpbGwgY3JlYXRlIHRvIHZlcnRpY2VzIHdpdGggdHdvIHZhbHVlcyBlYWNoXG4gIGlmICh0aGlzLl92ZXJ0cy5sZW5ndGggIT09ICh0aGlzLl9zZWdtZW50cy5sZW5ndGggLTEpICogNCkge1xuICAgIC8vIGlmIGl0J3Mgbm90IGNvcnJlY3QsIHdlIGNsZWFyIHRoZSBlbnRpcmUgbGlzdFxuICAgIHRoaXMuX3ZlcnRzID0gW107XG4gIH1cblxuICAvLyBub3cgd2UgbG9vcCBvdmVyIGFsbCB0aGUgc2VnbWVudHMsIHRoZSBsaXN0IGhhcyB0aGUgXCJ5b3VuZ2VzdFwiIHNlZ21lbnQgYXQgdGhlIGVuZFxuICB2YXIgcHJldkFuZyA9IDA7XG4gIFxuICBmb3IodmFyIGogPSAwOyBqIDwgdGhpcy5fc2VnbWVudHMubGVuZ3RoOyArK2opIHtcbiAgICAvLyBzdG9yZSB0aGUgYWN0aXZlIHNlZ21lbnQgZm9yIGNvbnZlbmllbmNlXG4gICAgczEgPSB0aGlzLl9zZWdtZW50c1tqXTtcblxuICAgIC8vIGlmIHRoZXJlJ3MgYSBwcmV2aW91cyBzZWdtZW50LCB0aW1lIHRvIGRvIHNvbWUgbWF0aFxuICAgIGlmKHMyKSB7XG4gICAgICAvLyB3ZSBjYWxjdWxhdGUgdGhlIGFuZ2xlIGJldHdlZW4gdGhlIHR3byBzZWdtZW50c1xuICAgICAgLy8gdGhlIHJlc3VsdCB3aWxsIGJlIGluIHJhZGlhbnMsIHNvIGFkZGluZyBoYWxmIG9mIHBpIHdpbGwgXCJ0dXJuXCIgdGhlIGFuZ2xlIDkwIGRlZ3JlZXNcbiAgICAgIC8vIHRoYXQgbWVhbnMgd2UgY2FuIHVzZSB0aGUgc2luIGFuZCBjb3MgdmFsdWVzIHRvIFwiZXhwYW5kXCIgdGhlIGxpbmUgb3V0d2FyZHNcbiAgICAgIGFuZyA9IE1hdGguYXRhbjIoczEueSAtIHMyLnksIHMxLnggLSBzMi54KSArIE1hdGguUEkgLyAyO1xuICAgICAgc2luID0gTWF0aC5zaW4oYW5nKTtcbiAgICAgIGNvcyA9IE1hdGguY29zKGFuZyk7XG5cbiAgICAgIC8vIG5vdyBpdCdzIHRpbWUgdG8gY3JlYXQgZXRoZSB0d28gdmVydGljZXMgdGhhdCB3aWxsIHJlcHJlc2VudCB0aGlzIHBhaXIgb2Ygc2VnbWVudHNcbiAgICAgIC8vIHVzaW5nIGEgbG9vcCBoZXJlIGlzIHByb2JhYmx5IGEgYml0IG92ZXJraWxsIHNpbmNlIGl0J3Mgb25seSB0d28gaXRlcmF0aW9uc1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IDI7ICsraSkge1xuICAgICAgICAvLyB0aGlzIG1ha2VzIHRoZSBmaXJzdCBzZWdtZW50IHN0YW5kIG91dCB0byB0aGUgXCJsZWZ0XCIgb2YgdGhlIGxpbmVcbiAgICAgICAgLy8gYW5uZCB0aGUgc2Vjb25kIHRvIHRoZSByaWdodCwgY2hhbmdpbmcgdGhhdCBtYWdpYyBudW1iZXIgYXQgdGhlIGVuZCB3aWxsIGFsdGhlciB0aGUgbGluZSB3aWR0aFxuICAgICAgICBvZmZzZXQgPSAoIC0wLjUgKyBpIC8gMSkgKiB0aGlzLnRyYWlsV2lkdGg7XG5cbiAgICAgICAgLy8gaWYgdHJhaWwgc2NhbGUgZWZmZWN0IGlzIGVuYWJsZWQsIHdlIHNjYWxlIGRvd24gdGhlIG9mZnNldCBhcyB3ZSBtb3ZlIGRvd24gdGhlIGxpc3RcbiAgICAgICAgaWYodGhpcy50cmFpbFNjYWxpbmcpIHtcbiAgICAgICAgICBvZmZzZXQgKj0gaiAvIHRoaXMuX3NlZ21lbnRzLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZpbmFsbHkgd2UgcHV0IHRvIHZhbHVlcyBpbiB0aGUgdmVydCBsaXN0XG4gICAgICAgIC8vIHVzaW5nIHRoZSBzZWdtZW50IGNvb3JkaW5hdGVzIGFzIGEgYmFzZSB3ZSBhZGQgdGhlIFwiZXh0ZW5kZWRcIiBwb2ludFxuICAgICAgICAvLyBvZmZzZXRYIGFuZCBvZmZzZXRZIGFyZSB1c2VkIGhlciB0byBtb3ZlIHRoZSBlbnRpcmUgdHJhaWxcbiAgICAgICAgdGhpcy5fdmVydHNbdmVydEluZGV4KytdID0gczEueCArIGNvcyAqIG9mZnNldCAtIG9mZnNldFg7XG4gICAgICAgIHRoaXMuX3ZlcnRzW3ZlcnRJbmRleCsrXSA9IHMxLnkgKyBzaW4gKiBvZmZzZXQgLSBvZmZzZXRZO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBmaW5hbGx5IHN0b3JlIHRoZSBjdXJyZW50IHNlZ21lbnQgYXMgdGhlIHByZXZpb3VzIHNlZ21lbnQgYW5kIGdvIGZvciBhbm90aGVyIHJvdW5kXG4gICAgczIgPSBzMS5jb3B5VG8oe30pO1xuICB9XG4gIC8vIHdlIG5lZWQgYXQgbGVhc3QgZm91ciB2ZXJ0aWNlcyB0byBkcmF3IHNvbWV0aGluZ1xuICBpZih0aGlzLl92ZXJ0cy5sZW5ndGggPj0gOCkge1xuICAgIC8vIG5vdywgd2UgaGF2ZSBhIHRyaWFuZ2xlIFwic3RyaXBcIiwgYnV0IGZsYXNoIGNhbid0IGRyYXcgdGhhdCB3aXRob3V0IFxuICAgIC8vIGluc3RydWN0aW9ucyBmb3Igd2hpY2ggdmVydGljZXMgdG8gY29ubmVjdCwgc28gaXQncyB0aW1lIHRvIG1ha2UgdGhvc2VcbiAgICBcbiAgICAvLyBoZXJlLCB3ZSBsb29wIG92ZXIgYWxsIHRoZSB2ZXJ0aWNlcyBhbmQgcGFpciB0aGVtIHRvZ2V0aGVyIGluIHRyaWFuZ2xlc1xuICAgIC8vIGVhY2ggZ3JvdXAgb2YgZm91ciB2ZXJ0aWNlcyBmb3JtcyB0d28gdHJpYW5nbGVzXG4gICAgZm9yKHZhciBrID0gMDsgayA8IHRoaXMuX3ZlcnRzLmxlbmd0aDsgaysrKSB7XG4gICAgICB0aGlzLl9pbmRpY2VzW2sgKiA2ICsgMF0gPSBrICogMiArIDA7XG4gICAgICB0aGlzLl9pbmRpY2VzW2sgKiA2ICsgMV0gPSBrICogMiArIDE7XG4gICAgICB0aGlzLl9pbmRpY2VzW2sgKiA2ICsgMl0gPSBrICogMiArIDI7XG4gICAgICB0aGlzLl9pbmRpY2VzW2sgKiA2ICsgM10gPSBrICogMiArIDE7XG4gICAgICB0aGlzLl9pbmRpY2VzW2sgKiA2ICsgNF0gPSBrICogMiArIDI7XG4gICAgICB0aGlzLl9pbmRpY2VzW2sgKiA2ICsgNV0gPSBrICogMiArIDM7XG4gICAgfVxuICAgIHRoaXMuYmVnaW5GaWxsKHRoaXMudHJhaWxDb2xvcik7XG4gICAgdGhpcy5kcmF3VHJpYW5nbGVzKHRoaXMuX3ZlcnRzLCB0aGlzLl9pbmRpY2VzKTtcbiAgICB0aGlzLmVuZEZpbGwoKTtcbiAgICBcbiAgfVxufTtcblxuXG5cblxuXG5cbi8qKlxuKiBBZGQgYSBTcHJpdGUgcmVmZXJlbmNlIHRvIHRoaXMgUGx1Z2luLlxuKiBBbGwgdGhpcyBwbHVnaW4gZG9lcyBpcyBtb3ZlIHRoZSBTcHJpdGUgYWNyb3NzIHRoZSBzY3JlZW4gc2xvd2x5LlxuKiBAdHlwZSB7UGhhc2VyLlNwcml0ZX1cbiovXG5cbi8qKlxuKiBCZWdpbnMgdGhlIHNjcmVlbiBzaGFrZSBlZmZlY3RcbiogXG4qIEBwYXJhbSB7bnVtYmVyfSBbZHVyYXRpb249MjBdIC0gVGhlIGR1cmF0aW9uIG9mIHRoZSBzY3JlZW4gc2hha2VcbiogQHBhcmFtIHtudW1iZXJ9IFtzdHJlbmd0aD0yMF0gLSBUaGUgc3RyZW5ndGggb2YgdGhlIHNjcmVlbiBzaGFrZVxuKiBcbiogQG1ldGhvZCBQaGFzZXIuUGx1Z2luLkp1aWN5I3JlZHJhd1NlZ21lbnRcbiogQG1lbWJlcm9mIFBoYXNlci5QbHVnaW4uSnVpY3lcbiovXG5QaGFzZXIuUGx1Z2luLkp1aWN5LnByb3RvdHlwZS5zaGFrZSA9IGZ1bmN0aW9uIChkdXJhdGlvbiwgc3RyZW5ndGgpIHtcbiAgdGhpcy5fc2hha2VXb3JsZFRpbWUgPSBkdXJhdGlvbiB8fCAyMDtcbiAgdGhpcy5fc2hha2VXb3JsZE1heCA9IHN0cmVuZ3RoIHx8IDIwO1xuICB0aGlzLmdhbWUud29ybGQuc2V0Qm91bmRzKHRoaXMuX2JvdW5kc0NhY2hlLnggLSB0aGlzLl9zaGFrZVdvcmxkTWF4LCB0aGlzLl9ib3VuZHNDYWNoZS55IC0gdGhpcy5fc2hha2VXb3JsZE1heCwgdGhpcy5fYm91bmRzQ2FjaGUud2lkdGggKyB0aGlzLl9zaGFrZVdvcmxkTWF4LCB0aGlzLl9ib3VuZHNDYWNoZS5oZWlnaHQgKyB0aGlzLl9zaGFrZVdvcmxkTWF4KTtcbn07XG5cblxuLyoqXG4qIENyZWF0ZXMgYSAnSnVpY3kuU2NyZWVuRmxhc2gnIG9iamVjdFxuKlxuKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgLSBUaGUgY29sb3Igb2YgdGhlIHNjcmVlbiBmbGFzaFxuKiBcbiogQHR5cGUge1BoYXNlci5QbHVnaW4uSnVpY3kuU2NyZWVuRmxhc2h9XG4qL1xuXG5QaGFzZXIuUGx1Z2luLkp1aWN5LnByb3RvdHlwZS5jcmVhdGVTY3JlZW5GbGFzaCA9IGZ1bmN0aW9uKGNvbG9yKSB7XG4gICAgcmV0dXJuIG5ldyBQaGFzZXIuUGx1Z2luLkp1aWN5LlNjcmVlbkZsYXNoKHRoaXMuZ2FtZSwgY29sb3IpO1xufTtcblxuXG4vKipcbiogQ3JlYXRlcyBhICdKdWljeS5UcmFpbCcgb2JqZWN0XG4qXG4qIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggLSBUaGUgbGVuZ3RoIG9mIHRoZSB0cmFpbFxuKiBAcGFyYW0ge251bWJlcn0gY29sb3IgLSBUaGUgY29sb3Igb2YgdGhlIHRyYWlsXG4qIFxuKiBAdHlwZSB7UGhhc2VyLlBsdWdpbi5KdWljeS5UcmFpbH1cbiovXG5QaGFzZXIuUGx1Z2luLkp1aWN5LnByb3RvdHlwZS5jcmVhdGVUcmFpbCA9IGZ1bmN0aW9uKGxlbmd0aCwgY29sb3IpIHtcbiAgcmV0dXJuIG5ldyBQaGFzZXIuUGx1Z2luLkp1aWN5LlRyYWlsKHRoaXMuZ2FtZSwgbGVuZ3RoLCBjb2xvcik7XG59O1xuXG5cbi8qKlxuKiBDcmVhdGVzIHRoZSBvdmVyIHNjYWxlIGVmZmVjdCBvbiB0aGUgZ2l2ZW4gb2JqZWN0XG4qXG4qIEBwYXJhbSB7UGhhc2VyLlNwcml0ZX0gb2JqZWN0IC0gVGhlIG9iamVjdCB0byBvdmVyIHNjYWxlXG4qIEBwYXJhbSB7bnVtYmVyfSBbc2NhbGU9MS41XSAtIFRoZSBzY2FsZSBhbW91bnQgdG8gb3ZlcnNjYWxlIGJ5XG4qIEBwYXJhbSB7UGhhc2VyLlBvaW50fSBbaW5pdGlhbFNjYWxlPW5ldyBQaGFzZXIuUG9pbnQoMSwxKV0gLSBUaGUgaW5pdGlhbCBzY2FsZSBvZiB0aGUgb2JqZWN0XG4qIFxuKi9cblBoYXNlci5QbHVnaW4uSnVpY3kucHJvdG90eXBlLm92ZXJTY2FsZSA9IGZ1bmN0aW9uKG9iamVjdCwgc2NhbGUsIGluaXRpYWxTY2FsZSkge1xuICBzY2FsZSA9IHNjYWxlIHx8IDEuNTtcbiAgdmFyIGlkID0gdGhpcy5fb3ZlclNjYWxlc0NvdW50ZXIrKztcbiAgaW5pdGlhbFNjYWxlID0gaW5pdGlhbFNjYWxlIHx8IG5ldyBQaGFzZXIuUG9pbnQoMSwxKTtcbiAgdmFyIHNjYWxlT2JqID0gdGhpcy5fb3ZlclNjYWxlc1tpZF07XG4gIGlmKCFzY2FsZU9iaikge1xuICAgIHNjYWxlT2JqID0ge1xuICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICBjYWNoZTogaW5pdGlhbFNjYWxlLmNvcHlUbyh7fSlcbiAgICB9O1xuICB9IFxuICBzY2FsZU9iai5zY2FsZSA9IHNjYWxlO1xuICBcbiAgdGhpcy5fb3ZlclNjYWxlc1tpZF0gPSBzY2FsZU9iajtcbn07XG5cbi8qKlxuKiBDcmVhdGVzIHRoZSBqZWxseSBlZmZlY3Qgb24gdGhlIGdpdmVuIG9iamVjdFxuKlxuKiBAcGFyYW0ge1BoYXNlci5TcHJpdGV9IG9iamVjdCAtIFRoZSBvYmplY3QgdG8gZ2VsYXRpbml6ZVxuKiBAcGFyYW0ge251bWJlcn0gW3N0cmVuZ3RoPTAuMl0gLSBUaGUgc3RyZW5ndGggb2YgdGhlIGVmZmVjdFxuKiBAcGFyYW0ge251bWJlcn0gW2RlbGF5PTBdIC0gVGhlIGRlbGF5IG9mIHRoZSBzbmFwLWJhY2sgdHdlZW4uIDUwbXMgYXJlIGF1dG9tYXRpY2FsbGx5IGFkZGVkIHRvIHdoYXRldmVyIHRoZSBkZWxheSBhbW91bnQgaXMuXG4qIEBwYXJhbSB7UGhhc2VyLlBvaW50fSBbaW5pdGlhbFNjYWxlPW5ldyBQaGFzZXIuUG9pbnQoMSwxKV0gLSBUaGUgaW5pdGlhbCBzY2FsZSBvZiB0aGUgb2JqZWN0XG4qIFxuKi9cblBoYXNlci5QbHVnaW4uSnVpY3kucHJvdG90eXBlLmplbGx5ID0gZnVuY3Rpb24ob2JqZWN0LCBzdHJlbmd0aCwgZGVsYXksIGluaXRpYWxTY2FsZSkge1xuICBzdHJlbmd0aCA9IHN0cmVuZ3RoIHx8IDAuMjtcbiAgZGVsYXkgPSBkZWxheSB8fCAwO1xuICBpbml0aWFsU2NhbGUgPSBpbml0aWFsU2NhbGUgfHwgIG5ldyBQaGFzZXIuUG9pbnQoMSwgMSk7XG4gIFxuICB0aGlzLmdhbWUuYWRkLnR3ZWVuKG9iamVjdC5zY2FsZSkudG8oe3g6IGluaXRpYWxTY2FsZS54ICsgKGluaXRpYWxTY2FsZS54ICogc3RyZW5ndGgpfSwgNTAsIFBoYXNlci5FYXNpbmcuUXVhZHJhdGljLkluT3V0LCB0cnVlLCBkZWxheSlcbiAgLnRvKHt4OiBpbml0aWFsU2NhbGUueH0sIDYwMCwgUGhhc2VyLkVhc2luZy5FbGFzdGljLk91dCwgdHJ1ZSk7XG5cbiAgdGhpcy5nYW1lLmFkZC50d2VlbihvYmplY3Quc2NhbGUpLnRvKHt5OiBpbml0aWFsU2NhbGUueSArIChpbml0aWFsU2NhbGUueSAqIHN0cmVuZ3RoKX0sIDUwLCBQaGFzZXIuRWFzaW5nLlF1YWRyYXRpYy5Jbk91dCwgdHJ1ZSwgZGVsYXkgKyA1MClcbiAgLnRvKHt5OiBpbml0aWFsU2NhbGUueX0sIDYwMCwgUGhhc2VyLkVhc2luZy5FbGFzdGljLk91dCwgdHJ1ZSk7XG59O1xuXG4vKipcbiogQ3JlYXRlcyB0aGUgbW91c2Ugc3RyZXRjaCBlZmZlY3Qgb24gdGhlIGdpdmVuIG9iamVjdFxuKlxuKiBAcGFyYW0ge1BoYXNlci5TcHJpdGV9IG9iamVjdCAtIFRoZSBvYmplY3QgdG8gbW91c2Ugc3RyZXRjaFxuKiBAcGFyYW0ge251bWJlcn0gW3N0cmVuZ3RoPTAuNV0gLSBUaGUgc3RyZW5ndGggb2YgdGhlIGVmZmVjdFxuKiBAcGFyYW0ge1BoYXNlci5Qb2ludH0gW2luaXRpYWxTY2FsZT1uZXcgUGhhc2VyLlBvaW50KDEsMSldIC0gVGhlIGluaXRpYWwgc2NhbGUgb2YgdGhlIG9iamVjdFxuKiBcbiovXG5QaGFzZXIuUGx1Z2luLkp1aWN5LnByb3RvdHlwZS5tb3VzZVN0cmV0Y2ggPSBmdW5jdGlvbihvYmplY3QsIHN0cmVuZ3RoLCBpbml0aWFsU2NhbGUpIHtcbiAgICBzdHJlbmd0aCA9IHN0cmVuZ3RoIHx8IDAuNTtcbiAgICBpbml0aWFsU2NhbGUgPSBpbml0aWFsU2NhbGUgfHwgbmV3IFBoYXNlci5Qb2ludCgxLDEpO1xuICAgIG9iamVjdC5zY2FsZS54ID0gaW5pdGlhbFNjYWxlLnggKyAoTWF0aC5hYnMob2JqZWN0LnggLSB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54KSAvIDEwMCkgKiBzdHJlbmd0aDtcbiAgICBvYmplY3Quc2NhbGUueSA9IGluaXRpYWxTY2FsZS55ICsgKGluaXRpYWxTY2FsZS55ICogc3RyZW5ndGgpIC0gKG9iamVjdC5zY2FsZS54ICogc3RyZW5ndGgpO1xufTtcblxuLyoqXG4qIFJ1bnMgdGhlIGNvcmUgdXBkYXRlIGZ1bmN0aW9uIGFuZCBjYXVzZXMgc2NyZWVuIHNoYWtlIGFuZCBvdmVyc2NhbGluZyBlZmZlY3RzIHRvIG9jY3VyIGlmIHRoZXkgYXJlIHF1ZXVlZCB0byBkbyBzby5cbipcbiogQG1ldGhvZCBQaGFzZXIuUGx1Z2luLkp1aWN5I3VwZGF0ZVxuKiBAbWVtYmVyb2YgUGhhc2VyLlBsdWdpbi5KdWljeVxuKi9cblBoYXNlci5QbHVnaW4uSnVpY3kucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNjYWxlT2JqO1xuICAvLyBTY3JlZW4gU2hha2VcbiAgaWYodGhpcy5fc2hha2VXb3JsZFRpbWUgPiAwKSB7IFxuICAgIHZhciBtYWduaXR1ZGUgPSAodGhpcy5fc2hha2VXb3JsZFRpbWUgLyB0aGlzLl9zaGFrZVdvcmxkTWF4KSAqIHRoaXMuX3NoYWtlV29ybGRNYXg7XG4gICAgdmFyIHggPSB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKC1tYWduaXR1ZGUsIG1hZ25pdHVkZSk7XG4gICAgdmFyIHkgPSB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKC1tYWduaXR1ZGUsIG1hZ25pdHVkZSk7XG5cbiAgICB0aGlzLmdhbWUuY2FtZXJhLnggPSB4O1xuICAgIHRoaXMuZ2FtZS5jYW1lcmEueSA9IHk7XG4gICAgdGhpcy5fc2hha2VXb3JsZFRpbWUtLTtcbiAgICBpZih0aGlzLl9zaGFrZVdvcmxkVGltZSA8PSAwKSB7XG4gICAgICB0aGlzLmdhbWUud29ybGQuc2V0Qm91bmRzKHRoaXMuX2JvdW5kc0NhY2hlLngsIHRoaXMuX2JvdW5kc0NhY2hlLngsIHRoaXMuX2JvdW5kc0NhY2hlLndpZHRoLCB0aGlzLl9ib3VuZHNDYWNoZS5oZWlnaHQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIG92ZXIgc2NhbGVzXG4gIGZvcih2YXIgcyBpbiB0aGlzLl9vdmVyU2NhbGVzKSB7XG4gICAgaWYodGhpcy5fb3ZlclNjYWxlcy5oYXNPd25Qcm9wZXJ0eShzKSkge1xuICAgICAgc2NhbGVPYmogPSB0aGlzLl9vdmVyU2NhbGVzW3NdO1xuICAgICAgaWYoc2NhbGVPYmouc2NhbGUgPiAwLjAxKSB7XG4gICAgICAgIHNjYWxlT2JqLm9iamVjdC5zY2FsZS54ID0gc2NhbGVPYmouc2NhbGUgKiBzY2FsZU9iai5jYWNoZS54O1xuICAgICAgICBzY2FsZU9iai5vYmplY3Quc2NhbGUueSA9IHNjYWxlT2JqLnNjYWxlICogc2NhbGVPYmouY2FjaGUueTtcbiAgICAgICAgc2NhbGVPYmouc2NhbGUgLT0gdGhpcy5nYW1lLnRpbWUuZWxhcHNlZCAqIHNjYWxlT2JqLnNjYWxlICogMC4zNTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjYWxlT2JqLm9iamVjdC5zY2FsZS54ID0gc2NhbGVPYmouY2FjaGUueDtcbiAgICAgICAgc2NhbGVPYmoub2JqZWN0LnNjYWxlLnkgPSBzY2FsZU9iai5jYWNoZS55O1xuICAgICAgICBkZWxldGUgdGhpcy5fb3ZlclNjYWxlc1tzXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8vIGZvciBicm93c2VyaWZ5IGNvbXBhdGliaWxpdHlcbmlmKG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICBtb2R1bGUuZXhwb3J0cyA9IFBoYXNlci5QbHVnaW4uSnVpY3k7XG59XG5cblxuXG4vLyBEcmF3IFRyaWFuZ2xlcyBQb2x5ZmlsbCBmb3IgYmFjayBjb21wYXRpYmlsaXR5XG5pZighUGhhc2VyLkdyYXBoaWNzLnByb3RvdHlwZS5kcmF3VHJpYW5nbGUpIHtcbiAgUGhhc2VyLkdyYXBoaWNzLnByb3RvdHlwZS5kcmF3VHJpYW5nbGUgPSBmdW5jdGlvbihwb2ludHMsIGN1bGwpIHtcbiAgICAgIHZhciB0cmlhbmdsZSA9IG5ldyBQaGFzZXIuUG9seWdvbihwb2ludHMpO1xuICAgICAgaWYgKGN1bGwpIHtcbiAgICAgICAgICB2YXIgY2FtZXJhVG9GYWNlID0gbmV3IFBoYXNlci5Qb2ludCh0aGlzLmdhbWUuY2FtZXJhLnggLSBwb2ludHNbMF0ueCwgdGhpcy5nYW1lLmNhbWVyYS55IC0gcG9pbnRzWzBdLnkpO1xuICAgICAgICAgIHZhciBhYiA9IG5ldyBQaGFzZXIuUG9pbnQocG9pbnRzWzFdLnggLSBwb2ludHNbMF0ueCwgcG9pbnRzWzFdLnkgLSBwb2ludHNbMF0ueSk7XG4gICAgICAgICAgdmFyIGNiID0gbmV3IFBoYXNlci5Qb2ludChwb2ludHNbMV0ueCAtIHBvaW50c1syXS54LCBwb2ludHNbMV0ueSAtIHBvaW50c1syXS55KTtcbiAgICAgICAgICB2YXIgZmFjZU5vcm1hbCA9IGNiLmNyb3NzKGFiKTtcbiAgICAgICAgICBpZiAoY2FtZXJhVG9GYWNlLmRvdChmYWNlTm9ybWFsKSA+IDApIHtcbiAgICAgICAgICAgICAgdGhpcy5kcmF3UG9seWdvbih0cmlhbmdsZSk7XG4gICAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmRyYXdQb2x5Z29uKHRyaWFuZ2xlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgfTtcblxuICAvKlxuICAqIERyYXdzIHtQaGFzZXIuUG9seWdvbn0gdHJpYW5nbGVzIFxuICAqXG4gICogQHBhcmFtIHtBcnJheTxQaGFzZXIuUG9pbnQ+fEFycmF5PG51bWJlcj59IHZlcnRpY2VzIC0gQW4gYXJyYXkgb2YgUGhhc2VyLlBvaW50cyBvciBudW1iZXJzIHRoYXQgbWFrZSB1cCB0aGUgdmVydGljZXMgb2YgdGhlIHRyaWFuZ2xlc1xuICAqIEBwYXJhbSB7QXJyYXk8bnVtYmVyPn0ge2luZGljZXM9bnVsbH0gLSBBbiBhcnJheSBvZiBudW1iZXJzIHRoYXQgZGVzY3JpYmUgd2hhdCBvcmRlciB0byBkcmF3IHRoZSB2ZXJ0aWNlcyBpblxuICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2N1bGw9ZmFsc2VdIC0gU2hvdWxkIHdlIGNoZWNrIGlmIHRoZSB0cmlhbmdsZSBpcyBiYWNrLWZhY2luZ1xuICAqIEBtZXRob2QgUGhhc2VyLkdyYXBoaWNzLnByb3RvdHlwZS5kcmF3VHJpYW5nbGVzXG4gICovXG5cbiAgUGhhc2VyLkdyYXBoaWNzLnByb3RvdHlwZS5kcmF3VHJpYW5nbGVzID0gZnVuY3Rpb24odmVydGljZXMsIGluZGljZXMsIGN1bGwpIHtcblxuICAgICAgdmFyIHBvaW50MSA9IG5ldyBQaGFzZXIuUG9pbnQoKSxcbiAgICAgICAgICBwb2ludDIgPSBuZXcgUGhhc2VyLlBvaW50KCksXG4gICAgICAgICAgcG9pbnQzID0gbmV3IFBoYXNlci5Qb2ludCgpLFxuICAgICAgICAgIHBvaW50cyA9IFtdLFxuICAgICAgICAgIGk7XG5cbiAgICAgIGlmICghaW5kaWNlcykge1xuICAgICAgICAgIGlmKHZlcnRpY2VzWzBdIGluc3RhbmNlb2YgUGhhc2VyLlBvaW50KSB7XG4gICAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IHZlcnRpY2VzLmxlbmd0aCAvIDM7IGkrKykge1xuICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3VHJpYW5nbGUoW3ZlcnRpY2VzW2kgKiAzXSwgdmVydGljZXNbaSAqIDMgKyAxXSwgdmVydGljZXNbaSAqIDMgKyAyXV0sIGN1bGwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHZlcnRpY2VzLmxlbmd0aCAvIDY7IGkrKykge1xuICAgICAgICAgICAgICAgICAgcG9pbnQxLnggPSB2ZXJ0aWNlc1tpICogNiArIDBdO1xuICAgICAgICAgICAgICAgICAgcG9pbnQxLnkgPSB2ZXJ0aWNlc1tpICogNiArIDFdO1xuICAgICAgICAgICAgICAgICAgcG9pbnQyLnggPSB2ZXJ0aWNlc1tpICogNiArIDJdO1xuICAgICAgICAgICAgICAgICAgcG9pbnQyLnkgPSB2ZXJ0aWNlc1tpICogNiArIDNdO1xuICAgICAgICAgICAgICAgICAgcG9pbnQzLnggPSB2ZXJ0aWNlc1tpICogNiArIDRdO1xuICAgICAgICAgICAgICAgICAgcG9pbnQzLnkgPSB2ZXJ0aWNlc1tpICogNiArIDVdO1xuICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3VHJpYW5nbGUoW3BvaW50MSwgcG9pbnQyLCBwb2ludDNdLCBjdWxsKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZih2ZXJ0aWNlc1swXSBpbnN0YW5jZW9mIFBoYXNlci5Qb2ludCkge1xuICAgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBpbmRpY2VzLmxlbmd0aCAvMzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBwb2ludHMucHVzaCh2ZXJ0aWNlc1tpbmRpY2VzW2kgKiAzIF1dKTtcbiAgICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKHZlcnRpY2VzW2luZGljZXNbaSAqIDMgKyAxXV0pO1xuICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2godmVydGljZXNbaW5kaWNlc1tpICogMyArIDJdXSk7XG4gICAgICAgICAgICAgICAgICBpZihwb2ludHMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3VHJpYW5nbGUocG9pbnRzLCBjdWxsKTsgICAgXG4gICAgICAgICAgICAgICAgICAgICAgcG9pbnRzID0gW107XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBwb2ludDEueCA9IHZlcnRpY2VzW2luZGljZXNbaV0gKiAyXTtcbiAgICAgICAgICAgICAgICAgIHBvaW50MS55ID0gdmVydGljZXNbaW5kaWNlc1tpXSAqIDIgKyAxXTtcbiAgICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKHBvaW50MS5jb3B5VG8oe30pKTtcbiAgICAgICAgICAgICAgICAgIGlmIChwb2ludHMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3VHJpYW5nbGUocG9pbnRzLCBjdWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICBwb2ludHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgfTtcbn0iLCIvLyAgICAgdXVpZC5qc1xuLy9cbi8vICAgICBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMiBSb2JlcnQgS2llZmZlclxuLy8gICAgIE1JVCBMaWNlbnNlIC0gaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBfZ2xvYmFsID0gdGhpcztcblxuICAvLyBVbmlxdWUgSUQgY3JlYXRpb24gcmVxdWlyZXMgYSBoaWdoIHF1YWxpdHkgcmFuZG9tICMgZ2VuZXJhdG9yLiAgV2UgZmVhdHVyZVxuICAvLyBkZXRlY3QgdG8gZGV0ZXJtaW5lIHRoZSBiZXN0IFJORyBzb3VyY2UsIG5vcm1hbGl6aW5nIHRvIGEgZnVuY3Rpb24gdGhhdFxuICAvLyByZXR1cm5zIDEyOC1iaXRzIG9mIHJhbmRvbW5lc3MsIHNpbmNlIHRoYXQncyB3aGF0J3MgdXN1YWxseSByZXF1aXJlZFxuICB2YXIgX3JuZztcblxuICAvLyBOb2RlLmpzIGNyeXB0by1iYXNlZCBSTkcgLSBodHRwOi8vbm9kZWpzLm9yZy9kb2NzL3YwLjYuMi9hcGkvY3J5cHRvLmh0bWxcbiAgLy9cbiAgLy8gTW9kZXJhdGVseSBmYXN0LCBoaWdoIHF1YWxpdHlcbiAgaWYgKHR5cGVvZihfZ2xvYmFsLnJlcXVpcmUpID09ICdmdW5jdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIF9yYiA9IF9nbG9iYWwucmVxdWlyZSgnY3J5cHRvJykucmFuZG9tQnl0ZXM7XG4gICAgICBfcm5nID0gX3JiICYmIGZ1bmN0aW9uKCkge3JldHVybiBfcmIoMTYpO307XG4gICAgfSBjYXRjaChlKSB7fVxuICB9XG5cbiAgaWYgKCFfcm5nICYmIF9nbG9iYWwuY3J5cHRvICYmIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgICAvLyBXSEFUV0cgY3J5cHRvLWJhc2VkIFJORyAtIGh0dHA6Ly93aWtpLndoYXR3Zy5vcmcvd2lraS9DcnlwdG9cbiAgICAvL1xuICAgIC8vIE1vZGVyYXRlbHkgZmFzdCwgaGlnaCBxdWFsaXR5XG4gICAgdmFyIF9ybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgICBfcm5nID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgICAgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhfcm5kczgpO1xuICAgICAgcmV0dXJuIF9ybmRzODtcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFfcm5nKSB7XG4gICAgLy8gTWF0aC5yYW5kb20oKS1iYXNlZCAoUk5HKVxuICAgIC8vXG4gICAgLy8gSWYgYWxsIGVsc2UgZmFpbHMsIHVzZSBNYXRoLnJhbmRvbSgpLiAgSXQncyBmYXN0LCBidXQgaXMgb2YgdW5zcGVjaWZpZWRcbiAgICAvLyBxdWFsaXR5LlxuICAgIHZhciAgX3JuZHMgPSBuZXcgQXJyYXkoMTYpO1xuICAgIF9ybmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCByOyBpIDwgMTY7IGkrKykge1xuICAgICAgICBpZiAoKGkgJiAweDAzKSA9PT0gMCkgciA9IE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDtcbiAgICAgICAgX3JuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBfcm5kcztcbiAgICB9O1xuICB9XG5cbiAgLy8gQnVmZmVyIGNsYXNzIHRvIHVzZVxuICB2YXIgQnVmZmVyQ2xhc3MgPSB0eXBlb2YoX2dsb2JhbC5CdWZmZXIpID09ICdmdW5jdGlvbicgPyBfZ2xvYmFsLkJ1ZmZlciA6IEFycmF5O1xuXG4gIC8vIE1hcHMgZm9yIG51bWJlciA8LT4gaGV4IHN0cmluZyBjb252ZXJzaW9uXG4gIHZhciBfYnl0ZVRvSGV4ID0gW107XG4gIHZhciBfaGV4VG9CeXRlID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgICBfYnl0ZVRvSGV4W2ldID0gKGkgKyAweDEwMCkudG9TdHJpbmcoMTYpLnN1YnN0cigxKTtcbiAgICBfaGV4VG9CeXRlW19ieXRlVG9IZXhbaV1dID0gaTtcbiAgfVxuXG4gIC8vICoqYHBhcnNlKClgIC0gUGFyc2UgYSBVVUlEIGludG8gaXQncyBjb21wb25lbnQgYnl0ZXMqKlxuICBmdW5jdGlvbiBwYXJzZShzLCBidWYsIG9mZnNldCkge1xuICAgIHZhciBpID0gKGJ1ZiAmJiBvZmZzZXQpIHx8IDAsIGlpID0gMDtcblxuICAgIGJ1ZiA9IGJ1ZiB8fCBbXTtcbiAgICBzLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvWzAtOWEtZl17Mn0vZywgZnVuY3Rpb24ob2N0KSB7XG4gICAgICBpZiAoaWkgPCAxNikgeyAvLyBEb24ndCBvdmVyZmxvdyFcbiAgICAgICAgYnVmW2kgKyBpaSsrXSA9IF9oZXhUb0J5dGVbb2N0XTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFplcm8gb3V0IHJlbWFpbmluZyBieXRlcyBpZiBzdHJpbmcgd2FzIHNob3J0XG4gICAgd2hpbGUgKGlpIDwgMTYpIHtcbiAgICAgIGJ1ZltpICsgaWkrK10gPSAwO1xuICAgIH1cblxuICAgIHJldHVybiBidWY7XG4gIH1cblxuICAvLyAqKmB1bnBhcnNlKClgIC0gQ29udmVydCBVVUlEIGJ5dGUgYXJyYXkgKGFsYSBwYXJzZSgpKSBpbnRvIGEgc3RyaW5nKipcbiAgZnVuY3Rpb24gdW5wYXJzZShidWYsIG9mZnNldCkge1xuICAgIHZhciBpID0gb2Zmc2V0IHx8IDAsIGJ0aCA9IF9ieXRlVG9IZXg7XG4gICAgcmV0dXJuICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXTtcbiAgfVxuXG4gIC8vICoqYHYxKClgIC0gR2VuZXJhdGUgdGltZS1iYXNlZCBVVUlEKipcbiAgLy9cbiAgLy8gSW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL0xpb3NLL1VVSUQuanNcbiAgLy8gYW5kIGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS91dWlkLmh0bWxcblxuICAvLyByYW5kb20gIydzIHdlIG5lZWQgdG8gaW5pdCBub2RlIGFuZCBjbG9ja3NlcVxuICB2YXIgX3NlZWRCeXRlcyA9IF9ybmcoKTtcblxuICAvLyBQZXIgNC41LCBjcmVhdGUgYW5kIDQ4LWJpdCBub2RlIGlkLCAoNDcgcmFuZG9tIGJpdHMgKyBtdWx0aWNhc3QgYml0ID0gMSlcbiAgdmFyIF9ub2RlSWQgPSBbXG4gICAgX3NlZWRCeXRlc1swXSB8IDB4MDEsXG4gICAgX3NlZWRCeXRlc1sxXSwgX3NlZWRCeXRlc1syXSwgX3NlZWRCeXRlc1szXSwgX3NlZWRCeXRlc1s0XSwgX3NlZWRCeXRlc1s1XVxuICBdO1xuXG4gIC8vIFBlciA0LjIuMiwgcmFuZG9taXplICgxNCBiaXQpIGNsb2Nrc2VxXG4gIHZhciBfY2xvY2tzZXEgPSAoX3NlZWRCeXRlc1s2XSA8PCA4IHwgX3NlZWRCeXRlc1s3XSkgJiAweDNmZmY7XG5cbiAgLy8gUHJldmlvdXMgdXVpZCBjcmVhdGlvbiB0aW1lXG4gIHZhciBfbGFzdE1TZWNzID0gMCwgX2xhc3ROU2VjcyA9IDA7XG5cbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuICBmdW5jdGlvbiB2MShvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICAgIHZhciBpID0gYnVmICYmIG9mZnNldCB8fCAwO1xuICAgIHZhciBiID0gYnVmIHx8IFtdO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICB2YXIgY2xvY2tzZXEgPSBvcHRpb25zLmNsb2Nrc2VxICE9IG51bGwgPyBvcHRpb25zLmNsb2Nrc2VxIDogX2Nsb2Nrc2VxO1xuXG4gICAgLy8gVVVJRCB0aW1lc3RhbXBzIGFyZSAxMDAgbmFuby1zZWNvbmQgdW5pdHMgc2luY2UgdGhlIEdyZWdvcmlhbiBlcG9jaCxcbiAgICAvLyAoMTU4Mi0xMC0xNSAwMDowMCkuICBKU051bWJlcnMgYXJlbid0IHByZWNpc2UgZW5vdWdoIGZvciB0aGlzLCBzb1xuICAgIC8vIHRpbWUgaXMgaGFuZGxlZCBpbnRlcm5hbGx5IGFzICdtc2VjcycgKGludGVnZXIgbWlsbGlzZWNvbmRzKSBhbmQgJ25zZWNzJ1xuICAgIC8vICgxMDAtbmFub3NlY29uZHMgb2Zmc2V0IGZyb20gbXNlY3MpIHNpbmNlIHVuaXggZXBvY2gsIDE5NzAtMDEtMDEgMDA6MDAuXG4gICAgdmFyIG1zZWNzID0gb3B0aW9ucy5tc2VjcyAhPSBudWxsID8gb3B0aW9ucy5tc2VjcyA6IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgLy8gUGVyIDQuMi4xLjIsIHVzZSBjb3VudCBvZiB1dWlkJ3MgZ2VuZXJhdGVkIGR1cmluZyB0aGUgY3VycmVudCBjbG9ja1xuICAgIC8vIGN5Y2xlIHRvIHNpbXVsYXRlIGhpZ2hlciByZXNvbHV0aW9uIGNsb2NrXG4gICAgdmFyIG5zZWNzID0gb3B0aW9ucy5uc2VjcyAhPSBudWxsID8gb3B0aW9ucy5uc2VjcyA6IF9sYXN0TlNlY3MgKyAxO1xuXG4gICAgLy8gVGltZSBzaW5jZSBsYXN0IHV1aWQgY3JlYXRpb24gKGluIG1zZWNzKVxuICAgIHZhciBkdCA9IChtc2VjcyAtIF9sYXN0TVNlY3MpICsgKG5zZWNzIC0gX2xhc3ROU2VjcykvMTAwMDA7XG5cbiAgICAvLyBQZXIgNC4yLjEuMiwgQnVtcCBjbG9ja3NlcSBvbiBjbG9jayByZWdyZXNzaW9uXG4gICAgaWYgKGR0IDwgMCAmJiBvcHRpb25zLmNsb2Nrc2VxID09IG51bGwpIHtcbiAgICAgIGNsb2Nrc2VxID0gY2xvY2tzZXEgKyAxICYgMHgzZmZmO1xuICAgIH1cblxuICAgIC8vIFJlc2V0IG5zZWNzIGlmIGNsb2NrIHJlZ3Jlc3NlcyAobmV3IGNsb2Nrc2VxKSBvciB3ZSd2ZSBtb3ZlZCBvbnRvIGEgbmV3XG4gICAgLy8gdGltZSBpbnRlcnZhbFxuICAgIGlmICgoZHQgPCAwIHx8IG1zZWNzID4gX2xhc3RNU2VjcykgJiYgb3B0aW9ucy5uc2VjcyA9PSBudWxsKSB7XG4gICAgICBuc2VjcyA9IDA7XG4gICAgfVxuXG4gICAgLy8gUGVyIDQuMi4xLjIgVGhyb3cgZXJyb3IgaWYgdG9vIG1hbnkgdXVpZHMgYXJlIHJlcXVlc3RlZFxuICAgIGlmIChuc2VjcyA+PSAxMDAwMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1dWlkLnYxKCk6IENhblxcJ3QgY3JlYXRlIG1vcmUgdGhhbiAxME0gdXVpZHMvc2VjJyk7XG4gICAgfVxuXG4gICAgX2xhc3RNU2VjcyA9IG1zZWNzO1xuICAgIF9sYXN0TlNlY3MgPSBuc2VjcztcbiAgICBfY2xvY2tzZXEgPSBjbG9ja3NlcTtcblxuICAgIC8vIFBlciA0LjEuNCAtIENvbnZlcnQgZnJvbSB1bml4IGVwb2NoIHRvIEdyZWdvcmlhbiBlcG9jaFxuICAgIG1zZWNzICs9IDEyMjE5MjkyODAwMDAwO1xuXG4gICAgLy8gYHRpbWVfbG93YFxuICAgIHZhciB0bCA9ICgobXNlY3MgJiAweGZmZmZmZmYpICogMTAwMDAgKyBuc2VjcykgJSAweDEwMDAwMDAwMDtcbiAgICBiW2krK10gPSB0bCA+Pj4gMjQgJiAweGZmO1xuICAgIGJbaSsrXSA9IHRsID4+PiAxNiAmIDB4ZmY7XG4gICAgYltpKytdID0gdGwgPj4+IDggJiAweGZmO1xuICAgIGJbaSsrXSA9IHRsICYgMHhmZjtcblxuICAgIC8vIGB0aW1lX21pZGBcbiAgICB2YXIgdG1oID0gKG1zZWNzIC8gMHgxMDAwMDAwMDAgKiAxMDAwMCkgJiAweGZmZmZmZmY7XG4gICAgYltpKytdID0gdG1oID4+PiA4ICYgMHhmZjtcbiAgICBiW2krK10gPSB0bWggJiAweGZmO1xuXG4gICAgLy8gYHRpbWVfaGlnaF9hbmRfdmVyc2lvbmBcbiAgICBiW2krK10gPSB0bWggPj4+IDI0ICYgMHhmIHwgMHgxMDsgLy8gaW5jbHVkZSB2ZXJzaW9uXG4gICAgYltpKytdID0gdG1oID4+PiAxNiAmIDB4ZmY7XG5cbiAgICAvLyBgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZGAgKFBlciA0LjIuMiAtIGluY2x1ZGUgdmFyaWFudClcbiAgICBiW2krK10gPSBjbG9ja3NlcSA+Pj4gOCB8IDB4ODA7XG5cbiAgICAvLyBgY2xvY2tfc2VxX2xvd2BcbiAgICBiW2krK10gPSBjbG9ja3NlcSAmIDB4ZmY7XG5cbiAgICAvLyBgbm9kZWBcbiAgICB2YXIgbm9kZSA9IG9wdGlvbnMubm9kZSB8fCBfbm9kZUlkO1xuICAgIGZvciAodmFyIG4gPSAwOyBuIDwgNjsgbisrKSB7XG4gICAgICBiW2kgKyBuXSA9IG5vZGVbbl07XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1ZiA/IGJ1ZiA6IHVucGFyc2UoYik7XG4gIH1cblxuICAvLyAqKmB2NCgpYCAtIEdlbmVyYXRlIHJhbmRvbSBVVUlEKipcblxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Jyb29mYS9ub2RlLXV1aWQgZm9yIEFQSSBkZXRhaWxzXG4gIGZ1bmN0aW9uIHY0KG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gICAgLy8gRGVwcmVjYXRlZCAtICdmb3JtYXQnIGFyZ3VtZW50LCBhcyBzdXBwb3J0ZWQgaW4gdjEuMlxuICAgIHZhciBpID0gYnVmICYmIG9mZnNldCB8fCAwO1xuXG4gICAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSAnc3RyaW5nJykge1xuICAgICAgYnVmID0gb3B0aW9ucyA9PSAnYmluYXJ5JyA/IG5ldyBCdWZmZXJDbGFzcygxNikgOiBudWxsO1xuICAgICAgb3B0aW9ucyA9IG51bGw7XG4gICAgfVxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgdmFyIHJuZHMgPSBvcHRpb25zLnJhbmRvbSB8fCAob3B0aW9ucy5ybmcgfHwgX3JuZykoKTtcblxuICAgIC8vIFBlciA0LjQsIHNldCBiaXRzIGZvciB2ZXJzaW9uIGFuZCBgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZGBcbiAgICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gICAgcm5kc1s4XSA9IChybmRzWzhdICYgMHgzZikgfCAweDgwO1xuXG4gICAgLy8gQ29weSBieXRlcyB0byBidWZmZXIsIGlmIHByb3ZpZGVkXG4gICAgaWYgKGJ1Zikge1xuICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IDE2OyBpaSsrKSB7XG4gICAgICAgIGJ1ZltpICsgaWldID0gcm5kc1tpaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1ZiB8fCB1bnBhcnNlKHJuZHMpO1xuICB9XG5cbiAgLy8gRXhwb3J0IHB1YmxpYyBBUElcbiAgdmFyIHV1aWQgPSB2NDtcbiAgdXVpZC52MSA9IHYxO1xuICB1dWlkLnY0ID0gdjQ7XG4gIHV1aWQucGFyc2UgPSBwYXJzZTtcbiAgdXVpZC51bnBhcnNlID0gdW5wYXJzZTtcbiAgdXVpZC5CdWZmZXJDbGFzcyA9IEJ1ZmZlckNsYXNzO1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBQdWJsaXNoIGFzIEFNRCBtb2R1bGVcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7cmV0dXJuIHV1aWQ7fSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mKG1vZHVsZSkgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBQdWJsaXNoIGFzIG5vZGUuanMgbW9kdWxlXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB1dWlkO1xuICB9IGVsc2Uge1xuICAgIC8vIFB1Ymxpc2ggYXMgZ2xvYmFsIChpbiBicm93c2VycylcbiAgICB2YXIgX3ByZXZpb3VzUm9vdCA9IF9nbG9iYWwudXVpZDtcblxuICAgIC8vICoqYG5vQ29uZmxpY3QoKWAgLSAoYnJvd3NlciBvbmx5KSB0byByZXNldCBnbG9iYWwgJ3V1aWQnIHZhcioqXG4gICAgdXVpZC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBfZ2xvYmFsLnV1aWQgPSBfcHJldmlvdXNSb290O1xuICAgICAgcmV0dXJuIHV1aWQ7XG4gICAgfTtcblxuICAgIF9nbG9iYWwudXVpZCA9IHV1aWQ7XG4gIH1cbn0pLmNhbGwodGhpcyk7IiwibW9kdWxlLmV4cG9ydHMgPVxuKGZ1bmN0aW9uKGVsZSwgc2NvcGUsIHNvY2tldCwgbWFwcywgbWFwSWQsIGluamVjdG9yKSB7XG5cbiAgLy8gUmVxdWlyZSBsaWJcbiAgcmVxdWlyZSgnLi9saWIvanVpY3knKTtcbiAgdmFyIFVVSUQgPSByZXF1aXJlKCcuL2xpYi91dWlkJyk7XG4gIFxuICB2YXIgaGVpZ2h0ICA9IHBhcnNlSW50KGVsZS5jc3MoJ2hlaWdodCcpLCAxMCksXG4gICAgICB3aWR0aCAgID0gcGFyc2VJbnQoZWxlLmNzcygnd2lkdGgnKSwgMTApO1xuICB2YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSh3aWR0aCwgaGVpZ2h0LCBQaGFzZXIuQVVUTywgJ2dhbWUtY2FudmFzJyk7XG5cbiAgdmFyIEdhbWUgICAgPSByZXF1aXJlKCcuL3N0YXRlcycpLFxuICAgICAgc3RhdGVzICA9IEdhbWUuU3RhdGVzO1xuXG4gIGdhbWUuc3RhdGUuYWRkKCdCb290Jywgc3RhdGVzLkJvb3QpO1xuICBnYW1lLnN0YXRlLmFkZCgnUHJlbG9hZGVyJywgc3RhdGVzLlByZWxvYWRlcik7XG4gIGdhbWUuc3RhdGUuYWRkKCdNYWluTWVudScsIHN0YXRlcy5NYWluTWVudSk7XG4gIGdhbWUuc3RhdGUuYWRkKCdQbGF5Jywgc3RhdGVzLlBsYXkpO1xuICAvLyBnYW1lLnN0YXRlLmFkZCgnR2FtZScsIHJlcXVpcmUoJy4vc3RhdGVzL2dhbWUnKSk7XG4gIC8vIGdhbWUuc3RhdGUuYWRkKCdOZXh0TGV2ZWwnLCByZXF1aXJlKCcuL3N0YXRlcy9uZXh0X2xldmVsJykpO1xuICBnYW1lLnN0YXRlLmFkZCgnR2FtZU92ZXInLCBzdGF0ZXMuR2FtZU92ZXIpO1xuXG4gIGdhbWUubWFwSWQgPSBtYXBJZDtcbiAgZ2FtZS5zb2NrZXQgPSBzb2NrZXQ7XG4gIGdhbWUuc2NvcGUgID0gc2NvcGU7XG4gIEdhbWUubWFwcyAgICAgICAgICAgPSBtYXBzO1xuICBHYW1lLnJlbW90ZVBsYXllcnMgPSBbXTtcblxuICB2YXIgdXNlciAgPSBpbmplY3Rvci5nZXQoJ1VzZXInKSxcbiAgICAgIGcgICAgID0gR2FtZTtcblxuICBnLnNvY2tldCAgICAgICAgPSBzb2NrZXQ7XG4gIGcubWFwSWQgICAgICAgICA9IG1hcElkO1xuICBnLmN1cnJlbnRQbGF5ZXIgPSB1c2VyLmdldEN1cnJlbnRVc2VyKCk7XG5cbiAgLy8gVHVybiBvZmYgbXVzaWNcbiAgc2NvcGUuJG9uKCdnYW1lOnRvZ2dsZU11c2ljJywgZnVuY3Rpb24oKSB7XG4gICAgZ2FtZS5zdGF0ZS5zdGF0ZXMuUHJlbG9hZGVyLnRvZ2dsZU11c2ljKCk7XG4gIH0pO1xuXG4gIC8vIENsZWFudXBcbiAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuICAgIHNvY2tldC5lbWl0KCdwbGF5ZXJMZWZ0TWFwJywge1xuICAgICAgcGxheWVySWQ6IGcuc2lkLFxuICAgICAgbWFwSWQ6IGcubWFwSWRcbiAgICB9KTtcbiAgICBnYW1lLmRlc3Ryb3koKTtcbiAgfSk7XG5cbiAgLy8gTmV0d29yayBzb2NrZXQgZXZlbnRzXG4gIEdhbWUuY29ubmVjdGVkID0gdHJ1ZTtcbiAgY29uc29sZS5sb2coJ2Nvbm5lY3RlZCBkYXRhIGRhdGEnLCBzb2NrZXQsIGcuY3VycmVudFBsYXllcik7XG4gIC8vIGcuc2lkICAgICA9IGRhdGEuaWQ7XG4gIGcucGxheWVyTmFtZSA9ICdBcmknO1xuICAvLyBnLnBsYXllck5hbWUgPSBwcm9tcHQoXCJQbGVhc2UgZW50ZXIgeW91ciBuYW1lXCIpIHx8ICdQbGF5ZXInO1xuICBnLnNvY2tldC5lbWl0KCdzZXRQbGF5ZXJOYW1lJywgeyBuYW1lOiBnLnBsYXllck5hbWUgfSk7XG5cbiAgZy5zb2NrZXQub24oJ3BsYXllckRldGFpbHMnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgZy5zaWQgPSBkYXRhLmlkO1xuICAgIGNvbnNvbGUubG9nKCdHQU1FIEdBTUUnLCBnYW1lKTtcbiAgICBnYW1lLnN0YXRlLnN0YXJ0KCdCb290Jyk7XG4gIH0pO1xuXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XG5cbiAgR2FtZS5TdGF0ZXMuQm9vdCA9IGZ1bmN0aW9uKGdhbWUpIHt9O1xuXG4gIEdhbWUuU3RhdGVzLkJvb3QucHJvdG90eXBlID0ge1xuICAgIHJlc2l6ZUNhbnZhc1RvQ29udGFpbmVyRWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY2FudmFzID0gdGhpcy5nYW1lLmNhbnZhcztcblxuICAgICAgdmFyIGNhbnZhcyAgICAgICAgICA9IHRoaXMuZ2FtZS5jYW52YXMsXG4gICAgICAgICAgY29udGFpbmVyV2lkdGggID0gY2FudmFzLmNsaWVudFdpZHRoLFxuICAgICAgICAgIGNvbnRhaW5lckhlaWdodCA9IGNhbnZhcy5jbGllbnRIZWlnaHQ7XG5cbiAgICAgIHZhciB4U2NhbGUgPSBjb250YWluZXJXaWR0aCAvIHRoaXMud2lkdGg7XG4gICAgICB2YXIgeVNjYWxlID0gY29udGFpbmVySGVpZ2h0IC8gdGhpcy5oZWlnaHQ7XG4gICAgICB2YXIgbmV3U2NhbGUgPSBNYXRoLm1pbiggeFNjYWxlLCB5U2NhbGUgKTtcblxuICAgICAgdGhpcy5zY2FsZS53aWR0aCA9IG5ld1NjYWxlICogdGhpcy5nYW1lLndpZHRoO1xuICAgICAgdGhpcy5zY2FsZS5oZWlnaHQgPSBuZXdTY2FsZSAqIHRoaXMuZ2FtZS5oZWlnaHQ7XG4gICAgICB0aGlzLnNjYWxlLnNldFNpemUoY29udGFpbmVyV2lkdGgsIGNvbnRhaW5lckhlaWdodCk7XG5cbiAgICAgIEdhbWUud2lkdGggID0gdGhpcy5nYW1lLndpZHRoO1xuICAgICAgR2FtZS5oZWlnaHQgPSB0aGlzLmdhbWUuaGVpZ2h0O1xuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5pbnB1dC5tYXhQb2ludGVycyA9IDE7XG4gICAgICB0aGlzLnN0YWdlLmRpc2FibGVWaXNpYmlsaXR5Q2hhbmdlID0gdHJ1ZTtcblxuICAgICAgaWYgKHRoaXMuZ2FtZS5kZXZpY2UuZGVza3RvcCkge1xuICAgICAgICB0aGlzLnNjYWxlLnNjYWxlTW9kZSA9IFBoYXNlci5TY2FsZU1hbmFnZXIuU0hPV19BTEw7XG4gICAgICAgIC8vIHRoaXMuc2NhbGUuc2V0TWluTWF4KDQ4MCwgMjYwLCAyMDQ4LCAxNTM2KTtcbiAgICAgICAgLy8gdGhpcy5zY2FsZS5wYWdlQWxpZ25Ib3Jpem9udGFsbHkgPSB0cnVlO1xuICAgICAgICAvLyB0aGlzLnNjYWxlLnBhZ2VBbGlnblZlcnRpY2FsbHkgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5nYW1lLnN0YWdlLnNjYWxlTW9kZSA9IFBoYXNlci5TY2FsZU1hbmFnZXIuU0hPV19BTEw7XG4gICAgICAgIHRoaXMuZ2FtZS5zdGFnZS5zY2FsZS5taW5XaWR0aCA9ICA0ODA7XG4gICAgICAgIHRoaXMuZ2FtZS5zdGFnZS5zY2FsZS5taW5IZWlnaHQgPSAyNjA7XG4gICAgICAgIHRoaXMuZ2FtZS5zdGFnZS5zY2FsZS5tYXhXaWR0aCA9IDY0MDtcbiAgICAgICAgdGhpcy5nYW1lLnN0YWdlLnNjYWxlLm1heEhlaWdodCA9IDQ4MDtcbiAgICAgICAgdGhpcy5nYW1lLnN0YWdlLnNjYWxlLmZvcmNlTGFuZHNjYXBlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5nYW1lLnN0YWdlLnNjYWxlLnBhZ2VBbGlnbkhvcml6b250YWxseSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2NhbGUuc2V0UmVzaXplQ2FsbGJhY2sodGhpcy5oYW5kbGVSZXNpemVFdmVudCwgdGhpcyk7XG5cbiAgICAgIHRoaXMuc2NhbGUuc2V0U2NyZWVuU2l6ZSh0cnVlKTtcbiAgICAgIHRoaXMuc2NhbGUucmVmcmVzaCgpO1xuICAgIH0sXG4gICAgcHJlbG9hZDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgLy8gIEhlcmUgd2UgbG9hZCB0aGUgYXNzZXRzIHJlcXVpcmVkIGZvciBvdXIgcHJlbG9hZGVyIChpbiB0aGlzIGNhc2UgYSBiYWNrZ3JvdW5kIGFuZCBhIGxvYWRpbmcgYmFyKVxuICAgICAgdGhpcy5sb2FkLmltYWdlKCdtZW51X2JhY2tncm91bmQnLCAnYXNzZXRzL21lbnVfYmFja2dyb3VuZC5qcGcnKTtcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgncHJlbG9hZGVyJywgJ2Fzc2V0cy9wcmVsb2FkZXIuZ2lmJyk7XG4gICAgICB0aGlzLmxvYWQuanNvbignbGV2ZWxzJywgJ2Fzc2V0cy9sZXZlbHMuanNvbicpO1xuICAgIH0sXG5cbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCl7XG4gICAgICBpZiAodGhpcy5nYW1lLmRldmljZS5kZXNrdG9wKSB7XG4gICAgICAgdGhpcy5zY2FsZS5zY2FsZU1vZGUgPSBQaGFzZXIuU2NhbGVNYW5hZ2VyLlNIT1dfQUxMOyAvL2Fsd2F5cyBzaG93IHdob2xlIGdhbWVcbiAgICAgICAgdGhpcy5nYW1lLnN0YWdlLnNjYWxlLnBhZ2VBbGlnbkhvcml6b250YWxseSA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNjYWxlLnNjYWxlTW9kZSA9IFBoYXNlci5TY2FsZU1hbmFnZXIuU0hPV19BTEw7XG4gICAgICAgIHRoaXMuc2NhbGUuZm9yY2VMYW5kc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zY2FsZS5wYWdlQWxpZ25Ib3Jpem9udGFsbHkgPSB0cnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5yZXNpemVDYW52YXNUb0NvbnRhaW5lckVsZW1lbnQoKTtcbiAgICAgIEdhbWUuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5zdGF0ZS5zdGFydCgnUHJlbG9hZGVyJyk7XG4gICAgfSxcblxuICAgIGhhbmRsZVJlc2l6ZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmVzaXplQ2FudmFzVG9Db250YWluZXJFbGVtZW50KCk7XG4gICAgfVxuICB9XG5cbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKEdhbWUpIHtcblxuICBHYW1lLlN0YXRlcy5HYW1lT3ZlciA9IGZ1bmN0aW9uKGdhbWUpIHtcblxuICB9O1xuXG4gIEdhbWUuU3RhdGVzLkdhbWVPdmVyLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoR2FtZS5tdWx0aXBsYXllcikge1xuICAgICAgLy8gR2FtZW92ZXIgcGFuZWxcbiAgICAgIHRoaXMuZ2FtZW92ZXJQYW5lbCA9IG5ldyBHYW1lLlByZWZhYnMuR2FtZW92ZXJQYW5lbCh0aGlzLmdhbWUpO1xuICAgICAgdGhpcy5nYW1lLmFkZC5leGlzdGluZyh0aGlzLmdhbWVvdmVyUGFuZWwpO1xuXG4gICAgICB0aGlzLmdhbWVvdmVyUGFuZWwuc2hvdyhHYW1lLnNjb3JlKTtcbiAgICB9XG4gIH07XG59KTsiLCJ2YXIgR2FtZSA9IHtcbiAgbmFtZTogJ25nLWludmFkZXInLFxuICAvLyBTdGF0ZXMgb2Ygb3VyIGdhbWVcbiAgU3RhdGVzOiB7fSxcbiAgLy8gUHJlZmFic1xuICBQcmVmYWJzOiB7fSxcbiAgLy8gTGV2ZWxzXG4gIExldmVsczoge30sXG5cbiAgb3JpZW50YXRlZDogdHJ1ZSxcblxuICBiYWNrZ3JvdW5kWDogMCxcbiAgYmFja2dyb3VuZFk6IDAsXG5cbiAgcGF1c2VkOiB0cnVlLFxuXG4gIG11bHRpcGxheWVyOiB0cnVlLFxuXG4gIC8vIE1hcFxuICBtYXBEYXRhOiB7fSxcblxuICAvLyBTb2NrZXRcbiAgc29ja2V0OiB7fSxcbiAgcmVtb3RlUGxheWVyczogW10sXG4gIHRvQWRkOiBbXSxcbiAgdG9SZW1vdmU6IFtdLFxuICBsYXRlbmN5OiAwLFxuXG4gIHdpZHRoOiA4MDAsXG4gIGhlaWdodDogNjAwLFxuXG4gIC8vIEhlbHBlcnNcbiAgY3BjOiBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuIHggKiA2NCArIDMyO1xuICB9LFxuXG4gIHBsYXllckJ5SWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnJlbW90ZVBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLnJlbW90ZVBsYXllcnNbaV0uaWQgPT09IGlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlbW90ZVBsYXllcnNbaV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICByZXNldENhbGxiYWNrczogW10sXG4gIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICBfLm1hcChHYW1lLnJlc2V0Q2FsbGJhY2tzLCBmdW5jdGlvbihpLHYpIHtcbiAgICAgIEdhbWUucmVzZXRDYWxsYmFja3NbaV0uYXBwbHkodGhpcyk7XG4gICAgfSk7XG4gIH0sXG5cbiAgd2lubmVyOiBmYWxzZVxufTtcblxucmVxdWlyZSgnLi4vZW50aXRpZXMnKShHYW1lKTtcblxucmVxdWlyZSgnLi9ib290JykoR2FtZSk7XG5yZXF1aXJlKCcuL3ByZWxvYWRlcicpKEdhbWUpO1xucmVxdWlyZSgnLi9tYWlubWVudScpKEdhbWUpO1xucmVxdWlyZSgnLi9wbGF5JykoR2FtZSk7XG5yZXF1aXJlKCcuL2dhbWVfb3ZlcicpKEdhbWUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7IiwiLypcbiAqIFRoZSBNYWluTWVudSBzdGF0ZSBpcyByZXNwb25zaWJsZSBmb3Igc2hvd2luZyB0aGVcbiAqIG1haW4gbWVudSBvZiB0aGUgZ2FtZS4gXG4gKiBcbiAqIFRoZSBtYWluIG1lbnUgaGFzIGEgc2Nyb2xsaW5nIGJhY2tncm91bmQgd2l0aCB0d28gb3B0aW9uc1xuICogb2YgbmV3IHNvbG8gZ2FtZSBvciBuZXcgbXVsdGlwbGF5ZXIgZ2FtZS4gVGhlIGRpZmZlcmVuY2VcbiAqIGJldHdlZW4gdGhlIHR3byBpcyB0aGF0IGBHYW1lLm11bHRpcGxheWVyYCBpcyBzZXQgdG8gdHJ1ZVxuICogb24gdGhlIG5ldyBtdWxpdHBsYXllciBvcHRpb24uIFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbihHYW1lKSB7XG4gIEdhbWUuU3RhdGVzLk1haW5NZW51ID0gZnVuY3Rpb24oZ2FtZSkge1xuICAgIHRoaXMuanVpY3k7XG4gICAgdGhpcy5zY3JlZW5GbGFzaDtcbiAgfVxuXG4gIEdhbWUuU3RhdGVzLk1haW5NZW51LnByb3RvdHlwZSA9IHtcbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuXG4gICAgICB2YXIgZ2FtZSA9IHRoaXMuZ2FtZTtcblxuICAgICAgdGhpcy5zdGFydFRpbWUgPSBnYW1lLnRpbWUubm93O1xuICAgICAgXG4gICAgICB2YXIgaW1hZ2UgPSB0aGlzLmdhbWUuY2FjaGUuZ2V0SW1hZ2UoJ2xvZ28nKSxcbiAgICAgICAgY2VudGVyWCA9IHRoaXMud29ybGQuY2VudGVyWCxcbiAgICAgICAgY2VudGVyWSA9IHRoaXMud29ybGQuY2VudGVyWSAtIGltYWdlLmhlaWdodCxcbiAgICAgICAgZW5kWSAgICA9IHRoaXMud29ybGQuaGVpZ2h0ICsgaW1hZ2UuaGVpZ2h0LFxuICAgICAgICB0ZXh0UGFkZGluZyA9IHRoaXMuZ2FtZS5kZXZpY2UuZGVza3RvcCA/IDYwIDogMzA7XG5cbiAgICAgIC8vIE1lbnUgYmFja2dyb3VuZFxuICAgICAgdGhpcy5iYWNrZ3JvdW5kID0gZ2FtZS5hZGQudGlsZVNwcml0ZSgwLCAwLCB0aGlzLndvcmxkLndpZHRoLCB0aGlzLndvcmxkLmhlaWdodCwgJ21lbnVfYmFja2dyb3VuZCcpO1xuICAgICAgdGhpcy5iYWNrZ3JvdW5kLmF1dG9TY3JvbGwoLTUwLCAtMjApO1xuICAgICAgdGhpcy5iYWNrZ3JvdW5kLnRpbGVQb3NpdGlvbi54ID0gMDtcbiAgICAgIHRoaXMuYmFja2dyb3VuZC50aWxlUG9zaXRpb24ueSA9IDA7XG5cbiAgICAgIC8vIEFkZCBsb2dvXG4gICAgICB2YXIgc3ByaXRlID0gZ2FtZS5hZGQuc3ByaXRlKGNlbnRlclgsIGNlbnRlclkgLSB0ZXh0UGFkZGluZywgJ2xvZ28nKTtcbiAgICAgIHNwcml0ZS5hbmNob3Iuc2V0KDAuNSk7XG5cbiAgICAgIGlmICh0aGlzLmdhbWUuZGV2aWNlLmRlc2t0b3ApIHtcbiAgICAgICAgc3ByaXRlLnNjYWxlLnNldCgyKTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIG5ldyBnYW1lXG4gICAgICB2YXIgZm9udFNpemUgPSAodGhpcy5nYW1lLmRldmljZS5kZXNrdG9wID8gJzQwcHgnIDogJzIwcHgnKTtcbiAgICAgIHZhciBuZXdHYW1lID0gdGhpcy5uZXdHYW1lID0gdGhpcy5hZGQudGV4dCh0aGlzLndvcmxkLmNlbnRlclgsIFxuICAgICAgICBjZW50ZXJZICsgdGV4dFBhZGRpbmcsXG4gICAgICAgIFwiTmV3IGdhbWVcIiwgXG4gICAgICAgIHtcbiAgICAgICAgICBmb250OiBmb250U2l6ZSArIFwiIEFyY2hpdGVjdHMgRGF1Z2h0ZXJcIiwgXG4gICAgICAgICAgYWxpZ246XCJjZW50ZXJcIiwgXG4gICAgICAgICAgZmlsbDpcIiNmZmZcIlxuICAgICAgICB9KTsgXG4gICAgICBuZXdHYW1lLmlucHV0RW5hYmxlZCA9IHRydWU7XG4gICAgICBuZXdHYW1lLmFuY2hvci5zZXQoMC41KTtcblxuICAgICAgbmV3R2FtZS5ldmVudHMub25JbnB1dE92ZXIuYWRkKHRoaXMub3Zlck5ld2dhbWUsIHRoaXMpO1xuICAgICAgbmV3R2FtZS5ldmVudHMub25JbnB1dE91dC5hZGQodGhpcy5vdXROZXdnYW1lLCB0aGlzKTtcbiAgICAgIG5ld0dhbWUuZXZlbnRzLm9uSW5wdXREb3duLmFkZCh0aGlzLnBsYXlHYW1lLCB0aGlzKTtcblxuICAgICAgdmFyIG11bHRpR2FtZSA9IHRoaXMubXVsdGlHYW1lID0gXG4gICAgICAgIHRoaXMuYWRkLnRleHQodGhpcy53b3JsZC5jZW50ZXJYLCBcbiAgICAgICAgICBjZW50ZXJZICsgdGV4dFBhZGRpbmcgKyBuZXdHYW1lLmhlaWdodCxcbiAgICAgICAgXCJOZXcgbXVsdGlwbGF5ZXIgZ2FtZVwiLCBcbiAgICAgICAge1xuICAgICAgICAgIGZvbnQ6IGZvbnRTaXplICsgXCIgQXJjaGl0ZWN0cyBEYXVnaHRlclwiLCBcbiAgICAgICAgICBhbGlnbjpcImNlbnRlclwiLCBcbiAgICAgICAgICBmaWxsOlwiI2ZmZlwiXG4gICAgICAgIH0pOyBcbiAgICAgIG11bHRpR2FtZS5pbnB1dEVuYWJsZWQgPSB0cnVlO1xuICAgICAgbXVsdGlHYW1lLmFuY2hvci5zZXQoMC41KTtcblxuICAgICAgbXVsdGlHYW1lLmV2ZW50cy5vbklucHV0T3Zlci5hZGQodGhpcy5vdmVyTXVsdGlnYW1lLCB0aGlzKTtcbiAgICAgIG11bHRpR2FtZS5ldmVudHMub25JbnB1dE91dC5hZGQodGhpcy5vdXRNdWx0aWdhbWUsIHRoaXMpO1xuICAgICAgbXVsdGlHYW1lLmV2ZW50cy5vbklucHV0RG93bi5hZGQodGhpcy5wbGF5TXVsdGlHYW1lLCB0aGlzKTtcblxuICAgICAgLy8gSnVpY3lcbiAgICAgIHRoaXMuanVpY3kgPSBnYW1lLnBsdWdpbnMuYWRkKFBoYXNlci5QbHVnaW4uSnVpY3kpO1xuICAgICAgdGhpcy5zY3JlZW5GbGFzaCA9IHRoaXMuanVpY3kuY3JlYXRlU2NyZWVuRmxhc2goKTtcbiAgICAgIHRoaXMuYWRkLmV4aXN0aW5nKHRoaXMuc2NyZWVuRmxhc2gpO1xuXG4gICAgICAvLyBNdXNpY1xuICAgICAgdGhpcy5tZW51X211c2ljID0gZ2FtZS5hZGQuYXVkaW8oJ21lbnVfbXVzaWMnKTtcbiAgICAgIHRoaXMuZGluayAgICAgICA9IGdhbWUuYWRkLmF1ZGlvKCdkaW5rJyk7XG4gICAgICB0aGlzLm1lbnVfbXVzaWMucGxheSgpO1xuICAgIH0sXG5cbiAgICBwbGF5R2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICBHYW1lLm11bHRpcGxheWVyID0gZmFsc2U7XG4gICAgICB0aGlzLm1lbnVfbXVzaWMuc3RvcCgpO1xuICAgICAgdGhpcy5nYW1lLnN0YXRlLnN0YXJ0KCdQbGF5Jyk7XG4gICAgfSxcblxuICAgIHBsYXlNdWx0aUdhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgR2FtZS5tdWx0aXBsYXllciA9IHRydWU7XG4gICAgICB0aGlzLnBsYXkoKTtcbiAgICB9LFxuXG4gICAgb3Zlck5ld2dhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLm5ld0dhbWUuc2NhbGUpXG4gICAgICAgIC50byh7eDogMS4zLCB5OiAxLjN9LCAzMDAsIFBoYXNlci5FYXNpbmcuRXhwb25lbnRpYWwuT3V0LCB0cnVlKVxuICAgICAgdGhpcy5kaW5rLnBsYXkoKTtcbiAgICB9LFxuXG4gICAgb3Zlck11bHRpZ2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMubXVsdGlHYW1lLnNjYWxlKVxuICAgICAgICAudG8oe3g6IDEuMywgeTogMS4zfSwgMzAwLCBQaGFzZXIuRWFzaW5nLkV4cG9uZW50aWFsLk91dCwgdHJ1ZSlcbiAgICAgIHRoaXMuZGluay5wbGF5KCk7XG4gICAgfSxcblxuICAgIG91dE11bHRpZ2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMubXVsdGlHYW1lLnNjYWxlKVxuICAgICAgICAudG8oe3g6IDEsIHk6IDF9LCAzMDAsIFBoYXNlci5FYXNpbmcuRXhwb25lbnRpYWwuT3V0LCB0cnVlKVxuICAgICAgdGhpcy5kaW5rLnBsYXkoKTtcbiAgICB9LFxuXG4gICAgb3V0TmV3Z2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMubmV3R2FtZS5zY2FsZSlcbiAgICAgICAgLnRvKHt4OiAxLCB5OiAxfSwgMzAwLCBQaGFzZXIuRWFzaW5nLkV4cG9uZW50aWFsLk91dCwgdHJ1ZSk7XG4gICAgfVxuICB9XG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKEdhbWUpIHtcbiAgdmFyIGcgPSBHYW1lO1xuICBHYW1lLlN0YXRlcy5QbGF5ID0gZnVuY3Rpb24oZ2FtZSkge31cblxuICBHYW1lLlN0YXRlcy5QbGF5LnByb3RvdHlwZSA9IHtcbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGdhbWUgPSB0aGlzLmdhbWU7XG4gICAgICB0aGlzLmxldmVsICAgICAgPSBHYW1lLmN1cnJlbnRMZXZlbCB8fCAwO1xuICAgICAgdGhpcy5sZXZlbERhdGEgID0gR2FtZS5MZXZlbHNbdGhpcy5sZXZlbF07XG4gICAgICB0aGlzLnBvaW50cyAgICAgPSAwO1xuXG4gICAgICAvLyBCYWNrZ3JvdW5kXG4gICAgICB0aGlzLmJhY2tncm91bmQgPSB0aGlzLmdhbWUuYWRkLnRpbGVTcHJpdGUoMCwgMCwgdGhpcy5nYW1lLndpZHRoLCB0aGlzLmdhbWUuaGVpZ2h0LCAnYmFja2dyb3VuZCcgKyB0aGlzLmxldmVsKTtcbiAgICAgIHRoaXMuYmFja2dyb3VuZC5hdXRvU2Nyb2xsKDEsIDE1KTtcbiAgICAgIHRoaXMuYmFja2dyb3VuZC50aWxlUG9zaXRpb24ueCA9IEdhbWUuYmFja2dyb3VuZFg7XG4gICAgICB0aGlzLmJhY2tncm91bmQudGlsZVBvc2l0aW9uLnkgPSBHYW1lLmJhY2tncm91bmRZO1xuICAgICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLmJhY2tncm91bmQpXG4gICAgICAgIC50byh7YWxwaGE6IDAuM30sIFxuICAgICAgICAgIDUwMDAsIFxuICAgICAgICAgIFBoYXNlci5FYXNpbmcuTGluZWFyLk5PTkUsIFxuICAgICAgICAgIHRydWUsIDAsIE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgdHJ1ZSk7XG5cbiAgICAgIC8vIEZQU1xuICAgICAgdGhpcy5nYW1lLnRpbWUuYWR2YW5jZWRUaW1pbmcgPSB0cnVlO1xuICAgICAgdGhpcy5mcHNUZXh0ID0gdGhpcy5nYW1lLmFkZC50ZXh0KFxuICAgICAgICAgIDEwMCwgKHRoaXMuZ2FtZS5oZWlnaHQgLSAyNiksICcnLCBcbiAgICAgICAgICB7IGZvbnQ6ICcxNnB4IEFyaWFsJywgZmlsbDogJyNmZmZmZmYnIH1cbiAgICAgICk7XG5cbiAgICAgIC8vIEVuZW15IExhc2Vyc1xuICAgICAgdGhpcy5sYXNlcnMgICAgICAgICA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gICAgICAvLyBFbmVtaWVzXG4gICAgICAvLyB0aGlzLmVuZW1pZXMgICAgICAgID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgICAgIHRoaXMuZW5lbXlHcm91cHMgICAgPSB7fTsgLy89IGdhbWUuYWRkLmdyb3VwKCk7XG4gICAgICB0aGlzLmVuZW15R3JvdXBzQ291bnQgPSAwO1xuICAgICAgdmFyIGxldmVsRW5lbWllcyA9IHRoaXMubGV2ZWxEYXRhLmVuZW1pZXM7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBsZXZlbEVuZW1pZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5lbmVteUdyb3Vwc1tpXSA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gICAgICAgIHRoaXMuZW5lbXlHcm91cHNDb3VudCsrO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5zY29yZSA9IDA7XG4gICAgICAvLyBUaGlzIHBsYXllcidzIGJ1bGxldHNcbiAgICAgIHRoaXMuYnVsbGV0cyAgICAgICAgPSBnYW1lLmFkZC5ncm91cCgpO1xuICAgICAgLy8gT3RoZXIgYnVsbGV0c1xuICAgICAgdGhpcy5yZW1vdGVCdWxsZXRzICA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gICAgICAvLyBXZSBoYXZlIG90aGVyIHBsYXllcnNcbiAgICAgIGcucmVtb3RlUGxheWVycyAgPSBnYW1lLnJlbW90ZVBsYXllcnMgfHwgW107XG5cbiAgICAgIC8vIFNldHVwIHNob290aW5nXG4gICAgICB0aGlzLmdhbWUuaW5wdXQub25Eb3duLmFkZCh0aGlzLnNob290QnVsbGV0LCB0aGlzKTtcblxuICAgICAgZy5zaW8gPSBnLnNvY2tldDtcblxuICAgICAgLy8gV2UgQUxXQVlTIGhhdmUgdXMgYXMgYSBwbGF5ZXJcbiAgICAgIGcuaGVybyA9IHRoaXMuaGVybyA9IG5ldyBHYW1lLlByZWZhYnMuUGxheWVyKHRoaXMuZ2FtZSwgXG4gICAgICAgICAgdGhpcy5nYW1lLndpZHRoLzIsIFxuICAgICAgICAgIHRoaXMuZ2FtZS5oZWlnaHQgKyA2MCArIDIwLFxuICAgICAgICAgIHRoaXMuZ2FtZS5pbnB1dCxcbiAgICAgICAgICB0cnVlLCBnLnNpbyk7XG4gICAgICBcbiAgICAgIHRoaXMuZ2FtZS5hZGQuZXhpc3RpbmcodGhpcy5oZXJvKTtcbiAgICAgIC8vIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5oZXJvKVxuICAgICAgICAvLyAudG8oe1xuICAgICAgICAvLyAgIHk6IHRoaXMuZ2FtZS5oZWlnaHQgLSAodGhpcy5oZXJvLmhlaWdodCArIDIwKVxuICAgICAgICAvLyB9LCAxNTAwLCBQaGFzZXIuRWFzaW5nLkV4cG9uZW50aWFsLk91dCwgdHJ1ZSk7XG5cbiAgICAgIC8vIERpc3BsYXkgbGl2ZXNcbiAgICAgIHRoaXMubGl2ZXNHcm91cCA9IHRoaXMuZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgICAgIHRoaXMubGl2ZXNHcm91cC5hZGQodGhpcy5nYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ2xpdmVzJykpO1xuICAgICAgdGhpcy5saXZlc0dyb3VwLmFkZCh0aGlzLmdhbWUuYWRkLnNwcml0ZSgyMCwgMywgJ251bScsIDApKTtcbiAgICAgIHRoaXMubGl2ZXNOdW0gPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSgzNSwgMywgJ251bScsIHRoaXMuaGVyby5saXZlcysxKTtcbiAgICAgIHRoaXMubGl2ZXNHcm91cC5hZGQodGhpcy5saXZlc051bSk7XG4gICAgICB0aGlzLmxpdmVzR3JvdXAueCA9IHRoaXMuZ2FtZS53aWR0aCAtIDU1O1xuICAgICAgdGhpcy5saXZlc0dyb3VwLnkgPSA1O1xuICAgICAgdGhpcy5saXZlc0dyb3VwLmFscGhhID0gMDtcblxuICAgICAgLy8gQWRkIGJ1bGxldHNcbiAgICAgIGZvcih2YXIgaSA9IDA7IGk8dGhpcy5oZXJvLm51bUJ1bGxldHM7IGkrKyl7XG4gICAgICAgIHZhciBidWxsZXQgPSBuZXcgR2FtZS5QcmVmYWJzLkJ1bGxldCh0aGlzLmdhbWUsIDAsIDAsIHRoaXMuaGVybyk7XG4gICAgICAgIHRoaXMuYnVsbGV0cy5hZGQoYnVsbGV0KTtcbiAgICAgIH1cblxuICAgICAgLy8gU2NvcmVcbiAgICAgIHRoaXMuc2NvcmUgPSAwO1xuICAgICAgdGhpcy5zY29yZVRleHQgPSB0aGlzLmdhbWUuYWRkLmJpdG1hcFRleHQoMTAsIHRoaXMuZ2FtZS5oZWlnaHQgLSAyNywgJ2FyY2hpdGVjdHNEYXVnaHRlcicsICdTY29yZTogMCcsIDE2KTtcbiAgICAgIHRoaXMuc2NvcmVUZXh0LmFscGhhID0gMDtcblxuICAgICAgLy8gSnVpY3lcbiAgICAgIHRoaXMuanVpY3kgPSB0aGlzLmdhbWUucGx1Z2lucy5hZGQoUGhhc2VyLlBsdWdpbi5KdWljeSk7XG4gICAgICB0aGlzLnNjcmVlbkZsYXNoID0gdGhpcy5qdWljeS5jcmVhdGVTY3JlZW5GbGFzaCgpO1xuICAgICAgdGhpcy5hZGQuZXhpc3RpbmcodGhpcy5zY3JlZW5GbGFzaCk7XG4gICAgICBcbiAgICAgIHRoaXMuZ2FtZV9tdXNpYyA9IGdhbWUuYWRkLmF1ZGlvKCdnYW1lX211c2ljJyk7XG4gICAgICAvLyB0aGlzLmdhbWVfbXVzaWMucGxheSgpO1xuXG4gICAgICAvLyBFbnRlciBwbGF5IG1vZGUgYWZ0ZXIgaW5pdCBzdGF0ZVxuICAgICAgdGhpcy50aW1lckluaXQgPSB0aGlzLmdhbWUudGltZS5jcmVhdGUodHJ1ZSk7XG4gICAgICB0aGlzLnRpbWVySW5pdC5hZGQoUGhhc2VyLlRpbWVyLlNFQ09ORCoxLjUsIHRoaXMuaW5pdEdhbWUsIHRoaXMpO1xuICAgICAgdGhpcy50aW1lckluaXQuc3RhcnQoKTtcblxuICAgICAgdmFyIGdhbWVQbGF5ID0gdGhpcztcbiAgICAgIHZhciBnYW1lUGxheWVyID0gXy5leHRlbmQodGhpcy5oZXJvLCB7XG4gICAgICAgIGlkOiBnLnNpZCxcbiAgICAgICAgbmFtZTogJ1lvdSBqb2luZWQnXG4gICAgICB9KVxuICAgICAgZ2FtZVBsYXkuZ2FtZS5zY29wZVxuICAgICAgICAgIC4kZW1pdCgnZ2FtZTpuZXdQbGF5ZXInLCBnYW1lUGxheWVyKTtcblxuICAgICAgaWYgKEdhbWUubXVsdGlwbGF5ZXIpIHtcbiAgICAgICAgLy8gSGVscGVyc1xuICAgICAgICB2YXIgcmVtb3ZlUGxheWVyID0gZnVuY3Rpb24ocGxheWVyLCBtYXApIHtcbiAgICAgICAgICBnLnJlbW90ZVBsYXllcnMuc3BsaWNlKGcucmVtb3RlUGxheWVycy5pbmRleE9mKHBsYXllciksIDEpO1xuICAgICAgICAgIEdhbWUudG9SZW1vdmUucHVzaChwbGF5ZXIpO1xuICAgICAgICAgIGdhbWVQbGF5LmdhbWUuc2NvcGUuJGVtaXQoJ2dhbWU6cmVtb3ZlUGxheWVyJywge1xuICAgICAgICAgICAgcGxheWVyOiBwbGF5ZXIsXG4gICAgICAgICAgICBtYXBJZDogbWFwXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGVyc1xuICAgICAgICB0aGlzLmdhbWUuc29ja2V0Lm9uKCdnYW1lVXBkYXRlZDphZGQnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2dhbWVVcGRhdGVkOmFkZCcpO1xuICAgICAgICAgIHZhciBhbGxQbGF5ZXJzID0gZGF0YS5hbGxQbGF5ZXJzLFxuICAgICAgICAgICAgICBuZXdQbGF5ZXJzID0gW107XG4gICAgICAgICAgXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxQbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVySW5RdWVzdGlvbiA9IGFsbFBsYXllcnNbaV07XG5cbiAgICAgICAgICAgIGlmIChwbGF5ZXJJblF1ZXN0aW9uLmlkID09PSBnLmhlcm8uaWQpIHtcbiAgICAgICAgICAgICAgLy8gTm9wZSwgd2UncmUgYWxyZWFkeSBhZGRlZFxuICAgICAgICAgICAgfSBlbHNlIGlmIChHYW1lLnBsYXllckJ5SWQocGxheWVySW5RdWVzdGlvbi5pZCkpIHtcbiAgICAgICAgICAgICAgLy8gTm9wZSwgd2UgYWxyZWFkeSBrbm93IGFib3V0ICdlbVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZy50b0FkZC5wdXNoKHBsYXllckluUXVlc3Rpb24pO1xuICAgICAgICAgICAgICBnYW1lUGxheS5nYW1lLnNjb3BlLiRlbWl0KCdnYW1lOm5ld1BsYXllcicsIHBsYXllckluUXVlc3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5nYW1lLnNvY2tldC5vbignZ2FtZVVwZGF0ZWQ6cmVtb3ZlJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIHZhciBhbGxQbGF5ZXJzID0gZy5yZW1vdGVQbGF5ZXJzLFxuICAgICAgICAgICAgICBuZXdQbGF5ZXJMaXN0ID0gZGF0YS5hbGxQbGF5ZXJzLFxuICAgICAgICAgICAgICBuZXdQbGF5ZXJzID0gW107XG5cbiAgICAgICAgICB2YXIgbWFwSWQgPSBkYXRhLm1hcDtcbiAgICAgICAgICBcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbFBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwbGF5ZXJJblF1ZXN0aW9uID0gYWxsUGxheWVyc1tpXTtcblxuICAgICAgICAgICAgaWYgKHBsYXllckluUXVlc3Rpb24uaWQgPT09IGcuaGVyby5pZCkge1xuICAgICAgICAgICAgICAvLyBOb3BlLCB3ZSdyZSBhbHJlYWR5IGFkZGVkXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZXdQbGF5ZXJMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5ld1BsYXllckxpc3RbaV0uaWQgPT09IHBsYXllckluUXVlc3Rpb24uaWQpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRoZSBwbGF5ZXIgaXMgaW4gdGhlIG5ldyBwbGF5ZXIgbGlzdFxuICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgaGF2ZSB0byByZW1vdmUgdGhlbVxuICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgY2FuIHJlbW92ZSB0aGlzIHBsYXllclxuICAgICAgICAgICAgICAgIHJlbW92ZVBsYXllcihwbGF5ZXJJblF1ZXN0aW9uLCBtYXBJZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZ2FtZS5zb2NrZXQub24oJ3VwZGF0ZVBsYXllcnMnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgdmFyIHBsYXllcnNEYXRhID0gZGF0YS5nYW1lLnBsYXllcnM7XG5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBsYXllcnNEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVyRGF0YSA9IHBsYXllcnNEYXRhW2ldO1xuICAgICAgICAgICAgdmFyIHBsYXllcjtcblxuICAgICAgICAgICAgaWYgKHBsYXllckRhdGEuaWQgIT09IGcuc2lkKSB7XG4gICAgICAgICAgICAgIHBsYXllciA9IEdhbWUucGxheWVyQnlJZChwbGF5ZXJEYXRhLmlkKTtcbiAgICAgICAgICAgICAgaWYgKHBsYXllcikge1xuICAgICAgICAgICAgICAgIHBsYXllci5vblVwZGF0ZUZyb21TZXJ2ZXIocGxheWVyRGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5nYW1lLnNvY2tldC5vbignYnVsbGV0U2hvdCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICB2YXIgcGxheWVyID0gR2FtZS5wbGF5ZXJCeUlkKGRhdGEuaWQpO1xuXG4gICAgICAgICAgaWYgKHBsYXllcikge1xuICAgICAgICAgICAgYnVsbGV0ID0gZ2FtZVBsYXkucmVtb3RlQnVsbGV0cy5nZXRGaXJzdEV4aXN0cyhmYWxzZSk7XG4gICAgICAgICAgICBpZighYnVsbGV0KXtcbiAgICAgICAgICAgICAgYnVsbGV0ID0gbmV3IEdhbWUuUHJlZmFicy5CdWxsZXQodGhpcy5nYW1lLCBkYXRhLngsIGRhdGEueSwgcGxheWVyKTtcbiAgICAgICAgICAgICAgZ2FtZVBsYXkucmVtb3RlQnVsbGV0cy5hZGQoYnVsbGV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFNob290IHRoZSBkYXJuIHRoaW5nXG4gICAgICAgICAgICBidWxsZXQuc2hvb3QoKTtcblxuICAgICAgICAgICAgYnVsbGV0LnJlc2V0KGRhdGEueCwgZGF0YS55KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZ2FtZS5zb2NrZXQub24oJ3BsYXllckhpdCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBpZiAoZGF0YS52aWN0aW0gPT09IGcuc2lkKSB7XG4gICAgICAgICAgICAvLyBXZSB3ZXJlIGhpdFxuICAgICAgICAgICAgaWYgKGRhdGEudmljdGltSGVhbHRoID09PSAwKSB7XG4gICAgICAgICAgICAgIGdhbWVQbGF5LmdhbWVPdmVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwbGF5ZXIgPSBHYW1lLnBsYXllckJ5SWQoZGF0YS52aWN0aW0pO1xuICAgICAgICAgICAgaWYgKHBsYXllcikge1xuICAgICAgICAgICAgICBpZiAoZGF0YS52aWN0aW1IZWFsdGggPD0gMCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5kaWUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5nYW1lLnNvY2tldC5vbignZ2FtZU92ZXInLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgdmFyIHdpbm5lcklkID0gZGF0YS53aW5uZXIuaWQ7XG4gICAgICAgICAgaWYgKHdpbm5lcklkID09PSBnLnNpZCkge1xuICAgICAgICAgICAgLy8gV0UgV09OIVxuICAgICAgICAgICAgR2FtZS53aW5uZXIgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXZSBMT1NUIDooXG4gICAgICAgICAgICBHYW1lLndpbm5lciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBnYW1lUGxheS5nYW1lT3ZlcigpO1xuICAgICAgICB9KTtcblxuICAgICAgICBnLnNvY2tldC5lbWl0KCduZXdQbGF5ZXInLCB7XG4gICAgICAgICAgbWFwSWQ6IEdhbWUubWFwSWQsXG4gICAgICAgICAgaGVhbHRoOiB0aGlzLmhlcm8uaGVhbHRoXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYoIUdhbWUucGF1c2VkKXtcbiAgICAgICAgLy8gdGhpcy51cGRhdGVQbGF5ZXIoKTtcblxuICAgICAgICB0aGlzLmFkZFBsYXllcnMoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVQbGF5ZXJzKCk7XG4gICAgICAgIC8vIFJ1biBnYW1lIGxvb3AgdGhpbmd5XG4gICAgICAgIHRoaXMuY2hlY2tDb2xsaXNpb25zKCk7XG5cbiAgICAgICAgdGhpcy5mcHNUZXh0LnNldFRleHQodGhpcy5nYW1lLnRpbWUuZnBzICsgJyBGUFMnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdXBkYXRlUmVtb3RlU2VydmVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBnYW1lID0gdGhpcy5nYW1lO1xuXG4gICAgICBnLnNvY2tldC5lbWl0KCd1cGRhdGVQbGF5ZXInLCB7XG4gICAgICAgIHg6IHRoaXMuaGVyby54LFxuICAgICAgICB5OiB0aGlzLmhlcm8ueSxcbiAgICAgICAgeFJlbDogdGhpcy5oZXJvLnggLyAoR2FtZS53aWR0aCA9PT0gMCA/IDEgOiBHYW1lLndpZHRoKSxcbiAgICAgICAgeVJlbDogdGhpcy5oZXJvLnkgLyAoR2FtZS5oZWlnaHQgPT09IDAgPyAxIDogR2FtZS5oZWlnaHQpLFxuICAgICAgICBoZWFsdGg6IHRoaXMuaGVyby5oZWFsdGgsXG4gICAgICAgIHJvdGF0aW9uOiB0aGlzLmhlcm8ucm90YXRpb24sXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnVwZGF0ZVJlbW90ZVNlcnZlclRpbWVyID0gdGhpcy5nYW1lLnRpbWUuZXZlbnRzXG4gICAgICAgIC5hZGQoXG4gICAgICAgICAgMjAsIC8vIEV2ZXJ5IDEwMCBtaWxpc2Vjb25kc1xuICAgICAgICAgIHRoaXMudXBkYXRlUmVtb3RlU2VydmVyLFxuICAgICAgICAgIHRoaXMpO1xuICAgIH0sXG5cbiAgICBhZGRQbGF5ZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgIHdoaWxlIChnLnRvQWRkLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICB2YXIgZGF0YSA9IGcudG9BZGQuc2hpZnQoKTtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICB2YXIgdG9BZGQgPSBcbiAgICAgICAgICAgIHRoaXMuYWRkUGxheWVyKGRhdGEueCwgZGF0YS55LCBkYXRhLmlkKTtcbiAgICAgICAgICBnLnJlbW90ZVBsYXllcnMucHVzaCh0b0FkZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYWRkUGxheWVyOiBmdW5jdGlvbih4LCB5LCBpZCkge1xuICAgICAgLy8gV2UgQUxXQVlTIGhhdmUgdXMgYXMgYSBwbGF5ZXJcbiAgICAgIHZhciBwbGF5ZXIgPSBuZXcgR2FtZS5QcmVmYWJzLlBsYXllcih0aGlzLmdhbWUsIHRoaXMuZ2FtZS53aWR0aC8yLCAxMDAsIG51bGwsIGlkKTtcbiAgICAgIHRoaXMuZ2FtZS5hZGQuZXhpc3RpbmcocGxheWVyKTtcblxuICAgICAgcmV0dXJuIHBsYXllcjtcbiAgICB9LFxuXG4gICAgcmVtb3ZlUGxheWVyczogZnVuY3Rpb24oKSB7XG4gICAgICB3aGlsZSAoZy50b1JlbW92ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgdmFyIHRvUmVtb3ZlID0gZy50b1JlbW92ZS5zaGlmdCgpO1xuICAgICAgICB0aGlzLmdhbWUud29ybGQucmVtb3ZlQ2hpbGQodG9SZW1vdmUsIHRydWUpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBzaHV0ZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmJ1bGxldHMuZGVzdHJveSgpO1xuICAgICAgdGhpcy5mb3JFYWNoRW5lbXkoZnVuY3Rpb24oZW5lbXkpIHtcbiAgICAgICAgZW5lbXkuZGVzdHJveSgpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmxhc2Vycy5kZXN0cm95KCk7XG4gICAgICAvLyB0aGlzLnVwZGF0ZVBsYXllcnMudGltZXIucGF1c2UoKTtcbiAgICAgIEdhbWUucGF1c2VkID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgZ29Ub01lbnU6IGZ1bmN0aW9uKCkge1xuICAgICAgR2FtZS5iYWNrZ3JvdW5kWCA9IHRoaXMuYmFja2dyb3VuZC50aWxlUG9zaXRpb24ueDtcbiAgICAgIEdhbWUuYmFja2dyb3VuZFkgPSB0aGlzLmJhY2tncm91bmQudGlsZVBvc2l0aW9uLnk7XG5cbiAgICAgIHRoaXMuZ2FtZS5zdGF0ZS5zdGFydCgnTWFpbk1lbnUnKTtcbiAgICB9LFxuXG4gICAgaW5pdEdhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBHZW5lcmF0ZSBlbmVtaWVzXG4gICAgICAvLyB0aGlzLmVuZW1pZXNHZW5lcmF0b3IgPSB0aGlzLmdhbWUudGltZS5ldmVudHNcbiAgICAgICAgLy8gLmFkZCgyMDAwLCB0aGlzLmdlbmVyYXRlRW5lbWllcywgdGhpcyk7XG5cbiAgICAgIC8vIEdlbmVyYXRlIGVuZW1pZXMgbGFzZXJcbiAgICAgIC8vIHRoaXMubGFzZXJzR2VuZXJhdG9yID0gdGhpcy5nYW1lLnRpbWUuZXZlbnRzXG4gICAgICAgIC8vIC5hZGQoMTAwMCwgdGhpcy5zaG9vdExhc2VyLCB0aGlzKTtcblxuICAgICAgLy8gR2VuZXJhdGUgc2VydmVyIHVwZGF0ZXNcbiAgICAgIHRoaXMudXBkYXRlUmVtb3RlU2VydmVyVGltZXIgPSB0aGlzLmdhbWUudGltZS5ldmVudHNcbiAgICAgICAgLmFkZCgyMDAsIHRoaXMudXBkYXRlUmVtb3RlU2VydmVyLCB0aGlzKTtcblxuICAgICAgLy8gU2hvdyBVSVxuICAgICAgLy8gdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLmxpdmVzR3JvdXApXG4gICAgICAvLyAgIC50byh7YWxwaGE6MX0sIDYwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUpO1xuICAgICAgLy8gdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLnNjb3JlVGV4dClcbiAgICAgIC8vICAgLnRvKHthbHBoYToxfSwgNjAwLCBQaGFzZXIuRWFzaW5nLkV4cG9uZW50aWFsLk91dCwgdHJ1ZSk7XG5cbiAgICAgIC8vIFBsYXlcbiAgICAgIHRoaXMucGxheUdhbWUoKTtcbiAgICB9LFxuXG4gICAgcGxheUdhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEdhbWUucGF1c2VkKSB7XG4gICAgICAgIEdhbWUucGF1c2VkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5oZXJvLmZvbGxvdyA9IHRydWU7XG4gICAgICAgIHRoaXMuaGVyby5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG5cbiAgICAgICAgLy8gTkVFRCBUTyBVUERBVEUgVEhJU1xuICAgICAgICAvLyB0aGlzLmVuZW1pZXNHZW5lcmF0b3IudGltZXIucmVzdW1lKCk7XG5cbiAgICAgICAgdGhpcy5sYXNlcnMuZm9yRWFjaChmdW5jdGlvbihsYXNlcikge1xuICAgICAgICAgIGxhc2VyLnJlc3VtZSgpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQueCA9IHRoaXMuaGVyby54O1xuICAgICAgICB0aGlzLmdhbWUuaW5wdXQueSA9IHRoaXMuaGVyby55O1xuXG4gICAgICB9XG4gICAgfSxcblxuICAgIGdlbmVyYXRlRW5lbWllczogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGV2ZWxFbmVtaWVzID0gdGhpcy5sZXZlbERhdGEuZW5lbWllcztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGV2ZWxFbmVtaWVzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgdmFyIGVuZW15R3JvdXAgPSB0aGlzLmVuZW15R3JvdXBzW2ldLFxuICAgICAgICAgICAgbGV2ZWxFbmVteSAgPSBsZXZlbEVuZW1pZXNbaV07XG4gICAgICAgIHZhciBlbmVtaWVzID0gZW5lbXlHcm91cC5nZXRGaXJzdEV4aXN0cyhmYWxzZSk7XG5cbiAgICAgICAgaWYoIWVuZW1pZXMpe1xuICAgICAgICAgIGVuZW1pZXMgPSBuZXcgR2FtZS5QcmVmYWJzXG4gICAgICAgICAgICAuRW5lbWllcyh0aGlzLmdhbWUsIFxuICAgICAgICAgICAgICBsZXZlbEVuZW15LmNvdW50IHx8IDEwLCBcbiAgICAgICAgICAgICAgbGV2ZWxFbmVteSxcbiAgICAgICAgICAgICAgdGhpcy5oZXJvLFxuICAgICAgICAgICAgICB0aGlzLmVuZW15R3JvdXBzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZXNldChmcm9tWSwgdG9ZLCBzcGVlZClcbiAgICAgICAgZW5lbWllc1xuICAgICAgICAgIC5yZXNldCh0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKDAsIHRoaXMuZ2FtZS53aWR0aCksIFxuICAgICAgICAgICAgICB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKDAsIHRoaXMuZ2FtZS53aWR0aCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZWxhdW5jaCB0aW1lciBkZXBlbmRpbmcgb24gbGV2ZWxcbiAgICAgIHRoaXMuZW5lbWllc0dlbmVyYXRvciA9IHRoaXMuZ2FtZS50aW1lLmV2ZW50c1xuICAgICAgICAuYWRkKFxuICAgICAgICAgIHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoMjAsIDUwKSAqIDUwMC8odGhpcy5sZXZlbCArIDEpLCBcbiAgICAgICAgICB0aGlzLmdlbmVyYXRlRW5lbWllcywgdGhpcyk7XG4gICAgfSxcblxuICAgIHNob290QnVsbGV0OiBmdW5jdGlvbigpe1xuICAgICAgLy8gQ2hlY2sgZGVsYXkgdGltZVxuICAgICAgaWYodGhpcy5sYXN0QnVsbGV0U2hvdEF0ID09PSB1bmRlZmluZWQpIHRoaXMubGFzdEJ1bGxldFNob3RBdCA9IDA7XG4gICAgICBpZih0aGlzLmdhbWUudGltZS5ub3cgLSB0aGlzLmxhc3RCdWxsZXRTaG90QXQgPCB0aGlzLmhlcm8uc2hvdERlbGF5KXtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5sYXN0QnVsbGV0U2hvdEF0ID0gdGhpcy5nYW1lLnRpbWUubm93O1xuXG4gICAgICAvLyBDcmVhdGUgYnVsbGV0c1xuICAgICAgdmFyIGJ1bGxldCwgYnVsbGV0UG9zWTtcbiAgICAgIGJ1bGxldCA9IHRoaXMuYnVsbGV0cy5nZXRGaXJzdEV4aXN0cyhmYWxzZSk7XG4gICAgICBpZihidWxsZXQpIHtcblxuICAgICAgICBidWxsZXQucmVzZXQodGhpcy5oZXJvLngsIHRoaXMuaGVyby55KTtcbiAgICAgICAgLy8gU2hvb3QgdGhlIGRhcm4gdGhpbmdcbiAgICAgICAgYnVsbGV0LnNob290KCk7XG5cbiAgICAgICAgdGhpcy5nYW1lLnNvY2tldC5lbWl0KCdzaG90YnVsbGV0Jywge1xuICAgICAgICAgIGlkOiBnLnNpZCxcbiAgICAgICAgICB5OiBidWxsZXQueSxcbiAgICAgICAgICB4OiBidWxsZXQueCxcbiAgICAgICAgICByb3RhdGlvbjogYnVsbGV0LnJvdGF0aW9uXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBjaGVja0NvbGxpc2lvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEdhbWUubXVsdGlwbGF5ZXIpIHtcbiAgICAgICAgLy8gZy5yZW1vdGVQbGF5ZXJzLmZvckVhY2goZnVuY3Rpb24ocGxheWVyKSB7XG4gICAgICAgICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAoXG4gICAgICAgICAgICAgIHRoaXMucmVtb3RlQnVsbGV0cywgXG4gICAgICAgICAgICAgIHRoaXMuaGVybywgdGhpcy5raWxsSGVybyxcbiAgICAgICAgICAgICAgbnVsbCwgdGhpcyk7XG5cbiAgICAgICAgICBnLnJlbW90ZVBsYXllcnMuZm9yRWFjaChmdW5jdGlvbihyZW1vdGVQbGF5ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKFxuICAgICAgICAgICAgICB0aGlzLmJ1bGxldHMsIHJlbW90ZVBsYXllciwgdGhpcy5oaXRBUmVtb3RlUGxheWVyLCBudWxsLCB0aGlzKTtcbiAgICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAvLyB9LCB0aGlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNpbmdsZSBwbGF5ZXIgbW9kZSByZXF1aXJlcyBlbmVtaWVzXG4gICAgICAgICAgdmFyIGxldmVsRW5lbWllcyA9IHRoaXMuZW5lbXlHcm91cHM7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmVuZW15R3JvdXBzQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgdmFyIGVuZW1pZXMgPSBsZXZlbEVuZW1pZXNbaV07XG4gICAgICAgICAgICBlbmVtaWVzLmZvckVhY2goZnVuY3Rpb24oZW5lbXkpIHtcbiAgICAgICAgICAgICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5idWxsZXRzLCBlbmVteSwgdGhpcy5raWxsRW5lbXksIG51bGwsIHRoaXMpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAgIGVuZW1pZXMuZm9yRWFjaChmdW5jdGlvbihlbmVteSkge1xuICAgICAgICAgICAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLmhlcm8sIGVuZW15LCB0aGlzLmtpbGxIZXJvLCBudWxsLCB0aGlzKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuaGVybywgdGhpcy5sYXNlcnMsIHRoaXMua2lsbEhlcm8sIG51bGwsIHRoaXMpO1xuICAgICAgICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuaGVybywgdGhpcy5ib251cywgdGhpcy5hY3RpdmVCb251cywgbnVsbCwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgdXBkYXRlU2NvcmU6IGZ1bmN0aW9uKGVuZW15KSB7XG4gICAgICB0aGlzLnNjb3JlICs9IGVuZW15LmRlc2MgPyBlbmVteS5kZXNjLm1heEhlYWx0aCA6IDE7XG4gICAgICB0aGlzLnNjb3JlVGV4dC5zZXRUZXh0KCdTY29yZTogJyArIHRoaXMuc2NvcmUgKyAnJyk7XG4gICAgfSxcblxuICAgIGtpbGxFbmVteTogZnVuY3Rpb24oYnVsbGV0LCBlbmVteSkge1xuICAgICAgaWYgKCFlbmVteS5kZWFkICYmIGVuZW15LmNoZWNrV29ybGRCb3VuZHMpIHtcbiAgICAgICAgZW5lbXkuZGllKCk7XG4gICAgICAgIGJ1bGxldC5raWxsKCk7XG4gICAgICAgIHRoaXMudXBkYXRlU2NvcmUoZW5lbXkpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBraWxsSGVybzogZnVuY3Rpb24oaGVybywgZW5lbXkpIHtcbiAgICAgIGlmKGVuZW15IGluc3RhbmNlb2YgR2FtZS5QcmVmYWJzLkxhc2VyIHx8IFxuICAgICAgICAgIChlbmVteSBpbnN0YW5jZW9mIEdhbWUuUHJlZmFicy5FbmVteSAmJiBcbiAgICAgICAgICAgICFlbmVteS5kZWFkICYmIFxuICAgICAgICAgICAgZW5lbXkuY2hlY2tXb3JsZEJvdW5kcykpe1xuICAgICAgICB0aGlzLmhlcm8ubGl2ZXMtLTtcbiAgICAgICAgdGhpcy5zY3JlZW5GbGFzaC5mbGFzaCgpO1xuXG4gICAgICAgIGlmICh0aGlzLmhlcm8ubGl2ZXMgPCAxKSB7XG4gICAgICAgICAgdGhpcy5nYW1lT3ZlcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGVyby5lbmFibGVTaGllbGQoMik7XG4gICAgICAgICAgdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLmxpdmVzTnVtKS50byh7YWxwaGE6MCwgeTogOH0sIDIwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUpLm9uQ29tcGxldGUuYWRkKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0aGlzLmxpdmVzTnVtLmZyYW1lID0gdGhpcy5oZXJvLmxpdmVzKzE7XG4gICAgICAgICAgICB0aGlzLmxpdmVzTnVtLnkgPSAtMjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5saXZlc051bSkudG8oe2FscGhhOjEsIHk6M30sIDIwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgIH0gZWxzZSBpZiAoZW5lbXkgaW5zdGFuY2VvZiBHYW1lLlByZWZhYnMuQnVsbGV0KSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgYnVsbGV0ID0gZW5lbXksXG4gICAgICAgICAgICBwbGF5ZXIgPSBidWxsZXQucGxheWVyO1xuXG4gICAgICAgIGJ1bGxldC5raWxsKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuaGVyby53YXNIaXRCeShidWxsZXQsIHBsYXllcikpIHtcbiAgICAgICAgLy8gU2hvdCBieSBhIHBsYXllclxuICAgICAgICAgIHRoaXMuc2NyZWVuRmxhc2guZmxhc2goKTtcblxuICAgICAgICAgIC8vIE5vdGlmeSBzZXJ2ZXJcbiAgICAgICAgICB0aGlzLmdhbWUuc29ja2V0LmVtaXQoJ3BsYXllckhpdCcsIHtcbiAgICAgICAgICAgIHNob290ZXI6IHBsYXllci5pZCxcbiAgICAgICAgICAgIHZpY3RpbTogZy5zaWQsXG4gICAgICAgICAgICBoZWFsdGg6IHRoaXMuaGVyby5oZWFsdGhcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmhlcm8uaGVhbHRoIDwgMCkge1xuICAgICAgICAgIHRoaXMuZ2FtZU92ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGJ1bGxldC5kaWUoKTtcbiAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vIGVuZW15LmRpZSh0cnVlKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgaGl0QVJlbW90ZVBsYXllcjogZnVuY3Rpb24ocGxheWVyLCBidWxsZXQpIHtcbiAgICAgIGlmICghcGxheWVyLnNoaWVsZHNFbmFibGVkKSB7XG4gICAgICAgIHBsYXllci5zaG93RXhwbG9zaW9uKCk7XG4gICAgICB9XG4gICAgICBidWxsZXQua2lsbCgpO1xuICAgIH0sXG4gICAgXG4gICAgc2hvb3RMYXNlcjogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBsYXNlciA9IHRoaXMubGFzZXJzLmdldEZpcnN0RXhpc3RzKGZhbHNlKTtcblxuICAgICAgaWYoIWxhc2VyKXtcbiAgICAgICAgbGFzZXIgPSBuZXcgR2FtZS5QcmVmYWJzLkxhc2VyKHRoaXMuZ2FtZSwgMCwgMCk7XG4gICAgICAgIHRoaXMubGFzZXJzLmFkZChsYXNlcik7XG4gICAgICB9XG4gICAgICBsYXNlci5yZXNldChcbiAgICAgICAgICB0aGlzLmdhbWUud2lkdGggKyBsYXNlci53aWR0aC8yLCBcbiAgICAgICAgICB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKDIwLCB0aGlzLmdhbWUuaGVpZ2h0KSk7XG4gICAgICBsYXNlci5yZWxvYWQoMTAwICsgKHRoaXMubGV2ZWwgKyAxKSozMCk7XG5cbiAgICAgIC8vIFJlbGF1bmNoIGJ1bGxldCB0aW1lciBkZXBlbmRpbmcgb24gbGV2ZWxcbiAgICAgIHRoaXMubGFzZXJzR2VuZXJhdG9yID0gdGhpcy5nYW1lLnRpbWUuZXZlbnRzXG4gICAgICAgIC5hZGQoXG4gICAgICAgICAgdGhpcy5nYW1lLnJuZC5pbnRlZ2VySW5SYW5nZSgxMiwgMjApICogMjUwLyh0aGlzLmxldmVsICsgMSksIFxuICAgICAgICAgIHRoaXMuc2hvb3RMYXNlciwgdGhpcyk7XG4gICAgfSxcblxuICAgIGdhbWVPdmVyOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIHRoaXMuZ2FtZS5pbnB1dC5vbkRvd24uYWRkKHRoaXMuc2hvb3RCdWxsZXQsIHRoaXMpO1xuICAgICAgdGhpcy5nYW1lLmlucHV0Lm9uRG93bi5yZW1vdmVBbGwoKTtcblxuICAgICAgdGhpcy5nYW1lb3ZlciA9IHRydWU7XG5cbiAgICAgIHRoaXMuanVpY3kuc2hha2UoMjAsIDUpO1xuXG4gICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMuaGVybylcbiAgICAgICAgLnRvKHthbHBoYTogMH0sIDUwMCwgUGhhc2VyLkVhc2luZy5FeHBvbmVudGlhbC5PdXQsIHRydWUpO1xuXG4gICAgICB0aGlzLnNjb3JlVGV4dC5hbHBoYSA9IDA7XG4gICAgICB0aGlzLmxpdmVzR3JvdXAuYWxwaGEgPSAwO1xuXG4gICAgICB0aGlzLnBhdXNlR2FtZSgpO1xuXG4gICAgICAvLyBDbGVhbiB1cCBzb2NrZXRcbiAgICAgIHRoaXMuZ2FtZS5zb2NrZXQucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG5cbiAgICAgIC8vIFNob3cgdGhlIGdhbWVvdmVyIHBhbmVsXG4gICAgICB0aGlzLnN0YXRlLnN0YXJ0KCdHYW1lT3ZlcicpO1xuICAgIH0sXG5cbiAgICBmb3JFYWNoRW5lbXk6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICB2YXIgbGV2ZWxFbmVtaWVzID0gdGhpcy5lbmVteUdyb3VwcztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5lbmVteUdyb3Vwc0NvdW50OyBpKyspIHtcbiAgICAgICAgdmFyIGVuZW1pZXMgPSBsZXZlbEVuZW1pZXNbaV07XG4gICAgICAgIGVuZW1pZXMuZm9yRWFjaChmbiwgdGhpcyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHBhdXNlR2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIUdhbWUucGF1c2VkKSB7XG4gICAgICAgIEdhbWUucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5oZXJvLmZvbGxvdyA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChHYW1lLm11bHRpcGxheWVyKSB7fVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0aGlzLmVuZW1pZXNHZW5lcmF0b3IudGltZXIucGF1c2UoKTtcblxuICAgICAgICAgIHRoaXMuZm9yRWFjaEVuZW15KGZ1bmN0aW9uKGdyb3VwKSB7XG4gICAgICAgICAgICBncm91cC5jYWxsQWxsKCdwYXVzZScpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdGhpcy5sYXNlcnMuZm9yRWFjaChmdW5jdGlvbihsYXNlcikge1xuICAgICAgICAgICAgbGFzZXIucGF1c2UoKTtcbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5nYW1lb3Zlcikge1xuICAgICAgICAgIC8vIHRoaXMucGF1c2VQYW5lbC5zaG93KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oR2FtZSkge1xuICB2YXIgZyA9IEdhbWU7XG5cbiAgR2FtZS5TdGF0ZXMuUHJlbG9hZGVyID0gZnVuY3Rpb24gKGdhbWUpIHtcbiAgICAgdGhpcy5hc3NldCA9IG51bGw7XG4gICAgIHRoaXMucmVhZHkgPSBmYWxzZTtcblxuICAgICBXZWJGb250Q29uZmlnID0ge1xuICAgICAgICAvLyAgVGhlIEdvb2dsZSBGb250cyB3ZSB3YW50IHRvIGxvYWQgKHNwZWNpZnkgYXMgbWFueSBhcyB5b3UgbGlrZSBpbiB0aGUgYXJyYXkpXG4gICAgICAgIGdvb2dsZToge1xuICAgICAgICAgIGZhbWlsaWVzOiBbJ1JldmFsaWEnLCAnQXJjaGl0ZWN0cyBEYXVnaHRlciddXG4gICAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIEdhbWUuU3RhdGVzLlByZWxvYWRlci5wcm90b3R5cGUgPSB7XG5cbiAgICBwcmVsb2FkOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmxvYWQub25Mb2FkQ29tcGxldGUuYWRkT25jZSh0aGlzLm9uTG9hZENvbXBsZXRlLCB0aGlzKTtcbiAgICAgIHRoaXMuYXNzZXQgPSB0aGlzLmFkZC5zcHJpdGUodGhpcy53b3JsZC5jZW50ZXJYLCB0aGlzLndvcmxkLmNlbnRlclksICdwcmVsb2FkZXInKTtcbiAgICAgIHRoaXMuYXNzZXQuYW5jaG9yLnNldFRvKDAuNSwgMC41KTtcbiAgICAgIHRoaXMubG9hZC5zZXRQcmVsb2FkU3ByaXRlKHRoaXMuYXNzZXQpO1xuXG4gICAgICAvLyBMb2FkIHRoZSBnYW1lIGxldmVsc1xuICAgICAgdmFyIExldmVscyA9IEdhbWUuTGV2ZWxzID0gdGhpcy5nYW1lLmNhY2hlLmdldEpTT04oJ2xldmVscycpO1xuXG4gICAgICAvLyBMb2FkIGxldmVsIGJhY2tncm91bmRzXG4gICAgICBmb3IgKHZhciBpIGluIExldmVscykge1xuICAgICAgICB2YXIgb2JqID0gTGV2ZWxzW2ldO1xuICAgICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2JhY2tncm91bmQnK2ksIG9iai5iYWNrZ3JvdW5kKTtcbiAgICAgIH1cblxuICAgICAgLy8gTG9hZCBmb250c1xuICAgICAgdGhpcy5nYW1lLmxvYWQuc2NyaXB0KCd3ZWJmb250JywgJy8vYWpheC5nb29nbGVhcGlzLmNvbS9hamF4L2xpYnMvd2ViZm9udC8xLjQuNy93ZWJmb250LmpzJyk7XG5cbiAgICAgIC8vIExvYWQgbWVudVxuICAgICAgdGhpcy5sb2FkLmltYWdlKCdsb2dvJywgJ2Fzc2V0cy9sb2dvLnBuZycpO1xuXG4gICAgICAvLyBMb2FkIHBsYXllciBzcHJpdGVzXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2hlcm8nLCAnYXNzZXRzL3BsYXllcl9ibHVlLnBuZycpO1xuICAgICAgdGhpcy5sb2FkLmltYWdlKCdzaGllbGQnLCAnYXNzZXRzL3NoaWVsZC5wbmcnKTtcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgncGxheWVyX2dyZWVuJywgJ2Fzc2V0cy9wbGF5ZXJfZ3JlZW4ucG5nJyk7XG5cbiAgICAgIHRoaXMubG9hZC5pbWFnZSgnbGFzZXJfcmVkJywgJ2Fzc2V0cy9sYXNlcl9yZWQucG5nJyk7XG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2xhc2VyX3llbGxvdycsICdhc3NldHMvbGFzZXJfeWVsbG93LnBuZycpO1xuICAgICAgdGhpcy5sb2FkLmltYWdlKCdsYXNlcl9vcmFuZ2UnLCAnYXNzZXRzL2xhc2VyX29yYW5nZS5wbmcnKTtcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgnbGFzZXJfZ3JheScsICdhc3NldHMvbGFzZXJfZ3JheS5wbmcnKTtcblxuICAgICAgLy8gTG9hZCBlbmVtaWVzXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2VuZW15XzEnLCAnYXNzZXRzL2VuZW15XzEucG5nJyk7XG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2VuZW15XzInLCAnYXNzZXRzL2VuZW15XzIucG5nJyk7XG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2VuZW15XzMnLCAnYXNzZXRzL2VuZW15XzMucG5nJyk7XG5cbiAgICAgIC8vIE5leHQgbGV2ZWwgYW5kIGdhbWVvdmVyIGdyYXBoaWNzXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ25leHRfbGV2ZWwnLCAnYXNzZXRzL2xldmVsY29tcGxldGUtYmcucG5nJyk7XG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2dhbWVvdmVyJywgJ2Fzc2V0cy9nYW1lb3Zlci1iZy5wbmcnKTtcbiAgICAgIHRoaXMubG9hZC5pbWFnZSgnbmV3JywgJ2Fzc2V0cy9uZXcucG5nJyk7XG5cbiAgICAgIHRoaXMubG9hZC5zcHJpdGVzaGVldCgnYnRuTWVudScsICdhc3NldHMvYnRuLW1lbnUucG5nJywgMTkwLCA0OSwgMik7XG4gICAgICB0aGlzLmxvYWQuc3ByaXRlc2hlZXQoJ2J0bicsICdhc3NldHMvYnRuLnBuZycsIDQ5LCA0OSwgNik7XG4gICAgICB0aGlzLmxvYWQuc3ByaXRlc2hlZXQoJ251bScsICdhc3NldHMvbnVtLnBuZycsIDEyLCAxMSwgNSk7XG4gICAgICB0aGlzLmxvYWQuc3ByaXRlc2hlZXQoJ2JvbnVzJywgJ2Fzc2V0cy9ib251cy5wbmcnLCAxNiwgMTYsIDIpO1xuXG4gICAgICAvLyBOdW1iZXJzXG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ251bScsICdhc3NldHMvbnVtLnBuZycpO1xuICAgICAgdGhpcy5sb2FkLmltYWdlKCdsaXZlcycsICdhc3NldHMvbGl2ZXMucG5nJyk7XG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ3BhbmVsJywgJ2Fzc2V0cy9wYW5lbC5wbmcnKTtcblxuICAgICAgdGhpcy5sb2FkLmltYWdlKCdsYXNlcicsICdhc3NldHMvbGFzZXIucG5nJyk7XG4gICAgICB0aGlzLmxvYWQuaW1hZ2UoJ2J1bGxldCcsICdhc3NldHMvYnVsbGV0LnBuZycpO1xuXG4gICAgICAvLyBBdWRpb1xuICAgICAgdGhpcy5sb2FkLmF1ZGlvKCdsYXNlckZ4JywgJ2Fzc2V0cy9sYXNlcl8wMS5tcDMnKTtcbiAgICAgIHRoaXMubG9hZC5hdWRpbygnZGluaycsICdhc3NldHMvZGluay5tcDMnKTtcbiAgICAgIHRoaXMubG9hZC5hdWRpbygnbWVudV9tdXNpYycsICdhc3NldHMvbWVudV9tdXNpYy5tcDMnKTtcbiAgICAgIHRoaXMubG9hZC5hdWRpbygnZ2FtZV9tdXNpYycsICdhc3NldHMvZ2FtZV9tdXNpYy5tcDMnKTtcblxuICAgICAgdGhpcy5sb2FkLnNwcml0ZXNoZWV0KCdleHBsb3Npb24nLCAnYXNzZXRzL2V4cGxvZGUucG5nJywgMTI4LCAxMjgsIDE2KTtcblxuICAgICAgLy8gRm9udHNcbiAgICAgIHRoaXMubG9hZC5iaXRtYXBGb250KCdhcmNoaXRlY3RzRGF1Z2h0ZXInLCBcbiAgICAgICAgJ2Fzc2V0cy9mb250cy9yLnBuZycsIFxuICAgICAgICAnYXNzZXRzL2ZvbnRzL3IuZm50Jyk7XG5cbiAgICAgIC8vIEZpbmFsbHksIGxvYWQgdGhlIGNhY2hlZCBsZXZlbCwgaWYgdGhlcmUgaXMgb25lXG4gICAgICBHYW1lLmN1cnJlbnRMZXZlbCA9IDA7XG4gICAgICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2N1cnJlbnRMZXZlbCcpKSB7XG4gICAgICAgIEdhbWUuY3VycmVudExldmVsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2N1cnJlbnRMZXZlbCcpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBjcmVhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuYXNzZXQuY3JvcEVuYWJsZWQgPSBmYWxzZTtcblxuICAgICAgdGhpcy5nYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IDB4MkIzRTQyO1xuICAgICAgdmFyIHR3ZWVuID0gdGhpcy5hZGQudHdlZW4odGhpcy5hc3NldClcbiAgICAgIC50byh7XG4gICAgICAgIGFscGhhOiAwXG4gICAgICB9LCA1MDAsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5vbmUsIHRydWUpO1xuICAgICAgdHdlZW4ub25Db21wbGV0ZS5hZGQodGhpcy5zdGFydE1haW5NZW51LCB0aGlzKTtcblxuICAgICAgLy8gTG9hZCBrZXlib2FyZCBjYXB0dXJlXG4gICAgICB2YXIgZ2FtZSA9IHRoaXMuZ2FtZTtcbiAgICAgIEdhbWUuY3Vyc29ycyA9IGdhbWUuaW5wdXQua2V5Ym9hcmQuY3JlYXRlQ3Vyc29yS2V5cygpO1xuICAgICAgLy8gdmFyIG11c2ljID0gdGhpcy5nYW1lLmFkZC5hdWRpbygnZ2FsYXh5Jyk7XG4gICAgICAvLyBtdXNpYy5sb29wID0gdHJ1ZTtcbiAgICAgIC8vIG11c2ljLnBsYXkoJycpO1xuICAgICAgLy8gd2luZG93Lm11c2ljID0gbXVzaWM7XG4gICAgfSxcblxuICAgIHN0YXJ0TWFpbk1lbnU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEhdGhpcy5yZWFkeSkge1xuICAgICAgICBpZiAoR2FtZS5tYXBJZCkge1xuICAgICAgICAgIHRoaXMuZ2FtZS5zdGF0ZS5zdGFydCgnUGxheScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZ2FtZS5zdGF0ZS5zdGFydCgnTWFpbk1lbnUnKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB0aGlzLmdhbWUuc3RhdGUuc3RhcnQoJ1BsYXknKTtcbiAgICAgICAgLy8gdGhpcy5nYW1lLnN0YXRlLnN0YXJ0KCdOZXh0TGV2ZWwnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdG9nZ2xlTXVzaWM6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMubXVzaWNJc1BsYXlpbmcgPSAhdGhpcy5tdXNpY0lzUGxheWluZykge1xuICAgICAgICBtdXNpYy5zdG9wKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtdXNpYy5wbGF5KCcnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Mb2FkQ29tcGxldGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMucmVhZHkgPSB0cnVlO1xuICAgIH1cbiAgfTtcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuaG9tZScpXHJcbi5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzdGF0ZSwgJHNjb3BlKXtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgX3RoaXMubWFpbk9wdGlvbnMgPSB7XHJcbiAgICAgICAgc2VjdGlvbnNDb2xvcjogWycjMWJiYzliJywgJyM0QkJGQzMnLCAnIzdCQUFCRSddLFxyXG4gICAgICAgIG5hdmlnYXRpb246IHRydWUsXHJcbiAgICAgICAgbmF2aWdhdGlvblBvc2l0aW9uOiAncmlnaHQnLFxyXG4gICAgICAgIHNjcm9sbGluZ1NwZWVkOiA1MDBcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm1vb2cgPSBmdW5jdGlvbihtZXJnKXsgY29uc29sZS5sb2cobWVyZyk7IH07XHJcblxyXG4gICAgdGhpcy5zbGlkZXMgPSBbXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogJ1NpbXBsZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdFYXN5IHRvIHVzZS4gQ29uZmlndXJhYmxlIGFuZCBjdXN0b21pemFibGUuJyxcclxuICAgICAgICAvLyBzcmM6ICdpbWFnZXMvMS5wbmcnXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogJ0Nvb2wnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSXQganVzdCBsb29rcyBjb29sLiBJbXByZXNzIGV2ZXJ5Ym9keSB3aXRoIGEgc2ltcGxlIGFuZCBtb2Rlcm4gd2ViIGRlc2lnbiEnLFxyXG4gICAgICAgIC8vIHNyYzogJ2ltYWdlcy8yLnBuZydcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIHRpdGxlOiAnQ29tcGF0aWJsZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdXb3JraW5nIGluIG1vZGVybiBhbmQgb2xkIGJyb3dzZXJzIHRvbyEnLFxyXG4gICAgICAgIC8vIHNyYzogJ2ltYWdlcy8zLnBuZydcclxuICAgICAgfVxyXG4gICAgXTtcclxuXHJcbiAgICB0aGlzLmFkZFNsaWRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIF90aGlzLnNsaWRlcy5wdXNoKHtcclxuICAgICAgICB0aXRsZTogJ05ldyBTbGlkZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdJIG1hZGUgYSBuZXcgc2xpZGUhJyxcclxuICAgICAgICAvLyBzcmM6ICdpbWFnZXMvMS5wbmcnXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8kY29tcGlsZShhbmd1bGFyLmVsZW1lbnQoJCgnLnNsaWRlJykpKSgkc2NvcGUpO1xyXG4gICAgfTtcclxufSk7IiwibW9kdWxlLmV4cG9ydHMgPVxuYW5ndWxhci5tb2R1bGUoJ2FwcC5ob21lJywgWyd1aS5yb3V0ZXInXSlcbi5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpe1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdzY3JpcHRzL2hvbWUvdGVtcGxhdGUvYmFzZS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ29udHJvbGxlciBhcyB2bSdcbiAgICAgICAgfSlcbiAgICAgICAgLnN0YXRlKCdob21lLmxhbmRpbmcnLCB7XG4gICAgICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnc2NyaXB0cy9ob21lL3RlbXBsYXRlL2xhbmRpbmcuaHRtbCcsXG4gICAgICAgIH0pXG4gICAgICAgIC5zdGF0ZSgnaG9tZS5sb2dpbicsIHtcbiAgICAgICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3NjcmlwdHMvaG9tZS90ZW1wbGF0ZS9sYW5kaW5nLmh0bWwnXG4gICAgICAgIH0pXG4gICAgICAgIC5zdGF0ZSgnaG9tZS5yZWdpc3RlcicsIHtcbiAgICAgICAgICAgIHVybDogJy9yZWdpc3RlcidcbiAgICAgICAgfSlcbiAgICAgICAgLnN0YXRlKCdob21lLmZvcmdvdC1wYXNzd29yZCcsIHtcbiAgICAgICAgICAgIHVybDogJ2ZvcmdvdC1wYXNzd29yZCdcbiAgICAgICAgfSlcbn0pXG5cbnJlcXVpcmUoJy4vZnVsbFBhZ2VfY29udHJvbGxlcicpOyIsIlxuYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFtcbiAgJ3VpLnJvdXRlcicsXG4gICdmdWxsUGFnZS5qcycsXG4gIHJlcXVpcmUoJy4vaG9tZScpLm5hbWUsXG4gIHJlcXVpcmUoJy4vbWVudScpLm5hbWUsXG4gIHJlcXVpcmUoJy4vZ2FtZScpLm5hbWUsXG4gIHJlcXVpcmUoJy4vdXNlcicpLm5hbWUsXG4gIHJlcXVpcmUoJy4vbmF2YmFyJykubmFtZSxcbiAgcmVxdWlyZSgnLi9vdmVybGF5JykubmFtZSxcbiAgcmVxdWlyZSgnLi9uZXR3b3JrJykubmFtZSxcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAkdXJsUm91dGVyUHJvdmlkZXJcbiAgICAub3RoZXJ3aXNlKCcvJyk7XG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSBcbmFuZ3VsYXIubW9kdWxlKCdhcHAubWVudScsIFtcbiAgcmVxdWlyZSgnLi9wbGF5X2J1dHRvbicpLm5hbWVcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdtZW51Jywge1xuICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICB0ZW1wbGF0ZVVybDogJ3NjcmlwdHMvbWVudS90ZW1wbGF0ZS5odG1sJyxcbiAgICAgIHVybDogJy9tZW51J1xuICAgIH0pXG4gICAgLnN0YXRlKCdtZW51LmhvbWUnLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICdzY3JpcHRzL21lbnUvbWFpbi5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdNZW51Q29udHJvbGxlciBhcyBjdHJsJyxcbiAgICAgIG9uRW50ZXI6IGZ1bmN0aW9uKFJvb20pIHtcbiAgICAgICAgUm9vbS5xdWVyeUZvclJvb21zKCk7XG4gICAgICB9XG4gICAgfSlcbn0pXG5cbnJlcXVpcmUoJy4vbWVudV9jb250cm9sbGVyJyk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5tZW51Jylcbi5jb250cm9sbGVyKCdNZW51Q29udHJvbGxlcicsIGZ1bmN0aW9uKG15U29ja2V0LCAkc2NvcGUsIFJvb20pIHtcblxuICAkc2NvcGUuJG9uKCdtYXA6dXBkYXRlJywgZnVuY3Rpb24oZXZ0LCBtYXBJZCkge1xuICAgIGN0cmwucm9vbXMgPSBSb29tLmdldFJvb21zKCk7XG4gIH0pO1xuXG4gIHZhciBjdHJsID0gdGhpcztcblxuICBjdHJsLmNyZWF0ZUlkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpLnRvU3RyaW5nKCk7XG4gIH07XG5cbn0pOyIsIm1vZHVsZS5leHBvcnRzID1cbmFuZ3VsYXIubW9kdWxlKCdhcHAubWVudS5wbGF5QnV0dG9uJywgW10pXG4uZGlyZWN0aXZlKCdwbGF5QnV0dG9uJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgc2NvcGU6IHtcbiAgICAgIG9uQ2xpY2s6ICcmJ1xuICAgIH0sXG4gICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwicGxheUJ1dHRvblwiXFxcbiAgICAgICAgbmctY2xpY2s9XCJvbkNsaWNrKClcIj5cXFxuICAgICAgPGkgY2xhc3M9XCJpY29uIGlvbi1wbGF5XCI+PC9pPlxcXG4gICAgICA8c3BhbiBjbGFzcz1cInBsYXktdGV4dFwiPnBsYXk8L3NwYW4+XFxcbiAgICA8L2Rpdj4nXG4gIH1cbn0pIiwibW9kdWxlLmV4cG9ydHMgPVxuYW5ndWxhci5tb2R1bGUoJ2FwcC5uYXZiYXInLCBbXSlcbi5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgcmVwbGFjZTogdHJ1ZSxcbiAgICB0ZW1wbGF0ZVVybDogJ3NjcmlwdHMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICBjb250cm9sbGVyOiAnTmF2YmFyQ29udHJvbGxlcidcbiAgfVxufSlcblxucmVxdWlyZSgnLi9uYXZiYXJfY29udHJvbGxlcicpOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAubmF2YmFyJylcbi5jb250cm9sbGVyKCdOYXZiYXJDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCBHYW1lLCBwbGF5ZXJzKSB7XG5cbiAgJHNjb3BlLmNvbm5lY3RlZFBsYXllcnMgPSBbXTtcbiAgJHNjb3BlLmdhbWUgPSBHYW1lO1xuXG4gICRzY29wZS4kb24oJ25ld1BsYXllcnMnLCBmdW5jdGlvbihldnQsIHBsYXllcnMpIHtcbiAgICAkc2NvcGUuY29ubmVjdGVkUGxheWVycyA9IHBsYXllcnM7XG4gIH0pO1xuXG59KSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubmV0d29yaycpXG4uZmFjdG9yeSgnRmVlZEl0ZW0nLCBmdW5jdGlvbigpIHtcbiAgdmFyIEZlZWRJdGVtID0gZnVuY3Rpb24oZXZlbnROYW1lLCBkYXRhKSB7XG4gICAgdGhpcy5pZCA9IGRhdGEuaWQ7XG4gICAgdGhpcy5ldmVudE5hbWUgPSBldmVudE5hbWU7XG5cbiAgICB0aGlzLm1zZyA9IGRhdGEubmFtZSB8fCBldmVudE5hbWUgKyAnIGhhcHBlbmVkJztcbiAgfTtcblxuICByZXR1cm4gRmVlZEl0ZW07XG59KVxuLnNlcnZpY2UoJ2ZlZWQnLCBmdW5jdGlvbihteVNvY2tldCwgJHJvb3RTY29wZSwgRmVlZEl0ZW0pIHtcbiAgXG4gIC8vICRyb290U2NvcGUuJG9uKCcnKVxuICB2YXIgc2VydmljZSA9IHRoaXMsXG4gICAgICBsaXN0ID0gW107XG5cbiAgdGhpcy5saXN0ID0gbGlzdDtcbiAgdGhpcy5tYXhMZW5ndGggPSAxMDtcblxuICB2YXIgYWRkVG9MaXN0ID0gZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGl0ZW0gPSBuZXcgRmVlZEl0ZW0obmFtZSwgZGF0YSk7XG4gICAgICBsaXN0LnVuc2hpZnQoaXRlbSk7XG5cbiAgICAgIGlmIChsaXN0Lmxlbmd0aCA+IHNlcnZpY2UubWF4TGVuZ3RoKSB7XG4gICAgICAgIGxpc3Quc3BsaWNlKHNlcnZpY2UubWF4TGVuZ3RoLCBsaXN0Lmxlbmd0aCAtIHNlcnZpY2UubWF4TGVuZ3RoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRyb290U2NvcGUuJG9uKCdnYW1lOnJlbW92ZVBsYXllcicsIGZ1bmN0aW9uKGV2dCwgcGxheWVyRGF0YSkge1xuICB9KTtcblxuICBteVNvY2tldC50aGVuKGZ1bmN0aW9uKHNvY2tldCkge1xuICAgIC8vIE5ldyBwbGF5ZXIgam9pbmVkXG4gICAgc29ja2V0Lm9uKCduZXdQbGF5ZXInLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBhZGRUb0xpc3QoXCJqb2luXCIsIGRhdGEpO1xuICAgIH0pO1xuXG4gICAgLy8gUGxheWVyIHdhcyBoaXRcbiAgICBzb2NrZXQub24oJ3BsYXllckhpdCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGFkZFRvTGlzdChcInBsYXllckhpdFwiLCBkYXRhKTtcbiAgICB9KTtcblxuICB9KTtcblxufSk7XG4iLCJyZXF1aXJlKCcuL2lvTG9hZGVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID1cbmFuZ3VsYXIubW9kdWxlKCdhcHAubmV0d29yaycsIFtcbiAgJ2J0Zm9yZC5zb2NrZXQtaW8nLFxuICAnYXBwLmxvYWRlcidcbl0pXG4uY29uZmlnKGZ1bmN0aW9uKGlvTG9hZGVyUHJvdmlkZXIpIHtcbiAgY29uc29sZS5sb2coJ2lvTG9hZGVyJywgaW9Mb2FkZXJQcm92aWRlcik7XG59KVxuXG5yZXF1aXJlKCcuL3dzJyk7XG5yZXF1aXJlKCcuL3BsYXllcnMnKTtcbnJlcXVpcmUoJy4vZmVlZCcpOyIsIid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2FkZXInLCBbXSlcbi5wcm92aWRlcignaW9Mb2FkZXInLCBmdW5jdGlvbigpIHtcblxuICB0aGlzLnNjcmlwdFVybCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4rJy9zb2NrZXQuaW8vc29ja2V0LmlvLmpzJztcblxuICB0aGlzLiRnZXQgPSBbJyR3aW5kb3cnLCAnJGRvY3VtZW50JywgJyRxJywgZnVuY3Rpb24oJHdpbmRvdywgJGRvY3VtZW50LCAkcSkge1xuXG4gICAgdmFyIGRlZmVyID0gJHEuZGVmZXIoKSxcbiAgICAgIHNjcmlwdFVybCA9IHRoaXMuc2NyaXB0VXJsO1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgZG9uZTogZnVuY3Rpb24oKXtcblxuICAgICAgICB2YXIgb25TY3JpcHRMb2FkID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICByZXR1cm4gZGVmZXIucmVzb2x2ZSgkd2luZG93LmlvKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZigkd2luZG93LmlvKXtcbiAgICAgICAgICBvblNjcmlwdExvYWQoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgIHZhciBzY3JpcHRUYWcgPSAkZG9jdW1lbnRbMF0uY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgICAgICAgICBzY3JpcHRUYWcudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICAgICAgICAgIHNjcmlwdFRhZy5hc3luYyA9IHRydWU7XG4gICAgICAgICAgc2NyaXB0VGFnLnNyYyA9IHNjcmlwdFVybDtcbiAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgICBvblNjcmlwdExvYWQoKTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICBkZWZlci5yZWplY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSBvblNjcmlwdExvYWQ7XG4gICAgICAgICAgdmFyIHMgPSAkZG9jdW1lbnRbMF0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICAgICAgICBzLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbiAgICAgIH1cbiAgICB9O1xuICB9XTtcblxuICB0aGlzLnNldFNjcmlwdFVybCA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHRoaXMuc2NyaXB0VXJsID0gdXJsO1xuICB9O1xuXG5cbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5uZXR3b3JrJylcbi8vIFRoZSBwbGF5ZXIgbW9kZWxcbi8vIFdlJ2xsIHN0b3JlIHRoZSBwbGF5ZXIgYW5kIHRoZWlyIG5hbWVcbi5mYWN0b3J5KCdQbGF5ZXInLCBmdW5jdGlvbigpIHtcbiAgdmFyIFBsYXllciA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB0aGlzLmlkID0gZGF0YS5pZDtcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XG4gIH07XG5cbiAgcmV0dXJuIFBsYXllcjtcbn0pXG4vLyBUaGUgYHBsYXllcnNgIHNlcnZpY2UgaG9sZHMgYWxsIG9mIHRoZSBjdXJyZW50IHBsYXllcnNcbi8vIGZvciB0aGUgZ2FtZS4gV2UgdXNlIGl0IHRvIG1hbmFnZSBhbnkgcGxheWVyLXJlbGF0ZWQgZGF0YVxuLnNlcnZpY2UoJ3BsYXllcnMnLCBmdW5jdGlvbihteVNvY2tldCwgJHJvb3RTY29wZSwgUGxheWVyLCBSb29tKSB7XG4gIFxuICB2YXIgc2VydmljZSA9IHRoaXMsXG4gICAgICBsaXN0T2ZQbGF5ZXJzID0gW107XG5cbiAgdmFyIHBsYXllckJ5SWQgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBwbGF5ZXI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0T2ZQbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdE9mUGxheWVyc1tpXS5pZCA9PT0gaWQpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RPZlBsYXllcnNbaV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU29ja2V0IGxpc3RlbmVyc1xuICBteVNvY2tldC50aGVuKGZ1bmN0aW9uKHNvY2tldCkge1xuICAgIHNvY2tldC5vbignZ2FtZU92ZXInLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAkcm9vdFNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgbGlzdE9mUGxheWVycyA9IFtdO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oJ21hcDp1cGRhdGUnLCBmdW5jdGlvbihtYXApIHtcbiAgICAgIGNvbnNvbGUubG9nKCdwbGF5ZXJzIG1hcDp1cGRhdGUnLCBtYXApO1xuICAgIH0pXG4gIH0pO1xuXG4gIC8vIFNjb3BlIGxpc3RlbmVyc1xuICAkcm9vdFNjb3BlLiRvbignZ2FtZTpyZW1vdmVQbGF5ZXInLCBmdW5jdGlvbihldnQsIHBsYXllckRhdGEpIHtcbiAgICB2YXIgcGxheWVyID0gcGxheWVyQnlJZChwbGF5ZXJEYXRhLmlkKTtcbiAgICB2YXIgaWR4ID0gbGlzdE9mUGxheWVycy5pbmRleE9mKHBsYXllcik7XG5cbiAgICBjb25zb2xlLmxvZygnZ2FtZTpyZW1vdmVQbGF5ZXIgcGxheWVycyBwbGF5ZXInLCBwbGF5ZXJEYXRhLmlkLCBfLm1hcChsaXN0T2ZQbGF5ZXJzLCAnaWQnKSk7XG4gICAgbGlzdE9mUGxheWVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ25ld1BsYXllcnMnLCBsaXN0T2ZQbGF5ZXJzKTtcbiAgfSk7XG4gIC8vIERvIHdlIGhhdmUgYSBuZXcgcGxheWVyP1xuICAkcm9vdFNjb3BlLiRvbignZ2FtZTpuZXdQbGF5ZXInLCBmdW5jdGlvbihldnQsIHBsYXllckRhdGEpIHtcbiAgICB2YXIgcGxheWVyID0gbmV3IFBsYXllcihwbGF5ZXJEYXRhKTtcbiAgICBsaXN0T2ZQbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ25ld1BsYXllcnMnLCBsaXN0T2ZQbGF5ZXJzKTtcbiAgfSk7XG5cbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5uZXR3b3JrJylcbi5mYWN0b3J5KCdteVNvY2tldCcsIGZ1bmN0aW9uKGlvTG9hZGVyLCAkcSwgc29ja2V0RmFjdG9yeSwgVXNlcikge1xuXG4gIHZhciBteVNvY2tldCA9ICRxLmRlZmVyKCk7XG5cbiAgaW9Mb2FkZXIuZG9uZSgpLnRoZW4oZnVuY3Rpb24oaW8pIHtcbiAgICB2YXIgbXlJb1NvY2tldCA9IGlvLmNvbm5lY3Qod2luZG93LmxvY2F0aW9uLmhvc3RuYW1lK1wiOjgwMDBcIik7XG5cbiAgICB2YXIgYVNvY2sgPSBzb2NrZXRGYWN0b3J5KHtcbiAgICAgIGlvU29ja2V0OiBteUlvU29ja2V0XG4gICAgfSk7XG5cbiAgICBteVNvY2tldC5yZXNvbHZlKGFTb2NrKTtcbiAgfSk7XG5cbiAgcmV0dXJuIG15U29ja2V0LnByb21pc2U7XG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID1cbmFuZ3VsYXIubW9kdWxlKCdhcHAub3ZlcmxheScsIFtdKVxuLmRpcmVjdGl2ZSgnb3ZlcmxheUJhcicsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHRlbXBsYXRlVXJsOiAnL3NjcmlwdHMvb3ZlcmxheS9vdmVybGF5Lmh0bWwnLFxuICAgIGNvbnRyb2xsZXI6ICdPdmVybGF5Q29udHJvbGxlciBhcyBjdHJsJ1xuICB9XG59KVxuXG5yZXF1aXJlKCcuL292ZXJsYXlfY29udHJvbGxlci5qcycpOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAub3ZlcmxheScpXG4uY29udHJvbGxlcignT3ZlcmxheUNvbnRyb2xsZXInLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsIHBsYXllcnMsIGZlZWQpIHtcbiAgdmFyIGN0cmwgPSB0aGlzO1xuXG4gIGN0cmwudHVybk9mZk11c2ljID0gZnVuY3Rpb24oKSB7XG4gICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdnYW1lOnRvZ2dsZU11c2ljJyk7XG4gIH07XG5cbiAgY3RybC50aXRsZSA9IFwiRmVlZFwiO1xuXG4gIGN0cmwuZmVlZCA9IGZlZWQubGlzdDtcbiAgY3RybC5mZWVkTGltaXQgPSAxMDtcblxuICAkc2NvcGUuJG9uKCduZXdQbGF5ZXJzJywgZnVuY3Rpb24oZXZ0LCBwbGF5ZXJzKSB7XG4gICAgJHNjb3BlLnBsYXllcnMgPSBwbGF5ZXJzO1xuICB9KTtcblxufSkiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnVzZXInKVxuLnNlcnZpY2UoJ0dhbWUnLCBmdW5jdGlvbigpIHtcblxuICB0aGlzLnBsYXlpbmcgPSBmYWxzZTtcblxufSk7IiwibW9kdWxlLmV4cG9ydHMgPVxuYW5ndWxhci5tb2R1bGUoJ2FwcC51c2VyJywgW10pXG5cbnJlcXVpcmUoJy4vdXNlcl9zZXJ2aWNlJyk7XG5yZXF1aXJlKCcuL3Jvb21fc2VydmljZScpO1xucmVxdWlyZSgnLi9nYW1lX3NlcnZpY2UnKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnVzZXInKVxuLnNlcnZpY2UoJ1Jvb20nLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkcSwgbXlTb2NrZXQpIHtcbiAgdmFyIHNlcnZpY2UgPSB0aGlzO1xuICB2YXIgY3VycmVudFJvb21zID0gW10sXG4gICAgICBjdXJyZW50Um9vbUNvdW50ID0gMDtcblxuICB0aGlzLnF1ZXJ5Rm9yUm9vbXMgPSBmdW5jdGlvbigpIHtcbiAgICBteVNvY2tldC50aGVuKGZ1bmN0aW9uKHNvY2tldCkge1xuICAgICAgc29ja2V0LmVtaXQoJ2dldE1hcHMnKTtcbiAgICB9KTtcbiAgfTtcblxuICBteVNvY2tldC50aGVuKGZ1bmN0aW9uKHNvY2tldCkge1xuICAgIHNvY2tldC5vbignZ2V0QWxsTWFwcycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGN1cnJlbnRSb29tcyA9IGRhdGE7XG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ21hcDp1cGRhdGUnKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbignZ2xvYmFsOm5ld1BsYXllcicsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBtYXBJZCA9IGRhdGEubWFwLFxuICAgICAgICAgIG1hcCAgID0gZ2V0Um9vbUJ5SWQobWFwSWQpO1xuXG4gICAgICBpZiAobWFwKSB7XG4gICAgICAgIG1hcC5wbGF5ZXJzLnB1c2goZGF0YS5wbGF5ZXIpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKCduZXdNYXBDcmVhdGVkJywgZnVuY3Rpb24obmV3TWFwKSB7XG4gICAgICBjdXJyZW50Um9vbXMucHVzaChuZXdNYXApO1xuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdtYXA6dXBkYXRlJywgbmV3TWFwKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbignZ2FtZU92ZXInLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgbWFwSWQgPSBkYXRhLm1hcElkLFxuICAgICAgICAgIG1hcCAgID0gZ2V0Um9vbUJ5SWQobWFwSWQpO1xuXG4gICAgICBjb25zb2xlLmxvZygnZ2FtZU92ZXInLCBkYXRhLCBtYXApO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKCdnbG9iYWw6cGxheWVyTGVmdE1hcCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBtYXBJZCA9IGRhdGEubWFwSWQsXG4gICAgICAgICAgbWFwICAgPSBnZXRSb29tQnlJZChtYXBJZCk7XG5cbiAgICAgIGlmIChtYXApIHtcbiAgICAgICAgdmFyIGlkeCA9IGdldFBsYXllckluZGV4QnlJZChkYXRhLmlkLCBtYXApO1xuICAgICAgICBtYXAucGxheWVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIH1cbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnbWFwOnVwZGF0ZScsIG1hcCk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oJ2dsb2JhbDpyZW1vdmVNYXAnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgbWFwSWQgPSBkYXRhLm1hcElkLFxuICAgICAgICAgIG1hcCAgID0gZ2V0Um9vbUJ5SWQobWFwSWQpO1xuXG4gICAgICBpZiAobWFwKSB7XG4gICAgICAgIHNlcnZpY2UucXVlcnlGb3JSb29tcygpO1xuICAgICAgfVxuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdtYXA6dXBkYXRlJywgbWFwKTtcbiAgICB9KTtcblxuICB9KTtcblxuICB0aGlzLmdldFJvb21zID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGN1cnJlbnRSb29tcztcbiAgfTtcblxuICB0aGlzLmdldFJvb20gPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiBnZXRSb29tQnlJZChpZCk7XG4gIH07XG5cbiAgdmFyIGdldFJvb21CeUlkID0gZnVuY3Rpb24oaWQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1cnJlbnRSb29tcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGN1cnJlbnRSb29tc1tpXS5pZCA9PT0gaWQpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRSb29tc1tpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIHZhciBnZXRQbGF5ZXJJbmRleEJ5SWQgPSBmdW5jdGlvbihpZCwgbWFwKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXAucGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBsYXllciA9IG1hcC5wbGF5ZXJzW2ldO1xuICAgICAgaWYgKHBsYXllci5pZCA9PT0gaWQpIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnVzZXInKVxuLnNlcnZpY2UoJ1VzZXInLCBmdW5jdGlvbigpIHtcblxuICB2YXIgY3VycmVudFVzZXIgPVxuICAgIGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdjdXJyZW50VXNlcicpO1xuXG4gIGlmIChjdXJyZW50VXNlcikge1xuICAgIGN1cnJlbnRVc2VyID0gSlNPTi5wYXJzZShjdXJyZW50VXNlcik7XG4gIH07XG5cbiAgdGhpcy5zZXRDdXJyZW50VXNlciA9IGZ1bmN0aW9uKHUpIHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY3VycmVudFVzZXInLCBKU09OLnN0cmluZ2lmeSh1KSk7XG4gICAgY3VycmVudFVzZXIgPSB1O1xuICB9O1xuXG4gIHRoaXMuZ2V0Q3VycmVudFVzZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gY3VycmVudFVzZXI7XG4gIH07XG5cbiAgdGhpcy5tb2RpZnlDdXJyZW50VXNlciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICB2YXIgdSA9IHRoaXMuZ2V0Q3VycmVudFVzZXIoKTtcblxuICAgIGlmICh1KSB7XG4gICAgICBmb3IgKHZhciBvcHQgaW4gb3B0cykge1xuICAgICAgICB1W29wdF0gPSBvcHRzW29wdF07XG4gICAgICB9XG4gICAgICB0aGlzLnNldEN1cnJlbnRVc2VyKHUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldEN1cnJlbnRVc2VyKG9wdHMpO1xuICAgIH1cblxuICAgIHJldHVybiBjdXJyZW50VXNlcjtcbiAgfTtcblxufSk7Il19
