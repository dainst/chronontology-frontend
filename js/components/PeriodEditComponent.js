/**
 * Created by Simon Hohl on 12.04.17.
 */

angular.module('chronontology.components')
    .component('periodEdit',{
        templateUrl: '../../partials/period/edit.html',
        bindings:
        {
            createPeriod: '<',
            originalPeriod: '<',
            resourceCache: '=',
            onSave: '&'
        },
        controller: function(chronontologySettings) {
            var _this = this;

            _this.validTypes = chronontologySettings.validTypes;
            _this.validSubtypes = chronontologySettings.validSubtypes;
            _this.validProvenances = chronontologySettings.validProvenances;

            _this.internalRelationTypes = chronontologySettings.internalRelationTypes;
            _this.allenRelationTypes = chronontologySettings.allenRelationTypes;
            _this.gazetteerRelationTypes = chronontologySettings.gazetteerRelationTypes;

            _this.chosenInternalRelationType = _this.internalRelationTypes[0];
            _this.chosenAllenRelationType = _this.allenRelationTypes[0];
            _this.chosenGazetteerRelationType = _this.gazetteerRelationTypes[0];

            _this.period = null;
            _this.relatedPeriods = null;
            _this.relatedLocations = null;

            _this.activeEditTab = 'core';

            _this.newLanguageInput = document.getElementById('language-input');

            _this.pickedRelations = function(){
                var result = {};

                for(var i = 0; i < _this.internalRelationTypes.length; i++){
                    result[_this.internalRelationTypes[i]] = null;
                }

                for(var i = 0; i < _this.allenRelationTypes.length; i++){
                    result[_this.allenRelationTypes[i]] = null;
                }

                return result;
            }();

            _this.pickedLocations = function () {
                var result = {};
                for(var i = 0; i < _this.gazetteerRelationTypes.length; i++) {
                    result[_this.gazetteerRelationTypes[i]] = null;
                }
                return result;
            }();

            _this.$onChanges = function() {
                if(_this.createPeriod === true){
                    _this.period = {};
                    return;
                }

                if(!_this.originalPeriod){
                    return;
                }

                _this.copyOriginal();
            };

            _this.saveChanges = function () {
                _this.onSave({
                    period: _this.period
                });
            };

            _this.reset = function () {
                _this.copyOriginal();
            };

            _this.copyOriginal = function () {
                _this.period = angular.copy(_this.originalPeriod);
            };

            _this.addLanguage = function () {
                if(!('names' in _this.period)) _this.period['names'] = {};
                if(_this.newLanguageInput.value in _this.period.names) return;
                if(_this.newLanguageInput.value.trim() === "") return;

                _this.period.names[_this.newLanguageInput.value] = [];
                _this.newLanguageInput.value = "";
            };

            _this.removeLanguage = function(lang) {
                delete _this.period.names[lang]
            };

            _this.addName = function (lang) {
                if(!_this.period.names[lang]) _this.period.names[lang] = [];
                _this.period.names[lang].push("");
            };

            _this.removeName = function(lang, index) {
                _this.period.names[lang].splice(index, 1);
            };

            _this.toggleSubtypeSelection = function (typeString) {
                var typeIndex = _this.period.types.indexOf(typeString);
                if(typeIndex < 0){
                    _this.period.types.push(typeString)
                }
                else {
                    _this.period.types = _this.period.types.filter(function (x) {
                        return typeString !== x;
                    })
                }
            };

            _this.selectAllSubtypes = function () {
                _this.period.types = _this.validSubtypes.slice(0);
            };

            _this.deselectAllSubtypes = function () {
                _this.period.types = [];
            };

            _this.addTimespan = function() {

                if(!_this.period.hasTimespan) {
                    _this.period.hasTimespan = [];
                }

                var emptyTimespanObject = {
                    "sourceOriginal": null,
                    "sourceURL": null,
                    "timeOriginal": null,
                    "calendar": null,
                    "begin": {
                        "at": null,
                        "isImprecise": null
                    },
                    "end": {
                        "at": null,
                        "isImprecise": null
                    }
                };

                _this.period.hasTimespan.push(emptyTimespanObject);
            };

            _this.removeTimespan = function(timespan) {
                _this.period.hasTimespan = _this.period.hasTimespan.filter(function(x){
                    return x['timeOriginal'] !== timespan['timeOriginal'];
                });
            };

            _this.addTag = function () {
                if(_this.period.tags == undefined){
                  _this.period.tags = [];
                }
                _this.period.tags.push("");
            };

            _this.removeTag = function (tag) {
                _this.period.tags = _this.period.tags.filter(function (x) {
                    return x !== tag;
                })
            };

            _this.addPickedRelation = function (relationName) {

                if(_this.pickedRelations[relationName] === null) {
                    return;
                }

                if(_this.period.id === _this.pickedRelations[relationName]) {
                    console.log('Picked period is linked period, aborting.');
                    _this.pickedRelations[relationName] = null;
                    return;
                }

                if(_this.period.relations === undefined || _this.period.relations.constructor === Array) {
                    _this.period.relations = {};
                }

                if(_this.period.relations[relationName] === undefined ) {
                    _this.period.relations[relationName] = [];
                }

                _this.period.relations[relationName].push(_this.pickedRelations[relationName].resource.id);
                _this.resourceCache[_this.pickedRelations[relationName].resource.id] = angular.copy(_this.pickedRelations[relationName].resource);
                _this.pickedRelations[relationName] = null;
            };

            _this.removeRelation = function(relationName, relation) {

                _this.period.relations[relationName] = _this.period.relations[relationName].filter(function(x){
                    return x !== relation;
                });
            };

            _this.addGazetteerRelation = function(relationName) {

                if(_this.pickedLocations[relationName] === null) {
                    return;
                }

                if(_this.period[relationName] === undefined) {
                    _this.period[relationName] = [];
                }

                _this.period[relationName].push(_this.pickedLocations[relationName]['@id']);
                _this.resourceCache[_this.pickedLocations[relationName]['@id']] = _this.pickedLocations[relationName];

                _this.pickedLocations[relationName] = null;
            };

            _this.removeGazetteerRelation = function(relationName, relation) {
                _this.period[relationName] = _this.period[relationName].filter(function(x){
                    return x !== relation;
                });
            };
        }
    });
