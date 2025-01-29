/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";
import { CreatePollRequest } from "@/app/_types/poll";

export default function CreatePollForm() {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!title.trim()) {
      setError("Please enter a poll title");
      setIsLoading(false);
      return;
    }

    if (options.length < 3) {
      setError("Please provide at least three options (min)");
      setIsLoading(false);
      return;
    }

    if (options.length > 4) {
      setError("Only four options are allowed (max)");
      setIsLoading(false);
      return;
    }

    const validOptions = options.filter((option) => option.trim() !== "");
    if (validOptions.length < 3) {
      setError("Please provide at least three valid options");
      setIsLoading(false);
      return;
    }

    try {
      const pollData: CreatePollRequest = {
        title: title.trim(),
        options: validOptions,
      };

      const response = await fetch("/api/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pollData),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Failed to create poll");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to create poll");
      }

      router.push("/polls");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create poll");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Poll Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter your poll question"
          required
        />
      </div>
      <div className="space-y-4">
        <Label>Options</Label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              required
            />
            {index >= 2 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemoveOption(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddOption}
          className="w-full"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Option
        </Button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <Button type="submit" className="w-full">
        Create Poll
      </Button>
    </form>
  );
}
