angular.module('chronontology.components')
.controller('GeoPickerResourceModalController', function($uibModalInstance, $scope) {

        var _this = this;

        $scope.view = 'list';
        $scope.gazetteerType = 'dai';

        this.setView = function(view) {
            $scope.view = view;
        }

        this.loadTable = function() {
            $scope.datasource = "/spi/place/"
             + $scope.gazetteerType + "/" + $scope.gazetteerId;
        };

        this.selectPlace = function(place) {
            $uibModalInstance.close(place);
        };

});

function GeoPickerResourceController($http, $uibModal) {

    var _this = this;

    _this.openModal = function() {
        var modal = $uibModal.open({
			templateUrl: "geopickerResource_modal.html",
			controller: "GeoPickerResourceModalController",
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
    .component('geopickerresource',{
        templateUrl: '../../partials/components/geo/pickerResource.html',
        bindings: {
            onPlaceSelected: '&'
        },
        controller: GeoPickerResourceController
    });
