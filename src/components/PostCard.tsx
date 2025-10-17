import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Heart, MessageCircle, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Generate a unique session ID for anonymous users
const getSessionId = () => {
  let sessionId = localStorage.getItem('anonymous_session_id');
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('anonymous_session_id', sessionId);
  }
  return sessionId;
};

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  imageUrl?: string | null;
  likesCount: number;
  userId?: string;
  onClick: () => void;
}

export const PostCard = ({
  id,
  title,
  content,
  createdAt,
  imageUrl,
  likesCount: initialLikesCount,
  userId,
  onClick,
}: PostCardProps) => {
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount || 0);
  const { toast } = useToast();

  useEffect(() => {
    checkIfLiked();
  }, [id]);

  const checkIfLiked = async () => {
    const sessionId = getSessionId();
    
    const query = supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", id);
    
    if (userId) {
      query.eq("user_id", userId);
    } else {
      query.eq("session_id", sessionId);
    }

    const { data } = await query.single();
    setHasLiked(!!data);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const sessionId = getSessionId();

    if (hasLiked) {
      const deleteQuery = supabase
        .from("post_likes")
        .delete()
        .eq("post_id", id);
      
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
          post_id: id, 
          user_id: userId || null,
          session_id: userId ? null : sessionId
        });

      if (!error) {
        setHasLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    }
  };

  const truncateContent = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w\u00C0-\u024F]+/g;
    return text.match(hashtagRegex) || [];
  };

  const removeHashtags = (text: string): string => {
    return text.replace(/#[\w\u00C0-\u024F]+/g, '').trim();
  };

  return (
    <Card 
      className="p-3 bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
              {title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                shein-abdala
                <BadgeCheck className="h-3 w-3 text-primary fill-primary/20 stroke-primary stroke-2" />
              </span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>
        </div>

        {imageUrl && (
          <div className="w-full h-40 rounded-lg overflow-hidden border border-border/40">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {truncateContent(removeHashtags(content))}
        </p>

        {extractHashtags(content).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {extractHashtags(content).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs px-2 py-0.5 rounded-full font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
          <Button
            variant={hasLiked ? "default" : "ghost"}
            size="sm"
            onClick={handleLike}
            className="gap-1.5 h-8 text-xs"
          >
            <Heart className={`h-3.5 w-3.5 ${hasLiked ? "fill-current" : ""}`} />
            <span className="font-medium">{likesCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={onClick}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Ver mais
          </Button>
        </div>
      </div>
    </Card>
  );
};
