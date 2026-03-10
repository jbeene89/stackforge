import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useDiscussions, useCreateDiscussion, useDeleteDiscussion, type Discussion } from "@/hooks/useDiscussions";
import { MessageSquare, Reply, Trash2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  targetType: "project" | "module" | "stack";
  targetId: string;
  targetName: string;
}

function CommentItem({
  comment,
  replies,
  targetType,
  targetId,
  userId,
}: {
  comment: Discussion;
  replies: Discussion[];
  targetType: string;
  targetId: string;
  userId?: string;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(true);
  const createDiscussion = useCreateDiscussion();
  const deleteDiscussion = useDeleteDiscussion();

  const handleReply = () => {
    if (!replyText.trim()) return;
    createDiscussion.mutate(
      { targetType, targetId, content: replyText, parentId: comment.id },
      { onSuccess: () => { setReplyText(""); setShowReply(false); } }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="glass rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {(comment.author_name || "?")[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium">{comment.author_name}</span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {userId === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive/60 hover:text-destructive"
                onClick={() => deleteDiscussion.mutate({ id: comment.id, targetType, targetId })}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setShowReply(!showReply)}>
            <Reply className="h-3 w-3 mr-1" /> Reply
          </Button>
          {replies.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setShowReplies(!showReplies)}>
              {showReplies ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showReply && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pl-6">
            <div className="flex gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                className="min-h-[60px] text-sm"
              />
              <Button size="sm" className="self-end" onClick={handleReply} disabled={!replyText.trim() || createDiscussion.isPending}>
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showReplies && replies.length > 0 && (
        <div className="pl-6 space-y-2 border-l-2 border-border/50 ml-3">
          {replies.map((r) => (
            <CommentItem key={r.id} comment={r} replies={[]} targetType={targetType} targetId={targetId} userId={userId} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function DiscussionThread({ targetType, targetId, targetName }: Props) {
  const { user } = useAuth();
  const { data: discussions, isLoading } = useDiscussions(targetType, targetId);
  const createDiscussion = useCreateDiscussion();
  const [open, setOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const topLevel = discussions?.filter((d) => !d.parent_id) || [];
  const repliesMap = new Map<string, Discussion[]>();
  discussions?.forEach((d) => {
    if (d.parent_id) {
      const arr = repliesMap.get(d.parent_id) || [];
      arr.push(d);
      repliesMap.set(d.parent_id, arr);
    }
  });

  const handlePost = () => {
    if (!newComment.trim()) return;
    createDiscussion.mutate(
      { targetType, targetId, content: newComment },
      { onSuccess: () => setNewComment("") }
    );
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" />
        Start a Discussion
        {topLevel.length > 0 && (
          <Badge variant="secondary" className="text-[10px] ml-1">{topLevel.length}</Badge>
        )}
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Discussion</h3>
          <Badge variant="outline" className="text-[10px]">{targetName}</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>
          Collapse
        </Button>
      </div>

      <Separator />

      {/* New comment */}
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts, questions, or feedback…"
          className="min-h-[70px] text-sm"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handlePost} disabled={!newComment.trim() || createDiscussion.isPending}>
            <Send className="h-3 w-3 mr-1" /> {createDiscussion.isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Thread */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>
      ) : topLevel.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No comments yet. Be the first to start a discussion!</p>
      ) : (
        <div className="space-y-3">
          {topLevel.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={repliesMap.get(c.id) || []}
              targetType={targetType}
              targetId={targetId}
              userId={user?.id}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
