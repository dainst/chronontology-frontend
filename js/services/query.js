'use strict';

var Query = function(chronontologySettings) {

    function Query() {
        this.q = "";
        this.fq = [];
        this.exists = [];
        this.from = 0;
        this.size = 25;
    }

    Query.prototype.setFrom = function(from) {
        var newQuery = angular.copy(this);
        newQuery.from = from;
        return newQuery;
    }

    Query.prototype.addParam = function(key, name, value) {
        var newQuery = angular.copy(this);
        newQuery[key].push({key:name, value:value});
        return newQuery;
    }

    Query.prototype.removeParam = function(key, name) {
        var newQuery = angular.copy(this);
        newQuery[key] = newQuery[key].filter(function(entry) {
            return entry.key !== name;
        });
        return newQuery;
    }

    Query.prototype.toBackendUri = function() {

        var params = [];

        params = params.concat(buildFacetParams());
        params = params.concat(buildFqParams(this.fq));
        params = params.concat(buildExistsParams(this.exists));

        params.push("q=" + encodeURIComponent(this.q));
        params.push("from=" + this.from);
        params.push("size=" + this.size);

        if (params.length > 0) {
            return "?" + params.join("&");
        } else {
            return "";
        }

    }

    Query.prototype.toFrontendUri = function() {

        var params = [];

        params = params.concat(buildFqParams());
        params = params.concat(buildExistsParams());

        params.push("q=" + encodeURIComponent(this.q));
        params.push("from=" + this.from);

        if (params.length > 0) {
            return "?" + params.join("&");
        } else {
            return "";
        }

    }

    function buildFacetParams() {
        var params = [];
        for(var i in chronontologySettings.facetList) {
            params.push("facet=resource." + encodeURIComponent(chronontologySettings.facetList[i]));
        }
        return params;
    }

    function buildFqParams(fq) {
        var params = [];
        for(var i in fq) {
            var value = "resource" + fq[i].key + ":\"" + fq[i].value + "\"";
            params.push("fq=" + encodeURIComponent(value));
        }
        return params;
    }

    function buildExistsParams(exists) {
        var params = [];
        for(var i in exists) {
            var value = "resource" + exists[i].key + ":\"" + exists[i].value + "\"";
            params.push("exists=" + encodeURIComponent(value));
        }
        return params;
    }

    function initArray(search, key) {
        var a = [];
        if (search[key]) a = angular.copy(search[key]);
        if (typeof a === 'string') a = [a];
        return a;
    }

    Query.fromSearch = function(search) {
        var newQuery = new Query();
        newQuery.fq = initArray(search, 'fq');
        newQuery.exists = initArray(search, 'exists');
        if (search.q) newQuery.q = search.q;
        if (search.from) newQuery.from = search.from;
        return newQuery;
    }

    return Query;

}

angular.module('chronontology.services').factory(
    'Query', ['chronontologySettings', Query]
);
