/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/_store/store";
import { PollCard } from "@/app/_components/PollCard";
import { toast } from "@/app/_hooks/use-toast";
import { Poll } from "@/app/_types/poll";
import { usePollStore } from "@/app/_store/pollStore";

export default function ManagePollsPage() {
  const { username } = useAuthStore();
  const { polls, setPolls, deletePoll, resetPollVotes } = usePollStore();

  useEffect(() => {
    const fetchUserPolls = async () => {
      const response = await fetch(`/api/polls?creator=${username}`);
      const data = await response.json();
      setPolls(data);
    };

    fetchUserPolls();
  }, [username, setPolls]);

  const fetchUserPolls = async () => {
    const response = await fetch(`/api/polls?creator=${username}`);
    const data = await response.json();
    setPolls(data);
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      await deletePoll(pollId);
      usePollStore.getState().deletePoll(pollId);
      toast({
        title: "Success",
        description: "Poll deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete poll, ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleResetVotes = async (pollId: string) => {
    try {
      await resetPollVotes(pollId);
      usePollStore.getState().resetPollVotes(pollId);
      toast({
        title: "Success",
        description: "Poll votes reset successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to reset votes, ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleVote = async (
    _pollId: string,
    _optionId: string
  ): Promise<void> => {
    // Since we don't want to allow voting from manage page, we'll return an empty promise
    return Promise.resolve();
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Your Polls</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            onVote={handleVote}
            onClose={handleDeletePoll}
            onReset={handleResetVotes}
            showControls={true}
          />
        ))}
      </div>
    </div>
  );
}
