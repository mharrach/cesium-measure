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
        return areaInMeters + " m2";
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
            console.log(point.position._value);
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

            let that = this;

            function getMidpointCall(){
                return that.getMidpoint(); 
            }

            function getLengthCall(){
                return that.getLength();
            }

            var label = viewer.entities.add({
                position: new Cesium.CallbackProperty(getMidpointCall, false),
                label: {
                    // This callback updates the length to print each frame.
                    text: new Cesium.CallbackProperty(getLengthCall, false),
                    font: "20px sans-serif",
                    fillColor: Cesium.Color.DEEPSKYBLUE,
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
                    width: 2.0,
                    material: new Cesium.PolylineGlowMaterialProperty({
                    color: Cesium.Color.WHITE,
                    //glowPower: 0.25,
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

            function getMidpointCall(){
                return that.getMidpoint();
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
                    fillColor: Cesium.Color.DEEPSKYBLUE,
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