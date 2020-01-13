import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Input } from "./Input";
import { withRX } from "@devexperts/react-kit/dist/utils/with-rx2";
import { createHandler } from "@devexperts/rx-utils/dist/create-handler.utils";
import {
	startWith,
	map,
	mapTo,
	switchMap,
	filter,
	withLatestFrom,
	scan,
	shareReplay
} from "rxjs/operators";
import { combineLatest, from, Observable, merge, BehaviorSubject } from "rxjs";
import { Form, Col, Button } from "react-bootstrap";
import { submitFormMapped } from "./services/form";
import { isFormResponseFailureMapped } from "./model/formModel";
import { makeId, Id } from "./utils/makeId";
import { combineLatestArray } from "./utils/combineLatestArray";
import { validateHostname } from "./utils/validators";

type AccountProps = {
	id: Id;
	sitename: InputProps;
	username: InputProps;
};

type AppFormProps = {
	name: InputProps;
	password: InputProps;
	confirmPassword: InputProps;
	accounts: AccountProps[];
	isSending: boolean;
	onAddAccountClick: () => void;
	onRemoveAccountClick: (id: Id) => void;
	onSubmitClick: () => void;
};

type AccountState2 = { id: Id; sitename: InputModel2; username: InputModel2 };

const AppFormRaw: React.FC<AppFormProps> = props => {
	const {
		name,
		password,
		confirmPassword,
		accounts,
		isSending,
		onAddAccountClick,
		onRemoveAccountClick,
		onSubmitClick
	} = props;
	return (
		<div>
			<Input name="Name" {...name} disabled={isSending} />
			<Input name="Password" {...password} disabled={isSending} />
			<Input
				name="ConfirmPassword"
				{...confirmPassword}
				disabled={isSending}
			/>
			<Form.Row as={Col}>
				<Col>
					<Form.Label>Accounts:</Form.Label>
				</Col>
			</Form.Row>
			{accounts.map(account => {
				return (
					<div key={account.id}>
						<Form.Row>
							<Col>
								<Input
									name="Sitename"
									{...account.sitename}
									showLabel={false}
									disabled={isSending}
								/>
							</Col>
							<Col>
								<Input
									name="Username"
									{...account.username}
									showLabel={false}
									disabled={isSending}
								/>
							</Col>
							<Col>
								<Button
									variant="dark"
									onClick={() =>
										onRemoveAccountClick(account.id)
									}
									disabled={isSending}
								>
									Remove
								</Button>
							</Col>
						</Form.Row>
					</div>
				);
			})}
			<Form.Group as={Col}>
				<Button
					variant="primary"
					onClick={onAddAccountClick}
					disabled={isSending}
				>
					Add account
				</Button>
			</Form.Group>
			<Form.Group as={Col}>
				<Button
					variant="primary"
					onClick={onSubmitClick}
					disabled={isSending}
				>
					Submit
				</Button>
			</Form.Group>
		</div>
	);
};

type Operator<T> = (from: T) => T;

type InputModel2 = {
	value$: Observable<string>;
	isFocused$: Observable<boolean>;
	isVisited$: Observable<boolean>;
	onChange: (value: string) => void;
	onBlur: () => void;
	onFocus: () => void;
};

function createInputModel(): InputModel2 {
	const valueHandler = createHandler<string>();
	const focused = createHandler<boolean>();
	const isFocused$ = focused.value$.pipe(startWith(false), shareReplay(1));
	const isVisited$ = focused.value$.pipe(
		mapTo(true),
		startWith(false),
		shareReplay(1)
	);

	return {
		value$: valueHandler.value$.pipe(startWith(""), shareReplay(1)),
		isFocused$,
		isVisited$,
		onChange: value => valueHandler.handle(value),
		onBlur: () => focused.handle(false),
		onFocus: () => focused.handle(true)
	};
}

function createAccountModel() {
	return {
		sitename: createInputModel(),
		username: createInputModel()
	};
}

type ListItemWrapper<T> = {
	id: string;
	item: T;
};

type AccountsState = ListItemWrapper<AccountState2>[];

type List = {
	list$: Observable<AccountsState>;
	onAddClick: () => void;
	onRemoveClick: (id: Id) => void;
};

function createAccountsList(): List {
	const listReducers = new BehaviorSubject<Operator<AccountsState>>(a => a);
	const list$ = listReducers.pipe(
		startWith((a: AccountsState) => a),
		scan((state, fn) => fn(state), [] as AccountsState),
		shareReplay(1)
	);
	const onAddClick = () => {
		const id = makeId();
		listReducers.next(list => [
			...list,
			{ id, item: createAccountModel() } as ListItemWrapper<AccountState2>
		]);
	};
	const onRemoveClick = (id: Id) =>
		listReducers.next(list => list.filter(item => item.id !== id));

	return {
		list$,
		onAddClick,
		onRemoveClick
	};
}

function defaultInputProps(): InputProps {
	return {
		value: "",
		error: null,
		onChange: (_: string) => undefined,
		onBlur: () => undefined,
		onFocus: () => undefined
	};
}

interface InputProps {
	value: string;
	error: string | null;
	onChange: (value: string) => void;
	onBlur: () => void;
	onFocus: () => void;
}

