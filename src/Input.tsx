import React from "react";
import { Form, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { InputState } from "./model/InputState";

export interface InputCallbackProps {
	onBlur: () => void;
	onFocus: () => void;
	onChange: (value: string) => void;
}

export type InputProps = {
	name: string;
	state: InputState;
} & InputCallbackProps;

export const Input: React.FC<InputProps> = ({
	name,
	state,
	onBlur,
	onFocus,
	onChange
}) => {
	return (
		<div>
			<Form.Group as={Col}>
				<Form.Label>{name}</Form.Label>
				<Form.Control
					type="text"
					placeholder={name}
					required
					value={state.value}
					onBlur={onBlur}
					onFocus={onFocus}
					isInvalid={state.error !== null}
					onChange={(e: any) => onChange(e.target.value)}
				/>
				{state.error !== null ? (
					<Form.Control.Feedback type="invalid">
						{state.error}
					</Form.Control.Feedback>
				) : null}
			</Form.Group>
		</div>
	);
};
