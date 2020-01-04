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