function makeInputProps(
	input: InputModel2,
	serverResponse$: Observable<string | undefined>,
	userError$: Observable<string | null>
): Observable<InputProps> {
	const { value$, isFocused$, onFocus, onBlur, onChange } = input;
	const serverError$ = merge(
		serverResponse$.pipe(
			map(r => (r ? r : null)),
			startWith(null)
		),
		isFocused$.pipe(
			filter(focused => focused),
			mapTo(null)
		)
	);

	const error$ = combineLatest(serverError$, userError$).pipe(
		map(([user, server]) => user || server)
	);

	const props$ = combineLatest(value$, error$).pipe(
		map(([value, error]) => ({
			value,
			error,
			onChange,
			onFocus,
			onBlur
		}))
	);

	return props$;
}

function nonNullableInput(
	input: InputModel2,
	serverResponse$: Observable<string | undefined>
): Observable<InputProps> {
	return makeInputProps(input, serverResponse$, getNonEmptyError(input));
}

function lostFocusError(
	input: InputModel2,
	validate: (value: string) => string | null
) {
	return combineLatest(input.value$, input.isFocused$, input.isVisited$).pipe(
		map(([value, isFocused, isVisited]) =>
			!isFocused && isVisited ? validate(value) : null
		)
	);
}

function getNonEmptyError(input: InputModel2) {
	return lostFocusError(input, value => (value === "" ? "Empty!" : null));
}

function shouldMatchError(input: InputModel2, input2: InputModel2) {
	return combineLatest(
		input.value$,
		input.isFocused$,
		input.isVisited$,
		input2.value$
	).pipe(
		map(([value, isFocused, isVisited, value2]) =>
			value !== value2 && !isFocused && isVisited
				? "Passwords should match"
				: null
		)
	);
}

function combineErrors(...errors$: Observable<string | null>[]) {
	return combineLatestArray(errors$).pipe(
		map(errors => errors.reduce((c, error) => c || error, null))
	);
}

export const AppForm = withRX(AppFormRaw)(_props$ => {
	const name = createInputModel();
	const password = createInputModel();
	const confirmPassword = createInputModel();
	const accountsList = createAccountsList();

	const formData = combineLatest(
		name.value$,
		password.value$,
		confirmPassword.value$,
		accountsList.list$
	).pipe(
		switchMap(([name, password, confirmPassword, list]) =>
			combineLatestArray(
				list.map(itm => {
					return combineLatest(
						itm.item.sitename.value$,
						itm.item.username.value$
					).pipe(
						map(([sitename, username]) => ({
							sitename,
							username,
							id: itm.id
						}))
					);
				})
			).pipe(
				startWith([]),
				map(accounts => ({
					name,
					password,
					confirmPassword,
					accounts
				}))
			)
		)
	);

	const submitHandler = createHandler<void>();

	const serverResponse$ = submitHandler.value$
		.pipe(withLatestFrom(formData))
		.pipe(
			switchMap(([_, data]) => from(submitFormMapped(data))),
			shareReplay(1)
		);

	const isSending$ = merge(
		submitHandler.value$.pipe(mapTo(true)),
		serverResponse$.pipe(mapTo(false))
	);

	const serverErrors$ = serverResponse$.pipe(
		filter(isFormResponseFailureMapped),
		map(response => response.errors)
	);

	const nameProps$ = nonNullableInput(
		name,
		serverErrors$.pipe(map(r => r.name.error))
	);
	const passwordProps$ = nonNullableInput(
		password,
		serverErrors$.pipe(map(r => r.password.error))
	);
	const confirmPasswordProps$ = makeInputProps(
		confirmPassword,
		serverErrors$.pipe(map(r => r.confirmPassword.error)),
		combineErrors(
			getNonEmptyError(confirmPassword),
			shouldMatchError(confirmPassword, password)
		)
	);

	const accountsProps$ = accountsList.list$.pipe(
		switchMap(list => {
			const accounts = list.map(item => {
				const serverErrorAccount$ = serverErrors$.pipe(
					map(errors => errors.accounts.find(s => s.id === item.id))
				);
				return combineLatest(
					makeInputProps(
						item.item.sitename,
						serverErrorAccount$.pipe(
							map(a => (a ? a.sitename.error : undefined))
						),
						combineErrors(
							getNonEmptyError(item.item.sitename),
							lostFocusError(item.item.sitename, validateHostname)
						)
					),
					nonNullableInput(
						item.item.username,
						serverErrorAccount$.pipe(
							map(a => (a ? a.username.error : undefined))
						)
					)
				).pipe(
					map(([sitename, username]) => {
						return { sitename, username, id: item.id };
					})
				);
			});

			return combineLatestArray(accounts);
		})
	);

	return {
		defaultProps: {
			name: defaultInputProps(),
			password: defaultInputProps(),
			confirmPassword: defaultInputProps(),
			accounts: [],
			isSending: false,
			onAddAccountClick: accountsList.onAddClick,
			onRemoveAccountClick: accountsList.onRemoveClick,
			onSubmitClick: () => submitHandler.handle()
		},
		props: {
			name: nameProps$,
			password: passwordProps$,
			confirmPassword: confirmPasswordProps$,
			accounts: accountsProps$,
			isSending: isSending$
		}
	};
});
