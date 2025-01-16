import { create } from "zustand";
import { Poll } from "@/types/poll";

interface PollStore {
  polls: Poll[];
  setPolls: (polls: Poll[]) => void;
  updatePoll: (pollId: string, updatedPoll: Partial<Poll>) => void;
  deletePoll: (pollId: string) => void;
  resetPollVotes: (pollId: string) => void;
}

export const usePollStore = create<PollStore>((set) => ({
  polls: [],
  setPolls: (polls) => set({ polls }),
  updatePoll: (pollId, updatedPoll) =>
    set((state) => ({
      polls: state.polls.map((poll) =>
        poll.id === pollId ? { ...poll, ...updatedPoll } : poll
      ),
    })),
  deletePoll: (pollId) =>
    set((state) => ({
      polls: state.polls.filter((poll) => poll.id !== pollId),
    })),
  resetPollVotes: (pollId) =>
    set((state) => ({
      polls: state.polls.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              options: poll.options.map((opt) => ({ ...opt, votes: 0 })),
              totalVotes: 0,
            }
          : poll
      ),
    })),
}));
