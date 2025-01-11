/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: Date;
}

interface WebSocketMessage {
  type: "poll_update";
  pollId: string;
  options: PollOption[];
  totalVotes: number;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function PollDetailPage() {
  const searchParams = useSearchParams();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | undefined>();
  const [wsStatus, setWsStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const [hasVoted, setHasVoted] = useState(false);

  // WebSocket connection setup
  useEffect(() => {
    const pollId = searchParams.get("id");
    if (!pollId) return;

    const ws = new WebSocket(`ws://localhost:8080/ws/polls/${pollId}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsStatus("connected");
      // Subscribe to poll updates
      ws.send(
        JSON.stringify({
          type: "subscribe",
          pollId: pollId,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === "poll_update") {
          setPoll((prevPoll) => {
            if (!prevPoll) return null;
            return {
              ...prevPoll,
              options: message.options,
              totalVotes: message.totalVotes,
            };
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsStatus("error");
    };

    ws.onclose = () => {
      setWsStatus("error");
    };

    // Initial poll data fetch
    const fetchPollData = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}`);
        const data = await response.json();
        setPoll({
          ...data,
          createdAt: new Date(data.createdAt),
        });
      } catch (error) {
        console.error("Error fetching poll data:", error);
      }
    };

    fetchPollData();

    return () => {
      ws.close();
    };
  }, [searchParams]);

  const handleVote = async (optionId: string) => {
    if (hasVoted || !poll) return;

    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId }),
      });

      if (response.ok) {
        setHasVoted(true);
        localStorage.setItem(`voted_${poll.id}`, "true");
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  if (!poll?.id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const chartData = poll.options.map((option) => ({
    name: option.text,
    value: option.votes,
  }));

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

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
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="currentColor"
          className="text-sm"
        >
          {`${value} votes`}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="currentColor"
          className="text-xs opacity-70"
        >
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      {wsStatus === "error" && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Connection lost. Trying to reconnect...
        </div>
      )}

      <Card className="w-full max-w-5xl shadow-xl">
        <CardHeader className="space-y-4 pb-6 pt-8 px-6 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent">
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {poll.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary hover:bg-primary/15"
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {poll.createdAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary hover:bg-primary/15"
              >
                <Users className="mr-1.5 h-3.5 w-3.5" />
                {poll.totalVotes.toLocaleString()}{" "}
                {poll.totalVotes === 1 ? "vote" : "votes"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-8 p-6">
          <div className="h-[400px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {chartData.map((_, index) => (
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
            <h2 className="text-2xl font-semibold text-primary">
              Results Breakdown
            </h2>
            <div className="space-y-4">
              {poll.options.map((option, index) => (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">
                      {option.text}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {option.votes.toLocaleString()} votes (
                      {((option.votes / poll.totalVotes) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Progress
                      value={(option.votes / poll.totalVotes) * 100}
                      className="h-3"
                      style={{
                        backgroundColor: `${COLORS[index % COLORS.length]}20`,
                      }}
                    />
                    {!hasVoted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVote(option.id)}
                        className="shrink-0"
                      >
                        Vote
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
