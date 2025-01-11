"use client";

import { useState, useEffect } from "react";
import { PollCard } from "@/app/_components/PollCard";
import { SearchPolls } from "@/app/_components/SearchPolls";
import Link from "next/link";
import { Button } from "../_components/Button";
import { PlusCircle } from "lucide-react";

interface Poll {
  id: string;
  title: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  createdAt: Date;
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);

  useEffect(() => {
    const fetchPolls = async () => {
      const mockPolls: Poll[] = [
        {
          id: "1",
          title: "Favorite Programming Language",
          options: [
            { id: "1a", text: "JavaScript", votes: 50 },
            { id: "1b", text: "Python", votes: 30 },
            { id: "1c", text: "Java", votes: 20 },
          ],
          totalVotes: 100,
          createdAt: new Date("2023-01-01"),
        },
        {
          id: "2",
          title: "Best Frontend Framework",
          options: [
            { id: "2a", text: "React", votes: 80 },
            { id: "2b", text: "Vue", votes: 50 },
            { id: "2c", text: "Angular", votes: 30 },
          ],
          totalVotes: 160,
          createdAt: new Date("2023-02-15"),
        },
        {
          id: "3",
          title: "Preferred Database",
          options: [
            { id: "3a", text: "PostgreSQL", votes: 40 },
            { id: "3b", text: "MongoDB", votes: 35 },
            { id: "3c", text: "MySQL", votes: 25 },
          ],
          totalVotes: 100,
          createdAt: new Date("2023-03-20"),
        },
      ];
      setPolls(mockPolls);
      setFilteredPolls(mockPolls);
    };

    fetchPolls();
  }, []);

  const handleSearch = (searchTerm: string) => {
    const filtered = polls.filter((poll) =>
      poll.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPolls(filtered);
  };

  const handleVote = (pollId: string, optionId: string) => {
    setPolls((prevPolls) =>
      prevPolls.map((poll) => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map((option) => {
            if (option.id === optionId) {
              return { ...option, votes: option.votes + 1 };
            }
            return option;
          });
          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + 1,
          };
        }
        return poll;
      })
    );
    setFilteredPolls((prevFilteredPolls) =>
      prevFilteredPolls.map((poll) => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map((option) => {
            if (option.id === optionId) {
              return { ...option, votes: option.votes + 1 };
            }
            return option;
          });
          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + 1,
          };
        }
        return poll;
      })
    );
  };

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
