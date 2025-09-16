import React from "react";
import PropTypes from "prop-types";
import { NavLink, useLocation, matchPath } from "react-router-dom";

function SidebarSkeleton() {
  return (
    <div className="mb-4 p-3 bg-blue-50 rounded-lg animate-pulse animate-fade-in">
      <div className="h-4 bg-blue-200 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-blue-200 rounded w-full"></div>
    </div>
  );
}

function TeacherSidebar({ userData, userLoading, items = [], onSignOut }) {
  const navItems = Array.isArray(items) ? items : [];
  const location = useLocation(); // ✅ INSIDE the component

  return (
    <aside className="w-64 bg-white shadow-md p-6 hidden md:block">
      <h1 className="text-xl font-bold mb-2">Teacher Dashboard</h1>

      {userLoading ? (
        <SidebarSkeleton />
      ) : (
        userData && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-900 animate-fade-in">
            <div className="font-semibold">{userData.name}</div>
            <div className="text-xs break-all">{userData.email}</div>
          </div>
        )
      )}

      <nav>
        {navItems.map((item) =>
          item.disabled ? (
            <div
              key={item.path}
              aria-disabled="true"
              title="Coming soon"
              className="flex items-center px-4 py-2 mb-2 rounded-lg text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              end={Boolean(item.end)}
              className={({ isActive }) => {
                const extraActive = (item.activePatterns || []).some((p) =>
                  matchPath({ path: p, end: true }, location.pathname)
                );
                const active = isActive || extraActive;
                return `flex items-center px-4 py-2 mb-2 rounded-lg ${
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`;
              }}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </NavLink>
          )
        )}
      </nav>

      <button
        onClick={onSignOut}
        className="mt-6 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
      >
        Sign Out
      </button>
    </aside>
  );
}

TeacherSidebar.propTypes = {
  userData: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  userLoading: PropTypes.bool.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      icon: PropTypes.node,
      end: PropTypes.bool,
      disabled: PropTypes.bool,
      activePatterns: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  onSignOut: PropTypes.func.isRequired,
};

export default React.memo(TeacherSidebar);
