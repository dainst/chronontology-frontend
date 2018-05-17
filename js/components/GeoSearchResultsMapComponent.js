function GeoSearchResultsMapController($scope, $location, $routeParams, $http, $sce, chronontologySettings, $filter, $compile) {

    var _this = this;

    _this.loading = false;
    _this.empty = false;
    _this.init = false;

    this.$onChanges = function() {
        if (!_this.init) {
            this.initMap();
        }
        this.loadData();
    };

    this.loadData = function() {
        _this.loading = true;
        _this.empty = true;
        $http.get(_this.datasource, {
                headers: { 'Authorization': undefined }
        }).then(function success(geojson){
            _this.loading = false;
            _this.geojson = geojson.data;
            if (geojson.data.geometry && geojson.data.geometry.type) {
                _this.empty = false;
                _this.initPlaces(geojson.data);
            } else if (geojson.data.features && geojson.data.features.length > 0) {
                _this.empty = false;
                _this.initPlaces(geojson.data);
            } else {
                _this.empty = true;
                if (_this.init) {
                    _this.map.removeLayer(_this.markers);
                    _this.map.setView([_this.mapY, _this.mapX], _this.mapZoom);
                }
            }
        }, function error(err) {
            console.warn(err) // TODO show error message
        });
    };

    this.initMap = function() {
        // init map
        _this.mapY = 50.1287762;
        _this.mapX = -5.4532871;
        _this.markersArea = 0;
        _this.mapZoom = 2;
        _this.baseLayer = L.tileLayer('http://{s}.tiles.mapbox.com/v3/isawnyu.map-knmctlkh/{z}/{x}/{y}.png', {
            maxZoom: 15,
            attribution: "<a href='javascript:alert(\"Tiles (c) MapBox (http://mapbox.com), Data (c) OpenStreetMap (http://www.openstreetmap.org) and contributors, CC-BY-SA, Tiles and Data (c) 2013 AWMC (http://www.awmc.unc.edu) CC-BY-NC 3.0 (http://creativecommons.org/licenses/by-nc/3.0/deed.en_US)\");'>Attribution</a>"
        });
        _this.map = L.map("map3", {
            fullscreenControl: {pseudoFullscreen: false},
            center: [_this.mapY, _this.mapX],
            zoom: _this.mapZoom,
            layers: [_this.baseLayer]
        });
        // add scale
        L.control.scale().addTo(_this.map);
        // init param
        _this.init = true;
        // init cluster
		_this.markers = new L.markerClusterGroup();
        _this.orangeBowlIcon = L.icon({iconUrl: 'img/Icone_Boule_Orange.png', iconSize: [30, 30], iconAnchor: [15, 15]});
        // init search
        _this.controlSearch = new L.Control.Search({
    		position:'topleft',
    		layer: _this.markers,
            initial: false,
            propertyName: 'name',
    		marker: false,
            zoom: 13
    	});
        _this.controlSearch.on('search:locationfound', function(e) {
    		e.layer.openPopup();
    	});
        _this.map.addControl(_this.controlSearch);
        // add minimap
        _this.miniMap = new L.Control.MiniMap(_this.baseLayer);
        //_this.map.addControl(_this.miniMap);
    };

    this.initPlaces = function(geojson) {
		_this.map.removeLayer(_this.markers);
        // add markers and polygons
        _this.marker = L.geoJson(geojson, {
          onEachFeature: _this.onEachFeature,
          pointToLayer: function (feature, latlng) {
              return L.marker(latlng, {icon: _this.orangeBowlIcon, name: feature.properties.names.prefName.name});
            }
        });
        // add marker as layer
        _this.markers.addLayer(_this.marker);
        _this.map.addLayer(_this.markers);
        // calc layer center
        _this.mapY = _this.marker.getBounds().getCenter().lat;
        _this.mapX = _this.marker.getBounds().getCenter().lng;
        // set map
        _this.map.setView([_this.mapY, _this.mapX], _this.mapZoom);
        // zoom to bounds
        _this.map.fitBounds(_this.marker.getBounds());
        if (_this.map.tap) _this.map.tap.enable();
        document.getElementById('map3').style.cursor='grab';
    }

    this.onEachFeature = function(feature, layer) {
        var popupContent = "<div><strong>{{place.properties.names.prefName.name}}</strong><br><a ng-href='{{place.properties['@id']}}' target='_blank'>{{place.properties['@id']}}</a><br><br><button ng-click='selectPlace(place)' class='btn btn-primary btn-xs'><span class='glyphicon glyphicon-map-marker'></span> Select this place</button></div>";
        var popupScope =  $scope.$new(true);
        popupScope.place = feature;
        popupScope.selectPlace = _this.selectPlace;
        var compiledContent = $compile(popupContent)(popupScope)[0];
		layer.bindPopup(compiledContent);
    };

    this.selectPlace = function(place) {
        _this.onPlaceSelected({place: place});
    }

}

angular.module('chronontology.components')
    .component('geosearchresultsmap',{
        templateUrl: '../../partials/components/geo/searchResultsMap.html',
        bindings: {
            datasource: '@datasource',
            onPlaceSelected: '&'
        },
        controller: GeoSearchResultsMapController
    });
