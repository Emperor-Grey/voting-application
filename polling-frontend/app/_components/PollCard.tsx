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
}

export function PollCard({ poll, onVote }: PollCardProps) {
  const [localPoll, setLocalPoll] = useState(poll);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const [selectedOptionText, setSelectedOptionText] = useState<string>("");

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
        const updatedPoll = {
          ...prevPoll,
          options: data.options.map((option: any) => ({
            ...option,
            percentage: calculatePercentage(option.votes, data.totalVotes),
          })),
          totalVotes: data.totalVotes,
        };
        return updatedPoll;
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

      // Update local storage to mark this poll as voted
      const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "{}");
      votedPolls[poll.id] = true;
      localStorage.setItem("votedPolls", JSON.stringify(votedPolls));
      setHasVoted(true);

      // Immediately update the local state
      setLocalPoll((prevPoll) => {
        const updatedOptions = prevPoll.options.map((option) => {
          if (option.id === selectedOption) {
            return { ...option, votes: option.votes + 1 };
          }
          return option;
        });
        const newTotalVotes = prevPoll.totalVotes + 1;

        return {
          ...prevPoll,
          options: updatedOptions,
          totalVotes: newTotalVotes,
        };
      });

      const wsService = WebSocketService.getInstance();
      wsService.vote(poll.id, selectedOption);

      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to submit vote(${error}). Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
      setShowConfirmDialog(false);
      setSelectedOption(null);
    }
  };

  const calculatePercentage = (votes: number, total: number) => {
    if (!total) return "0.0";
    return ((votes / total) * 100).toFixed(1);
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
        <CardFooter>
          <Link href={`/polls/${poll.id}`} className="w-full">
            <Button variant="outline" className="w-full">
              <BarChart2 className="mr-2 h-4 w-4" />
              View Detailed Results
            </Button>
          </Link>
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
    </>
  );
}
