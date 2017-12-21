function PeriodInfoController($http) {

    var ctrl = this;

    this.$onInit = function() {

        $http.get('/data/period/' + ctrl.id).then(function(result) {
            ctrl.period = result.data.resource;
        });
    }
}

(function(module) {
    try {
      module = angular.module('chronontology.widgets.period-info');
    } catch (e) {
      module = angular.module('chronontology.widgets.period-info', []);
    }

    module.component('periodInfo',{
        templateUrl: 'widgets/period-info/PeriodInfo.html',
        bindings:
        {
            id: '@'
        },
        controller: PeriodInfoController
    });

})();

// As the widget is inteded to be used as a stand-alone application
// bootstrapping has to be done manually here instead of using 'ng-app'
var periodInfoWidgets = document.getElementsByTagName('period-info');
for (var i=0; i < periodInfoWidgets.length; i++) {
    angular.bootstrap(periodInfoWidgets[i], ['chronontology.widgets.period-info']);
}
