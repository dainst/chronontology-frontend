'use strict';

angular.module('chronontology.controllers')
.controller('PageController', ['$scope', '$routeParams', '$http', '$location', 'localizedContent', '$timeout', '$templateCache',
    function ($scope, $routeParams, $http, $location, localizedContent, $timeout, $templateCache) {

        $scope.$on("$includeContentError", function (event, templateName) {
            $location.path('/404');
        });

        var CONTENT_URL = '{LOCATION}/{LANG}/{NAME}.html';
        var CONTENT_TOC = '{LOCATION}/content.json';

        var contentDir = 'info';

        var content_url = $scope.curl = CONTENT_URL.replace('{NAME}', $routeParams.page).replace('{LOCATION}', contentDir);

        if ($location.search()['lang'] != undefined) {

            $scope.templateUrl = content_url.replace('{LANG}', $location.search()['lang']);

            // Ensure that images are loaded correctly
            $templateCache.remove($scope.templateUrl);

        } else {

            $http.get(CONTENT_TOC.replace('{LOCATION}', contentDir))

                .then(function (result) {

                    var data = result.data;
                    var lang = localizedContent.determineLanguage(data, $routeParams.page);

                    $scope.templateUrl = content_url.replace('{LANG}', lang);

                    // Ensure that images are loaded correctly
                    $templateCache.remove($scope.templateUrl);

                    if ($routeParams.id) $timeout(function () {
                        var element = document.getElementById($routeParams.id);
                        element.scrollIntoView();
                        var clickEvent = new MouseEvent("click", {
                            bubbles: false,
                            cancelable: true,
                            view: window
                        });
                        var link = element.parentElement.parentElement;
                        link.dispatchEvent(clickEvent);
                    }, 500);
                }).catch(function (error) {
                    console.log(error);
                });
        }
    }]);
