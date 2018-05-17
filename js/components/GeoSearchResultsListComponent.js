function GeoSearchResultsListController($scope, $location, $routeParams, $http, $sce, chronontologySettings, $filter) {

    var _this = this;

    _this.loading = false;
    _this.showLevenshtein = false;
    _this.results = [];
    _this.empty = true;

    new Tablesort(document.getElementById('searchresultlist'));

    _this.$onChanges = function() {
        this.loadData();
    };

    _this.loadData = function() {
        _this.loading = true;
        _this.results = [];
        _this.empty = true;

        $http.get(_this.datasource, {
                headers: { 'Authorization': undefined }
        }).then(function success(geojson){
            _this.loading = false;
            if (geojson.data.geometry && geojson.data.geometry.type) {
                _this.results = [geojson.data];
                _this.empty = false;
            } else if (geojson.data.features && geojson.data.features.length > 1) {
                _this.results = geojson.data.features;
                _this.empty = false;
            }
            if (geojson.data.metadata && geojson.data.metadata.searchstring) {
                _this.showLevenshtein = true;
            } else {
                _this.showLevenshtein = false;
            }
        }, function error(err) {
            console.warn(err) // TODO show error message
        });
    };

    _this.selectPlace = function(place) {
        _this.onPlaceSelected({place: place});
    }

}

angular.module('chronontology.components')
    .component('geosearchresultslist',{
        templateUrl: '../../partials/components/geo/searchResultsList.html',
        bindings: {
            datasource: '@datasource',
            onPlaceSelected: '&'
        },
        controller: GeoSearchResultsListController
    });
