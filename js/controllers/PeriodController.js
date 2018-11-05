'use strict';

angular.module('chronontology.controllers')

    .controller("PeriodController", function ($scope, $location, $routeParams, $http, $sce, chronontologySettings,
                                              authService, gazetteerDataService, timelineDataService) {

      // possible relations
      // (labels are now in transl8 keys "relation_isSenseOf" etc.)
      $scope.internalRelationTypes = chronontologySettings.internalRelationTypes;
      $scope.allenRelationTypes = chronontologySettings.allenRelationTypes;
      $scope.combinedRelationTypes =
          chronontologySettings.internalRelationTypes
              .concat(chronontologySettings.allenRelationTypes);

      $scope.gazetteerRelationTypes = chronontologySettings.gazetteerRelationTypes;
      $scope.authService = authService;
      $scope.resourceCache = {};

      $scope.setupCreateMode = function () {
      };

      $scope.setupViewMode = function () {
        var relevantParts =
            'resource.id,resource.names,resource.hasTimespan,' +
            'resource.relations.isPartOf,resource.relations.hasPart,' +
            'resource.relations.follows,resource.relations.isFollowedBy';

        $http.get('/data/period/' + $routeParams.id)
            .then(function success(result) {
              $scope.viewMode = 'display_and_edit';
              $scope.activeTab = 'info';
              $scope.document = result.data;
              $scope.period = result.data.resource;
              $scope.hasValidTimespan = timelineDataService.validatePeriod($scope.document);

              $scope.updateCache();

              var geoFrameUrl = chronontologySettings.geoFrameBaseUri + "?uri=" + chronontologySettings.baseUri;
              $scope.geoFrameUrl = $sce.trustAsResourceUrl(geoFrameUrl + "/period/" + result.data.resource.id);

              $http.get('/data/period/?size=10000&q=resource.provenance:' + $scope.period.provenance + '&part=' + relevantParts).then(
                  function success(response) {
                    $scope.provenancePeriods = response.data.results;
                  }, function error(response) {
                    console.dir(response);
                  }
              );
            }, function error(response) {
              if(response.status === 404){
                $location.path('/404');
              }
            });
      };

      if ($routeParams.id === 'create') {
        console.log("Setting mode to create.");
        if($scope.authService.getUser() === undefined){
          $scope.viewMode = 'please_login';
        }
        else {
          $scope.viewMode = 'create';
          $scope.setupCreateMode();
        }
      }
      else {
        console.log("Loading & showing view.");
        $scope.viewMode = 'loading';
        $scope.setupViewMode();
      }

      $scope.updateCache = function () {
        $scope.updateCachedPeriods();
        $scope.updateCachedLocations();
      };

      $scope.updateCachedPeriods = function () {
        if (!$scope.period.relations) return;

        for (var i in $scope.combinedRelationTypes) {
          var currentType = $scope.combinedRelationTypes[i];

          // Check cache for periods.
          if (currentType in $scope.period.relations
              && $scope.period.relations[currentType].constructor === Array) { // hack "includes" key is present in every generic javascript object
            $scope.period.relations[currentType].forEach(function (periodId) {
              if (!(periodId in $scope.resourceCache)) {
                if ($scope.document.related && periodId in $scope.document.related) {
                  $scope.resourceCache[periodId] = $scope.document.related[periodId];
                }
                else {
                  (function (periodId) {
                    console.log("Relation " + periodId + " not appended to document, retrieving...");
                    $http.get('/data/period/' + periodId).then(
                        function success(result) {
                          $scope.resourceCache[periodId] = result.data.resource;
                        })
                  })(periodId)
                }
              }
            });
          }

          // Check cache for derived periods.
          if ($scope.document.derived && $scope.document.derived.relations && currentType in $scope.document.derived.relations) {
            $scope.document.derived.relations[currentType].forEach(function (periodId) {
              if (!(periodId in $scope.resourceCache)) {
                if ($scope.document.related && periodId in $scope.document.related) {
                  $scope.resourceCache[periodId] = $scope.document.related[periodId];
                }
                else {
                  (function (periodId) {
                    console.log("Derived relation " + periodId + " not appended to document, retrieving...");
                    $http.get('/data/period/' + periodId).then(function success(result) {
                      $scope.resourceCache[periodId] = result.data.resource;
                    })
                  })(periodId)
                }
              }
            })
          }
        }
      };

      $scope.updateCachedLocations = function () {
        for (var i in $scope.gazetteerRelationTypes) {
          var currentType = $scope.gazetteerRelationTypes[i];

          // Check cache for locations.
          if (currentType in $scope.period) {
            $scope.period[currentType].forEach(function (gazetteerUri) {
              if (!(gazetteerUri in $scope.resourceCache)) {
                if ($scope.document.related && gazetteerUri in $scope.document.related) {
                  $scope.resourceCache[gazetteerUri] = $scope.document.related[gazetteerUri];
                }
                else {
                  (function (gazetteerUri) {
                    console.log("Relation " + gazetteerUri + " not appended to document, retrieving...");
                    gazetteerDataService.getByUri(gazetteerUri, function (result) {
                      $scope.resourceCache[gazetteerUri] = {
                        'prefName': result['prefName']
                      };
                    })
                  })(gazetteerUri)
                }
              }
            })
          }

          // Check cache for derived locations.
          if ($scope.document.derived && currentType in $scope.document.derived) {
            $scope.document.derived[currentType].forEach(function (gazetteerUri) {
              if (!(gazetteerUri in $scope.resourceCache)) {
                if ($scope.document.related && gazetteerUri in $scope.document.related) {
                  $scope.resourceCache[gazetteerUri] = $scope.document.related[gazetteerUri];
                }
                else {
                  (function (gazetteerUri) {
                    console.log("Derived relation " + gazetteerUri + " not appended to document, retrieving...");
                    gazetteerDataService.getByUri(gazetteerUri, function (result) {
                      $scope.resourceCache[gazetteerUri] = {
                        'prefName': result['prefName']
                      };
                    })
                  })(gazetteerUri)
                }
              }
            })
          }
        }
      };

      $scope.exportJSON = function () {
        var JSONexport = angular.toJson($scope.document, true);
        var blob = new Blob([JSONexport], {type: "text/plain;charset=utf-8"});
        saveAs(blob, 'period-' + $scope.period.id + ".json");
      };

      $scope.saveUpdatedPeriod = function (period) {

        console.log("Saving new period.");
        console.dir(period);

        $scope.period = angular.copy(period);
        $scope.document.resource = $scope.period;
        $http.put("/data/period/" + $scope.period.id, JSON.stringify($scope.document))
            .then(
                function success(data) {
                  console.log("success");
                  console.dir(data.data);

                  $scope.activeTab = 'info';
                },
                function error(data) {
                  console.log("error");
                  console.dir(data);
                }
            );
      };

      $scope.saveCreatedPeriod = function (period) {

        console.log("Saving new period.");
        console.dir(period);

        $scope.period = angular.copy(period);
        $scope.document = {};
        $scope.document.resource = $scope.period;

        $http.post("/data/period/", JSON.stringify($scope.document))
            .then(
                function success(data) {
                  console.log("success");
                  console.dir(data.data);

                  $location.path('/period/' + data.data.resource.id)
                },
                function error(data) {
                  console.log("error");
                  console.dir(data);
                }
            );
      };
    });
