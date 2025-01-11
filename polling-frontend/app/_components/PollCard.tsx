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

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
}

export function PollCard({ poll, onVote }: PollCardProps) {
  const handleVote = (optionId: string) => {
    onVote(poll.id, optionId);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 ease-in-out">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{poll.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup onValueChange={handleVote} className="space-y-2">
          {poll.options.map((option) => (
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
                      width: `${(option.votes / poll.totalVotes) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {((option.votes / poll.totalVotes) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </RadioGroup>
        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <span>
            <CheckCircle2 className="inline mr-1 h-4 w-4" />
            {poll.totalVotes} votes
          </span>
          <span>Created {poll.createdAt.toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={{
            pathname: `/polls/${poll.id}`,
            query: {
              pollData: JSON.stringify({
                ...poll,
                createdAt: poll.createdAt.toISOString(),
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
