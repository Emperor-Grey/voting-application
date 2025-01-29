"use client";

import { useState, useEffect } from "react";
import { PollCard } from "@/app/_components/PollCard";
import { SearchPolls } from "@/app/_components/SearchPolls";
import { WebSocketService } from "@/app/_services/websocket";
import Link from "next/link";
import { Button } from "../_components/Button";
import { PlusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePollStore } from "@/app/_store/pollStore";
import { votePoll } from "../lib/api";

export default function PollsPage() {
  const { polls, setPolls, updatePoll, deletePoll } = usePollStore();
  const [filteredPolls, setFilteredPolls] = useState(polls);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Record<string, boolean>>({});
  const wsService = WebSocketService.getInstance();

  useEffect(() => {
    const storedVotedPolls = JSON.parse(
      localStorage.getItem("votedPolls") || "{}"
    );
    setVotedPolls(storedVotedPolls);

    const fetchPolls = async () => {
      try {
        const response = await fetch("/api/polls");
        if (!response.ok) throw new Error("Failed to fetch polls");
        const data = await response.json();
        setPolls(data);
        setFilteredPolls(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load polls");
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();

    // Subscribe to all poll updates
    wsService.onPollUpdate((pollId, updatedPoll) => {
      if (updatedPoll === null) {
        // Handle poll deletion
        deletePoll(pollId);
        setFilteredPolls((prev) => prev.filter((p) => p.id !== pollId));
      } else {
        // Handle poll update
        updatePoll(pollId, updatedPoll);
        setFilteredPolls((prev) =>
          prev.map((poll) =>
            poll.id === pollId ? { ...poll, ...updatedPoll } : poll
          )
        );
      }
    });

    return () => {
      // Cleanup WebSocket subscription
      wsService.cleanup();
    };
  }, [setPolls, updatePoll, deletePoll, wsService]);

  // Update filtered polls when main polls list changes
  useEffect(() => {
    setFilteredPolls(polls);
  }, [polls]);

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
      await votePoll(pollId, optionId);

      // Update voted polls in state and localStorage
      const newVotedPolls = { ...votedPolls, [pollId]: true };
      setVotedPolls(newVotedPolls);
      localStorage.setItem("votedPolls", JSON.stringify(newVotedPolls));

      // Send vote through WebSocket
      wsService.vote(pollId, optionId);

      toast({
        title: "Vote submitted!",
        description: "Your vote has been recorded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to submit vote. Please try again. ${error}`,
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
