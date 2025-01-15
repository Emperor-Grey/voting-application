/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { PollCard } from "@/app/_components/PollCard";
import { SearchPolls } from "@/app/_components/SearchPolls";
import { WebSocketService } from "@/app/_services/websocket";
import { Poll } from "@/types/poll";
import Link from "next/link";
import { Button } from "../_components/Button";
import { PlusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load voted polls from localStorage
    const storedVotedPolls = JSON.parse(
      localStorage.getItem("votedPolls") || "{}"
    );
    setVotedPolls(storedVotedPolls);

    const fetchPolls = async () => {
      try {
        const response = await fetch("/api/polls");
        if (!response.ok) throw new Error("Failed to fetch polls");
        const data = await response.json();

        const pollsWithDates = data.map((poll: Poll) => ({
          ...poll,
          createdAt: new Date(poll.createdAt),
        }));

        setPolls(pollsWithDates);
        setFilteredPolls(pollsWithDates);

        // Set up WebSocket subscriptions for all polls
        const wsService = WebSocketService.getInstance();
        pollsWithDates.forEach((poll: Poll) => {
          wsService.subscribe(poll.id, (updatedPoll) => {
            handlePollUpdate(poll.id, updatedPoll);
          });
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load polls");
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();

    // Cleanup WebSocket subscriptions
    return () => {
      const wsService = WebSocketService.getInstance();
      polls.forEach((poll) => {
        wsService.unsubscribe(poll.id, () => {});
      });
    };
  }, []);

  const handlePollUpdate = (pollId: string, updatedPollData: any) => {
    setPolls((currentPolls) =>
      currentPolls.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              options: updatedPollData.options,
              totalVotes: updatedPollData.totalVotes,
            }
          : poll
      )
    );

    setFilteredPolls((currentPolls) =>
      currentPolls.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              options: updatedPollData.options,
              totalVotes: updatedPollData.totalVotes,
            }
          : poll
      )
    );
  };

  const handleSearch = (searchTerm: string) => {
    const filtered = polls.filter((poll) =>
      poll.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPolls(filtered);
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls[pollId]) {
      toast({
        title: "Already voted",
        description: "You have already voted in this poll.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ option_id: optionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      // Update voted polls in state and localStorage
      const newVotedPolls = { ...votedPolls, [pollId]: true };
      setVotedPolls(newVotedPolls);
      localStorage.setItem("votedPolls", JSON.stringify(newVotedPolls));

      // Send vote through WebSocket
      const wsService = WebSocketService.getInstance();
      wsService.vote(pollId, optionId);

      toast({
        title: "Vote submitted!",
        description: "Your vote has been recorded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to submit vote. Please try again.${error}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Polls</h1>
        <Link href="/polls/new" passHref>
          <Button className="justify-center items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Poll
          </Button>
        </Link>
      </div>
      <SearchPolls onSearch={handleSearch} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredPolls.map((poll) => (
          <PollCard key={poll.id} poll={poll} onVote={handleVote} />
        ))}
      </div>
    </div>
  );
}
