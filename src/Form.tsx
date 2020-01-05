import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Input, InputCallbackProps } from "./Input";
import { withRX } from "@devexperts/react-kit/dist/utils/with-rx2";
import { createHandler } from "@devexperts/rx-utils/dist/create-handler.utils";
import { InputState, InputModel } from "./model/InputState";
import { startWith, map, mapTo, switchMap, filter } from "rxjs/operators";
import { combineLatest, from, Observable, of, merge } from "rxjs";
import { arrayModels, ItemWrapper, ModelsCallbacks } from "./utils/arrayModels";
import { Form, Col, Button } from "react-bootstrap";
import { submitForm } from "./services/form";
import { FormInputResponse, isFormResponseFailure } from "./model/formModel";

type AppFormProps = {
	name: InputState;
	nameCallbacks: InputCallbackProps;
	password: InputState;
	passwordCallbacks: InputCallbackProps;
	confirmPassword: InputState;
	confirmPasswordCallbacks: InputCallbackProps;
	accounts: ItemWrapper<AccountState>[];
	accountsCallbacks: ModelsCallbacks<AccountCallbacks>;
	submitForm: () => void;
};

const defaultInputState: InputState = {
	value: "",
	error: null,
	isFocused: false,
	isVisited: false
};

type AccountState = { sitename: InputState; username: InputState };

type AccountCallbacks = {
	sitename: InputCallbackProps;
	username: InputCallbackProps;
};

const defaultAccountState: AccountState = {
	sitename: defaultInputState,
	username: defaultInputState
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
			<Form.Row as={Col}>
				<Col>
					<Form.Label>Accounts:</Form.Label>
				</Col>
			</Form.Row>
			{props.accounts.map(account => {
				return (
					<div key={account.id}>
						<Form.Row>
							<Col>
								<Input
									name="Sitename"
									state={account.state.sitename}
									{...props.accountsCallbacks.item(account.id)
										.sitename}
									showLabel={false}
								/>
							</Col>
							<Col>
								<Input
									name="Username"
									state={account.state.username}
									{...props.accountsCallbacks.item(account.id)
										.username}
									showLabel={false}
								/>
							</Col>
							<Col>
								<Button
									variant="dark"
									onClick={props.accountsCallbacks.remove(
										account.id
									)}
								>
									Remove
								</Button>
							</Col>
						</Form.Row>
					</div>
				);
			})}
			<Form.Group as={Col}>
				<Button variant="primary" onClick={props.accountsCallbacks.add}>
					Add account
				</Button>
			</Form.Group>
			<Form.Group as={Col}>
				<Button variant="primary" onClick={props.submitForm}>
					Submit
				</Button>
			</Form.Group>
		</div>
	);
};

function createNonNullableInput(
	serverResponse$: Observable<FormInputResponse>
): InputModel<InputState, InputCallbackProps> {
	const valueHandler = createHandler<string>();
	const value$ = valueHandler.value$.pipe(startWith(""));
	const focused = createHandler<boolean>();
	const focused$ = focused.value$.pipe(startWith(false));
	const visited$ = focused.value$.pipe(mapTo(true), startWith(false));

	const userError$ = combineLatest(value$, focused$, visited$).pipe(
		map(([value, focused, visited]) => {
			if (value === "" && !focused && visited) {
				return "Empty!";
			} else {
				return null;
			}
		})
	);
	const serverError$ = merge(
		serverResponse$.pipe(
			map(r => (r.error ? r.error : null)),
			startWith(null)
		),
		focused$.pipe(mapTo(null))
	);

	const error$ = combineLatest(serverError$, userError$).pipe(
		map(([user, server]) => user || server)
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
	const sitename = createNonNullableInput(of({ value: "" }));
	const username = createNonNullableInput(of({ value: "" }));

	const state = combineLatest(sitename.state, username.state).pipe(
		map(([sitename, username]) => ({ sitename, username }))
	);

	return new InputModel<AccountState, AccountCallbacks>(state, {
		sitename: sitename.callbacks,
		username: username.callbacks
	});
}

export const AppForm = withRX(AppFormRaw)(_props$ => {
	const submitHandler = createHandler<void>();
	const formResponse = submitHandler.value$.pipe(
		switchMap(() =>
			from(
				submitForm({
					name: "sdf",
					password: "pass",
					confirmPassword: "sdf",
					accounts: []
				})
			)
		)
	);

	const serverErrors = formResponse.pipe(filter(isFormResponseFailure));

	const name = createNonNullableInput(
		serverErrors.pipe(map(r => r.errors.name))
	);
	const password = createNonNullableInput(
		serverErrors.pipe(map(r => r.errors.password))
	);
	const confirmPassword = createNonNullableInput(
		serverErrors.pipe(map(r => r.errors.confirmPassword))
	).mapWith(password.state, (confirm, password) => {
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
	});
	const accounts = arrayModels(defaultAccountState, createAccount);

	return {
		defaultProps: {
			name: defaultInputState,
			nameCallbacks: name.callbacks,
			password: defaultInputState,
			passwordCallbacks: password.callbacks,
			confirmPassword: defaultInputState,
			confirmPasswordCallbacks: confirmPassword.callbacks,
			accounts: [],
			accountsCallbacks: accounts.callbacks,
			submitForm: () => {
				submitHandler.handle();
			}
		},
		props: {
			name: name.state,
			password: password.state,
			confirmPassword: confirmPassword.state,
			accounts: accounts.values$
		}
	};
});
