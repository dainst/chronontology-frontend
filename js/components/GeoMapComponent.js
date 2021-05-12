function GeoMapController($scope, $location, $routeParams, $http, $sce, chronontologySettings, $filter) {

    var _this = this;
    var popupinfo = [];

    _this.loading = true;
    _this.empty = false;

    this.$onChanges = function(changes) {
        if (changes.selectedPeriodId && _this.selectedPeriodId) {
            this.initMap();
            _this.loadData();
        }
    };

    this.loadData = function() {
        $http.get("/spi/place?periodid=" + _this.selectedPeriodId, {
                headers: { 'Authorization': undefined }
        }).then(function success(geojson){
            _this.loading = false;
            _this.geojson = geojson.data;
            if (geojson.data.features.length > 0) _this.initPlaces(geojson.data);
            else _this.empty = true;
        }, function error(err) {
            console.warn(err) // TODO show error message
        });
    };

    this.initMap = function() {

        // init map
        _this.mapY = 0;
        _this.mapX = 0;
        _this.markersArea = 0;
        _this.mapZoom = 1;
        _this.baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	        maxZoom: 15,
	        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
        _this.map = L.map("map", {
            fullscreenControl: {pseudoFullscreen: false},
            center: [_this.mapY, _this.mapX],
            zoom: _this.mapZoom,
            layers: [_this.baseLayer]
        });
        // disable interaction
        _this.map.dragging.disable();
        _this.map.touchZoom.disable();
        _this.map.doubleClickZoom.disable();
        _this.map.scrollWheelZoom.disable();
        _this.map.boxZoom.disable();
        _this.map.keyboard.disable();
        if (_this.map.tap) _this.map.tap.disable();
        document.getElementById('map').style.cursor = 'default';

    };

    this.initPlaces = function(geojson) {

        // set styles and stle params
        var colors = {};
        colors.spatiallyPartOfRegion = "#ff0000";
        colors.isNamedAfter = "#32CD32";
        colors.hasCoreArea = "#9214ff";
        var styleattr = {};
        styleattr.weight = 1.75;
        styleattr.opacity = 1;
        styleattr.fillOpacity = 0;
        var spatiallyPartOfRegion = {
            color: colors.spatiallyPartOfRegion,
            weight: styleattr.weight,
            opacity: styleattr.opacity,
            fillOpacity: styleattr.fillOpacity
        };
        var isNamedAfter = {
            color: colors.isNamedAfter,
            weight: styleattr.weight,
            opacity: styleattr.opacity,
            fillOpacity: styleattr.fillOpacity
        };
        var hasCoreArea = {
            color: colors.hasCoreArea,
            weight: styleattr.weight,
            opacity: styleattr.opacity,
            fillOpacity: styleattr.fillOpacity
        };

        // add scale
        L.control.scale().addTo(_this.map);
        // add legend
        var legend = L.control({position: 'bottomright'});
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend');
            var stopA = false;
            var stopB = false;
            var stopC = false;
            for (var feature in geojson.features) {
                if (geojson.features[feature].properties.gazetteerrelation) {
                    if (geojson.features[feature].properties.gazetteerrelation.indexOf("spatiallyPartOfRegion") !== -1 && !stopA) {
                        div.innerHTML += '<box style="border-color:' + colors.spatiallyPartOfRegion + '"></box><content>' + $filter('transl8')('relation_spatiallyPartOfRegion') + '</content>';
                        stopA = true;
                    } else if (geojson.features[feature].properties.gazetteerrelation.indexOf("isNamedAfter") !== -1 && !stopB) {
                        div.innerHTML += '<box style="border-color:' + colors.isNamedAfter + '"></box><content>' + $filter('transl8')('relation_isNamedAfter') + '</content>';
                        stopB = true;
                    } else if (geojson.features[feature].properties.gazetteerrelation.indexOf("hasCoreArea") !== -1 && !stopC) {
                        div.innerHTML += '<box style="border-color:' + colors.hasCoreArea + '"></box><content>' + $filter('transl8')('relation_hasCoreArea') + '</content>';
                        stopC = true;
                    }
                }
            }
            return div;
        };
        legend.addTo(_this.map);
        // add info legend
        _this.infoLegend = L.control({position: 'topright'});
        _this.infoLegend.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };
        _this.infoLegend.update = function (props) {
            this._div.innerHTML = "<h4>Geometry Information</h4>";
            this._div.innerHTML +=  (props ?
                "<span><b>" + props.names.prefName.name + "</b></span>" +
                "<br><span><i>" + props.gazetteerrelation + "</i></span>" +
                "<br><span>" + props.gazetteertype + ": " + props.gazetteerid + "</span>"
                : "<span>no geometry selected</span>");
            this._div.innerHTML = this._div.innerHTML.replace("spatiallyPartOfRegion", $filter('transl8')('relation_spatiallyPartOfRegion'));
            this._div.innerHTML = this._div.innerHTML.replace("isNamedAfter", $filter('transl8')('relation_isNamedAfter'));
            this._div.innerHTML = this._div.innerHTML.replace("hasCoreArea", $filter('transl8')('relation_hasCoreArea'));
        };
        _this.infoLegend.addTo(_this.map);
        // add markers and polygons
        _this.marker = L.geoJson(geojson, {
          onEachFeature: _this.onEachFeature,
          style: function (feature, latlng) {
              if (feature.properties.gazetteerrelation === "spatiallyPartOfRegion") {
                return spatiallyPartOfRegion;
              } else if (feature.properties.gazetteerrelation === "isNamedAfter") {
                return isNamedAfter;
              } else if (feature.properties.gazetteerrelation === "hasCoreArea") {
                return hasCoreArea;
              } else {
                return spatiallyPartOfRegion;
              }
          },
          pointToLayer: function (feature, latlng) {
              // create polygon out of point
              var point = turf.point([latlng.lat, latlng.lng]);
              var buffer = turf.buffer(point, 25, "kilometers");
              var envelope = turf.envelope(buffer);
              return L.polygon(envelope.geometry.coordinates);
            }
        });
        // add marker as layer
        _this.map.addLayer(_this.marker);
        // calc layer center
        _this.mapY = _this.marker.getBounds().getCenter().lat;
        _this.mapX = _this.marker.getBounds().getCenter().lng;
        // set map
        _this.map.setView([_this.mapY, _this.mapX], _this.mapZoom);
        // zoom to bounds
        _this.map.fitBounds(_this.marker.getBounds());

        // enable interaction
        _this.map.dragging.enable();
        _this.map.touchZoom.enable();
        _this.map.doubleClickZoom.enable();
        _this.map.scrollWheelZoom.enable();
        _this.map.boxZoom.enable();
        _this.map.keyboard.enable();
        if (_this.map.tap) _this.map.tap.enable();
        document.getElementById('map').style.cursor='grab';
    }

    this.onEachFeature = function(feature, layer) {
        layer.on({
            mouseover: _this.highlightFeature,
            mouseout: _this.resetHighlight,
            click: _this.highlightFeature,
            dblclick: _this.zoomToFeature
        });
    };

    this.highlightFeature = function(e) {
        // highlight feature
        e.target.setStyle({
            weight: 1.75,
            color: "#000000",
            fillOpacity: 0.5,
            fillColor: "#FFD700"
        });
        // set info to legend
        _this.infoLegend.update(e.target.feature.properties);
    };

    this.resetHighlight = function(e) {
        // reset highlight
        _this.marker.resetStyle(e.target);
        // reset legend
        _this.infoLegend.update();
    };

    this.zoomToFeature = function(e) {
        _this.map.fitBounds(e.target.getBounds());
    }

}

angular.module('chronontology.components')
    .component('geomap',{
        templateUrl: '../../partials/components/geo/map.html',
        bindings: {
            selectedPeriodId: '<'
        },
        controller: GeoMapController
    });
