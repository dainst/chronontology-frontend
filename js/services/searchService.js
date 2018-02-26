'use strict';

var SearchService = function($http, $q) {

	this.search = function(query) {

		var deferred = $q.defer();

		var uri = '/data/period/' + query.toBackendUri();
		$http.get(uri).then(
			function success(result) {
				deferred.resolve(result.data);
			},
			function error(err) {
				console.warn(err);
				deferred.reject();
			}
		);

		return deferred.promise;
	}

}

angular.module('chronontology.services').service('searchService',
	["$http", "$q", SearchService]);
