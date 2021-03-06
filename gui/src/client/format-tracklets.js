function compare(a,b) {
	if (a[2] < b[2])
		return -1;
	if (a[2] > b[2])
		return 1;
	return 0;
}

export function formatTracklets(trackableObjectsArray, loopTime, loopLength) {

	for (var i=0; i < trackableObjectsArray.length; i++) { // go through each trackableObject in trackableObjectsArray

		var trackableObject = trackableObjectsArray[i];
		
		// if (trackableObject.rw_coords.length < 2) {
		// 	continue; // if there's only one position, there's no point in trying to track it
		// }

		// console.log(trackableObject.objectID);
		
		var start_timestamp; 
		var end_timestamp;
		var start_lng;
		var start_lat;
		var end_lng;
		var end_lat;

		var useable = false;

		// Sort the tracklets by frame_timestamp
		var tracklets = trackableObject.tracklets; // get each tracklet for this trackableObject with each frame_timestamp
		if(!trackableObject.sorted) { // only sort if it hasn't been sorted yet
			tracklets.sort(compare); // sort trackable by frame_timestamp
			trackableObject.tracklets = tracklets; // change "tracklets" property to the sorted version
			trackableObject.sorted = true; // mark it as sorted
			trackableObjectsArray[i] = trackableObject // update its version in the main array
		}

	}

	// trackableObjectsArray = truncateTimestamp(trackableObjectsArray, loopTime, loopLength);
	return trackableObjectsArray;
}

function truncateTimestamp(trackableObjectsArray, loopTime, loopLength) {

	for (var i=0; i < trackableObjectsArray.length; i++) { // go through each trackableObject in trackableObjectsArray

		var trackableObject = trackableObjectsArray[i];
		var tracklets = trackableObject.tracklets; // get each tracklet for this trackableObject with each frame_timestamp
		for (var j=0; j < tracklets.length-1; j++) { // go through all the recorded coordinates of that trackable object

			var frame_timestamp = tracklets[j][2];

			frame_timestamp = frame_timestamp / 1000;

			tracklets[j][2] = ((frame_timestamp % loopTime) / loopTime) * loopLength;

		}
		
		// attach modified tracklets to trackableObject
		trackableObject.tracklets = tracklets;

		// attach modified trackableObject to trackableObjectsArray
		trackableObjectsArray[i] = trackableObject;

	}

	return trackableObjectsArray;
	
}


export function interpolateTracklets(sortedTrackletsOfObject, clockTimestamp, ruler) { // argument is tracklets of single object that are sorted by timestamp (t1,t2 ...)
	for (var j=0; j < sortedTrackletsOfObject.length-1; j++) { // go through all the recorded coordinates of that trackable object
		
		// console.log("sortedTrackletsOfObject[j].frame_timestamp");
		// console.log(sortedTrackletsOfObject[j].frame_timestamp);
		// console.log("clockTimestamp");
		// console.log(clockTimestamp);
		// console.log("clockTimestamp - sortedTrackletsOfObject[j].frame_timestamp");
		// console.log(clockTimestamp - sortedTrackletsOfObject[j].frame_timestamp);

		var useable = false;
		
		if (sortedTrackletsOfObject[j][2] <= clockTimestamp && clockTimestamp < sortedTrackletsOfObject[j+1][2]) { // if the clockTimestamp is between the timestamp of two successive coordinates..

			/* console.log("inside j");
			   console.log(j); */

			// .. set the local variables to these coordinates
			var start_timestamp = sortedTrackletsOfObject[j][2];
			var end_timestamp = sortedTrackletsOfObject[j+1][2];
			
			var start_lng = sortedTrackletsOfObject[j][0];
			var start_lat = sortedTrackletsOfObject[j][1];
			
			var end_lng = sortedTrackletsOfObject[j+1][0];
			var end_lat = sortedTrackletsOfObject[j+1][1];
			
			useable = true; // let the next block know it can run
			
			break; // no need to continue
		}
	}

	if (useable == true) {
		// console.log(start_lng);
		// console.log(end_lng);
		// console.log(start_lat);
		// console.log(end_lat);
		var line = [[start_lng, start_lat], [end_lng, end_lat]];
		var distance = ruler.distance(line[0], line[1]);
		// console.log(distance);
		var progress = (clockTimestamp-start_timestamp) / (end_timestamp-start_timestamp);
		// console.log(progress);
		var distance_along = progress*distance;
		// console.log(distance_along);
		var point = ruler.along(line, distance_along);
		
		// console.log("point");
		// console.log(point);

		// return [point[0], point[1], clockTimestamp];
		return {"lng": point[0], "lat": point[1]};
		
	} else {
		return null;
	}
}

export function interpolatePositionAndBearing(sortedTrackletsOfObject, clockTimestamp, ruler, inMilliseconds) { // Only to be used with tracklets sorted by timestamp (t1,t2 ...)

	var advance;
	var bearing;
	
	if (inMilliseconds == true) {
		advance = 2;
	} else {
		advance = 0.002;
	}

	const interpolatedCurrentPosition = interpolateTracklets(sortedTrackletsOfObject, clockTimestamp, ruler);
	// get the next position 
	const interpolatedNextPosition = interpolateTracklets(sortedTrackletsOfObject, clockTimestamp+advance, ruler);

	if (interpolatedCurrentPosition !== null && interpolatedNextPosition !== null) {
		
		// determine bearing
		// ruler.bearing([longitude, latitude], [longitude, latitude]): Returns the bearing between two points in angles.
		bearing = ruler.bearing( [interpolatedCurrentPosition.lng, interpolatedCurrentPosition.lat], [interpolatedNextPosition.lng, interpolatedNextPosition.lat] )

		return [interpolatedCurrentPosition, bearing];

	} else {
		return [null, null];
	}

	
}
