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
        if (!newQuery[key]) newQuery[key] = [];
        newQuery[key].push({key:name, value:value});
        return newQuery;
    }

    Query.prototype.removeParam = function(key, name, value) {
        var newQuery = angular.copy(this);
        newQuery[key] = newQuery[key].filter(function(entry) {
            return !(entry.key == name && entry.value == value);
        });
        return newQuery;
    }

    Query.prototype.toBackendUri = function() {

        var params = [];

        params = params.concat(buildFacetParams());
        params = params.concat(buildFqParams(this.fq, "resource."));
        params = params.concat(buildExistsParams(this.exists, "resource."));

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

        params = params.concat(buildFqParams(this.fq));
        params = params.concat(buildExistsParams(this.exists));

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

    function buildFqParams(fq, prefix) {
        if (!prefix) prefix = "";
        var params = [];
        for(var i in fq) {
            var value = prefix + fq[i].key + ":\"" + fq[i].value + "\"";
            params.push("fq=" + encodeURIComponent(value));
        }
        return params;
    }

    function buildExistsParams(exists, prefix) {
        if (!prefix) prefix = "";
        var params = [];
        for(var i in exists) {
            var value = prefix + exists[i];
            params.push("exists=" + encodeURIComponent(value));
        }
        return params;
    }

    function initFq(search) {
        var fq = [];
        if (typeof search.fq === 'string') fq = [search.fq];
        else fq = search.fq;
        if (fq) for (var i in fq) {
            var split = fq[i].split(':');
            fq[i] = { key: split[0], value: split[1].substr(1, split[1].length - 2) }
        }
        return fq;
    }

    function initExists(search) {
        var exists = [];
        if (typeof search.exists === 'string') exists = [exists];
        else exists = search.exists;
        return exists;
    }

    Query.fromSearch = function(search) {
        var newQuery = new Query();
        newQuery.fq = initFq(search);
        newQuery.exists = initExists(search);
        if (search.q) newQuery.q = search.q;
        if (search.from) newQuery.from = search.from;
        return newQuery;
    }

    return Query;

}

angular.module('chronontology.services').factory(
    'Query', ['chronontologySettings', Query]
);