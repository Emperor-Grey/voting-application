"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Poll } from "@/types/poll";
import { WebSocketService } from "@/app/_services/websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/app/lib/utils";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/polls/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch poll");
        const data = await response.json();
        setPoll(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load poll");
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();

    // Set up WebSocket subscription
    const wsService = WebSocketService.getInstance();
    const handleUpdate = (updatedPoll: Poll) => {
      setPoll(updatedPoll);
    };

    wsService.subscribe(params.id, handleUpdate);

    return () => {
      wsService.unsubscribe(params.id, handleUpdate);
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error || "Poll not found"}</div>
      </div>
    );
  }

  // Calculate total votes
  const totalVotes = poll.options.reduce(
    (sum, option) => sum + option.votes,
    0
  );

  // Prepare data for charts
  const chartData = poll.options.map((option) => ({
    name: option.text,
    votes: option.votes,
    percentage:
      totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0,
  }));

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold">{poll.title}</CardTitle>
            <Badge variant={poll.isClosed ? "destructive" : "default"}>
              {poll.isClosed ? "Closed" : "Active"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Created on {formatDate(poll.createdAt)}
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Votes Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value} votes`, "Votes"]}
                  />
                  <Bar dataKey="votes" fill="#4f46e5">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Percentage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="votes"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vote Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="text-lg font-semibold">Total Votes</h3>
                <p className="text-3xl font-bold">{totalVotes}</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="text-lg font-semibold">Leading Option</h3>
                <p className="text-3xl font-bold">
                  {
                    chartData.reduce((prev, current) =>
                      Number(current.votes) > Number(prev.votes)
                        ? current
                        : prev
                    ).name
                  }
                </p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="text-lg font-semibold">Options</h3>
                <p className="text-3xl font-bold">{poll.options.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
