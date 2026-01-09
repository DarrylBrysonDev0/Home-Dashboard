/**
 * GET /api/analytics/transfers
 *
 * Returns transfer flows between accounts for Sankey diagram visualization
 * Matches source (outgoing) and destination (incoming) transfer pairs
 *
 * Query params:
 * - start_date: ISO date string for period start
 * - end_date: ISO date string for period end
 *
 * Response shape:
 * {
 *   data: {
 *     transfers: [
 *       {
 *         source_account_id: "ACC-JOINT-CHK",
 *         source_account_name: "Joint Checking",
 *         destination_account_id: "ACC-USER1-SAV",
 *         destination_account_name: "User1 Savings",
 *         total_amount: 1500.00,
 *         transfer_count: 3
 *       }
 *     ]
 *   }
 * }
 *
 * User Story 8: View Transfer Flow Between Accounts
 */

import { NextRequest, NextResponse } from "next/server";
import { transferFlowParamsSchema } from "@/lib/validations/analytics";
import { getTransferFlows } from "@/lib/queries/transfers";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      start_date: searchParams.get("start_date") ?? undefined,
      end_date: searchParams.get("end_date") ?? undefined,
    };

    // Validate parameters with Zod
    const parsed = transferFlowParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      const errorMessage =
        parsed.error.issues[0]?.message ?? "Invalid parameters";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { start_date, end_date } = parsed.data;

    // Fetch transfer flows with filters
    const transfers = await getTransferFlows({
      startDate: start_date,
      endDate: end_date,
    });

    return NextResponse.json({
      data: {
        transfers,
      },
    });
  } catch (error) {
    console.error("Error fetching transfer flows:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfer flows" },
      { status: 500 }
    );
  }
}
