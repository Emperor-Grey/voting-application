/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, CheckCircle2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import { WebSocketService } from "../_services/websocket";
import { Poll } from "@/types/poll";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "../_store/store";
import { formatDate } from "../lib/utils";

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => Promise<void>;
  onClose?: (pollId: string) => Promise<void>;
  onReset?: (pollId: string) => Promise<void>;
  showControls?: boolean;
}

export function PollCard({
  poll,
  onVote,
  onClose,
  onReset,
  showControls = false,
}: PollCardProps) {
  const [localPoll, setLocalPoll] = useState(poll);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedOptionText, setSelectedOptionText] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Check if user has already voted for this poll
    const checkVoteStatus = () => {
      const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "{}");
      setHasVoted(!!votedPolls[poll.id]);
    };

    checkVoteStatus();
  }, [poll.id]);

  useEffect(() => {
    const wsService = WebSocketService.getInstance();

    const handlePollUpdate = (data: any) => {
      setLocalPoll((prevPoll) => {
        const updatedOptions = data.options.map((option: any) => ({
          ...option,
          votes: option.votes,
        }));

        const newTotalVotes = updatedOptions.reduce(
          (sum: number, opt: any) => sum + opt.votes,
          0
        );

        return {
          ...prevPoll,
          options: updatedOptions,
          totalVotes: newTotalVotes,
          isClosed: data.isClosed,
          createdAt: data.createdAt || prevPoll.createdAt,
        };
      });
    };

    wsService.subscribe(poll.id, handlePollUpdate);

    return () => {
      wsService.unsubscribe(poll.id, handlePollUpdate);
    };
  }, [poll.id]);

  const handleOptionSelect = (optionId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote in polls.",
        variant: "destructive",
      });
      return;
    }

    if (hasVoted) {
      toast({
        title: "Already Voted",
        description: "You have already voted in this poll.",
        variant: "destructive",
      });
      return;
    }

    const selectedOpt = localPoll.options.find((opt) => opt.id === optionId);
    if (selectedOpt) {
      setSelectedOption(optionId);
      setSelectedOptionText(selectedOpt.text);
      setShowConfirmDialog(true);
    }
  };

  const handleVoteConfirm = async () => {
    if (!selectedOption) return;

    setIsVoting(true);
    try {
      await onVote(poll.id, selectedOption);

      // Update local storage
      const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "{}");
      votedPolls[poll.id] = true;
      localStorage.setItem("votedPolls", JSON.stringify(votedPolls));
      setHasVoted(true);

      // Update local state with new vote count
      setLocalPoll((prevPoll) => {
        const updatedOptions = prevPoll.options.map((option) => ({
          ...option,
          votes: option.id === selectedOption ? option.votes + 1 : option.votes,
        }));

        const newTotalVotes = updatedOptions.reduce(
          (sum, opt) => sum + opt.votes,
          0
        );

        return {
          ...prevPoll,
          options: updatedOptions,
          totalVotes: newTotalVotes,
        };
      });

      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to submit vote. Please try again., ${error}}`,
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
      setShowConfirmDialog(false);
      setSelectedOption(null);
    }
  };

  const calculatePercentage = (votes: number, total: number): string => {
    if (!total) return "0";
    return ((votes / total) * 100).toFixed(1);
  };

  const handleResetConfirm = async () => {
    try {
      setIsResetting(true);
      await onReset?.(poll.id);

      // Update local state
      setLocalPoll((prev) => ({
        ...prev,
        options: prev.options.map((opt) => ({
          ...opt,
          votes: 0,
        })),
        totalVotes: 0,
      }));

      setShowResetDialog(false);
    } catch (error) {
      console.error("Failed to reset votes:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await onClose?.(poll.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete poll:", error);
      toast({
        title: "Error",
        description: "Failed to delete poll",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg max-h-fit transition-all duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{poll.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            onValueChange={handleOptionSelect}
            value={selectedOption || ""}
            className="space-y-2"
          >
            {localPoll.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    disabled={isVoting || hasVoted}
                  />
                  <Label htmlFor={option.id} className="text-sm font-medium">
                    {option.text}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">{option.votes}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${calculatePercentage(
                          option.votes,
                          localPoll.totalVotes
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {calculatePercentage(option.votes, localPoll.totalVotes)}%
                  </span>
                </div>
              </div>
            ))}
          </RadioGroup>
          <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
            <span className="justify-center items-center flex space-x-1">
              <CheckCircle2 className="inline mr-1 h-4 w-4 font-semibold" />
              {localPoll.totalVotes} votes
              {hasVoted && <span className="ml-2">(You voted)</span>}
            </span>
            <span>Created {formatDate(localPoll.createdAt)}</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href={`/polls/${poll.id}`} className="w-full">
            <Button variant="outline" className="w-full">
              <BarChart2 className="mr-2 h-4 w-4" />
              View Detailed Results
            </Button>
          </Link>

          {showControls && (
            <div className="flex gap-2 w-full">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Poll
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowResetDialog(true)}
              >
                Reset Votes
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to vote for &quot;{selectedOptionText}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoteConfirm}
              disabled={isVoting}
              className="bg-primary"
            >
              {isVoting ? "Voting..." : "Confirm Vote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showControls && (
        <>
          <AlertDialog
            open={showConfirmDialog}
            onOpenChange={setShowConfirmDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close Poll</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to close this poll? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Close Poll
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Poll Votes</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reset all votes for this poll? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isResetting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetConfirm}
                  disabled={isResetting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isResetting ? "Resetting..." : "Reset Votes"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this poll? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Poll"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
