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