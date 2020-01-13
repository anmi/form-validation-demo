function idSection() {
	return Math.random()
		.toString()
		.slice(-8);
}
export function makeId() {
	return `${idSection()}-${idSection()}-${idSection()}`;
}

export type Id = string;
