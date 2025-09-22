"use client";
import { Button } from "@/components/ui/button";
import { bookmarkCar } from "@/lib/actions/cars-action";
import { HeartIcon, Share2Icon } from "lucide-react";
import React, { useOptimistic } from "react";
import { toast } from "sonner";

const copyToClipboard = async (text: string) => {
  try {
    await window.navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  } catch (error) {
    console.error("Failed to copy text: ", error);
    toast.error("Failed to copy text");
  }
};

type Props = {
  carId: string;
  savedBy: {
    id: string;
  }[];
  userId?: string;
};
const CoverButtons = ({ carId, savedBy, userId }: Props) => {
  const isSavedByMe = savedBy.some((user) => user.id === userId);
  const [isSaved, startTransition] = useOptimistic(
    isSavedByMe,
    (state) => !state
  );
  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => copyToClipboard(`${window.location.href}`)}
      >
        <Share2Icon className="w-5 h-5" />
      </Button>
      <form
        action={async () => {
          startTransition(true);
          await bookmarkCar(carId);
        }}
      >
        <Button>
          {isSaved ? (
            <>
              <HeartIcon className="h-5 w-5 fill-primary " />
            </>
          ) : (
            <HeartIcon className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default CoverButtons;
