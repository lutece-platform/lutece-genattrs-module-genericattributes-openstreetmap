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

	// The map elements (_gmap, _gmap_button, _gmap_status) are named with the prefix given to osmInitMap. The fields
	// of the question (_x, _y, _idAddress, _geometry, address) are named by the plugin of the form: plugin-forms uses
	// the same prefix (nIt0_attribute<id>), plugin-appointment the id of the entry alone (<id>_x).
	function resolveFieldsPrefix(prefix) {
		if (field(prefix, '_x')) {
			return prefix;
		}
		const entryId = prefix.replace(/^(?:nIt\d+_)?attribute/, '');
		return entryId !== prefix && field(entryId, '_x') ? entryId : prefix;
	}

	function fieldsPrefix(prefix) {
		const state = maps[prefix];
		return state ? state.fields : resolveFieldsPrefix(prefix);
	}

	function questionField(prefix, suffix) {
		return field(fieldsPrefix(prefix), suffix);
	}

	// Address container: <prefix>_address (back office, appointment), <prefix>_autocomplete (front office of
	// plugin-forms, address autocomplete), <prefix> (hidden address of the map only edit modes)
	function addressElement(prefix) {
		return questionField(prefix, '_address') || questionField(prefix, '_autocomplete') || questionField(prefix, '');
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

	// coordinates stored as text: a value that is not a number (typed or forged) gives no position
	function toLatLng(x, y) {
		return isSet(x) && isSet(y) && isFinite(Number(x)) && isFinite(Number(y)) ? [Number(y), Number(x)] : null;
	}

	function coordinates(prefix) {
		const x = questionField(prefix, '_x');
		const y = questionField(prefix, '_y');
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
		const x = questionField(prefix, '_x');
		const y = questionField(prefix, '_y');
		if (x && y) {
			x.value = latlng.lng;
			y.value = latlng.lat;
		}
		setLocation(prefix, latlng);
	}

	// writes a message, as text, in the status region of the map (announced by the screen readers)
	function announce(prefix, message) {
		const status = field(prefix, '_gmap_status');
		if (status) {
			status.textContent = message || '';
		}
	}

	function displayLocation(prefix, noAddressMessage) {
		const latlng = coordinates(prefix);
		if (!latlng) {
			announce(prefix, noAddressMessage);
			return;
		}
		announce(prefix, '');
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

	// reverse geocoding of the point clicked; null when Nominatim finds no address (sea, error body) or cannot be reached
	async function reverseGeocode(latlng) {
		try {
			const response = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + latlng.lat + '&lon=' + latlng.lng);
			if (!response.ok) {
				return null;
			}
			const result = await response.json();
			return result && !result.error && result.address ? result : null;
		} catch (e) {
			return null;
		}
	}

	async function setLocation(prefix, latlng) {
		const button = field(prefix, '_gmap_button');
		const result = await reverseGeocode(latlng);
		const address = result ? result.address : {};
		const city = address.city || address.town || address.village || '';
		const label = [address.house_number, address.road, address.postcode, city].filter(Boolean).join(' ');
		if (!label) {
			// no address at this point: the address already chosen is kept, the user is told
			announce(prefix, button && button.dataset.addressNotFound ? button.dataset.addressNotFound : '');
			return;
		}
		const input = addressInput(prefix);
		if (input) {
			input.value = label;
		}
		announce(prefix, label && button && button.dataset.addressFound ? button.dataset.addressFound + ' ' + label : label);
		const idAddress = questionField(prefix, '_idAddress');
		if (idAddress) {
			idAddress.value = result.osm_id || '';
		}
		const geometry = questionField(prefix, '_geometry');
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
		const fields = resolveFieldsPrefix(prefix);
		maps[prefix] = { map: null, marker: null, fields: fields };
		const latlng = readOnly ? toLatLng(x, y) || coordinates(prefix) : coordinates(prefix);
		const map = L.map(mapElement).setView(latlng || DEFAULT_CENTER, latlng ? 15 : 10);
		L.tileLayer(TILES, OPTIONS).addTo(map);
		maps[prefix].map = map;
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
