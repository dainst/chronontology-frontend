'use strict';

var TimelineDataService = function($filter) {

    this.getTimelineData = function(periods) {

        var periodsToDisplay = [];
        var periodsMap = {};

        var xDomain = [];

        createPeriodObjects(periods, periodsToDisplay, periodsMap, xDomain);
        determinePeriodRows(periodsToDisplay, periodsMap);

        return {
            periods: periodsToDisplay,
            periodsMap: periodsMap,
            xDomain: xDomain
        };
    };

    function createPeriodObjects(periods, periodsToDisplay, periodsMap, xDomain) {

        var periodNumberCounter = 0;

        for (var i in periods) {
            if (validatePeriod(periods[i])) createPeriodObject(periods[i], periodNumberCounter++, periodsToDisplay,
                periodsMap, xDomain);
        }
    }
    
    function createPeriodObject(period, periodNumber, periodsToDisplay, periodsMap, xDomain) {
        
        var label = '';
        if (period.resource.names) label = $filter('prefName')(period.resource.names);
        if (!period.resource.relations) period.resource.relations = {};

        var timespan = period.resource.hasTimespan[0];

        var periodObject = {
            id: period.resource.id,
            number: periodNumber,
            name: label,
            from: parseInt(getFrom(timespan.begin)),
            earliestFrom: timespan.begin.notBefore ? parseInt(timespan.begin.notBefore) : undefined,
            to: parseInt(getTo(timespan.end)),
            latestTo: timespan.end.notAfter ? parseInt(timespan.end.notAfter) : undefined,
            successor: period.resource.relations.isFollowedBy
                ? period.resource.relations.isFollowedBy[0] : undefined,
            parent: period.resource.relations.isPartOf,
            children: period.resource.relations.hasPart,
            row: -1
        };

        updateXDomain(periodObject, xDomain);
        periodsToDisplay.push(periodObject);
        periodsMap[periodObject.id] = periodObject;
    }

    function updateXDomain(periodObject, xDomain) {

        if (!xDomain[0] || periodObject.from < xDomain[0]) xDomain[0] = periodObject.from;
        if (!xDomain[1] || periodObject.to > xDomain[1]) xDomain[1] = periodObject.to;
    }

    function validatePeriod(period) {

        // Check if the timespan of the period is defined
        if (!period.resource.hasTimespan || !period.resource.hasTimespan[0])
            return false;

        // Check if the begin and end values of the timespan are defined
        if (!period.resource.hasTimespan[0].begin || !period.resource.hasTimespan[0].end)
            return false;

        // Check if the values of the timespan are numeric
        if (!isValidTime(period.resource.hasTimespan[0].begin) || !isValidTime(period.resource.hasTimespan[0].end))
            return false;

        // Check if the values of the timespan are set properly
        if (parseInt(period.resource.hasTimespan[0].end.at || period.resource.hasTimespan[0].end.notBefore)
            < parseInt(period.resource.hasTimespan[0].begin.at || period.resource.hasTimespan[0].begin.notAfter))
            return false;

        return true;
    }

    this.validatePeriod = validatePeriod;

    function isValidTime(time) {

        return (!isNaN(time.at) || (!isNaN(time.notBefore) && !isNaN(time.notAfter)));
    }

    function getFrom(time) {

        return time.at || time.notAfter;
    }

    function getTo(time) {

        return time.at || time.notBefore;
    }

    function determinePeriodRows(periods, periodsMap) {

        var periodGroups = assignPeriodsToGroups(periods, periodsMap);

        periodGroups.sort(function (a, b) {
            var diff = b.periodsCount - a.periodsCount;
            if (diff === 0) {
                return b.number - a.number;
            } else {
                return diff;
            }
        });

        var rows = [];
        var colorGroupNumber = 1;

        for (var i in periodGroups) {
            for (var rowNumber = 0; rowNumber < 1000; rowNumber++) {
                if (doesPeriodGroupFitInRow(periodGroups[i], rowNumber, rows)) {
                    putPeriodGroupToRow(periodGroups[i], rowNumber, rows);
                    colorGroupNumber = getColorGroupNumber(colorGroupNumber, periodGroups[i], rows);
                    setColorGroup(periodGroups[i], colorGroupNumber);
                    break;
                }
            }
        }
    }

    function assignPeriodsToGroups(periods, periodsMap) {

        periods.sort(function (a, b) {
            if (a.children && a.children.indexOf(b.id) > -1) return -1;
            if (b.children && b.children.indexOf(a.id) > -1) return 1;
            var diff = a.from - b.from;
            if (diff === 0) {
                return b.number - a.number;
            } else {
                return diff;
            }
        });

        var periodGroups = [];
        var groupNumberCounter = 0;

        for (var i in periods) {
            if (!periods[i].periodGroup) {
                var rootPeriod = getRootPeriod(periods[i], periodsMap);
                addToGroup(rootPeriod, periodsMap, createGroup(groupNumberCounter++), 0, 0, periodGroups);
                if (periodGroups.indexOf(rootPeriod.periodGroup) === -1)
                    periodGroups.push(rootPeriod.periodGroup);
            }
        }

        for (var i in periods)
            addSuccessorToGroup(periods[i], periodsMap, periodGroups);

        return periodGroups;
    }

    function getRootPeriod(period, periodsMap) {

        while (period.parent && period.parent[0]) {
            if (period.parent[0] in periodsMap)
                period = periodsMap[period.parent[0]];
            else break;
        }

        return period;
    }

    function createGroup(groupNumber) {

        return {
            number: groupNumber,
            rows: [], // Array of rows; a row is an array containing the periods of the row
            periodsCount: 0,
            from: NaN,
            to: NaN
        };
    }

    function addToGroup(period, periodsMap, group, row, hierarchyLevel, periodGroups) {

        if (period.periodGroup) return;

        setPeriodGroup(period, group, row, hierarchyLevel);

        for (var i in period.children) {
            if (period.children[i] in periodsMap && period.id !== period.children[i]) {
                var rowNumber = row + 1;
                while (group.rows[rowNumber]
                        && !doesPeriodFitInRow(periodsMap[period.children[i]], group.rows[rowNumber])) {
                    rowNumber++;
                }
                addToGroup(periodsMap[period.children[i]], periodsMap, group, rowNumber, hierarchyLevel + 1,
                    periodGroups);
            }
        }
    }

    function addSuccessorToGroup(period, periodsMap, periodGroups) {

        if (period.successor && period.successor in periodsMap && period.id !== period.successor) {
            var successor = periodsMap[period.successor];
            if (successor.periodGroup.periodsCount === 1) {
                periodGroups.splice(periodGroups.indexOf(successor.periodGroup), 1);
                setPeriodGroup(successor, period.periodGroup, period.groupRow, period.level);
                addSuccessorToGroup(successor, periodsMap, periodGroups);
            }
        }
    }

    function setPeriodGroup(period, group, row, hierarchyLevel) {

        period.periodGroup = group;
        period.groupRow = row;
        if (!group.rows[row]) group.rows[row] = [];
        period.level = hierarchyLevel;
        group.rows[row].push(period);
        group.periodsCount++;

        if (isNaN(group.from) || group.from > period.from) group.from = period.from;
        if (isNaN(group.to) || group.to < period.to) group.to = period.to;
    }

    function doesPeriodFitInRow(period, row) {

        for (var i in row) {
            if (!(row[i].to <= period.from || row[i].from >= period.to)) {
                return false;
            }
        }
        return true;
    }

    function doesPeriodGroupFitInRow(group, rowNumber, rows) {

        for (var i = rowNumber; i < rowNumber + group.rows.length; i++) {
            if (!rows[i]) continue;
            for (var j in rows[i]) {
                var period = rows[i][j];
                if (!(period.to <= group.from || period.from >= group.to)) {
                    return false;
                }
            }
        }
        return true;
    }

    function putPeriodGroupToRow(group, rowNumber, rows) {

        group.startRow = rowNumber;
        for (var i = 0; i < group.rows.length; i++) {
            for (var j in group.rows[i]) {
                group.rows[i][j].row = rowNumber + i;
                if (!rows[rowNumber + i]) rows[rowNumber + i] = [];
                rows[rowNumber + i].push(group.rows[i][j]);
                rows[rowNumber + i].sort(function (a, b) {
                    var diff = a.from - b.from;
                    if (diff == 0) {
                        return b.number - a.number;
                    } else {
                        return diff;
                    }
                });
            }
        }
    }

    function getColorGroupNumber(currentColorGroupNumber, group, rows) {

        var colorGroupNumber = currentColorGroupNumber;

        var loops = 0;
        do {
            colorGroupNumber = (colorGroupNumber === 10) ? 1 : colorGroupNumber + 1;
        } while (doAdjacentPeriodGroupsHaveColorGroup(group, colorGroupNumber, rows) && loops++ < 10);

        return colorGroupNumber;
    }

    function doAdjacentPeriodGroupsHaveColorGroup(group, colorGroupNumber, rows) {

        var startRow = (group.startRow === 0) ? 0 : group.startRow - 1;
        var endRow = (group.startRow === 0) ? startRow + group.rows.length : startRow + group.rows.length + 1;
        for (var i = startRow; i <= endRow; i++) {
            for (var j in rows[i]) {
                var period = rows[i][j];
                if (period.colorGroup === colorGroupNumber
                        && detectIntersection(period.from, period.to, group.from, group.to))
                    return true;
            }
        }

        for (i = 0; i < group.rows.length; i++) {
            for (j in group.rows[i]) {
                var rowIndex = rows[group.startRow + i].indexOf(group.rows[i][j]);
                if (rowIndex > 0) {
                    period = rows[group.startRow + i][rowIndex - 1];
                    if (period.colorGroup === colorGroupNumber &&
                        detectIntersection(period.from, period.to, group.from, group.to))
                        return true;
                }
                if (rowIndex < rows[group.startRow + i].length - 1) {
                    period = rows[group.startRow + i][rowIndex + 1];
                    if (period.colorGroup === colorGroupNumber &&
                        detectIntersection(period.from, period.to, group.from, group.to))
                        return true;
                }
            }
        }

        return false;
    }

    function detectIntersection(from1, to1, from2, to2) {

        if (from1 <= from2 && to1 >= from2) return true;
        if (from1 <= to2 && to1 >= to2) return true;
        if (from1 >= from2 && to1 <= to2) return true;

        return false;
    }

    function setColorGroup(group, colorGroupNumber) {

        for (var i in group.rows) {
            for (var j in group.rows[i]) {
                group.rows[i][j].colorGroup = colorGroupNumber;
            }
        }
    }
};

angular.module('chronontology.services').service('timelineDataService', ["$filter", TimelineDataService]);
