'use strict';

angular.module('chronontology.controllers')

.controller("SearchController", function($scope, $location, searchService, chronontologySettings, Query) {

    $scope.query = Query.fromSearch($location.search());

    searchService.search($scope.query).then(function(result){
        $scope.periods = result.results;
        $scope.total = result.total;
        $scope.facets = result.facets;
    });

    $scope.existsList = chronontologySettings.existsList;
    $scope.facetList = chronontologySettings.facetList;
    $scope.regionFacetList = chronontologySettings.regionFacetList;

    $scope.getPrevious = function(){
        return $scope.query.from - $scope.query.size;
    }
    $scope.getNext = function(){
        return parseInt($scope.query.from) + parseInt($scope.query.size);
    }

    $scope.getCurrentPage = function(){
        return $scope.query.from / $scope.query.size + 1;
    }
    $scope.getTotalPages = function(){
        return Math.ceil($scope.total / $scope.query.size);
    }

})
