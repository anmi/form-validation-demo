import { Id } from "../utils/makeId";

export interface AccountModel {
	sitename: string;
	username: string;
}

export interface FormModel {
	name: string;
	password: string;
	confirmPassword: string;
	accounts: AccountModel[];
}

export type AccountModelMapped = { id: Id } & AccountModel;

export type FormModelMapped = { accounts: AccountModelMapped[] } & FormModel;

function isFormAccountEqual(a: AccountModel, b: AccountModel) {
	return a.username === b.username && a.sitename === b.sitename;
}

export function isFormEqual(a: FormModel, b: FormModel) {
	return (
		a.name === b.name &&
		a.password === b.password &&
		a.confirmPassword === b.confirmPassword &&
		a.accounts.length === b.accounts.length &&
		a.accounts.every((aItem, i) => isFormAccountEqual(aItem, b.accounts[i]))
	);
}

export interface FormInputResponse {
	value: string;
	error?: string;
}

export interface FormAccountResponse {
	sitename: FormInputResponse;
	username: FormInputResponse;
}

export interface FormModelResponse {
	name: FormInputResponse;
	password: FormInputResponse;
	confirmPassword: FormInputResponse;
	accounts: FormAccountResponse[];
}

export interface FormResponseFailure {
	isSuccess: false;
	errors: FormModelResponse;
}

export function isFormResponseFailure(
	response: FormResponse
): response is FormResponseFailure {
	return !response.isSuccess;
}

export type FormResponse =
	| {
			isSuccess: true;
	  }
	| FormResponseFailure;

type FormAccountResponseMapped = {
	id: Id;
} & FormAccountResponse;

type FormModelResponseMapped = {
	name: FormInputResponse;
	password: FormInputResponse;
	confirmPassword: FormInputResponse;
	accounts: FormAccountResponseMapped[];
};

type FormResponseFailureMapped = {
	isSuccess: false;
	errors: FormModelResponseMapped;
};

export type FormResponseMapped =
	| { isSuccess: true }
	| FormResponseFailureMapped;

export function isFormResponseFailureMapped(
	response: FormResponseMapped
): response is FormResponseFailureMapped {
	return !response.isSuccess;
}
