import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/middleware/admin-check";
import { listUsers, createUser, isEmailTaken } from "@/lib/queries/users";
import { createUserSchema } from "@/lib/validations/auth";

/**
 * GET /api/users
 *
 * List all household member accounts (FR-031)
 *
 * Authentication: Admin only
 * Response: { data: SafeUser[] }
 *
 * @see contracts/users-api.md
 */
export async function GET() {
  try {
    // Check admin authentication
    const { authorized, response } = await checkAdminAuth();
    if (!authorized) {
      return response;
    }

    // Fetch all users
    const users = await listUsers();

    // Transform dates to ISO strings for JSON response
    const responseData = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Unable to load users. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 *
 * Create a new household member account (FR-032)
 *
 * Request Body: { email, name, password, role?, avatarColor? }
 * Authentication: Admin only
 * Response: { data: SafeUser } (201)
 *
 * @see contracts/users-api.md
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { authorized, response } = await checkAdminAuth();
    if (!authorized) {
      return response;
    }

    // Parse and validate request body
    const body = await request.json();
    const result = createUserSchema.safeParse(body);

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

    // Check if email is already taken
    const emailTaken = await isEmailTaken(result.data.email);
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

    // Create the user
    const user = await createUser({
      email: result.data.email,
      name: result.data.name,
      password: result.data.password,
      role: result.data.role,
      avatarColor: result.data.avatarColor,
    });

    // Transform response (dates to ISO strings)
    const responseData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt.toISOString(),
    };

    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Unable to create user. Please try again." },
      { status: 500 }
    );
  }
}
