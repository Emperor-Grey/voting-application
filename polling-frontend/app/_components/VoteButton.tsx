import { Button } from "@/app/_components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface VoteButtonProps {
  pollId: string;
  optionId: string;
  optionText: string;
  votes: number;
  onVote: (pollId: string, optionId: string) => Promise<void>;
  disabled?: boolean;
}

export function VoteButton({
  pollId,
  optionId,
  optionText,
  votes,
  onVote,
  disabled = false,
}: VoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    setIsVoting(true);
    try {
      await onVote(pollId, optionId);
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Button
      onClick={handleVote}
      disabled={disabled || isVoting}
      variant="outline"
      className="w-full justify-between"
    >
      <span>{optionText}</span>
      <div className="flex items-center gap-2">
        {isVoting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="font-medium">{votes}</span>
        )}
      </div>
    </Button>
  );
}
