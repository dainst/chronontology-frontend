'use strict';

angular.module('chronontology.controllers')

.controller("HomepageController", function($scope, language) {

    $scope.language = language.currentLanguage();

});
