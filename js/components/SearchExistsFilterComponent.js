angular.module('chronontology.components')
    .component('searchExistsFilter',{
        templateUrl: '../../partials/search/exists-filter.html',
        bindings:
        {
            field: '<',
            query: '<'
        },
        controller: function() {

            this.isExistsFieldSelected = function(field) {
                if (!this.query.exists) return false;
                return this.query.exists.indexOf(field) > -1;
            }

            this.addOrRemoveExistsField = function(field){
                if (this.isExistsFieldSelected(field)) {
                    return this.query.removeExists(field).toFrontendUri();
                } else {
                    return this.query.addExists(field).toFrontendUri();
                }
            }

        }
    });
