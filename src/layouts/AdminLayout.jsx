import React from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      <AdminSidebar />
      <main className="flex-grow p-8 overflow-auto">{children}</main>
    </div>
  );
}
