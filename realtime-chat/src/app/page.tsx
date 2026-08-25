import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import {  MessagesSquareIcon } from "lucide-react";
import Link from "next/link"




export default function Home() {
  return (
    <>
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessagesSquareIcon />
            </EmptyMedia>
            <EmptyTitle> 
              No Chat Rooms
            </EmptyTitle>
            <EmptyDescription>
              Create a new chat room to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/rooms/new" />}>
              Create a Chat Room
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </>
  )
}
