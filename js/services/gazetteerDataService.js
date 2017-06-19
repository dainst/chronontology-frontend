/**
 * Created by Simon Hohl on 16.06.17.
 */

'use strict';

var GazetteerDataService = function($http, chronontologySettings) {
    this.matchIdFromUriPattern = /\d+$/;
    this.getById = function(gazId, success) {
        $http.get(
            chronontologySettings.gazetteerBaseUri + '/doc/' + gazId + '.json',
            {
                headers: { Authorization : undefined}
            }
        ).success(function(result){
            return success(result);
        });
    };

    this.getByUri = function(gazUri, success) {
        this.getById(
            gazUri.match(this.matchIdFromUriPattern),
            function(result) {
                return success(result);
            }
        )
    }
};

angular.module('chronontology.services').service('gazetteerDataService', ["$http", "chronontologySettings", GazetteerDataService]);