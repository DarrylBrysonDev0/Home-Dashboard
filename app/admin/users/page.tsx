"use client";

/**
 * User Management Page
 *
 * Client component for managing household member accounts (FR-031, FR-032, FR-033).
 *
 * Features:
 * - List all users with UserList component
 * - Create new users with UserForm in dialog
 * - Edit existing users
 * - Delete users with confirmation
 *
 * @see contracts/users-api.md
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserList, { User } from "@/components/admin/user-list";
import UserForm, { UserFormUser } from "@/components/admin/user-form";
import { useSession } from "@/lib/hooks/use-session";

/**
 * User Management Page Component
 */
export default function UserManagementPage() {
  const router = useRouter();
  const { user: currentUser } = useSession();

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormUser | null>(null);

  /**
   * Fetch users from API
   */
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Handle opening dialog for new user
   */
  function handleAddUser() {
    setEditingUser(null);
    setIsDialogOpen(true);
  }

  /**
   * Handle opening dialog for editing user
   */
  function handleEditUser(user: User) {
    setEditingUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
    });
    setIsDialogOpen(true);
  }

  /**
   * Handle successful form submission
   */
  function handleFormSuccess() {
    setIsDialogOpen(false);
    setEditingUser(null);
    fetchUsers();
    router.refresh();
  }

  /**
   * Handle form cancel
   */
  function handleFormCancel() {
    setIsDialogOpen(false);
    setEditingUser(null);
  }

  /**
   * Handle user deletion
   */
  async function handleDeleteUser(userId: string) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      // Refresh the list
      fetchUsers();
      router.refresh();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  const dialogTitle = editingUser ? "Edit User" : "Add New User";
  const formMode = editingUser ? "edit" : "create";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage household member accounts
          </p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* User List */}
      <div className="rounded-md border">
        <UserList
          users={users}
          isLoading={isLoading}
          currentUserId={currentUser?.id}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          error={error}
        />
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <UserForm
            mode={formMode}
            user={editingUser || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
