angular.module('chronontology.components')
    .component('periodInformation',{
        templateUrl: '../../partials/components/period/information.html',
        bindings:
        {
            period: '<',
            internalRelationTypes: '<',
            allenRelationTypes: '<',
            gazetteerRelationTypes: '<',
            document: '<',
            resourceCache: '<'
        },
        controller: function (authService, chronontologySettings) {

            this.authService = authService;

            this.hasRelationsInResource = function(period){
                return period.hasOwnProperty('relations');
            }
            this.hasRelationsInDerived = function(document){
                return (document.hasOwnProperty('derived') &&
                        document.derived.hasOwnProperty('relations'));
            }
            this.hasGazetteerRelationsInDerived = function(document){
                if (!document.hasOwnProperty('derived')) {
                    return false;
                }
                for (var i in chronontologySettings.gazetteerRelationTypes) {
                    var currentType = chronontologySettings.gazetteerRelationTypes[i];
                    if (document.hasOwnProperty(currentType)) {
                        return true;
                    }
                }
                return false;
            }
            this.hasTimespanInDerived = function(document){
                return (document.hasOwnProperty('derived') &&
                        document.derived.hasOwnProperty('hasTimespan'));
            }
            this.hasDerivedInformation = function(document){
                return (this.hasGazetteerRelationsInDerived(document) ||
                        this.hasTimespanInDerived(document) ||
                        this.hasRelationsInDerived(document));
            }
        }
    });
