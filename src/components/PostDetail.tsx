import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink, FileText, Heart, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const getSessionId = () => {
  let sessionId = localStorage.getItem('anonymous_session_id');
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('anonymous_session_id', sessionId);
  }
  return sessionId;
};

interface PostDetailProps {
  post: {
    id: string;
    title: string;
    content: string;
    created_at: string;
    image_url?: string | null;
    document_url?: string | null;
    external_url?: string | null;
    likes_count: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export const PostDetail = ({ post, open, onOpenChange, userId }: PostDetailProps) => {
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (post) {
      checkIfLiked();
      setLikesCount(post.likes_count || 0);
    }
  }, [post]);

  const checkIfLiked = async () => {
    if (!post) return;
    
    const sessionId = getSessionId();
    
    const query = supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post.id);
    
    if (userId) {
      query.eq("user_id", userId);
    } else {
      query.eq("session_id", sessionId);
    }

    const { data } = await query.single();
    setHasLiked(!!data);
  };

  const handleLike = async () => {
    if (!post) return;
    
    const sessionId = getSessionId();

    if (hasLiked) {
      const deleteQuery = supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id);
      
      if (userId) {
        deleteQuery.eq("user_id", userId);
      } else {
        deleteQuery.eq("session_id", sessionId);
      }

      const { error } = await deleteQuery;

      if (!error) {
        setHasLiked(false);
        setLikesCount((prev) => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from("post_likes")
        .insert({ 
          post_id: post.id, 
          user_id: userId || null,
          session_id: userId ? null : sessionId
        });

      if (!error) {
        setHasLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    }
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w\u00C0-\u024F]+/g;
    return text.match(hashtagRegex) || [];
  };

  const removeHashtags = (text: string): string => {
    return text.replace(/#[\w\u00C0-\u024F]+/g, '').trim();
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-8 pb-6 border-b border-border/50 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                shein-abdala
                <BadgeCheck className="h-4 w-4 text-primary fill-primary/20 stroke-primary stroke-2" />
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              {post.title}
            </h2>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {post.image_url && (
            <div className="w-full rounded-xl overflow-hidden border border-border/40 shadow-sm">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-base">
            {removeHashtags(post.content)}
          </p>

          {extractHashtags(post.content).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {extractHashtags(post.content).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-sm px-3 py-1 rounded-full font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-border/50">
            <Button
              variant={hasLiked ? "default" : "outline"}
              size="default"
              onClick={handleLike}
              className="gap-2"
            >
              <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
              <span className="font-medium">{likesCount}</span>
              <span className="hidden sm:inline">{likesCount === 1 ? "Curtida" : "Curtidas"}</span>
            </Button>

            {post.external_url && (
              <a
                href={post.external_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="default" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Visitar Link
                </Button>
              </a>
            )}

            {post.document_url && (
              <a
                href={post.document_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="default" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Ver Documento
                </Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
