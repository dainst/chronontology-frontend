angular.module('chronontology.components')
    .component('searchFilter',{
        templateUrl: '../../partials/components/search/filter.html',
        bindings:
        {
            facette: '<',
            facets: '<',
            query: '<'
        },
        controller: function() {

            this.isFacetValueSelected = function(facette, facetvalue){
                if (!this.query.fq) return false;
                return this.query.fq.filter(function(param) {
                    return param.key == facette && param.value == facetvalue;
                }).length > 0;
            }
            this.addResource = function(text){
                return "resource." + text;
            }

            this.addOrRemoveFacetValue = function(facette, facetvalue){
                if (this.isFacetValueSelected(facette, facetvalue)) {
                    return this.query.removeFq(facette, facetvalue).toFrontendUri();
                } else {
                    return this.query.addFq(facette, facetvalue).toFrontendUri();
                }
            }

        }
    });
