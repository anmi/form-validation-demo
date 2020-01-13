import {
	FormModel,
	FormResponse,
	FormModelMapped,
	FormResponseMapped
} from "../model/formModel";

function submitForm(form: FormModel) {
	return new Promise<FormResponse>((resolve, _reject) => {
		setTimeout(() => {
			resolve({
				isSuccess: false,
				errors: {
					name: {
						value: form.name,
						error: "Name error"
					},
					password: {
						value: form.password,
						error: "Password error"
					},
					confirmPassword: {
						value: form.confirmPassword,
						error: "Confirm password error"
					},
					accounts: form.accounts.map(account => {
						return {
							sitename: {
								value: account.sitename,
								error: "Sitename error"
							},
							username: {
								value: account.username,
								error: "Username error"
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
