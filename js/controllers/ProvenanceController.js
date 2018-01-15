'use strict';

angular.module('chronontology.controllers')

.controller("ProvenanceController", function($scope, $routeParams, $http) {

	var relevantParts =
		'resource.id,resource.names,resource.hasTimespan,'+
		'resource.relations.isPartOf,resource.relations.hasPart,'+
		'resource.relations.follows,resource.relations.isFollowedBy';

	$http.get('/data/period/?size=10000&q=resource.provenance:' + $routeParams.provenance + '&part='+relevantParts).then(
		function success(result) {
			$scope.periods = result.data.results;
		}
	);
})
