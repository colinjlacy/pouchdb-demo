'use strict';

angular.module("pouchapp", ["ui.router"])

    .run(function(pouchDbSrvc) {

    })

    .config(function($stateProvider, $urlRouterProvider) {
      $stateProvider
          .state('list', {
            url: '/',
            templateUrl: 'app/views/list.template.html',
            controller: 'MainController',
            cache: false
          })
          .state('item', {
            url: '/:id',
            templateUrl: 'app/views/item.template.html',
            controller: 'MainController',
            cache: false
          });
      $urlRouterProvider.otherwise('/');
    })

    .controller("MainController", function($scope, $rootScope, $state, $stateParams, pouchDbSrvc) {

    });