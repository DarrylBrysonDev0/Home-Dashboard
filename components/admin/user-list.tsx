"use client";

/**
 * UserList Component
 *
 * Displays household member accounts in a table with management actions.
 *
 * Features:
 * - Table view of all users
 * - Role badges (Admin/Member)
 * - Account lockout status indicators
 * - Edit and delete actions
 * - Loading and empty states
 *
 * @see contracts/users-api.md
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert } from "@/components/ui/alert";

/**
 * User data structure from API
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER";
  avatarColor: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Props for UserList component
 */
export interface UserListProps {
  /** Array of users to display */
  users: User[];
  /** Loading state */
  isLoading?: boolean;
  /** Current user ID (to prevent self-deletion) */
  currentUserId?: string;
  /** Callback when edit is clicked */
  onEdit?: (user: User) => void;
  /** Callback when delete is clicked */
  onDelete?: (userId: string) => void;
  /** Optional error message to display */
  error?: string | null;
}

/**
 * Check if a user is currently locked out
 */
function isUserLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil) > new Date();
}

/**
 * Format date string for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * UserList component for displaying and managing household members
 */
export default function UserList({
  users,
  isLoading = false,
  currentUserId,
  onEdit,
  onDelete,
  error,
}: UserListProps) {
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const userToDelete = users.find((u) => u.id === deleteUserId);

  async function handleDelete() {
    if (!deleteUserId || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteUserId);
    } finally {
      setIsDeleting(false);
      setDeleteUserId(null);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <p className="text-sm font-medium">{error}</p>
      </Alert>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No users found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new user to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isLocked = isUserLocked(user.lockedUntil);
            const isSelf = user.id === currentUserId;

            return (
              <TableRow key={user.id}>
                {/* User Info */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium"
                      style={{
                        backgroundColor: user.avatarColor || "#6B7280",
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Name and Email */}
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Role Badge */}
                <TableCell>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                  >
                    {user.role}
                  </Badge>
                </TableCell>

                {/* Status */}
                <TableCell>
                  {isLocked ? (
                    <Badge variant="destructive">Locked</Badge>
                  ) : user.failedLoginAttempts > 0 ? (
                    <span className="text-sm text-yellow-600">
                      {user.failedLoginAttempts} failed attempt
                      {user.failedLoginAttempts > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-sm text-green-600">Active</span>
                  )}
                </TableCell>

                {/* Created Date */}
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteUserId(user.id)}
                      disabled={isSelf}
                      title={isSelf ? "Cannot delete your own account" : "Delete user"}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteUserId !== null}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name} (
              {userToDelete?.email})? This action cannot be undone.
              {userToDelete?.role === "ADMIN" && (
                <span className="mt-2 block text-yellow-600">
                  Warning: This user is an administrator.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
