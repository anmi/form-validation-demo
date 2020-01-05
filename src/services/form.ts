import { FormModel, FormResponse } from "../model/formModel";

export function submitForm(form: FormModel) {
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
