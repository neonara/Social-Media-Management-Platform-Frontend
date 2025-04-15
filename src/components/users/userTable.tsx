"use client";

import React, { useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  roles: string[];
}

const SimpleUserTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        
        const response = await fetch("http://localhost:8000/api/users/getUsers/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", 
        });

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(`Failed to fetch users: ${response.status} - ${errorMessage}`);
        }

        const data: User[] = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }



  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-md">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">ID</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Username</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Email</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Active</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Staff</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Roles</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.id}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{user.username}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{user.is_active ? "Yes" : "No"}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{user.is_staff ? "Yes" : "No"}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{user.roles.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SimpleUserTable;
