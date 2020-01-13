import React from "react";
import { Form, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

export interface InputCallbackProps {
	onBlur: () => void;
	onFocus: () => void;
	onChange: (value: string) => void;
}

export type InputProps = {
	name: string;
	value: string;
	error: string | null;
	showLabel?: boolean;
} & InputCallbackProps;

export const Input: React.FC<InputProps> = ({
	name,
	value,
	error,
	showLabel = true,
	onBlur,
	onFocus,
	onChange
}) => {
	return (
		<div>
			<Form.Group as={Col}>
				{showLabel && <Form.Label>{name}</Form.Label>}
				<Form.Control
					type="text"
					placeholder={name}
					required
					value={value}
					onBlur={onBlur}
					onFocus={onFocus}
					isInvalid={error !== null}
					onChange={(e: any) => onChange(e.target.value)}
				/>
				{error !== null ? (
					<Form.Control.Feedback type="invalid">
						{error}
					</Form.Control.Feedback>
				) : null}
			</Form.Group>
		</div>
	);
};
