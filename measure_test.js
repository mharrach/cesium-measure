if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNDc4OWI4OC0wNWFlLTQ2YzgtODA1NS0yNTJmYjUyOTQxZDQiLCJpZCI6MzY5NjAsImlhdCI6MTYwNDM3OTYyOX0._odKu0OJdnPa_CUqM13Vuk0H1IwA0nfRHdnEFhfBkOQ';
var viewer = new Cesium.Viewer("cesiumContainer",{
    selectionIndicator : false,
    infoBox : false
});
viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
    url: "http://118.42.112.206:9998/tilesets/terrain/"
});

//set viewer camera location to Seoul
var center = Cesium.Cartesian3.fromDegrees(127.024612, 37.532600);
viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, 42000.0));

const toolbar = document.querySelector("div.cesium-viewer-toolbar");
const modeButton = document.querySelector("div.navigationHelpButtonContainer");
myButton = document.querySelector(".dropdown");
toolbar.insertBefore(myButton, modeButton);

//show the droplist on click
function showList() {
    document.getElementById("myDropdown").classList.toggle("show");
}

var dropdownlist = document.querySelector("#myDropdown").childNodes;
var dropdowns = document.getElementsByClassName("dropdown-content")[0].children;

//clear data and the previously selected button when we click on the new one
dropdownlist.forEach(function(e) {
    e.addEventListener('click', function() {
        for (let i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('selected')) {
                openDropdown.classList.remove('selected');
                pointShape.deleteEntites();
                lineShape.deleteEntites();
                polygonShape.deleteEntites();
            }   
        }
        this.classList.toggle('selected');
    })
})

var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
var ellipsoid = viewer.scene.globe.ellipsoid;

let pointShape = new Shape(1, function(){
    return dropdowns[0].classList.contains('selected');
});
pointShape.setEventHandler();

let lineShape = new Shape(2, function(){
    return dropdowns[1].classList.contains('selected');
});
lineShape.setEventHandler();

let polygonShape = new Shape(3, function(){
    return dropdowns[2].classList.contains('selected');
});
polygonShape.setEventHandler();