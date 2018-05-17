angular.module('chronontology.components')
.controller('GeoPickerMapModalController', function($uibModalInstance, $scope) {

    var _this = this;

    $scope.view = 'map';
    $scope.gazetteerType = 'getty';

    this.setView = function(view) {
        $scope.view = view;
    }

    this.loadEmptyMap = function() {
        if ($scope.view === 'map') {
            $scope.datasource = $scope.gazetteerType;
        } else {
            console.log(_this.latlng);
            $scope.datasource = "/spi/place?bbox=50.082665;8.161050;50.082665;8.371850;49.903887;8.161050;49.903887;8.371850&type=getty";
        }
        console.log("GeoPickerMapModalController",$scope.datasource);
    };

    this.selectPlace = function(place) {
        $uibModalInstance.close(place);
    };

});

function GeoPickerMapController($http, $uibModal) {

    var _this = this;

    this.openModal = function() {
        var modal = $uibModal.open({
			templateUrl: "geopickerMap_modal.html",
			controller: "GeoPickerMapModalController",
			bindToController: true,
			size: 'lg',
            controllerAs: '$ctrl'
		});
        modal.result.then(function(place) {
            _this.selectedItem = place;
            _this.onPlaceSelected({place: place});
		});
    }

    _this.deselectPlace = function() {
        _this.selectedItem = undefined;
        _this.onPlaceSelected({place: undefined});
    };

}

angular.module('chronontology.components')
    .component('geopickermap',{
        templateUrl: '../../partials/components/geo/pickerMap.html',
        bindings: {
            onPlaceSelected: '&',
            latlng: '&'
        },
        controller: GeoPickerMapController
    });
