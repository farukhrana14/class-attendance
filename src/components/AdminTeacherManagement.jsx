


export default function AdminTeacherManagement() {
	const [teachers, setTeachers] = useState([]);
	const [loading, setLoading] = useState(true);
	const stats = {
		totalTeachers: teachers.length,
		totalStudents: 0,
		totalCourses: 0,
		totalSections: 0,
	};

	useEffect(() => {
		const fetchTeachers = async () => {
			setLoading(true);
			try {
				const q = query(collection(db, "users"), where("role", "==", "teacher"));
				const querySnapshot = await getDocs(q);
				const teacherList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
				setTeachers(teacherList);
			} catch (error) {
				console.error("Error fetching teachers:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchTeachers();
	}, []);

	// Example: topSection can be any content you want above the table
		const topSection = (
			<div className="bg-white rounded-lg shadow p-6 min-h-[120px] mb-4">
				{/* Add any controls, filters, or summary here */}
			</div>
		);

	return (
		<AdminLayout>
			<AdminMainArea stats={stats} topSection={topSection}>
				<div className="mt-8">
					<h2 className="text-xl font-bold mb-4">All Teachers</h2>
					{loading ? (
						<div>Loading...</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full bg-white border border-gray-200 rounded-lg">
								<thead>
									<tr>
										<th className="px-4 py-2 border-b">Name</th>
										<th className="px-4 py-2 border-b">Email</th>
										<th className="px-4 py-2 border-b">Status</th>
										<th className="px-4 py-2 border-b">ID</th>
										{/* Add more columns as needed */}
									</tr>
								</thead>
								<tbody>
									{teachers.map((teacher) => (
										<tr key={teacher.id} className="hover:bg-gray-50">
											<td className="px-4 py-2 border-b">{teacher.name || "-"}</td>
											<td className="px-4 py-2 border-b">{teacher.email || "-"}</td>
											<td className="px-4 py-2 border-b">{teacher.status || "-"}</td>
											<td className="px-4 py-2 border-b">{teacher.id}</td>
											{/* Add more fields as needed */}
										</tr>
									))}
								</tbody>
							</table>
							{teachers.length === 0 && (
								<div className="text-gray-500 mt-4">No teachers found.</div>
							)}
						</div>
					)}
				</div>
			</AdminMainArea>
		</AdminLayout>
	);
}

import React, { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import AdminMainArea from "../layouts/AdminMainArea";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
