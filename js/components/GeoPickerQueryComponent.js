angular.module('chronontology.components')
.controller('GeoPickerQueryModalController', function($uibModalInstance, $scope) {

    var _this = this;

    $scope.view = 'list';
    $scope.gazetteerType = 'dai';

    this.setView = function(view) {
        $scope.view = view;
    }

    this.loadTable = function() {
        $scope.datasource = "/spi/place"
         + "?q=" + $scope.query + "&type=" + $scope.gazetteerType;
    };

    this.selectPlace = function(place) {
        $uibModalInstance.close(place);
    };

});

function GeoPickerQueryController($http, $uibModal) {

    var _this = this;

    this.openModal = function() {
        var modal = $uibModal.open({
			templateUrl: "geopickerquery_modal.html",
			controller: "GeoPickerQueryModalController",
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
    .component('geopickerquery',{
        templateUrl: '../../partials/components/geo/pickerQuery.html',
        bindings: {
            onPlaceSelected: '&'
        },
        controller: GeoPickerQueryController
    });
