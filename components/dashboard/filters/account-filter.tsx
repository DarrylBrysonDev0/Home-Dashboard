"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Account type from the filters API
 */
export interface Account {
  account_id: string;
  account_name: string;
  account_type: "Checking" | "Savings" | string;
  account_owner: "Joint" | "User1" | "User2" | string;
  current_balance?: number;
  last_transaction_date?: string | null;
  transaction_count?: number;
}

/**
 * AccountFilter Component Props
 */
export interface AccountFilterProps {
  /** Available accounts to select from */
  accounts: Account[];
  /** Currently selected account IDs */
  selectedAccountIds: string[];
  /** Called when selection changes */
  onChange: (accountIds: string[]) => void;
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Group accounts by type (Checking/Savings) */
  groupByType?: boolean;
  /** Show owner name for each account */
  showOwner?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * AccountFilter Component
 *
 * Multi-select dropdown for filtering by accounts.
 * Supports grouping by type and shows account type badges.
 */
export function AccountFilter({
  accounts,
  selectedAccountIds,
  onChange,
  isLoading = false,
  groupByType = false,
  showOwner = false,
  className,
}: AccountFilterProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (accountId: string) => {
    const isSelected = selectedAccountIds.includes(accountId);
    if (isSelected) {
      onChange(selectedAccountIds.filter((id) => id !== accountId));
    } else {
      onChange([...selectedAccountIds, accountId]);
    }
  };

  const handleSelectAll = () => {
    onChange(accounts.map((a) => a.account_id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (selectedAccountIds.length === 0) {
      return "All Accounts";
    }
    if (selectedAccountIds.length === 1) {
      const account = accounts.find((a) => a.account_id === selectedAccountIds[0]);
      return account?.account_name || "1 account";
    }
    return `${selectedAccountIds.length} accounts`;
  };

  // Group accounts by type if needed
  const groupedAccounts = React.useMemo(() => {
    if (!groupByType) {
      return { all: accounts };
    }

    const groups: Record<string, Account[]> = {};
    accounts.forEach((account) => {
      const type = account.account_type || "Other";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(account);
    });
    return groups;
  }, [accounts, groupByType]);

  if (isLoading) {
    return (
      <div data-testid="account-filter-skeleton" className={className}>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Filter by account"
          disabled={true}
          className="w-[180px] justify-between opacity-50"
        >
          <span className="truncate">Loading...</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Filter by account"
          aria-haspopup="listbox"
          disabled={isLoading}
          className={cn("w-[180px] justify-between", className)}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandList role="listbox" aria-multiselectable="true">
            {accounts.length === 0 ? (
              <CommandEmpty>No accounts available</CommandEmpty>
            ) : (
              <>
                {/* Select All / Clear All buttons */}
                <div className="flex items-center justify-between px-2 py-2 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-7 text-xs"
                  >
                    Select All
                  </Button>
                  {selectedAccountIds.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {groupByType ? (
                  // Grouped view - hide type badge since it's already in the heading
                  Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
                    <CommandGroup key={type} heading={type}>
                      {typeAccounts.map((account) => (
                        <AccountItem
                          key={account.account_id}
                          account={account}
                          isSelected={selectedAccountIds.includes(account.account_id)}
                          showOwner={showOwner}
                          showTypeBadge={false}
                          onSelect={() => handleSelect(account.account_id)}
                        />
                      ))}
                    </CommandGroup>
                  ))
                ) : (
                  // Flat view - show type badge since there's no grouping
                  <CommandGroup>
                    {accounts.map((account) => (
                      <AccountItem
                        key={account.account_id}
                        account={account}
                        isSelected={selectedAccountIds.includes(account.account_id)}
                        showOwner={showOwner}
                        showTypeBadge={true}
                        onSelect={() => handleSelect(account.account_id)}
                      />
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Individual account item in the dropdown
 */
interface AccountItemProps {
  account: Account;
  isSelected: boolean;
  showOwner?: boolean;
  showTypeBadge?: boolean;
  onSelect: () => void;
}

function AccountItem({
  account,
  isSelected,
  showOwner,
  showTypeBadge = true,
  onSelect
}: AccountItemProps) {
  return (
    <CommandItem
      role="option"
      aria-selected={isSelected}
      onSelect={onSelect}
      className="flex items-center gap-2 cursor-pointer"
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onSelect()}
        aria-label={`Select ${account.account_name}`}
        tabIndex={-1}
        className="pointer-events-none"
      />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="truncate">{account.account_name}</span>
        {showOwner && (
          <span className="text-xs text-muted-foreground truncate">
            {account.account_owner}
          </span>
        )}
      </div>
      {showTypeBadge && (
        <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
          {account.account_type}
        </Badge>
      )}
    </CommandItem>
  );
}
