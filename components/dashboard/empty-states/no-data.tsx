import { FileQuestion, type LucideIcon } from "lucide-react";

interface NoDataProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function NoData({
  title = "No data available",
  description = "There are no transactions to display for the selected time period.",
  icon: Icon = FileQuestion,
}: NoDataProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 rounded-full bg-off-white p-4">
        <Icon className="h-8 w-8 text-medium-gray" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-dark-gray">{title}</h3>
      <p className="max-w-sm text-sm text-medium-gray">{description}</p>
    </div>
  );
}
