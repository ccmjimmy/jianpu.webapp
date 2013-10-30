'use strict';

angular.module('jianpuApp')
  // .controller('MainCtrl', function ($scope) {
  //   $scope.awesomeThings = [
  //     'HTML5 Boilerplate',
  //     'AngularJS',
  //     'Karma'
  //   ];
  // })
  .controller('NavbarCtrl', function ($scope, $location) {
    $scope.isActive = function (path) {
      return $location.path() === path;
    };
  });
