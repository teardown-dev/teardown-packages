// Example GeoJSON LineString
const geoJson = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [
      [-101.744384, 39.32155],
      [-101.552124, 39.330048],
      [-101.403808, 39.330048],
      [-101.332397, 39.364032],
      // Add more coordinates as needed
    ],
  },
};

// Function to convert GeoJSON LineString to GPX format
function convertGeoJsonToGpx(geoJson: any): string {
  if (geoJson.geometry.type !== "LineString") {
    throw new Error("The GeoJSON must be a LineString.");
  }

  const gpxStart =
    '<?xml version="1.0"?>\n<gpx version="1.1" creator="ReactNativeCodeGuru">\n<trk>\n<trkseg>\n';
  const gpxEnd = "</trkseg>\n</trk>\n</gpx>";

  const gpxPoints = geoJson.geometry.coordinates
    .map((coord: [number, number]) => {
      return `  <trkpt lat="${coord[1]}" lon="${coord[0]}"></trkpt>`;
    })
    .join("\n");

  return gpxStart + gpxPoints + gpxEnd;
}

const gpxData = convertGeoJsonToGpx(geoJson);

console.log(gpxData);
