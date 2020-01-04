import { Observable, combineLatest } from "rxjs";
import { InputCallbackProps } from "../Input";
import { map } from "rxjs/operators";

export interface InputState {
	value: string;
	error: string | null;
	isFocused: boolean;
	isVisited: boolean;
}

export class InputModel {
	constructor(
		public state: Observable<InputState>,
		public callbacks: InputCallbackProps
	) {}

	mapWith<T>(obs$: Observable<T>, fn: (a: InputState, b: T) => InputState) {
		return new InputModel(
			combineLatest(this.state, obs$).pipe(
				map(([state, obs]) => fn(state, obs))
			),
			this.callbacks
		);
	}
}
