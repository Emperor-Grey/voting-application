export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: Date | string;
  isCreator?: boolean;
  isClosed?: boolean;
}

// just for you know usage
export interface CreatePollRequest {
  title: string;
  options: string[];
}

export interface VoteRequest {
  optionId: string;
}
