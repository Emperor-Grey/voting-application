/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { WebSocketService } from "../_services/websocket";
import { useEffect, useState } from "react";
import { Poll } from "@/types/poll";

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
}

export function PollCard({ poll, onVote }: PollCardProps) {
  const [localPoll, setLocalPoll] = useState(poll);
  const [selectedOption, setSelectedOption] = useState<string>("");

  useEffect(() => {
    const wsService = WebSocketService.getInstance();

    const handlePollUpdate = (data: any) => {
      setLocalPoll((prevPoll) => ({
        ...prevPoll,
        options: data.options,
        totalVotes: data.totalVotes,
      }));
    };

    try {
      wsService.subscribe(poll.id, handlePollUpdate);
    } catch (error) {
      console.error("Failed to subscribe to poll updates:", error);
    }

    return () => {
      try {
        wsService.unsubscribe(poll.id, handlePollUpdate);
      } catch (error) {
        console.error("Failed to unsubscribe from poll updates:", error);
      }
    };
  }, [poll.id]);

  const handleVote = (optionId: string) => {
    if (!optionId) return;

    try {
      const wsService = WebSocketService.getInstance();
      wsService.vote(poll.id, optionId);
      onVote(poll.id, optionId);
      setSelectedOption(optionId);
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      // If it's already a Date object, use it directly
      const dateObj = date instanceof Date ? date : new Date(date);
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date");
      }
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Date unavailable";
    }
  };

  // Calculate percentage safely
  const calculatePercentage = (votes: number, total: number) => {
    if (!total) return "0.0";
    return ((votes / total) * 100).toFixed(1);
  };

  return (
    <Card className="hover:shadow-lg max-h-fit transition-all duration-300 ease-in-out">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{poll.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup onValueChange={handleVote} className="space-y-2">
          {localPoll.options.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="text-sm font-medium">
                  {option.text}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold">{option.votes}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{
                      width: `${calculatePercentage(
                        option.votes,
                        poll.totalVotes
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {calculatePercentage(option.votes, poll.totalVotes)}%
                </span>
              </div>
            </div>
          ))}
        </RadioGroup>
        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <span className="justify-center items-center flex space-x-1">
            <CheckCircle2 className="inline mr-1 h-4 w-4 font-semibold" />
            {poll.totalVotes} votes
          </span>
          <span>Created {formatDate(poll.createdAt)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={{
            pathname: `/polls/${poll.id}`,
            query: {
              pollData: JSON.stringify({
                ...poll,
                createdAt: formatDate(poll.createdAt),
              }),
            },
          }}
          className="w-full"
        >
          <Button variant="outline" className="w-full">
            <BarChart2 className="mr-2 h-4 w-4" />
            View Detailed Results
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
