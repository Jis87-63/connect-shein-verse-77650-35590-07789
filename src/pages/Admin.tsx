import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { PostManager } from "@/components/PostManager";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { Upload, Link as LinkIcon } from "lucide-react";
import type { SupportMessage } from "@/types/database";

const postSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(200),
  content: z.string().trim().min(1, "Conteúdo é obrigatório").max(5000),
  externalUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

const ADMIN_CODE = "MADARA";

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [showAuthForm, setShowAuthForm] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Call the function to grant admin access
      const { data, error } = await supabase.rpc('grant_admin_with_code', {
        admin_code: authCode
      });
      
      if (error) throw error;
      
      if (data === true) {
        setIsAdmin(true);
        setShowAuthForm(false);
        loadMessages();
        toast({ title: "Acesso autorizado!" });
      } else {
        toast({
          title: "Código incorreto",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Erro ao autenticar",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setMessages(data as SupportMessage[]);
  };

  const uploadFile = async (file: File, type: "image" | "document") => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("post-media").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const validated = postSchema.parse({ title, content, externalUrl });

      let imageUrl = null;
      let documentUrl = null;

      if (imageFile) {
        imageUrl = await uploadFile(imageFile, "image");
      }

      if (documentFile) {
        documentUrl = await uploadFile(documentFile, "document");
      }

      const { error } = await supabase.from("posts").insert([
        {
          title: validated.title,
          content: validated.content,
          author_id: user.id,
          external_url: validated.externalUrl || null,
          image_url: imageUrl,
          document_url: documentUrl,
        },
      ]);

      if (error) throw error;

      toast({ title: "Post publicado com sucesso!" });
      setTitle("");
      setContent("");
      setExternalUrl("");
      setImageFile(null);
      setDocumentFile(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao publicar post",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (showAuthForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 space-y-6 border-border/50">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">SM</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Acesso Administrativo
            </h1>
            <p className="text-muted-foreground">
              Digite o código de autorização
            </p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de Autorização</Label>
              <Input
                id="code"
                type="password"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Digite o código"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/")}
          >
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAdmin />
      <div className="container mx-auto px-4 pt-24 pb-12 space-y-8">
        <h1 className="text-4xl font-bold text-foreground">
          Painel Administrativo
        </h1>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Criar Publicação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da publicação"
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva o conteúdo aqui..."
                  rows={6}
                  required
                  maxLength={5000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="externalUrl">URL Externa (opcional)</Label>
                <div className="flex gap-2">
                  <LinkIcon className="h-5 w-5 text-muted-foreground mt-2" />
                  <Input
                    id="externalUrl"
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://exemplo.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Imagem (opcional)</Label>
                <div className="flex gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground mt-2" />
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
                {imageFile && (
                  <p className="text-sm text-muted-foreground">{imageFile.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">Documento (opcional)</Label>
                <div className="flex gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground mt-2" />
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  />
                </div>
                {documentFile && (
                  <p className="text-sm text-muted-foreground">{documentFile.name}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Publicando..." : "Publicar"}
              </Button>
            </form>
          </Card>

          <Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Mensagens de Suporte</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
              ) : (
                messages.map((msg) => (
                  <Card key={msg.id} className="p-5 bg-muted/50 border-border/30">
                    <p className="font-semibold text-foreground">{msg.name}</p>
                    <p className="text-sm text-muted-foreground">{msg.email}</p>
                    <p className="mt-3 text-foreground/80">{msg.message}</p>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm">
          <PostManager />
        </Card>
      </div>
    </div>
  );
};

export default Admin;
