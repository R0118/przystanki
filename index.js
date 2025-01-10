var mymap = L.map('map', { maxZoom: 25 }).setView([52.340554, 20.950055], 13);

var OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
var geoportal = L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution', {
    layers: 'ORTOFOTOMAPA',
    format: 'image/png',
    transparent: true,
    crs: L.CRS.EPSG3857, // Właściwy układ współrzędnych
    version: '1.3.0', // Wersja WMS 1.3.0
    attribution: 'Geoportal 2025 - www.geoportal.gov.pl'
});
OpenStreetMap.addTo(mymap);
geoportal.addTo(mymap);

var trasy = {};
var trasywarstw = {};

Promise.all([
    fetch('./dane.geoJSON').then(res => res.json())
]).then(([dane]) => {
    dane.collections.forEach((collection) => {
        var nazwa = collection.name;
        var trasa = collection.features.map(function (feature) {
            var w = feature.geometry.coordinates;
            return L.latLng(w[0], w[1]);
        });
        var przystanki = L.Routing.control({
            waypoints: trasa,
            language: 'pl',
            router: L.Routing.graphHopper('f4b21e7b-83d4-4e5e-8965-6685f1eb1f5f'),
            createMarker: function (i, waypoint, n) {
                var iconUrl;
                var label = collection.features[i]?.properties.label;
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

    L.control.layers({OpenStreetMap, geoportal}, trasywarstw).addTo(mymap);

    mymap.on('overlayadd', function (e) {
    var nazwa = e.name;
    if (trasywarstw[nazwa]) {
        trasy[nazwa].addTo(mymap);
        trasywarstw[nazwa].addTo(mymap); 
    }
});

mymap.on('overlayremove', function (e) {
    var nazwa = e.name;
    if (trasywarstw[nazwa]) {
        trasy[nazwa].remove();
        trasywarstw[nazwa].remove(); 
    }
});
}).catch(error => {
    console.error('Error loading GeoJSON file:', error);
});


var customControl = L.Control.extend({
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-routing-custom');
        container.innerHTML = `
            <div style="padding: 10px; font-size:100%;background-color:black">
                <h2 style="text-align: center; color: white;">Mapa tras autobusowych w Warszawie</h2>
            </div>`;
        return container;
    },
    onRemove: function (map) {}
});
mymap.addControl(new customControl());
