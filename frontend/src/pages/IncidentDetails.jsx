import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../services/authContext.js";
import incidentsService from "../services/incidentsService.js";

export default function IncidentDetails() {
	const { id } = useParams();
	const [incident, setIncident] = useState(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const { user } = useContext(AuthContext);
	const navigate = useNavigate();

	const fetchIncident = async () => {
		try {
			const data = await incidentsService.getIncidentById(id);
			setIncident(data);
		} catch (err) {
			console.error(err);
			toast.error("Failed to load incident");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchIncident();
	}, [id]);

	if (loading) return <div className="p-6">Loading...</div>;
	if (!incident) return <div className="p-6">Incident not found</div>;

	const canModify = user && (user.role === "admin" || user.role === "operator");

	const isDisabled = (targetStatus) => {
		return updating || incident.status === targetStatus;
	};

	async function changeStatus(newStatus) {
		if (incident.status === newStatus) return;

		setUpdating(true);
		try {
			const updated = await incidentsService.updateIncident(id, {
				status: newStatus,
			});
			setIncident(updated);
			toast.success("Status updated successfully");
		} catch (err) {
			console.error(err);
			toast.error("Failed to update status");
		} finally {
			setUpdating(false);
		}
	}

	// Format date to be more readable
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleString();
	};

	return (
		<div className="p-6">
			<button
				className="btn btn-ghost mb-4"
				onClick={() => navigate("/incidents")}
			>
				Back to List
			</button>

			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<div className="flex justify-between items-start">
						<div>
							<h1 className="text-2xl font-bold mb-2">{incident.ticketId}</h1>
							<h2 className="text-xl mb-4">{incident.title}</h2>
						</div>
						<div
							className="badge badge-lg"
							style={{
								backgroundColor:
									incident.status === "resolved"
										? "#4CAF50"
										: incident.status === "inProgress"
											? "#FF9800"
											: "#2196F3",
							}}
						>
							{incident.status}
						</div>
					</div>

					<div className="divider"></div>

					<div className="grid grid-cols-2 gap-4 mb-4">
						<div>
							<p className="text-sm text-gray-500">Priority</p>
							<p className="font-semibold">{incident.priority}</p>
						</div>
						<div>
							<p className="text-sm text-gray-500">Assigned To</p>
							<p className="font-semibold">
								{incident.assignedTo?.username || "Unknown"}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500">Created By</p>
							<p className="font-semibold">
								{incident.createdBy?.username || "Unknown"}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500">Created At</p>
							<p className="font-semibold">{formatDate(incident.createdAt)}</p>
						</div>
					</div>

					<div className="mb-4">
						<p className="text-sm text-gray-500 mb-2">Description</p>
						<p className="bg-base-200 p-4 rounded-lg">{incident.description}</p>
					</div>

					{incident.resolvedAt && (
						<div>
							<p className="text-sm text-gray-500">Resolved At</p>
							<p className="font-semibold">{formatDate(incident.resolvedAt)}</p>
						</div>
					)}

					{canModify && (
						<div className="card-actions justify-end mt-6">
							<button
								className="btn btn-outline"
								disabled={isDisabled("inProgress")}
								onClick={() => changeStatus("inProgress")}
							>
								Mark In Progress
							</button>
							<button
								className="btn btn-success"
								disabled={isDisabled("resolved")}
								onClick={() => changeStatus("resolved")}
							>
								Mark Resolved
							</button>
							<button
								className="btn btn-warning"
								disabled={isDisabled("open")}
								onClick={() => changeStatus("open")}
							>
								Reopen
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
