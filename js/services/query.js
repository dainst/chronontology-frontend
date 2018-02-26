'use strict';

var Query = function(chronontologySettings) {

    function Query() {
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

    Query.prototype.toString = function() {

        var params = [];

        params = params.concat(buildFacetParams());
        params = params.concat(buildFqParams());
        params = params.concat(buildExistsParams());

        params.push("from=" + this.from);
        params.push("size=" + this.size);

        if (params.length > 0) {
            return "?" + params.join("&");
        } else {
            return "";
        }

    }

    function buildFacetParams() {
        var params = [];
        for(var i in this.chronontologySettings.facetList) {
            params.push(encodeURIComponent(this.chronontologySettings.facetList[i]));
        }
        return params;
    }

    function buildFqParams() {
        var params = [];
        for(var i in this.fq) {
            var value = "resource" + this.fq[i].key + ":\"" + this.fq[i].value + "\"";
            params.push("fq=" + encodeURIComponent(value));
        }
        return params;
    }

    function buildExistsParams() {
        var params = [];
        for(var i in this.exists) {
            var value = "resource" + this.exists[i].key + ":\"" + this.exists[i].value + "\"";
            params.push("exists=" + encodeURIComponent(value));
        }
        return params;
    }

    function initArray(search, key) {
        var a = angular.copy(search.query[key]);
        if (typeof a === 'string') a = [a];
        if (Array.isArray(a)) return a;
        return [];
    }

    Query.fromSearch(search) = {
        var newQuery = new Query();
        newQuery.fq = initArray(search, 'fq');
        newQuery.exists = initArray(search, 'exists');
        if (search.query.from) newQuery.from = search.query.from;
        return newQuery;
    }

    return Query;

}

angular.module('chronontology.services').factory(
    'Query', ['chronontologySettings', Query]
);
