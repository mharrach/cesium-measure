// to do : close the line, and add labels

class Shape{
    constructor(pointsCount, condition){
        this.pointsCount = pointsCount;
        this.condition = condition;  
        this.handler =  new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        this.positions = [];
        this.entityId = [];
        this.end = false;
    }

    setGeodesic(){
        var geodesic = new Cesium.EllipsoidGeodesic();
        var startCartographic = Cesium.Cartographic.fromCartesian(this.positions[0]);
        //var endPoint = this.drawShape().polyline.positions.getValue()[1];
        var len = this.positions.length;
        var endPoint = this.positions[len - 1];
        var endCartographic = Cesium.Cartographic.fromCartesian(endPoint);
        geodesic.setEndPoints(startCartographic, endCartographic);

        return geodesic;
    }

    getMidpoint() {
        var scratch = new Cesium.Cartographic();
        var geodesic = this.setGeodesic();
        var midpointCartographic = geodesic.interpolateUsingFraction(
            0.5,
            scratch
        );
        return Cesium.Cartesian3.fromRadians(
            midpointCartographic.longitude,
            midpointCartographic.latitude
        );
    }

    getLength() {
        var geodesic = this.setGeodesic();
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

    getArea() {
        var positionsList = this.positions;
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
        return areaInMeters + "m2";
    }

    drawShape() {
        if(this.end) {
            this.deleteEntites();
            this.end = false;
            this.positions = [this.positions.pop()]; //get the last element
            this.entityId.length = 0;
        }        
        if (this.pointsCount == 1) {
            var len = this.positions.length;
            var point = viewer.entities.add({
                position : this.positions[len - 1],
                point : {
                    pixelSize : 10,
                    color : Cesium.Color.WHITE,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
            this.entityId.push(point.id);
            return point; 
        }
        else if (this.pointsCount == 2) {
            var len = this.positions.length;
            var position1 = this.positions[len - 1];
            var position2 = position1;

            var line = viewer.entities.add({
                polyline : {
                    positions : new Cesium.CallbackProperty(function () {
                        return [position1, position2];
                    }, false),
                    width: 10.0,
                    material: new Cesium.PolylineGlowMaterialProperty({
                    color: Cesium.Color.DEEPSKYBLUE,
                    glowPower: 0.25,
                    }),
                }
            });            

            handler.setInputAction(function(movement) {
                var movingPosition = viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                if (movingPosition) {
                    position2 = movingPosition;
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            
            //console.log(this.getLength());

            function getMidpointCall(){
                return this.getMidpoint(); //when I do "this.getMidpoint() it doesn't work!"
            }

            function getLengthCall(){
                return this.getLength(); //when I do "this.getLength() it doesn't work!"
            }

            var label = viewer.entities.add({
                position: new Cesium.CallbackProperty(getMidpointCall, false),
                label: {
                    // This callback updates the length to print each frame.
                    text: new Cesium.CallbackProperty(getLengthCall, false),
                    font: "20px sans-serif",
                    pixelOffset: new Cesium.Cartesian2(0.0, 20),
                },
            });

            this.entityId.push(line.id, label.id);
            this.stopDrawing();   
            return line;
        }
        else if (this.pointsCount > 2) {
            var that = this;
            var len = that.positions.length;
            var cartesian = that.positions[len - 1];
            var cartesian2 = that.positions[len - 1];
            that.positions.push(cartesian2);

            var line = viewer.entities.add({
                polyline : {
                    positions : new Cesium.CallbackProperty(function () {
                        return [cartesian, cartesian2];
                    }, false),
                    width: 10.0,
                    material: new Cesium.PolylineGlowMaterialProperty({
                    color: Cesium.Color.DEEPSKYBLUE,
                    glowPower: 0.25,
                    }),
                }
            });
            
            var polygon = viewer.entities.add({
                polygon: {
                hierarchy: new Cesium.CallbackProperty(function () {
                    return new Cesium.PolygonHierarchy(that.positions);
                }, false),
                material: new Cesium.ColorMaterialProperty(
                    Cesium.Color.WHITE.withAlpha(0.7)
                ),
                },
            });

            handler.setInputAction(function(movement) {
                cartesian2 = viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                that.positions[that.positions.length - 1] = cartesian2;
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            //console.log(that.getArea());

            function getMidpointCall(){
                return that.getMidpoint(); // same problem here..
            }

            function getAreaCall(){
                return that.getArea();
            }
            
            var label = viewer.entities.add({
                position: new Cesium.CallbackProperty(getMidpointCall, false),
                label: {
                    // This callback updates the length to print each frame.
                    text: new Cesium.CallbackProperty(getAreaCall, false),
                    font: "20px sans-serif",
                    pixelOffset: new Cesium.Cartesian2(0.0, 20),
                },
            });
            
            this.entityId.push(line.id, polygon.id, label.id);
            this.stopDrawing(); 
            
            return polygon;

        }
    }

    setEventHandler() {
        var that = this;
        this.handler.setInputAction(function(event) {
            if(that.condition()) {       
                let position = viewer.camera.pickEllipsoid(event.position, ellipsoid);
                that.positions.push(position);
                that.drawShape();
            } 
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    stopDrawing(){
        var that = this;
        that.handler.setInputAction(function() {
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            that.end = true;
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        
    }

    deleteEntites(){
        for (let index = 0; index < this.entityId.length; index++) {
            viewer.entities.removeById(this.entityId[index]);
        }
    }
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
                //viewer.entities.removeAll();
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

/*
handler.setInputAction(function (event) {
    for (let i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('selected')) {
            if (openDropdown.id == "O") {
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
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);*/

