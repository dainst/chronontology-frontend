function TimelineController(timelineDataService, $location, $element, $scope) {

    var _this = this;

    // These variables should be constant variables. Set to var because of an error with safari.
    var margin = 15;
    var maxZoomYears = 5;
    var minStartYear = -10000;
    var maxStartYear = new Date().getFullYear();
    var barHeight = 20;
    var buttonZoomFactor = 0.5;
    // -------

    var timeline;
    var canvas;
    var axis, axisElement;
    var bars, barRects, barTexts;
    var tooltip;
    var zoom, drag;
    var x, y;

    var timelineData;

    var totalXDomain = [];
    var startXDomain = [];
    var startYDomain = [];

    var width;
    var height;

    var initialized = false;

    d3.select(window).on('resize', _this.resize);

    this.$onChanges = function() {
        if (this.periods) this.initialize();
    };

    this.initialize = function() {

        width = this.getWidth();                  // Größe des zur Verfügung stehenden Fensters
        height = this.getHeight();

        y = d3.scale.linear()                    // y-Skala erstellen
            .domain([0, barHeight * 20])         // Anzahl Hierarchie-Ebenen
            .range([0, parseInt(height) - 30]);  // auf welcher Pixel-Fläche, minus Skalenbeschriftung

        timelineData = timelineDataService.getTimelineData(this.periods);
        totalXDomain = timelineData.xDomain;

        this.setStartDomains(timelineData.periodsMap);

        x = d3.scale.linear()
            .domain(startXDomain)                // z.B. -10.000 bis 2000 n.Chr.
            .range([0, parseInt(width)]);        // auf welcher Pixel-Fläche

        y.domain(startYDomain);

        timeline = d3.select('#timeline').append('svg')
            .attr('width', parseInt(width))
            .attr('height', parseInt(height))
            .classed('timeline', true);

        if (this.inactive) timeline.classed('inactive', true);

        canvas = timeline.append('svg')
            .attr('width', parseInt(width))
            .attr('height', parseInt(height) - 30);

        axis = d3.svg.axis()                    // Skalenbeschriftung
            .scale(x)
            .orient('bottom')
            .ticks(parseInt(this.axisTicks))                           // Anzahl Skalenschritte
            .tickSize(10, 0);

        axisElement = timeline.append('svg')
            .attr('y', parseInt(height) - 30)
            .attr('width', parseInt(width))
            .classed('axis', true)
            .call(axis);


        if (!this.inactive) {
            var minZoom = (startXDomain[1] - startXDomain[0])
                / (totalXDomain[1] - totalXDomain[0]);
            var maxZoom = (startXDomain[1] - startXDomain[0]) / maxZoomYears;

            zoom = d3.behavior.zoom()
                .x(x)
                .scaleExtent([minZoom, maxZoom])
                .on('zoom', function () {
                    axisElement.call(axis);
                    _this.updateBars();              // aktualisiert die Achsen, nochmal neu gemalt
                });

            drag = d3.behavior.drag()
                .on('drag', function () {
                    var domain = y.domain();
                    domain[0] -= d3.event.dy;     // Verschiebung unten/oben
                    domain[1] -= d3.event.dy;
                    y.domain(domain);
                    axisElement.call(axis);
                    _this.updateBars();
                });

            timeline.call(zoom).call(drag);

            tooltip = d3.select('body')
                .append('div')
                .classed('timeline-tooltip', true);
        }

        bars = canvas.selectAll('g').data(timelineData.periods).enter(); // bar = Rechteck von einer Period, bars = alle diese Rechtecke
        barRects = bars.append('g')
            .attr('class', function(d) { // CSS class für richtige Farbe und Helligkeit
                var barClass = 'bar level' + (d.level + 1);
                if (_this.inactive) {
                    barClass += ' inactive';
                } else {
                    barClass += ' group' + d.colorGroup;
                }
                return barClass;
            })
            .append('rect')
            .attr('rx', '5')
            .attr('ry', '5');
        if (!this.inactive) {
            barRects.on('click', _this.showPeriod);
            this.addTooltipBehavior(barRects);
        }

        if (this.selectedPeriodId) {
            barRects.filter(function (d) {
                return d.id == _this.selectedPeriodId;
            }).classed('selected', true);
        }

        barTexts = canvas.selectAll('g')
            .append('text')
            .classed('text', true)
            .on('click', _this.showPeriod);
        if (this.inactive) {
            barTexts.classed('inactive', true);
        } else {
            this.addTooltipBehavior(barTexts);
        }

        this.updateBars();

        initialized = true;
    };

    this.resize = function() {

        if (!initialized) return;

        var width = this.getWidth();
        var height = this.getHeight();

        y.range([0, parseInt(height) - 30]);
        x.range([0, parseInt(width)]);

        timeline.attr('width', parseInt(width))
            .attr('height', parseInt(height));

        canvas.attr('width', parseInt(width))
            .attr('height', parseInt(height) - 30);

        axisElement.attr('width', parseInt(width));
        axisElement.call(axis);

        this.updateBars();
    };

    this.getWidth = function() {
        return $element[0].parentNode.clientWidth - margin; // margin: für weiße Ränder
    };

    this.getHeight = function() {
        return $element[0].parentNode.clientHeight - margin;
    };

    this.updateBars = function() {  // aus Datenwerten Pixel berechnen

        barRects.attr('width', function(data) {
            return x(data.to) - x(data.from);
        })
            .attr('height', barHeight)
            .attr('x', function(data) {
                return x(data.from);
            })
            .attr('y', function(data) {
                return y(data.row) + data.row * (barHeight + 5);
            });

        barTexts.attr('x', function(data) {
            return x(data.from) + (x(data.to) - x(data.from)) / 2;
        })
            .attr('y', function(data) {
                return y(data.row) + data.row * (barHeight + 5) + barHeight / 2 + 5;
            })
            .text(function(data) {
                if (_this.doesTextFitInBar(data.name, x(data.to) - x(data.from))) {
                    data.textVisible = true;
                    return data.name;
                } else {
                    data.textVisible = false;
                    return '';
                }
            });

        axisElement.selectAll('.tick text')
            .text(function() { return _this.formatTickText(d3.select(this).text()); });
    };

    this.doesTextFitInBar = function(text, barWidth) {
        return !(this.getApproximatedTextLength(text) > barWidth);
    };

    this.getApproximatedTextLength = function(text) {
        return text.length * 7;
    };

    this.showPeriod = function(period) {

        tooltip.style('visibility', 'hidden');
        $location.path('/period/' + period.id);
        console.log('show period!');
        $scope.$apply();
    };

    this.formatTickText = function(text) {

        text = text.split('.').join('$');
        text = text.split(',').join('.');
        text = text.split('$').join(',');

        if (text.length < 6 || (text.indexOf('-') > -1 && text.length < 7)) {
            text = text.replace('.', '');
        }

        return text;
    };

    this.addTooltipBehavior = function(selection) {

        selection.on('mouseover', function(period) {
            if (period.textVisible) return;
            tooltip.text(period.name);
            return tooltip.style('visibility', 'visible');
        })
            .on('mousemove', function() {
                return tooltip.style('top', (d3.event.pageY - 10) + 'px')
                    .style('left', (d3.event.pageX + 10) + 'px');
            })
            .on('mouseout', function() { return tooltip.style('visibility', 'hidden'); });
    };

    this.setStartDomains = function(periodsMap) {

        if (this.selectedPeriodId && periodsMap[this.selectedPeriodId])
            this.setStartDomainsToSelection(periodsMap[this.selectedPeriodId]);
        else
            this.setStandardStartDomains();
    };

    this.setStartDomainsToSelection = function(selectedPeriod) {

        var span = selectedPeriod.to - selectedPeriod.from;
        var offset = (span < maxZoomYears) ? (maxZoomYears - span) / 2 : span / 2;
        var from = selectedPeriod.from - offset;
        var to = selectedPeriod.to + offset;
        if (from < totalXDomain[0]) from = totalXDomain[0];
        if (to > totalXDomain[1]) to = totalXDomain[1];
        startXDomain = [from, to];

        var centralRow = selectedPeriod.row;
        if (centralRow < 5) centralRow = 5;
        var yPos = centralRow + y.invert(centralRow * (barHeight + 5)) - 5;
        startYDomain = [yPos - barHeight * 10, yPos + barHeight * 10];
    };

    this.setStandardStartDomains = function() {

        startXDomain[0] = totalXDomain[0];
        startXDomain[1] = totalXDomain[1];
        if (startXDomain[0] < minStartYear)
            startXDomain[0] = minStartYear;
        if (startXDomain[1] > maxStartYear)
            startXDomain[1] = maxStartYear;

        startYDomain = [0, barHeight * 20];
    };

    this.zoomIn = function(event) {

        event.target.blur();
        this.zoom(true);
    };

    this.zoomOut = function(event) {

        event.target.blur();
        this.zoom(false);
    };

    this.zoom = function(zoomIn) {

        var center = [width / 2, height / 2];
        var view = { x: zoom.translate()[0], y: zoom.translate()[1], k: zoom.scale() };

        var targetZoom = zoom.scale() * (1 + buttonZoomFactor * (zoomIn ? 1 : -1));

        if (targetZoom < zoom.scaleExtent()[0] || targetZoom > zoom.scaleExtent()[1]) return false;

        view.x += center[0] - (((center[0] - view.x) / view.k) * targetZoom + view.x);
        view.y += center[1] - (((center[1] - view.y) / view.k) * targetZoom + view.y);
        view.k = targetZoom;

        this.interpolateZoom([view.x, view.y], view.k);
    };

    this.interpolateZoom = function(translate, scale) {

        return d3.transition().duration(350).tween('zoom', function() {

            var interpolatedTranslate = d3.interpolate(zoom.translate(), translate),
                interpolatedScale = d3.interpolate(zoom.scale(), scale);

            return function(time) {
                zoom.scale(interpolatedScale(time))
                    .translate(interpolatedTranslate(time));
                axisElement.call(axis);
                _this.updateBars();
            };
        });
    };
}

angular.module('chronontology.components').component('timeline', {
    templateUrl: '../../partials/timeline.html',
    bindings: {
        periods: '<',
        selectedPeriodId: '@',
        axisTicks: '@',
        inactive: '<'
    },
    controller: TimelineController
});
