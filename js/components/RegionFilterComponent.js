angular.module('chronontology.components')
    .component('regionFilter',{
        templateUrl: '../../partials/components/search/region-filter.html',
        bindings:
        {
            facet: '<',
            facets: '<',
            query: '<',
            route: '@'
        },
        controller: function($http) {

            this.placeNames = {};

            if(!this.route) this.route = "search";

            this.isFacetValueSelected = function(facet, facetvalue){
                if (!this.query.fq) return false;
                return this.query.fq.filter(function(param) {
                    return param.key == facet && param.value == facetvalue;
                }).length > 0;
            }
            this.addResource = function(text){
                return "resource." + text;
            }

            this.addOrRemoveFacetValue = function(facet, facetvalue){
                if (this.isFacetValueSelected(facet, facetvalue)) {
                    return this.query.removeFq(facet, facetvalue).toFrontendUri();
                } else {
                    return this.query.addFq(facet, facetvalue).toFrontendUri();
                }
            }

            this.getPlaceName = function(uri) {
                var split = uri.split('/');
                return split[split.length-1];
            }

        }
    });
