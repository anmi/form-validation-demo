export function validateHostname(hostname: string) {
	const regex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/g;

	if (hostname.match(regex)) {
		return null;
	} else {
		return "Invalid hostname format";
	}
}

export function validateNonEmpty(value: string) {
	if (value === "") {
		return "Should not be empty";
	} else {
		return null;
	}
}
