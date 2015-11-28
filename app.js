'use strict';

angular.module('pouchapp', ['ui.router'])

    .run(function(pouchDbSrvc) {
		pouchDbSrvc.setDatabase('colin-test');
		pouchDbSrvc.sync('http://localhost:4984/default');
    })

    .config(function($stateProvider, $urlRouterProvider) {
      $stateProvider
          .state('list', {
            url: '/',
            templateUrl: 'views/list.template.html',
            controller: 'MainController',
            cache: false
          })
          .state('item', {
            url: '/:id/:rev',
            templateUrl: 'views/item.template.html',
            controller: 'MainController',
            cache: false
          });
      $urlRouterProvider.otherwise('/');
    })

    .controller('MainController', function($scope, $rootScope, $state, $stateParams, pouchDbSrvc) {
		// set the scope.items to an empty object
		$scope.items = {};

		// start listening for changes in the DB
		pouchDbSrvc.startListening();

		// add the rootScope listener for changes sent by the service
		$rootScope.$on('pouchDbSrvc:change', function(e, data) {
			$scope.items[data.doc._id] = data.doc;
			$scope.$apply();
		});

		// add the rootScope listener for delete calls sent by the service
		$rootScope.$on('pouchDbSrvc:delete', function(e, data) {
			delete $scope.items[data.doc._id];
			$scope.$apply();
		});

		if($stateParams.id) {
			pouchDbSrvc.get($stateParams.id).then(function(res) {
				$scope.inputForm = res;
			}, function(err) {
				console.log(err);
			});
		}

		$scope.save = function(firstname, lastname, email) {
			var jsonObj = {
				firstname: firstname,
				lastname: lastname,
				email: email
			};
			if($stateParams.id) {
				jsonObj._id = $stateParams.id;
				jsonObj._rev = $stateParams.rev;
			}
			pouchDbSrvc.save(jsonObj).then(function() {
				$state.go('list');
			}, function(err) {
				console.log(err);
			});
		};
		
		$scope.delete = function(id, rev) {
			pouchDbSrvc.delete(id, rev);
		};
    })

    .service('pouchDbSrvc', function($rootScope, $q) {

		var database,
			changeListener;

		return {
			setDatabase: function(dbName) {
				database = new PouchDB(dbName);
			},
			startListening: function() {
				changeListener = database.changes({
					live: true,
					include_docs: true
				}).on('change', function(change) {
					if(!change.deleted) {
						$rootScope.$broadcast('pouchDbSrvc:change', change);
					} else {
						$rootScope.$broadcast('pouchDbSrvc:delete', change);
					}
				});
			},
			stopListening: function () {
				changeListener.cancel();
			},
			sync: function(remoteDatabase) {
				database.sync(remoteDatabase, {live: true, retry: true});
			},
			save: function(jsonObj) {
				var deferred = $q.defer();
				if(!jsonObj._id) {
					database.post(jsonObj).then(function(res) {
						deferred.resolve(res);
					}).catch(function(err) {
						deferred.reject(err);
					});
				} else {
					database.put(jsonObj).then(function(res) {
						deferred.resolve(res);
					}).catch(function(err) {
						deferred.reject(err);
					});
				}
				return deferred.promise;
			},
			delete: function(id, revision) {
				return database.remove(id, revision);
			},
			get: function(id) {
				return database.get(id);
			},
			destroy: function() {
				database.destroy();
			}
		}
	});