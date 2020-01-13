import React from "react";
import "./App.css";
import { AppForm } from "./Form";

const App: React.FC = () => {
	return (
		<div className="App">
			<p style={{ padding: 20 }}>
				Visit github page:
				<a
					href="https://github.com/anmi/form-validation-demo"
					target="_blank"
				>
					anmi/form-validation-demo
				</a>
				.
			</p>
			<AppForm />
		</div>
	);
};

export default App;
