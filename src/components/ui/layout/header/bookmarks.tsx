import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { BookmarkIcon } from "lucide-react";
import { Skeleton } from "../../skeleton";
import { Suspense } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";

export const Bookmarks = async () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <p className="flex items-center hover:bg-muted cursor-pointer  gap-1 p-1">
          <BookmarkIcon className="h-4 w-4" /> Saved
        </p>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-1">
            Bookmarks <BookmarkIcon className="h-4 w-4" />
          </SheetTitle>
        </SheetHeader>

        <Suspense fallback={<Skeleton className=" h-[calc(100vh-64px)]" />}>
          <ScrollArea className="h-[calc(100vh-64px)] p-4 ">
            <div className="flex flex-col gap-4 ">
              {/* <MainContent /> */}
            </div>
          </ScrollArea>
        </Suspense>
      </SheetContent>
    </Sheet>
  );
};