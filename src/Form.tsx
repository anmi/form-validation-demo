import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Input, InputCallbackProps } from "./Input";
import { withRX } from "@devexperts/react-kit/dist/utils/with-rx2";
import { createHandler } from "@devexperts/rx-utils/dist/create-handler.utils";
import { InputState, InputModel } from "./model/InputState";
import { startWith, map, mapTo } from "rxjs/operators";
import { combineLatest } from "rxjs";
import { arrayModels, ItemWrapper, ModelsCallbacks } from "./utils/arrayModels";

type AppFormProps = {
	name: InputState;
	nameCallbacks: InputCallbackProps;
	password: InputState;
	passwordCallbacks: InputCallbackProps;
	confirmPassword: InputState;
	confirmPasswordCallbacks: InputCallbackProps;
	accounts: ItemWrapper<InputState>[];
	accountsCallbacks: ModelsCallbacks<InputCallbackProps>;
};

const defaultInputState: InputState = {
	value: "",
	error: null,
	isFocused: false,
	isVisited: false
};

const AppFormRaw: React.FC<AppFormProps> = props => {
	return (
		<div>
			<Input name="Name" state={props.name} {...props.nameCallbacks} />
			<Input
				name="Password"
				state={props.password}
				{...props.passwordCallbacks}
			/>
			<Input
				name="ConfirmPassword"
				state={props.confirmPassword}
				{...props.confirmPasswordCallbacks}
			/>
			<button onClick={props.accountsCallbacks.add}>add</button>
			{props.accounts.map(account => {
				return (
					<div key={account.id}>
						<Input
							name="Sitename"
							state={account.state}
							{...props.accountsCallbacks.item(account.id)}
						/>
					</div>
				);
			})}
		</div>
	);
};

interface InputModelItem {
	id: string;
	model: InputState;
}
// type InputModelOperator = (from: InputModelItem[]) => InputModelItem[];

// function arrayModels(_models: InputModel[]) {
// 	const bs = new BehaviorSubject<InputModelOperator>(a => a);

// 	const values$ = bs.pipe(
// 		scan((state, fn) => fn(state), [] as InputModelItem[])
// 	);

// 	let callbacks: { [id: string]: InputCallbackProps } = {};
// 	let subscriptions: { [id: string]: Subscription } = {};

// 	return {
// 		values$,
// 		callbacks: {
// 			item: (id: string) => {
// 				return callbacks[id];
// 			},
// 			add: () => {
// 				const id = makeId();
// 				const model = createNonNullableInput();
// 				callbacks[id] = model.callbacks;
// 				bs.next(as => [
// 					...as.filter(a => a.id !== id),
// 					{ id, model: defaultInputState }
// 				]);

// 				subscriptions[id] = model.state$.subscribe(model => {
// 					bs.next(as => [
// 						...as.filter(a => a.id !== id),
// 						{ id, model }
// 					]);
// 				});
// 			},
// 			remove: (id: string) => {
// 				subscriptions[id].unsubscribe();
// 				delete subscriptions[id];
// 				bs.next(as => as.filter(a => a.id !== id));
// 			}
// 		}
// 	};
// }

function createNonNullableInput(): InputModel {
	const valueHandler = createHandler<string>();
	const value$ = valueHandler.value$.pipe(startWith(""));
	const focused = createHandler<boolean>();
	const focused$ = focused.value$.pipe(startWith(false));
	const visited$ = focused.value$.pipe(mapTo(true), startWith(false));

	const error$ = combineLatest(value$, focused$, visited$).pipe(
		map(([value, focused, visited]) => {
			if (value === "" && !focused && visited) {
				return "Empty!";
			} else {
				return null;
			}
		})
	);

	const state$ = combineLatest(error$, value$, focused$, visited$).pipe(
		map(([error, value, isFocused, isVisited]) => ({
			error,
			value,
			isFocused,
			isVisited
		}))
	);

	return new InputModel(state$, {
		onBlur: () => focused.handle(false),
		onFocus: () => focused.handle(true),
		onChange: value => valueHandler.handle(value)
	});
}

function createAccount() {
	const sitename = createNonNullableInput();
	const username = createNonNullableInput();

	return {
		sitename,
		username
	};
}

export const AppForm = withRX(AppFormRaw)(_props$ => {
	const name = createNonNullableInput();
	const password = createNonNullableInput();
	const confirmPassword = createNonNullableInput().mapWith(
		password.state,
		(confirm, password) => {
			return {
				...confirm,
				error: confirm.error
					? confirm.error
					: confirm.value !== password.value &&
					  confirm.isVisited &&
					  !confirm.isFocused
					? "Passwords didn't match"
					: null
			};
		}
	);
	const accounts = arrayModels(defaultInputState, () =>
		createNonNullableInput()
	);

	return {
		defaultProps: {
			name: defaultInputState,
			nameCallbacks: name.callbacks,
			password: defaultInputState,
			passwordCallbacks: password.callbacks,
			confirmPassword: defaultInputState,
			confirmPasswordCallbacks: confirmPassword.callbacks,
			accounts: [],
			accountsCallbacks: accounts.callbacks
		},
		props: {
			name: name.state,
			password: password.state,
			confirmPassword: confirmPassword.state,
			accounts: accounts.values$
		}
	};
});
