import { scan } from "rxjs/operators";
import { BehaviorSubject, Observable, Subscription, empty, of } from "rxjs";

function idSection() {
	return Math.random()
		.toString()
		.slice(-8);
}
function makeId() {
	return `${idSection()}-${idSection()}-${idSection()}`;
}

export type ItemWrapper<T> = {
	id: string;
	state: T;
};

type Operator<T> = (from: ItemWrapper<T>[]) => ItemWrapper<T>[];

function updateItemState<TState>(
	arr: ItemWrapper<TState>[],
	id: string,
	state: TState
) {
	return arr.map(item => (item.id === id ? { id, state } : item));
}

export function arrayModels<TState, TCallbacks, TResponse>(
	defaultState: TState,
	create: (
		serverResponse: Observable<TResponse>
	) => { state: Observable<TState>; callbacks: TCallbacks },
	serverResponse: Observable<TResponse[]>
) {
	const bs = new BehaviorSubject<Operator<TState>>(a => a);

	const values$ = bs.pipe(
		scan((state, fn) => fn(state), [] as ItemWrapper<TState>[])
	);

	function unsubInputs() {
		Object.keys(subscriptions).forEach(id => {
			subscriptions[id].unsubscribe();
			delete subscriptions[id];
			bs.next(_ => []);
		});
	}

	function add(response: Observable<TResponse>) {
		const id = makeId();
		const model = create(response);
		callbacks[id] = model.callbacks;
		bs.next(as => [
			...as.filter(a => a.id !== id),
			{ id, state: defaultState }
		]);

		subscriptions[id] = model.state.subscribe(state => {
			bs.next(as => updateItemState(as, id, state));
		});
	}

	const serverResponseSubscription = serverResponse.subscribe(sr => {
		unsubInputs();
		sr.forEach(r => {
			add(of(r));
		});
	});

	let callbacks: { [id: string]: TCallbacks } = {};
	let subscriptions: { [id: string]: Subscription } = {};

	return {
		state: new Observable<ItemWrapper<TState>[]>(r => {
			const subscr = values$.subscribe(values => {
				r.next(values);
			});
			return () => {
				unsubInputs();
				subscr.unsubscribe();
				serverResponseSubscription.unsubscribe();
			};
		}),
		callbacks: {
			item: (id: string) => {
				return callbacks[id];
			},
			add: () => {
				add(empty());
			},
			remove: (id: string) => {
				return () => {
					subscriptions[id].unsubscribe();
					delete subscriptions[id];
					bs.next(as => as.filter(a => a.id !== id));
				};
			}
		}
	};
}

export type ModelsCallbacks<TCallbacks> = {
	item(id: string): TCallbacks;
	add(): void;
	remove(id: string): () => void;
};
