var mapIdClicked = null;
function onMapClick (e) {
	const mapElementId = getIdAttribute();
	const prefix = mapElementId.substring(0, mapElementId.length - 5);
	const mapElement = document.getElementById(mapElementId);
	const iterationNumber = parseInt(mapElement.dataset.map);
	const xInput = document.getElementById(prefix + '_x');
	const yInput = document.getElementById(prefix + '_y');
	if(mapData[iterationNumber].hasMarker){
		mapArray[iterationNumber].eachLayer(function (layer) {
			if (layer instanceof L.Marker) {
				mapArray[iterationNumber].removeLayer(layer);
			}
		});
	} else {
		mapData[iterationNumber].hasMarker = true;
	}
	const marker = L.marker(e.latlng).addTo(mapArray[iterationNumber]);
	xInput.value = e.latlng.lng;
	yInput.value = e.latlng.lat;
	if (marker != null) {
		mapArray[iterationNumber].removeLayer(marker);
	}
	marker.addTo(mapArray[iterationNumber]);
	mapArray[iterationNumber].panTo(e.latlng);
	document.getElementById(prefix + '_waiting').display = 'block';
	setLocation(e.latlng, prefix);
	document.getElementById(prefix + '_waiting').display = 'none';
}
async function getLocation(latlng) {
	const lat = latlng.lat;
	const lon = latlng.lng;
	const reponse = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon);
	return await reponse.json();
}

function setLocation(latlng, prefix) {
	const location  = getLocation(latlng);
	location.then(function (result) {
		const address = result.address;
		const addressElement = document.getElementById(prefix + '_address');
		const houseNumber = address.house_number ? address.house_number : "";
		const road = address.road ? address.road : "";
		const postcode = address.postcode ? address.postcode : "";
		let city = address.city ? address.city : "";
		if(city === ""){
			city = address.town ? address.town : "";
		}
		if(city === ""){
			city = address.village ? address.village : "";
		}
		addressElement.value = houseNumber + " " + road + " " + postcode + " " + city;

		const idAddressElement = document.getElementById(prefix + '_idAddress');
		idAddressElement.value = result.osm_id;
		const geometryElement = document.getElementById(prefix + '_geometry');
		geometryElement.value = result.osm_type;
	});
}
function displayLocationOnMap(inputId){
	const prefix = inputId.substring(0, inputId.length - 12);
	const idMap = prefix + '_gmap';
	const iterationNumber = parseInt(document.getElementById(idMap).dataset.map);
	const lat = document.getElementById(prefix + '_y').value;
	const lon = document.getElementById(prefix + '_x').value;
	if(lat === "" || lon === null){
		alert("Veuillez saisir une adresse");
		return;
	}
	const latlng = [lat, lon];
	if(mapData[iterationNumber].hasMarker){
		mapArray[iterationNumber].eachLayer(function (layer) {
			if (layer instanceof L.Marker) {
				mapArray[iterationNumber].removeLayer(layer);
			}
		});
	} else {
		mapData[iterationNumber].hasMarker = true;
	}
	const marker = L.marker(latlng).addTo(mapArray[iterationNumber]);
	if (marker != null) {
		mapArray[iterationNumber].removeLayer(marker);
	}
	marker.addTo(mapArray[iterationNumber]);
	mapArray[iterationNumber].panTo(latlng);

}
function setIdAttribute(idAttribute){
	mapIdClicked = idAttribute;
}
function getIdAttribute(){
	return mapIdClicked;
}