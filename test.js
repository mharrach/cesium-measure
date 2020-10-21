var center = Cesium.Cartesian3.fromDegrees(126.884785, 37.479287, 200.0);
//viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, 4200000.0));
viewer.camera.flyTo({
  destination : Cesium.Cartesian3.fromDegrees(126.884785, 37.479287, 200.0)
});
var scene = viewer.scene
var model = scene.primitives.add(Cesium.Model.fromGltf({
    url : 'MySamples/jellyfish/scene.gltf'
  }));
var origin = Cesium.Cartesian3.fromDegrees(126.884785, 37.479287, 20.0);
var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);

var heading = 0;
var pitch = Cesium.Math.toRadians(90);
var roll = 0;
var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
var orientation = Cesium.Transforms.headingPitchRollQuaternion(
  origin,
  hpr
);
console.log(orientation);

var entity = viewer.entities.add({
  name: 'MySamples/jellyfish/scene.gltf',
  position: origin,
  orientation: orientation,
  model: {
    uri: 'MySamples/jellyfish/scene.gltf',
    minimumPixelSize: 128,
    maximumScale: 20000,
  },
});
//viewer.trackedEntity = entity; //in case of a moving object

model.readyPromise.then(function(model) {
  // Play all animations when the model is ready to render
  model.activeAnimations.addAll();
});