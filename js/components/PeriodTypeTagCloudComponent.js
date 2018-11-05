angular.module('chronontology.components')
    .component('periodTypeTagCloud',{
        templateUrl: '../../partials/components/period/type-tag-cloud.html',
        controller: function ($http, $filter) {

            this.normalizeWeight = function(count) {
                return Math.log10(count);
            }

            this.tags = [];
            var ctrl = this;

            var uri = "/data/period/?size=0&facet=resource.types";
            $http.get(uri).then(
    			function success(result) {
                    var tags = [];
    				result.data.facets['resource.types'].buckets.forEach(function(bucket) {
                        tags.push({
                            text: $filter('transl8')("value_types_" + bucket.key),
                            weight: ctrl.normalizeWeight(bucket.doc_count),
                            link: "/search?q=&fq=types:\"" + bucket.key + "\""
                        });
                    });
                    ctrl.tags = tags;
    			},
    			function error(err) {
    				console.warn(err);
    			}
    		);

        }
    });
