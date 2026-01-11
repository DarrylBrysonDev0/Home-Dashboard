import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/middleware/admin-check";
import {
  getUserById,
  updateUser,
  deleteUser,
  isEmailTaken,
  countAdminUsers,
  userExists,
} from "@/lib/queries/users";
import { updateUserSchema } from "@/lib/validations/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]
 *
 * Get a single user's details
 *
 * Authentication: Admin only
 * Response: { data: SafeUser & { eventsCreated: number } }
 *
 * @see contracts/users-api.md
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check admin authentication
    const { authorized, response } = await checkAdminAuth();
    if (!authorized) {
      return response;
    }

    // Fetch user
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform response
    const responseData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      eventsCreated: user.eventsCreated,
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Unable to load user details. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 *
 * Update a user's details (FR-033)
 *
 * Request Body: { email?, name?, password?, role?, avatarColor?, unlockAccount? }
 * Authentication: Admin only
 * Response: { data: SafeUser }
 *
 * @see contracts/users-api.md
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check admin authentication
    const { authorized, response } = await checkAdminAuth();
    if (!authorized) {
      return response;
    }

    // Check if user exists
    const exists = await userExists(id);
    if (!exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: {
            fieldErrors: result.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // If email is being changed, check if it's already taken
    if (result.data.email) {
      const emailTaken = await isEmailTaken(result.data.email, id);
      if (emailTaken) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: {
              fieldErrors: {
                email: ["Email already exists"],
              },
            },
          },
          { status: 400 }
        );
      }
    }

    // Update the user
    const user = await updateUser(id, result.data);

    // Transform response
    const responseData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Unable to update user. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 *
 * Delete a user account
 *
 * Restrictions:
 * - Cannot delete your own account
 * - Cannot delete the last admin user
 *
 * Authentication: Admin only
 * Response: { data: { success: true } }
 *
 * @see contracts/users-api.md
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check admin authentication
    const { authorized, response, session } = await checkAdminAuth();
    if (!authorized) {
      return response;
    }

    // Check if user exists
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot delete your own account
    if (session?.user?.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Cannot delete the last admin user
    if (user.role === "ADMIN") {
      const adminCount = await countAdminUsers();
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin user" },
          { status: 400 }
        );
      }
    }

    // Delete the user
    await deleteUser(id);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Unable to delete user. Please try again." },
      { status: 500 }
    );
  }
}
