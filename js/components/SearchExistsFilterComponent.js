angular.module('chronontology.components')
    .component('searchExistsFilter',{
        templateUrl: '../../partials/search/exists-filter.html',
        bindings:
        {
            field: '<',
            query: '<'
        },
        controller: function() {
            this.initExistsArray = function() {
                var exists = angular.copy(this.query.exists);
                if (typeof exists === 'string') exists = [exists];
                if (Array.isArray(exists)) return exists;
                return [];
            }

            this.buildExistsQuery = function(exists) {
                if (exists.length == 0) return "";
                else return "&exists=" + exists.join("&exists=");
            }

            this.getExistsValues = function(){
                return this.buildExistsQuery(this.initExistsArray());
            }

            this.getExistsValuesExcept = function(field){
                var exists = this.initExistsArray();
                var index = exists.indexOf(field);
                if (index > -1)
                    exists.splice(index, 1);
                return this.buildExistsQuery(exists);
            }

            this.isExistsFieldSelected = function(field){
                var exists = this.initExistsArray();
                return exists.indexOf(field) > -1;
            }

            this.addOrRemoveExistsField = function(field){
                if (this.isExistsFieldSelected(field)) {
                    return this.getExistsValuesExcept(field);
                } else {
                    return this.getExistsValues()+"&exists="+field;
                }
            }
        }
    });
