'use strict';

angular.module('chronontology.controllers')

.controller("TimelineController", function($scope, $location, searchService, Query, chronontologySettings, messageService) {

	var MAX_RESULTS = 1000;

	var relevantParts =
		'resource.id,resource.names,resource.hasTimespan,'+
		'resource.relations.isPartOf,resource.relations.hasPart,'+
		'resource.relations.follows,resource.relations.isFollowedBy';

    $scope.existsList = chronontologySettings.existsList;
    $scope.facetList = chronontologySettings.facetList;

	$scope.query = Query.fromSearch($location.search())
		.setSize(MAX_RESULTS)
		.setParts(relevantParts);

    searchService.search($scope.query).then(function(result){
        $scope.periods = result.results;
        $scope.total = result.total;
        $scope.facets = result.facets;

		if ($scope.total > MAX_RESULTS) {
			messageService.add("ui_timeline_greater_than_max", "info", false);
		}

    });
})
