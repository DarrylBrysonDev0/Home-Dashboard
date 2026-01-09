"use client";

/**
 * TransferFlowChart Component
 *
 * Displays money movement between accounts as a Sankey flow diagram.
 * Each account appears as a node, with flow links showing transfer amounts.
 *
 * Features:
 * - Sankey diagram visualization with proportional link widths
 * - Custom tooltips showing transfer amounts and counts
 * - Color-coded nodes using the chart palette
 * - Support for date range filtering
 * - Loading, error, and empty states
 *
 * User Story 8: View Transfer Flow Between Accounts
 */

import { useEffect, useState, useCallback, MouseEvent } from "react";
import { format } from "date-fns";
import { Sankey, Tooltip, Layer, Rectangle } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartSkeleton } from "../loading-skeleton";
import { NoData } from "../empty-states/no-data";
import { formatCurrency } from "./chart-tooltip";
import { CHART_COLORS, getChartColor, SEMANTIC_COLORS } from "@/lib/constants/colors";
import { useFilters } from "@/lib/contexts/filter-context";
import type { TransferFlow } from "@/lib/validations/analytics";

/**
 * Filter props for transfer flow data fetching
 */
export interface TransferFlowChartFilterProps {
  /** Start date for the date range filter */
  startDate?: Date;
  /** End date for the date range filter */
  endDate?: Date;
}

/**
 * Props for the TransferFlowChart component
 */
export interface TransferFlowChartProps extends TransferFlowChartFilterProps {
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * API response wrapper
 */
interface TransfersApiResponse {
  data?: {
    transfers: TransferFlow[];
  };
  error?: string;
}

/**
 * Sankey node data structure
 */
interface SankeyNode {
  name: string;
  color: string;
  accountId: string;
}

/**
 * Sankey link data structure
 */
interface SankeyLink {
  source: number;
  target: number;
  value: number;
  transferCount: number;
  sourceName: string;
  targetName: string;
}

/**
 * Sankey chart data structure
 */
interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

/**
 * Builds the URL with query parameters for the transfers API
 */
function buildTransfersUrl(filters: TransferFlowChartFilterProps): string {
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.set("start_date", format(filters.startDate, "yyyy-MM-dd"));
  }

  if (filters.endDate) {
    params.set("end_date", format(filters.endDate, "yyyy-MM-dd"));
  }

  const queryString = params.toString();
  return `/api/analytics/transfers${queryString ? `?${queryString}` : ""}`;
}

/**
 * Transform API response to Sankey chart data format
 * Creates nodes for each unique account and links for each transfer flow
 */
function transformToSankeyData(transfers: TransferFlow[]): SankeyData {
  if (!transfers || transfers.length === 0) {
    return { nodes: [], links: [] };
  }

  // Collect unique accounts (both source and destination)
  const accountMap = new Map<string, { id: string; name: string }>();

  for (const transfer of transfers) {
    if (!accountMap.has(transfer.source_account_id)) {
      accountMap.set(transfer.source_account_id, {
        id: transfer.source_account_id,
        name: transfer.source_account_name,
      });
    }
    if (!accountMap.has(transfer.destination_account_id)) {
      accountMap.set(transfer.destination_account_id, {
        id: transfer.destination_account_id,
        name: transfer.destination_account_name,
      });
    }
  }

  // Create nodes array with colors
  const accounts = Array.from(accountMap.values());
  const nodes: SankeyNode[] = accounts.map((account, index) => ({
    name: account.name,
    color: getChartColor(index),
    accountId: account.id,
  }));

  // Create index lookup for source/target references
  const accountIndexMap = new Map<string, number>();
  accounts.forEach((account, index) => {
    accountIndexMap.set(account.id, index);
  });

  // Create links array
  const links: SankeyLink[] = transfers.map((transfer) => ({
    source: accountIndexMap.get(transfer.source_account_id)!,
    target: accountIndexMap.get(transfer.destination_account_id)!,
    value: transfer.total_amount,
    transferCount: transfer.transfer_count,
    sourceName: transfer.source_account_name,
    targetName: transfer.destination_account_name,
  }));

  return { nodes, links };
}

