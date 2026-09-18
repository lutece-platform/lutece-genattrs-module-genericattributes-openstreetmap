(function () {
	if (window.osmInitMap) {
		return;
	}
	const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	const OPTIONS = {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		minZoom: 0,
		maxZoom: 18
	};
	const DEFAULT_CENTER = [48.853, 2.35];
	const maps = {};

	function field(prefix, suffix) {
		return document.getElementById(prefix + suffix);
	}

	function addressElement(prefix) {
		return field(prefix, '_address') || field(prefix, '');
	}

	function addressInput(prefix) {
		const element = addressElement(prefix);
		if (!element) {
			return null;
		}
		return element.querySelector('.lutece-autocomplete-search-input') || element;
	}

	function isSet(value) {
		return value !== undefined && value !== null && value !== '' && value !== '0';
	}

	function toLatLng(x, y) {
		return isSet(x) && isSet(y) ? [y, x] : null;
	}

	function coordinates(prefix) {
		const x = field(prefix, '_x');
		const y = field(prefix, '_y');
		return x && y ? toLatLng(x.value, y.value) : null;
	}

	function placeMarker(prefix, latlng, zoom) {
		const state = maps[prefix];
		if (state.marker) {
			state.map.removeLayer(state.marker);
		}
		state.marker = L.marker(latlng).addTo(state.map);
		state.map.panTo(latlng);
		if (zoom) {
			state.map.setZoom(zoom);
		}
	}

	function onMapClick(prefix, latlng) {
		placeMarker(prefix, latlng);
		field(prefix, '_x').value = latlng.lng;
		field(prefix, '_y').value = latlng.lat;
		setLocation(prefix, latlng);
	}

	function displayLocation(prefix, noAddressMessage) {
		const latlng = coordinates(prefix);
		if (!latlng) {
			alert(noAddressMessage);
			return;
		}
		placeMarker(prefix, latlng, 15);
	}

	function notifySelection(prefix, latlng, result) {
		const element = addressElement(prefix);
		if (!element) {
			return;
		}
		element.classList.add('wssuggest');
		if (window.SuggestPOI && window.SuggestPOI.EVT_SELECT) {
			element.dispatchEvent(new CustomEvent(window.SuggestPOI.EVT_SELECT, {
				detail: { poi: { id: result.osm_id || '', type: result.osm_type || '', x: latlng.lng, y: latlng.lat } }
			}));
		}
	}

	async function setLocation(prefix, latlng) {
		const response = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + latlng.lat + '&lon=' + latlng.lng);
		const result = await response.json();
		const address = result.address || {};
		const city = address.city || address.town || address.village || '';
		const input = addressInput(prefix);
		if (input) {
			input.value = [address.house_number, address.road, address.postcode, city].filter(Boolean).join(' ');
		}
		const idAddress = field(prefix, '_idAddress');
		if (idAddress) {
			idAddress.value = result.osm_id || '';
		}
		const geometry = field(prefix, '_geometry');
		if (geometry) {
			geometry.value = result.osm_type || '';
		}
		notifySelection(prefix, latlng, result);
	}

	window.osmInitMap = function (prefix, readOnly, x, y) {
		const mapElement = field(prefix, '_gmap');
		if (!mapElement || maps[prefix]) {
			return;
		}
		const latlng = readOnly ? toLatLng(x, y) || coordinates(prefix) : coordinates(prefix);
		const map = L.map(mapElement).setView(latlng || DEFAULT_CENTER, latlng ? 15 : 10);
		L.tileLayer(TILES, OPTIONS).addTo(map);
		maps[prefix] = { map: map, marker: null };
		if (latlng) {
			placeMarker(prefix, latlng);
		}
		if (readOnly) {
			return;
		}
		map.on('click', (e) => onMapClick(prefix, e.latlng));
		const button = field(prefix, '_gmap_button');
		button.addEventListener('click', () => displayLocation(prefix, button.dataset.noAddress));
		const input = addressInput(prefix);
		if (input) {
			input.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					button.click();
				}
			});
		}
	};
})();
