'use strict';

var SearchService = function($http, $q) {

	this.search = function(query) {

		var deferred = $q.defer();

		var from = query.from ? '&from=' + query.from : "";
		var size = query.size ? '&size=' + query.size : "";
		var facetlist = "&facet=resource.provenance&facet=resource.types";

		// facet values in der Backend-URI: mit "resource."
		var fq = query.fq;
        if (fq == null) {
			fq = "";
		} else if (typeof fq === 'string') {
			fq = "&fq=resource."+fq;
		} else {
			fq = "&fq=resource." + fq.join("&fq=resource.");
		}

		var exists = query.exists;
        if (exists == null) {
			exists = "";
		} else if (typeof exists === 'string') {
			exists = "&exists=resource."+exists;
		} else {
			exists = "&exists=resource." + exists.join("&exists=resource.");
		}

		var uri = '/data/period/?q=' + query.q + from + size + facetlist + fq + exists;
		$http.get(uri).then(
			function success(result) {
				deferred.resolve(result.data);
			},
			function error(err) {
				console.warn(err);
				deferred.reject();
			}
		);

		return deferred.promise;
	}

}

angular.module('chronontology.services').service('searchService',
	["$http", "$q", SearchService]);
