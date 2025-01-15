/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, Users } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from "recharts";
import { Poll } from "@/types/poll";

// Colors for the pie chart segments
const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];

const PollDetailsPage = () => {
  const searchParams = useSearchParams();
  const pollId = searchParams.get("id");
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}`);
        if (!response.ok) throw new Error("Failed to fetch poll");
        const data = await response.json();
        setPoll({
          ...data,
          createdAt: new Date(data.createdAt),
        });
      } catch (err: Error | any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  const handleVote = (optionId: any) => {
    if (!pollId || !poll || hasVoted) return;

    fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ option_id: optionId }),
    })
      .then((res) => res.json())
      .then((updatedPoll) => {
        setPoll(updatedPoll);
        setHasVoted(true);
      })
      .catch((err) => console.error("Error voting:", err));
  };

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      // percent,
      // value,
    } = props;

    return (
      <g>
        <text
          x={cx}
          y={cy}
          dy={8}
          textAnchor="middle"
          fill={fill}
          className="text-base font-medium"
        >
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary" />
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

  if (!poll) return null;

  const chartData = poll.options.map((option: { text: any; votes: any }) => ({
    name: option.text,
    value: option.votes,
  }));

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

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-5xl">
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold">{poll.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {formatDate(poll.createdAt)}
              </Badge>
              <Badge variant="secondary">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                {poll.totalVotes} votes
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index: number) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Results</h2>
            <div className="space-y-4">
              {poll.options.map(
                (
                  option: {
                    id: React.Key | null | undefined;
                    text:
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactElement<
                          unknown,
                          string | React.JSXElementConstructor<any>
                        >
                      | Iterable<React.ReactNode>
                      | React.ReactPortal
                      | Promise<
                          | string
                          | number
                          | bigint
                          | boolean
                          | React.ReactPortal
                          | React.ReactElement<
                              unknown,
                              string | React.JSXElementConstructor<any>
                            >
                          | Iterable<React.ReactNode>
                          | null
                          | undefined
                        >
                      | null
                      | undefined;
                    votes:
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactElement<
                          unknown,
                          string | React.JSXElementConstructor<any>
                        >
                      | Iterable<React.ReactNode>
                      | Promise<
                          | string
                          | number
                          | bigint
                          | boolean
                          | React.ReactPortal
                          | React.ReactElement<
                              unknown,
                              string | React.JSXElementConstructor<any>
                            >
                          | Iterable<React.ReactNode>
                          | null
                          | undefined
                        >
                      | null
                      | undefined;
                  }
                  // index: number
                ) => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{option.text}</span>
                      <span className="text-sm text-muted-foreground">
                        {option.votes} votes (
                        {(
                          ((Number(option.votes) || 0) / poll.totalVotes) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Progress
                        value={
                          ((Number(option.votes) || 0) / poll.totalVotes) * 100
                        }
                        className="h-3"
                      />
                      {!hasVoted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVote(option.id)}
                        >
                          Vote
                        </Button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PollDetailsPage;
