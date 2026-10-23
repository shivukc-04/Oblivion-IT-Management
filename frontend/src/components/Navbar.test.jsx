import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { AuthContext } from "../services/authContext";

function LocationDisplay() {
	const location = useLocation();
	return <span data-testid="location">{location.pathname}</span>;
}

function renderNavbar(user, logout = vi.fn()) {
	return render(
		<MemoryRouter initialEntries={["/dashboard"]}>
			<AuthContext.Provider value={{ user, logout }}>
				<Navbar />
				<LocationDisplay />
			</AuthContext.Provider>
		</MemoryRouter>
	);
}

describe("Navbar", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("shows navigation links and identity for an operator", () => {
		renderNavbar({ userId: "operator01", role: "operator" });

		expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
			"href",
			"/dashboard"
		);
		expect(screen.getByRole("link", { name: /servers/i })).toHaveAttribute(
			"href",
			"/servers"
		);
		expect(screen.getByRole("link", { name: /incidents/i })).toHaveAttribute(
			"href",
			"/incidents"
		);
		expect(screen.getByRole("link", { name: /trends/i })).toHaveAttribute(
			"href",
			"/trend"
		);
		expect(
			screen.getByText("Logged in as: operator01 (operator)")
		).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: /audit logs/i })).toBeNull();
		expect(
			screen.queryByRole("link", { name: /user management/i })
		).toBeNull();
	});

	it("shows administration links only to admins", () => {
		renderNavbar({ userId: "admin01", role: "admin" });

		expect(screen.getByRole("link", { name: /audit logs/i })).toHaveAttribute(
			"href",
			"/audit-logs"
		);
		expect(
			screen.getByRole("link", { name: /user management/i })
		).toHaveAttribute("href", "/users");
	});

	it("clears stored credentials and redirects on logout", async () => {
		const user = userEvent.setup();
		const logout = vi.fn(() => {
			localStorage.removeItem("authToken");
			localStorage.removeItem("userRole");
		});
		localStorage.setItem("authToken", "token");
		localStorage.setItem("userRole", "operator");
		renderNavbar({ userId: "operator01", role: "operator" }, logout);

		await user.click(screen.getByRole("button", { name: /logout/i }));

		expect(logout).toHaveBeenCalledOnce();
		expect(localStorage.getItem("authToken")).toBeNull();
		expect(localStorage.getItem("userRole")).toBeNull();
		expect(screen.getByTestId("location")).toHaveTextContent("/login");
	});
});
