import type { CommentRecord } from "@agent-kanban/contracts";
import { MessageSquareQuote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function CommentList({ comments }: { comments: CommentRecord[] }) {
  return (
    <div className="flex flex-col gap-3">
      {comments.length === 0 ? (
        <Card className="bg-card/70">
          <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
            No timeline comments yet.
          </CardContent>
        </Card>
      ) : (
        comments.map((comment) => (
          <Card key={comment.id} className="bg-card/70">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{comment.kind}</Badge>
                <Badge variant="outline">{comment.authorId}</Badge>
                <Badge variant="muted" suppressHydrationWarning>{new Date(comment.createdAt).toLocaleString()}</Badge>
              </div>
              <div className="flex items-start gap-3 text-sm leading-7 text-foreground">
                <MessageSquareQuote className="mt-1 size-4 text-primary" />
                <p>{comment.body}</p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
