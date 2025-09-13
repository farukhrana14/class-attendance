import React from "react";
import AdminLayout from "../layouts/AdminLayout";
import AdminMainArea from "../layouts/AdminMainArea";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      {/* Let AdminMainArea handle the TOP 4 CARDS exactly like AdminApproveTeacher */}
      <AdminMainArea stats={{}}>
        {/* Page content below the top cards */}
        <div className="p-8 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

          {/* Placeholder area for future tables/lists */}
          <div className="bg-white rounded-lg shadow p-10 text-center text-gray-400 border border-dashed border-gray-300">
            Data tables will render here later
          </div>
        </div>
      </AdminMainArea>
    </AdminLayout>
  );
}
