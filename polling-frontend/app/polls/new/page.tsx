import CreatePollForm from "@/app/_components/CreatePollForm";

export default function CreatePollPage() {
  return (
    <div className="container mx-auto px-4 py-8 relative max-w-6xl ">
      <h1 className="text-3xl font-bold mb-6">Create a New Poll</h1>
      <CreatePollForm />
    </div>
  );
}
