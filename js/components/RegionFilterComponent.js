angular.module('chronontology.components')
    .component('regionFilter',{
        templateUrl: '../../partials/components/search/region-filter.html',
        bindings:
        {
            facets: '<',
            query: '<',
            route: '@'
        },
        controller: function($http, language) {

            if(!this.route) this.route = "search";

            this.facet = "regions.en";
            if (language.currentLanguage()==COMPONENTS_GERMAN_LANG)
                this.facet = "regions.de"

            this.isFacetValueSelected = function(facetvalue){
                var facet = this.facet;
                if (!this.query.fq) return false;
                return this.query.fq.filter(function(param) {
                    return param.key == facet && param.value == facetvalue;
                }).length > 0;
            }

            this.addOrRemoveFacetValue = function(facetvalue){
                if (this.isFacetValueSelected(facetvalue)) {
                    return this.query.removeFq(this.facet, facetvalue).toFrontendUri();
                } else {
                    return this.query.addFq(this.facet, facetvalue).toFrontendUri();
                }
            }

        }
    });
