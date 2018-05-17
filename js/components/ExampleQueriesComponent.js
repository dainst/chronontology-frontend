angular.module('chronontology.components')
    .component('exampleQueries',{
        templateUrl: '../../partials/components/example-queries.html',
        controller: function (chronontologySettings) {

            this.queries = chronontologySettings.exampleQueries;

        }
    });
