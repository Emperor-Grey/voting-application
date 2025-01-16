import { Button } from "@/components/ui/button";

interface PollFiltersProps {
  onFilterChange: (filters: { closed?: boolean; creator?: string }) => void;
}

export function PollFilters({ onFilterChange }: PollFiltersProps) {
  return (
    <div className="flex gap-4 mb-6">
      <Button
        variant="outline"
        onClick={() => onFilterChange({ closed: false })}
      >
        Active Polls
      </Button>
      <Button
        variant="outline"
        onClick={() => onFilterChange({ closed: true })}
      >
        Closed Polls
      </Button>
      <Button variant="outline" onClick={() => onFilterChange({})}>
        All Polls
      </Button>
    </div>
  );
}
