'use strict';

angular.module('chronontology.directives')

  .directive('timeline', function(timelineDataService, $location) {
    return {
      restrict: 'EA',
      scope: {
          periods: '=',
          selectedPeriodId: '=',
          axisTicks: '@'
      },
      templateUrl: 'partials/timeline.html',
      link: function(scope, element) {

          // These variables should be constant variables. Set to var because of an error with safari.
          var margin = 15;
          var maxZoomYears = 5;
          var minStartYear = -10000;
          var maxStartYear = new Date().getFullYear();
          var barHeight = 20;
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

          var initialized = false;

          scope.$watch('periods', function() {
             if (scope.periods) initialize();
          });

          d3.select(window).on('resize', resize);

          function initialize() {

              var width = getWidth();                  // Größe des zur Verfügung stehenden Fensters
              var height = getHeight();

              y = d3.scale.linear()                    // y-Skala erstellen
                  .domain([0, barHeight * 20])         // Anzahl Hierarchie-Ebenen
                  .range([0, parseInt(height) - 30]);  // auf welcher Pixel-Fläche, minus Skalenbeschriftung

              timelineData = timelineDataService.getTimelineData(scope.periods);
              totalXDomain = timelineData.xDomain;
              
              setStartDomains(timelineData.periodsMap);

              x = d3.scale.linear()
                  .domain(startXDomain)                // z.B. -10.000 bis 2000 n.Chr.
                  .range([0, parseInt(width)]);        // auf welcher Pixel-Fläche

              y.domain(startYDomain);

              timeline = d3.select('#timeline').append('svg')
                  .attr('width', parseInt(width))
                  .attr('height', parseInt(height))
                  .classed('timeline', true);

              canvas = timeline.append('svg')
                  .attr('width', parseInt(width))
                  .attr('height', parseInt(height) - 30);

              axis = d3.svg.axis()                    // Skalenbeschriftung
                  .scale(x)
                  .orient('bottom')
                  .ticks(parseInt(scope.axisTicks))                           // Anzahl Skalenschritte
                  .tickSize(10, 0);

              axisElement = timeline.append('svg')
                  .attr('y', parseInt(height) - 30)
                  .attr('width', parseInt(width))
                  .classed('axis', true)
                  .call(axis);

              var minZoom = (startXDomain[1] - startXDomain[0])
                  / (totalXDomain[1] - totalXDomain[0]);
              var maxZoom = (startXDomain[1] - startXDomain[0]) / maxZoomYears;

              zoom = d3.behavior.zoom()
                  .x(x)
                  .scaleExtent([minZoom, maxZoom])
                  .on('zoom', function () {
                      axisElement.call(axis);
                      updateBars();              // aktualisiert die Achsen, nochmal neu gemalt
                  });

              drag = d3.behavior.drag()
                  .on('drag', function() {
                      var domain = y.domain();
                      domain[0] -= d3.event.dy;     // Verschiebung unten/oben
                      domain[1] -= d3.event.dy;
                      y.domain(domain);
                      axisElement.call(axis);
                      updateBars();
                  });

              timeline.call(zoom).call(drag);

              tooltip = d3.select('body')
                  .append('div')
                  .classed('timeline-tooltip', true);

              bars = canvas.selectAll('g').data(timelineData.periods).enter(); // bar = Rechteck von einer Period, bars = alle diese Rechtecke
              barRects = bars.append('g')
                  .attr('class', function(d) { return 'bar group' + d.colorGroup + ' level' + (d.groupRow + 1) }) // CSS class für richtige Farbe und Helligkeit
                  .append('rect')
                  .attr('rx','5')
                  .attr('ry','5')
                  .on('click', showPeriod);
              addTooltipBehavior(barRects);

              if (scope.selectedPeriodId) {
                  barRects.filter(function (d) {
                          return d.id == scope.selectedPeriodId;
                      })
                      .classed('selected', true);
              }

              barTexts = canvas.selectAll('g')
                  .append('text')
                  .classed('text', true)
                  .on('click', showPeriod);
              addTooltipBehavior(barTexts, tooltip);

              updateBars();

              initialized = true;
          }

          function resize() {

              if (!initialized) return;

              var width = getWidth();
              var height = getHeight();

              y.range([0, parseInt(height) - 30]);
              x.range([0, parseInt(width)]);

              timeline.attr('width', parseInt(width))
                  .attr('height', parseInt(height));

              canvas.attr('width', parseInt(width))
                  .attr('height', parseInt(height) - 30);

              axisElement.attr('width', parseInt(width));
              axisElement.call(axis);

              updateBars();
          }

          function getWidth() {
              return element[0].parentNode.clientWidth - margin; // margin: für weiße Ränder
          }

          function getHeight() {
              return element[0].parentNode.clientHeight - margin;
          }

          function updateBars() {  // aus Datenwerten Pixel berechnen

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
                      if (doesTextFitInBar(data.name, x(data.to) - x(data.from))) {
                          data.textVisible = true;
                          return data.name;
                      } else {
                          data.textVisible = false;
                          return '';
                      }
                  });

              axisElement.selectAll('.tick text')
                  .text(function() { return formatTickText(d3.select(this).text()); });
          }

          function doesTextFitInBar(text, barWidth) {
              return !(getApproximatedTextLength(text) > barWidth);
          }

          function getApproximatedTextLength(text) {
              return text.length * 7;
          }

          function showPeriod(period) {

              tooltip.style('visibility', 'hidden');
              $location.path('/period/' + period.id);
              scope.$apply();
          }

          function formatTickText(text) {

              text = text.split('.').join('$');
              text = text.split(',').join('.');
              text = text.split('$').join(',');

              if (text.length < 6 || (text.indexOf('-') > -1 && text.length < 7)) {
                  text = text.replace('.', '');
              }

              return text;
          }

          function addTooltipBehavior(selection) {

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
          }

          function setStartDomains(periodsMap) {

              if (scope.selectedPeriodId && periodsMap[scope.selectedPeriodId])
                  setStartDomainsToSelection(periodsMap[scope.selectedPeriodId]);
              else
                  setStandardStartDomains();
          }

          function setStartDomainsToSelection(selectedPeriod) {

              var span = selectedPeriod.to - selectedPeriod.from;
              var offset = (span < maxZoomYears) ? (maxZoomYears - span) / 2 : span / 2;
              var from = selectedPeriod.from - offset;
              var to = selectedPeriod.to + offset;
              if (from < totalXDomain[0]) from = totalXDomain[0];
              if (to > totalXDomain[1]) to = totalXDomain[1];
              startXDomain = [from, to];

              var centralRow = selectedPeriod.row;
              if (centralRow < 5) centralRow = 5;
              var yPos = centralRow + y.invert(centralRow * (barHeight + 5));
              startYDomain = [yPos - barHeight * 10, yPos + barHeight * 10];
          }

          function setStandardStartDomains() {

              startXDomain[0] = totalXDomain[0];
              startXDomain[1] = totalXDomain[1];
              if (startXDomain[0] < minStartYear)
                  startXDomain[0] = minStartYear;
              if (startXDomain[1] > maxStartYear)
                  startXDomain[1] = maxStartYear;

              startYDomain = [0, barHeight * 20];
          }
      }
    };
  }

);
