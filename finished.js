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

function showList() {
  document.getElementById("myDropdown").classList.toggle("show");
}

var dropdownlist = document.querySelector("#myDropdown").childNodes;
var dropdowns = document.getElementsByClassName("dropdown-content")[0].children;

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

handler.setInputAction(function (event) {
  for (let i = 0; i < dropdowns.length; i++) {
    var openDropdown = dropdowns[i];
    if (openDropdown.classList.contains('selected')) {

      if (openDropdown.id == 'O') {
        console.log(event.position);
        var cartesian = viewer.camera.pickEllipsoid(event.position, ellipsoid);
        var point = viewer.entities.add({
          position : cartesian,
          point : {
              pixelSize : 10,
              color : Cesium.Color.Blue,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        });
      }

      else if (openDropdown.id == "U") {
        var pos1 = viewer.camera.pickEllipsoid(event.position, ellipsoid);
        var pos2 = viewer.camera.pickEllipsoid(event.position, ellipsoid);
        
        var geodesic = new Cesium.EllipsoidGeodesic();
        var startCartographic = Cesium.Cartographic.fromCartesian(pos1);
        var scratch = new Cesium.Cartographic();

        function getLinePositions() {
            return [pos1, pos2];
        }

        var redLine = viewer.entities.add({
          polyline : {
            positions : new Cesium.CallbackProperty(getLinePositions, false),
            width: 10.0,
            material: new Cesium.PolylineGlowMaterialProperty({
              color: Cesium.Color.DEEPSKYBLUE,
              glowPower: 0.25,
            }),
          }
        });

        function getMidpoint() {
          var endPoint = redLine.polyline.positions.getValue()[1];
          endCartographic = Cesium.Cartographic.fromCartesian(endPoint);

          geodesic.setEndPoints(startCartographic, endCartographic);
          var midpointCartographic = geodesic.interpolateUsingFraction(
            0.5,
            scratch
          );
          return Cesium.Cartesian3.fromRadians(
            midpointCartographic.longitude,
            midpointCartographic.latitude
          );
        }

        function getLength() {
          // Get the end position from the polyLine's callback.
          var endPoint = redLine.polyline.positions.getValue()[1];
          endCartographic = Cesium.Cartographic.fromCartesian(endPoint);

          geodesic.setEndPoints(startCartographic, endCartographic);
          var lengthInMeters = Math.round(geodesic.surfaceDistance);
          return (lengthInMeters / 1000).toFixed(1) + " km";
        }

        var label = viewer.entities.add({
          position: new Cesium.CallbackProperty(getMidpoint, false),
          label: {
            // This callback updates the length to print each frame.
            text: new Cesium.CallbackProperty(getLength, false),
            font: "20px sans-serif",
            pixelOffset: new Cesium.Cartesian2(0.0, 20),
          },
        });

        handler.setInputAction(function(movement) {
          var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
          if (cartesian) {
            pos2 = cartesian;
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);             

        handler.setInputAction(function(event) {
          handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        
        /*var geodesic = new Cesium.EllipsoidGeodesic();
        var start = Cesium.Cartographic.fromCartesian(pointslist[0]);
        var end = Cesium.Cartographic.fromCartesian(pointslist[1]);
        geodesic.setEndPoints(start, end);
        console.log('Distance 2: ' + geodesic.surfaceDistance / 1000 + ' km');*/
      }

      else if (openDropdown.id == "N") {
        var cartesian = viewer.camera.pickEllipsoid(event.position, ellipsoid);
        var cartesian2 = viewer.camera.pickEllipsoid(event.position, ellipsoid);
        pointslist.push(cartesian,cartesian2);

        function createPoint(worldPosition) {
          var point = viewer.entities.add({
            position: worldPosition,
            point: {
              color: Cesium.Color.WHITE,
              pixelSize: 5,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
          });
          return point;
        }
        createPoint(cartesian);
        
        function drawShape(positionData) {
          shape = viewer.entities.add({
            polygon: {
              hierarchy: positionData,
              material: new Cesium.ColorMaterialProperty(
                Cesium.Color.WHITE.withAlpha(0.7)
              ),
            },
          });
          return shape;
        }

        function calArea(t1, t2, t3, i) {
          var r = Math.abs(t1.x * (t2.y - t3.y) + t2.x * (t3.y - t1.y) + t3.x * (t1.y - t2.y)) / 2;
          var cartographic = new Cesium.Cartographic((t1.x + t2.x + t3.x) / 3, (t1.y + t2.y + t3.y) / 3);
          var cartesian = viewer.scene.globe.ellipsoid.cartographicToCartesian(cartographic);
          var magnitude = Cesium.Cartesian3.magnitude(cartesian);
          return r * magnitude * magnitude * Math.cos(cartographic.latitude)
        }

        function getArea(positions) {
          areaInMeters = 0;
          if (positions.length >= 3)
          {
            var points = [];
            for(var i = 0, len = positions.length; i < len; i++)
            {
                // points.push(Cesium.Cartesian2.fromCartesian3(positions[i]));
                var cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
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
                areaInMeters += calArea(points[triangles[i]], points[triangles[i + 1]], points[triangles[i + 2]]);
            }
          }
          return areaInMeters;
        }

        var dynamicPositions = new Cesium.CallbackProperty(function () {
          return new Cesium.PolygonHierarchy(pointslist);
        }, false);
        drawShape(dynamicPositions);
        var area = getArea(pointslist);
        console.log(area);

        handler.setInputAction(function(movement) {
          cartesian2 = viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
          pointslist[pointslist.length - 1] = cartesian2;

        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        
        handler.setInputAction(function(event) {
          handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      
      }      
    
      else if (openDropdown.id == "A") {
        viewer.entities.removeAll();
        pointslist = [];
      }
    }
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);