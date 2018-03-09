angular.module('chronontology.components')
    .component('periodTypeTagCloud',{
        templateUrl: '../../partials/period/type-tag-cloud.html',
        controller: function ($http, chronontologySettings) {

            this.tags = [];
            var ctrl = this;

            var uri = "/data/period/?size=0&facet=resource.types";
            $http.get(uri).then(
    			function success(result) {
    				result.data.facets['resource.types'].buckets.forEach(function(bucket) {
                        ctrl.tags.push({
                            text: bucket.key,
                            weight: bucket.doc_count,
                            link: "/search?q=&fq=types:\"" + bucket.key + "\""
                        });
                    });
    			},
    			function error(err) {
    				console.warn(err);
    			}
    		);

        }
    });
