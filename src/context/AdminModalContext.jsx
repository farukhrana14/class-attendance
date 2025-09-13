import React, { createContext, useContext, useState } from "react";

const AdminModalContext = createContext();

export function AdminModalProvider({ children }) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [form, setForm] = useState({ name: "", email: "", courses: "" });

	return (
		<AdminModalContext.Provider value={{ isModalOpen, setIsModalOpen, isEditMode, setIsEditMode, form, setForm }}>
			{children}
		</AdminModalContext.Provider>
	);
}

export function useAdminModal() {
	const context = useContext(AdminModalContext);
	if (!context) {
		throw new Error("useAdminModal must be used within an AdminModalProvider");
	}
	return context;
}

// Example of a fancy modal component using TailwindCSS 3.3.3
export function FancyModal({ isOpen, onClose, title, children }) {
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
			<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-blue-400 animate-fadeIn">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-xl font-bold text-blue-700">{title}</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors">&times;</button>
				</div>
				<div>{children}</div>
			</div>
			<style>{`
				@keyframes fadeIn { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }
				.animate-fadeIn { animation: fadeIn 0.2s ease; }
			`}</style>
		</div>
	);
}
