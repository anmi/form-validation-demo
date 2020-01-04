import { Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";

export interface InputState {
	value: string;
	error: string | null;
	isFocused: boolean;
	isVisited: boolean;
}

export class InputModel<TState, TCallbacks> {
	constructor(
		public state: Observable<TState>,
		public callbacks: TCallbacks
	) {}

	mapWith<T>(obs$: Observable<T>, fn: (a: TState, b: T) => TState) {
		return new InputModel(
			combineLatest(this.state, obs$).pipe(
				map(([state, obs]) => fn(state, obs))
			),
			this.callbacks
		);
	}
}
