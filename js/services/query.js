'use strict';

var Query = function(chronontologySettings, language) {

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

    Query.prototype.setSize = function(size) {
        var newQuery = angular.copy(this);
        newQuery.size = size;
        return newQuery;
    }

    Query.prototype.setParts = function(parts) {
        var newQuery = angular.copy(this);
        newQuery.parts = parts;
        return newQuery;
    }

    Query.prototype.addFq = function(name, value) {
        var newQuery = angular.copy(this);
        if (!newQuery.fq) newQuery.fq = [];
        newQuery.fq.push({key:name, value:value});
        return newQuery;
    }

    Query.prototype.removeFq = function(name, value) {
        var newQuery = angular.copy(this);
        newQuery.fq = newQuery.fq.filter(function(entry) {
            return !(entry.key == name && entry.value == value);
        });
        return newQuery;
    }

    Query.prototype.addExists= function(name) {
        var newQuery = angular.copy(this);
        if (!newQuery.exists) newQuery.exists = [];
        newQuery.exists.push(name);
        return newQuery;
    }

    Query.prototype.removeExists = function(name) {
        var newQuery = angular.copy(this);
        newQuery.exists = newQuery.exists.filter(function(entry) {
            return entry !== name;
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
        if (this.parts) params.push("parts=" + this.parts);

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

        var regionFacet = "regions.en";
        if (language.currentLanguage()==COMPONENTS_GERMAN_LANG)
            regionFacet = "regions.de"
        params.push("facet=" + encodeURIComponent(regionFacet));

        return params;
    }

    function buildFqParams(fq, prefix) {
        if (!prefix) prefix = "";
        var params = [];
        for(var i in fq) {
            var value = prefix + fq[i].key + ":\"" + fq[i].value + "\"";
            // TODO loswerden
            if (fq[i].key.startsWith("region"))
                value = fq[i].key + ":\"" + fq[i].value + "\"";
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
        if (typeof search.exists === 'string') exists = [search.exists];
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
    'Query', ['chronontologySettings', 'language', Query]
);
