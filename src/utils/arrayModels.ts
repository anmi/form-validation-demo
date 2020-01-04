import { scan } from "rxjs/operators";
import { BehaviorSubject, Observable, Subscription } from "rxjs";

function makeId() {
	return `${Math.random()}-${Math.random()}-${Math.random()}`;
}

export type ItemWrapper<T> = {
	id: string;
	state: T;
};

type Operator<T> = (from: ItemWrapper<T>[]) => ItemWrapper<T>[];

export function arrayModels<TState, TCallbacks>(
	defaultState: TState,
	create: () => { state: Observable<TState>; callbacks: TCallbacks }
) {
	const bs = new BehaviorSubject<Operator<TState>>(a => a);

	const values$ = bs.pipe(
		scan((state, fn) => fn(state), [] as ItemWrapper<TState>[])
	);

	let callbacks: { [id: string]: TCallbacks } = {};
	let subscriptions: { [id: string]: Subscription } = {};

	return {
		values$,
		callbacks: {
			item: (id: string) => {
				return callbacks[id];
			},
			add: () => {
				const id = makeId();
				const model = create();
				callbacks[id] = model.callbacks;
				bs.next(as => [
					...as.filter(a => a.id !== id),
					{ id, state: defaultState }
				]);

				subscriptions[id] = model.state.subscribe(state => {
					bs.next(as => [
						...as.filter(a => a.id !== id),
						{ id, state }
					]);
				});
			},
			remove: (id: string) => {
				subscriptions[id].unsubscribe();
				delete subscriptions[id];
				bs.next(as => as.filter(a => a.id !== id));
			}
		}
	};
}

export type ModelsCallbacks<TCallbacks> = {
	item(id: string): TCallbacks;
	add(): void;
	remove(id: string): void;
};
