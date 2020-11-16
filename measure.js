Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNDc4OWI4OC0wNWFlLTQ2YzgtODA1NS0yNTJmYjUyOTQxZDQiLCJpZCI6MzY5NjAsImlhdCI6MTYwNDM3OTYyOX0._odKu0OJdnPa_CUqM13Vuk0H1IwA0nfRHdnEFhfBkOQ';
var viewer = new Cesium.Viewer("cesiumContainer",{
    selectionIndicator : false,
    infoBox : false
});
viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
    url: "http://118.42.112.206:9998/tilesets/terrain/"
});
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
                viewer.entities.removeAll();
                pointslist = [];
            }
        }
        this.classList.toggle('selected');
    })
})

var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
var ellipsoid = viewer.scene.globe.ellipsoid;
var pointslist = [];

class Shape{
    constructor(pointsCount, positions){
        this.pointsCount = pointsCount;
        this.positions = positions;
    }
    drawShape() {
        if (this.pointsCount == 1) {
            var point = viewer.entities.add({
                position : this.positions,
                point : {
                    pixelSize : 10,
                    color : Cesium.Color.WHITE,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
            return point; 
        }
        else if (this.pointsCount == 2) {
            var line = viewer.entities.add({
                polyline : {
                    positions : this.positions,
                    width: 10.0,
                    material: new Cesium.PolylineGlowMaterialProperty({
                    color: Cesium.Color.DEEPSKYBLUE,
                    glowPower: 0.25,
                    }),
                }
            });
            return line;
        }
        else if (this.pointsCount > 2) {
            var polygon = viewer.entities.add({
                polygon: {
                hierarchy: this.positions,
                material: new Cesium.ColorMaterialProperty(
                    Cesium.Color.WHITE.withAlpha(0.7)
                ),
                },
            });
            return polygon;
        }
    }

    setGeodesic(startPosition){
        var geodesic = new Cesium.EllipsoidGeodesic();
        var startCartographic = Cesium.Cartographic.fromCartesian(startPosition);
        var endPoint = this.drawShape().polyline.positions.getValue()[1];
        var endCartographic = Cesium.Cartographic.fromCartesian(endPoint);
        geodesic.setEndPoints(startCartographic, endCartographic);

        return geodesic;
    }

    getMidpoint(startPosition) {
        var scratch = new Cesium.Cartographic();
        var geodesic = this.setGeodesic(startPosition);
        var midpointCartographic = geodesic.interpolateUsingFraction(
            0.5,
            scratch
        );
        return Cesium.Cartesian3.fromRadians(
            midpointCartographic.longitude,
            midpointCartographic.latitude
        );
    }

    getLength(startPosition) {
        var geodesic = this.setGeodesic(startPosition);
        var lengthInMeters = Math.round(geodesic.surfaceDistance);
        return (lengthInMeters / 1000).toFixed(1) + " km";
    }

    calArea(t1, t2, t3, i) {
        var r = Math.abs(t1.x * (t2.y - t3.y) + t2.x * (t3.y - t1.y) + t3.x * (t1.y - t2.y)) / 2;
        var cartographic = new Cesium.Cartographic((t1.x + t2.x + t3.x) / 3, (t1.y + t2.y + t3.y) / 3);
        var cartesian = viewer.scene.globe.ellipsoid.cartographicToCartesian(cartographic);
        var magnitude = Cesium.Cartesian3.magnitude(cartesian);
        return r * magnitude * magnitude * Math.cos(cartographic.latitude)
    }

    getArea(positionsList) {
        var areaInMeters = 0;
        if (positionsList.length >= 3)
        {
            var points = [];
            for(var i = 0, len = positionsList.length; i < len; i++)
            {
                // points.push(Cesium.Cartesian2.fromCartesian3(positions[i]));
                var cartographic = Cesium.Cartographic.fromCartesian(positionsList[i]);
                points.push(new Cesium.Cartesian2(cartographic.longitude, cartographic.latitude));
            }
            if(Cesium.PolygonPipeline.computeWindingOrder2D(points) === Cesium.WindingOrder.CLOCKWISE)
            {
                points.reverse();
            }
            var triangles = Cesium.PolygonPipeline.triangulate(points);      
            for(var i = 0, len = triangles.length; i < len; i+=3)
            {
                // areaInMeters +=
                    // Cesium.PolygonPipeline.computeArea2D([points[triangles[i]],
                // points[triangles[i + 1]], points[triangles[i + 2]]]);
                areaInMeters += this.calArea(points[triangles[i]], points[triangles[i + 1]], points[triangles[i + 2]]);
            }
        }
        return areaInMeters;
    }

    stopDrawing(){
        handler.setInputAction(function() {
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
}

handler.setInputAction(function (event) {
    for (let i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('selected')) {
            if (openDropdown.id == 'O') {
                var position = viewer.camera.pickEllipsoid(event.position, ellipsoid);
                var pointShape = new Shape(1,position);
                pointShape.drawShape();
            }

            else if (openDropdown.id == "U") {
                var position1 = viewer.camera.pickEllipsoid(event.position, ellipsoid);
                var position2 = viewer.camera.pickEllipsoid(event.position, ellipsoid);
                function getLinePositions() {
                    return [position1, position2];
                }
                var positions = new Cesium.CallbackProperty(getLinePositions, false);
                var lineShape = new Shape(2, positions);
                lineShape.drawShape();

                function getMidpoint(){
                    return lineShape.getMidpoint(position1);
                }

                function getLength(){
                    return lineShape.getLength(position1);
                }

                viewer.entities.add({
                    position: new Cesium.CallbackProperty(getMidpoint, false),
                    label: {
                        // This callback updates the length to print each frame.
                        text: new Cesium.CallbackProperty(getLength, false),
                        font: "20px sans-serif",
                        pixelOffset: new Cesium.Cartesian2(0.0, 20),
                    },
                });

                handler.setInputAction(function(movement) {
                    var movingPosition = viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                    if (movingPosition) {
                        position2 = movingPosition;
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);             

                lineShape.stopDrawing();

            }

            else if (openDropdown.id == "N") {
                var cartesian = viewer.camera.pickEllipsoid(event.position, ellipsoid);
                var cartesian2 = viewer.camera.pickEllipsoid(event.position, ellipsoid);
                pointslist.push(cartesian,cartesian2);

                var pointShape = new Shape(1, cartesian);
                pointShape.drawShape();
                
                var dynamicPositions = new Cesium.CallbackProperty(function () {
                    return new Cesium.PolygonHierarchy(pointslist);
                }, false);

                var polygon = new Shape(3, dynamicPositions);
                polygon.drawShape();

                var area = polygon.getArea(pointslist);
                console.log(area);

                handler.setInputAction(function(movement) {
                    cartesian2 = viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                    pointslist[pointslist.length - 1] = cartesian2;
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                
                polygon.stopDrawing();
            }      
        
            else if (openDropdown.id == "A") {
                viewer.entities.removeAll();
                pointslist = [];
            }
        }
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);