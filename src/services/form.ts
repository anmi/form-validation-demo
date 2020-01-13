import {
	FormModel,
	FormResponse,
	FormModelMapped,
	FormResponseMapped
} from "../model/formModel";
import { validateNonEmpty, validateHostname } from "../utils/validators";

function submitForm(form: FormModel) {
	return new Promise<FormResponse>((resolve, _reject) => {
		setTimeout(() => {
			resolve({
				isSuccess: false,
				errors: {
					name: {
						value: form.name,
						error: validateNonEmpty(form.name) || undefined
					},
					password: {
						value: form.password,
						error: validateNonEmpty(form.password) || undefined
					},
					confirmPassword: {
						value: form.confirmPassword,
						error:
							validateNonEmpty(form.confirmPassword) ||
							form.password !== form.confirmPassword
								? "Passwords didn't match"
								: undefined
					},
					accounts: form.accounts.map(account => {
						return {
							sitename: {
								value: account.sitename,
								error:
									validateNonEmpty(account.sitename) ||
									validateHostname(account.sitename) ||
									undefined
							},
							username: {
								value: account.username,
								error:
									validateNonEmpty(account.username) ||
									(account.username === "user"
										? "User already exists"
										: undefined)
							}
						};
					})
				}
			});
		}, 800);
	});
}

export function submitFormMapped(
	form: FormModelMapped
): Promise<FormResponseMapped> {
	return submitForm(form).then(result => {
		if (result.isSuccess) {
			return result;
		} else {
			return {
				isSuccess: false,
				errors: {
					name: result.errors.name,
					password: result.errors.password,
					confirmPassword: result.errors.confirmPassword,
					accounts: result.errors.accounts.map((account, i) => {
						return {
							id: form.accounts[i].id,
							sitename: account.sitename,
							username: account.username
						};
					})
				}
			};
		}
	});
}
