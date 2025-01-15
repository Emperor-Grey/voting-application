"use client";

import { useState, useEffect } from "react";
import { PollCard } from "@/app/_components/PollCard";
import { SearchPolls } from "@/app/_components/SearchPolls";
import { WebSocketService } from "@/app/_services/websocket";
import { Poll } from "@/types/poll";
import Link from "next/link";
import { Button } from "../_components/Button";
import { PlusCircle } from "lucide-react";

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await fetch("/api/polls");
        if (!response.ok) throw new Error("Failed to fetch polls");
        const data = await response.json();

        // Convert dates from strings to Date objects
        const pollsWithDates = data.map((poll: Poll) => ({
          ...poll,
          createdAt: new Date(poll.createdAt),
        }));

        setPolls(pollsWithDates);
        setFilteredPolls(pollsWithDates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load polls");
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  const handleSearch = (searchTerm: string) => {
    const filtered = polls.filter((poll) =>
      poll.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPolls(filtered);
  };

  // We don't need to manually update the state anymore
  const handleVote = (pollId: string, optionId: string) => {
    const wsService = WebSocketService.getInstance();
    wsService.vote(pollId, optionId);
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
