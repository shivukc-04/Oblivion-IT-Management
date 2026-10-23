import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import api from "../services/axiosConfig";

vi.mock("../services/axiosConfig", () => ({
	default: { post: vi.fn() },
}));

describe("RegisterPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	async function completeRegistration(user, { role = false } = {}) {
		await user.type(screen.getByLabelText("User ID"), "newuser");
		await user.type(screen.getByLabelText("Username"), "New User");
		await user.type(screen.getByLabelText("Password"), "password123");
		await user.type(screen.getByLabelText("Email"), "newuser@example.com");
		if (role) {
			await user.selectOptions(screen.getByLabelText("Role"), role);
		}
		await user.click(screen.getByRole("button", { name: "Sign Up" }));
	}

	it("registers public accounts without accepting a client-selected role", async () => {
		const user = userEvent.setup();
		api.post.mockResolvedValue({});
		render(
			<MemoryRouter>
				<RegisterPage />
			</MemoryRouter>,
		);

		expect(screen.queryByLabelText("Role")).not.toBeInTheDocument();
		await completeRegistration(user);

		await waitFor(() => {
			expect(api.post).toHaveBeenCalledWith("/auth/register", {
				userId: "newuser",
				username: "New User",
				password: "password123",
				email: "newuser@example.com",
			});
		});
	});

	it("uses the admin-only endpoint for administrator-created accounts", async () => {
		const user = userEvent.setup();
		api.post.mockResolvedValue({});
		render(
			<MemoryRouter>
				<RegisterPage adminRegistration />
			</MemoryRouter>,
		);

		await completeRegistration(user, { role: "admin" });

		await waitFor(() => {
			expect(api.post).toHaveBeenCalledWith("/auth/admin/register", {
				userId: "newuser",
				username: "New User",
				password: "password123",
				email: "newuser@example.com",
				role: "admin",
			});
		});
	});
});
