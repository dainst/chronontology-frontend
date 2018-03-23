angular.module('chronontology.components')
    .component('exampleQueries',{
        templateUrl: '../../partials/example-queries.html',
        controller: function (chronontologySettings) {

            this.queries = chronontologySettings.exampleQueries;

        }
    });
