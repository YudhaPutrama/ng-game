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