/**
 * Custom hook for fetching transfer flow data
 */
function useTransferFlowData(filters: TransferFlowChartFilterProps) {
  const [data, setData] = useState<SankeyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildTransfersUrl(filters);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch transfer data (${response.status})`
        );
      }

      const json: TransfersApiResponse = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (!json.data?.transfers) {
        throw new Error("Invalid response: missing transfers data");
      }

      const sankeyData = transformToSankeyData(json.data.transfers);
      setData(sankeyData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Custom Sankey node component
 * Renders a colored rectangle for each account
 */
interface CustomNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: SankeyNode;
}

function CustomNode({ x, y, width, height, payload }: CustomNodeProps) {
  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={payload.color}
        fillOpacity={0.9}
        rx={2}
        ry={2}
      />
      {/* Account label */}
      <text
        x={x + width + 8}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="central"
        className="fill-foreground text-xs"
      >
        {payload.name}
      </text>
    </Layer>
  );
}

/**
 * Custom tooltip for Sankey links
 */
interface SankeyTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: SankeyLink & {
      source: SankeyNode;
      target: SankeyNode;
    };
  }>;
}

function SankeyTooltip({ active, payload }: SankeyTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const link = payload[0].payload;
  const isLinkData = link.sourceName && link.targetName;

  if (!isLinkData) {
    // Node tooltip
    return (
      <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">
          {link.source?.name || "Account"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-sm font-medium text-foreground">
        Transfer Flow
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">From:</span>
          <span className="font-medium">{link.sourceName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">To:</span>
          <span className="font-medium">{link.targetName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-medium" style={{ color: SEMANTIC_COLORS.transfer }}>
            {formatCurrency(link.value)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Transfers:</span>
          <span className="font-medium">{link.transferCount}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * TransferFlowChart - Displays money movement between accounts
 *
 * Shows a Sankey diagram with:
 * - Nodes representing accounts
 * - Links representing transfer flows with proportional widths
 * - Custom tooltips with transfer details
 */
export function TransferFlowChart({
  startDate,
  endDate,
  title = "Transfer Flow",
  description = "Money movement between your accounts",
  height = 350,
  className,
}: TransferFlowChartProps) {
  const { data, isLoading, error } = useTransferFlowData({
    startDate,
    endDate,
  });

  // Show loading skeleton
  if (isLoading) {
    return <ChartSkeleton height={height} />;
  }

  // Show error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive"
            style={{ height }}
            role="alert"
          >
            <div className="text-center">
              <p className="font-medium">Failed to load chart</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no data
  if (!data || data.nodes.length === 0 || data.links.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <NoData
            title="No transfer data"
            description="There are no transfer transactions between accounts for the selected period."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>
          <Sankey
            width={700}
            height={height}
            data={data}
            nodeWidth={15}
            nodePadding={20}
            margin={{ top: 10, right: 150, left: 10, bottom: 10 }}
            link={{
              stroke: SEMANTIC_COLORS.transfer,
              strokeOpacity: 0.4,
            }}
            node={<CustomNode x={0} y={0} width={0} height={0} index={0} payload={{ name: "", color: "", accountId: "" }} />}
          >
            <Tooltip content={<SankeyTooltip />} />
          </Sankey>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * FilteredTransferFlowChart - Context-aware transfer flow chart component
 *
 * Consumes the FilterContext to automatically fetch and display
 * transfer flow data based on the current filter state. Use this component
 * inside the dashboard where FilterProvider is available.
 *
 * For testing or standalone usage, use TransferFlowChart with explicit props.
 */
export interface FilteredTransferFlowChartProps {
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

export function FilteredTransferFlowChart({
  title = "Transfer Flow",
  description = "Money movement between your accounts",
  height = 350,
  className,
}: FilteredTransferFlowChartProps) {
  const { dateRange } = useFilters();

  return (
    <TransferFlowChart
      startDate={dateRange.start}
      endDate={dateRange.end}
      title={title}
      description={description}
      height={height}
      className={className}
    />
  );
}

export default TransferFlowChart;
