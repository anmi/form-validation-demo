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
