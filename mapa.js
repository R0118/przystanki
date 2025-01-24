var mapa = L.map('map', { maxZoom: 25 }).setView([52.317245376694935, 20.957449076417298], 13);

var OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
var Geoportal = L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/HighResolution', {
    layers: 'Raster', format: 'image/png', transparent: true });
var Terrestris = L.tileLayer.wms('https://ows.terrestris.de/osm/service', {
    layers: 'OSM-WMS', format: 'image/png', transparent: true });
OpenStreetMap.addTo(mapa);

var trasy = {};
var trasywarstw = {};

Promise.all([
    fetch('./dane.geoJSON').then(res => res.json())
]).then(([dane]) => {
    dane.collections.forEach((kolekcja) => {
        var nazwa = kolekcja.name;
        var trasa = kolekcja.features.map(function (feature) {
            var w = feature.geometry.coordinates;
            return L.latLng(w[0], w[1]);
        });
        var przystanki = L.Routing.control({
            waypoints: trasa,
            language: 'pl',
            router: L.Routing.graphHopper('3f3d23fb-91fb-4f54-8d75-2b8df6b95fea'),
            createMarker: function (i, waypoint, n) {
                var iconUrl;
                var label = kolekcja.features[i]?.properties.label;
                if (i === 0) {
                    iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
                } else if (i === n - 1) {
                    iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png';
                } else {
                    iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png';
                }
                var customIcon = L.icon({
                    iconUrl: iconUrl,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -24]
                });
                return L.marker(waypoint.latLng, { icon: customIcon, draggable: false }).bindPopup(label);
            },
            routeWhileDragging: false,
            editMode: false,
            addWaypoints: false
        });
        trasy[nazwa] = przystanki;
        trasywarstw[nazwa] = L.layerGroup([przystanki.getPlan()]);
    });

    L.control.layers({OpenStreetMap, Geoportal, Terrestris}, trasywarstw).addTo(mapa);

    mapa.on('overlayadd', function (e) {
    var nazwa = e.name;
    if (trasywarstw[nazwa]) {
        trasy[nazwa].addTo(mapa);
        trasywarstw[nazwa].addTo(mapa); 
    }
});

mapa.on('overlayremove', function (e) {
    var nazwa = e.name;
    if (trasywarstw[nazwa]) {
        trasy[nazwa].remove();
        trasywarstw[nazwa].remove(); 
    }
});});


var legenda = L.Control.extend({
    onAdd: function () {
        var k = L.DomUtil.create('div', 'leaflet-routing-custom');
        k.innerHTML = `<div style="padding: 10px; font-size:100%;background-color:white">
                <h2 style="text-align: center;">Mapa tras autobusowych w Warszawie</h2>
                <div style="font-size:120%; margin-left: 130px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span>Przystanek początkowy —</span>
                <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" style="width: 20px; height: 34px;" />
            </div>
            <div style="font-size:120%; margin-left: 130px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span>Przystanek końcowy —</span>
                <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" style="width: 20px; height: 34px;" />
            </div>
            <div style="font-size:120%; margin-left: 130px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span>Pozostałe przystanki —</span>
                <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" style="width: 20px; height: 34px;" />
            </div>
            </div>`;
        return k;
    },
    onRemove: function () {}
});
mapa.addControl(new legenda());
