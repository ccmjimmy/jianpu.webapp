'use strict';

angular.module('jianpuApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/toyRoom', {
        templateUrl: 'views/toy-room.html',
        controller: 'ToyRoomCtrl'
      })
      .when('/studio', {
        templateUrl: 'views/studio.html',
        controller: 'StudioCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html'
      })
      .otherwise({
        redirectTo: '/about'
      });
  });
