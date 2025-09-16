import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const getCourseName = (c) => c.courseName || c.title || "Untitled Course";
const getUniversity = (c) => c.university || c.universityName || "—";

function CoursesSkeleton() {
  const skeletons = [1, 2, 3];
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Courses</h2>
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {skeletons.map((n) => (
          <div
            key={n}
            className="bg-white rounded-lg shadow p-6 animate-pulse transition duration-500"
          >
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeacherCoursesList({
  courses = [],
  loading,
  ready,
  showEmpty,
  onDelete,
}) {
  const navigate = useNavigate();

  if (!ready || loading) return <CoursesSkeleton />;

  if (ready && !loading && courses.length === 0 && showEmpty) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">No courses found</p>
          <p className="text-gray-400 mb-6">
            Create your first course to get started
          </p>
          <button
            onClick={() => navigate("/teacher/create-course")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Courses</h2>
        <button
          onClick={() => navigate("/teacher/create-course")}
          className="text-blue-600 hover:underline font-medium bg-transparent border-none p-0 m-0 cursor-pointer"
          style={{ boxShadow: "none" }}
        >
          Create New Course
        </button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200"
          >
            <div
              onClick={() => navigate(`/teacher/courses/${course.id}`)}
              className="cursor-pointer flex-1"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold">
                  {course.courseCode || "No Code"}
                </h3>
                <span className="text-sm text-gray-500">
                  {course.semester || "—"} {course.year || ""}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{getCourseName(course)}</p>
              <div className="text-sm text-gray-600">
                <p>University: {getUniversity(course)}</p>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(course);
                }}
                className="text-red-600 hover:underline font-medium bg-transparent border-none p-0 m-0 cursor-pointer"
                style={{ boxShadow: "none" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

TeacherCoursesList.propTypes = {
  courses: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired })
  ),
  loading: PropTypes.bool.isRequired,
  ready: PropTypes.bool.isRequired,
  showEmpty: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default React.memo(TeacherCoursesList);
