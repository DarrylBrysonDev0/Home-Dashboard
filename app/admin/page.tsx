import Link from "next/link";
import { Users, Settings, Mail, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listUsers } from "@/lib/queries/users";

// Force dynamic rendering to prevent build-time database access
export const dynamic = 'force-dynamic';

/**
 * Admin Dashboard Page
 *
 * Server component that displays:
 * - Quick stats about users and system status
 * - Navigation cards to admin sections
 *
 * @see contracts/users-api.md
 */
export default async function AdminDashboardPage() {
  // Fetch stats
  const users = await listUsers();
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const memberCount = users.filter((u) => u.role === "MEMBER").length;
  const lockedCount = users.filter(
    (u) => u.lockedUntil && new Date(u.lockedUntil) > new Date()
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage household members and system settings
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {adminCount} admin{adminCount !== 1 ? "s" : ""}, {memberCount} member
              {memberCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.length - lockedCount} active
            </div>
            <p className="text-xs text-muted-foreground">
              {lockedCount > 0
                ? `${lockedCount} account${lockedCount !== 1 ? "s" : ""} locked`
                : "No locked accounts"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Status</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Configured</div>
            <p className="text-xs text-muted-foreground">
              SMTP settings available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Create, edit, and manage household member accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {users.length} user{users.length !== 1 ? "s" : ""} registered
              </span>
              <Button asChild size="sm">
                <Link href="/admin/users">Manage Users</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SMTP Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Email Settings
            </CardTitle>
            <CardDescription>
              Configure SMTP settings for calendar invites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Email notifications enabled
              </span>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/settings">Configure</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Link to Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar
            </CardTitle>
            <CardDescription>
              View and manage family events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link href="/calendar">Open Calendar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
