"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trophy, Heart, Star } from "lucide-react";

interface GratitudePost {
  id: string;
  author: string;
  avatarUrl?: string;
  content: string;
  reactions: { AMEN: number; GLORY: number };
  userReacted?: "AMEN" | "GLORY" | null;
  createdAt: string;
}

interface GratitudeFeedProps {
  posts: GratitudePost[];
  onReact: (postId: string, type: "AMEN" | "GLORY") => void;
  onPost: (content: string) => void;
  autoOpenForm?: boolean;
  onFormOpened?: () => void;
}

function PostCard({ post, onReact }: { post: GratitudePost; onReact: (type: "AMEN" | "GLORY") => void }) {
  const [localReaction, setLocalReaction] = useState(post.userReacted ?? null);
  const [counts, setCounts] = useState(post.reactions);
  const [burst, setBurst] = useState(false);

  const react = useCallback((type: "AMEN" | "GLORY") => {
    if (localReaction === type) return;
    setBurst(true);
    setTimeout(() => setBurst(false), 600);
    if (localReaction) {
      setCounts((prev) => ({ ...prev, [localReaction]: prev[localReaction] - 1, [type]: prev[type] + 1 }));
    } else {
      setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    }
    setLocalReaction(type);
    onReact(type);
  }, [localReaction, onReact]);

  const initials = post.author.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const isRecent = post.createdAt.includes("hora") || post.createdAt.includes("minuto") || post.createdAt === "agora";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`divine-card p-6 flex flex-col gap-3 ${isRecent ? "border-l-2 border-l-gold/40" : ""}`}
    >
      {/* Author */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full bg-divine-100 flex items-center justify-center text-gold-dark text-xs font-bold flex-shrink-0">
          {post.avatarUrl
            ? <Image src={post.avatarUrl} alt={post.author} width={40} height={40} className="w-full h-full rounded-full object-cover" />
            : initials
          }
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">{post.author}</p>
          <p className="text-xs text-slate-500">{post.createdAt}</p>
        </div>
        {/* Troféu de vitória */}
        <Trophy className="ml-auto w-4 h-4 text-gold/50" />
      </div>

      {/* Content */}
      <p className="text-base text-slate-600 leading-relaxed">{post.content}</p>

      {/* Reactions */}
      <div className="flex gap-2 relative">
        {(["AMEN", "GLORY"] as const).map((type) => (
          <motion.button
            key={type}
            onClick={() => react(type)}
            whileTap={{ scale: 0.85 }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-base font-semibold border transition-all ${
              localReaction === type
                ? "bg-divine-100 border-gold text-gold-dark"
                : "bg-white border-divine-200 text-slate-500 hover:border-gold hover:text-gold-dark"
            }`}
          >
            <span>{type === "AMEN" ? <Heart className="w-4 h-4" /> : <Star className="w-4 h-4" />}</span>
            <span>{type === "AMEN" ? "Amém" : "Glória a Deus"}</span>
            <span className={`text-xs font-bold ${localReaction === type ? "" : "text-slate-400"}`}>
              {counts[type]}
            </span>
          </motion.button>
        ))}

        {/* Burst de luz */}
        <AnimatePresence>
          {burst && (
            <motion.div
              className="absolute left-0 top-0 w-8 h-8 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(212,175,55,0.7) 0%, transparent 70%)" }}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function GratitudeFeed({ posts, onReact, onPost, autoOpenForm, onFormOpened }: GratitudeFeedProps) {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (autoOpenForm) {
      setShowForm(true);
      onFormOpened?.();
    }
  }, [autoOpenForm, onFormOpened]);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onPost(content.trim());
    setContent("");
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header + botão postar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
            Feed de Gratidão
          </p>
          <p className="text-sm text-slate-600 mt-0.5">Compartilhe suas vitórias</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-divine py-3 px-5 text-base"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Compartilhar"}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handlePost}
            className="divine-card p-4 flex flex-col gap-3 overflow-hidden"
          >
            <p className="text-sm font-medium text-slate-600">
              🏆 Qual vitória você quer compartilhar?
            </p>
            <div className="relative">
              <textarea
                placeholder="Escreva aqui... Ex: Deus respondeu minha oração por cura!"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 600))}
                rows={3}
                maxLength={600}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-divine-200 bg-divine-50/50 text-base text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold resize-none"
              />
              <span className={`absolute bottom-2 right-2 text-[10px] ${content.length > 550 ? "text-amber-400" : "text-slate-300"}`}>
                {content.length}/600
              </span>
            </div>
            <button type="submit" disabled={!content.trim()} className="btn-divine py-4 text-base disabled:opacity-40">
              Publicar vitória ✨
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Posts */}
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReact={(type) => onReact(post.id, type)}
            />
          ))}
        </AnimatePresence>
        {posts.length === 0 && (
          <div className="divine-card p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-divine-50 border-2 border-dashed border-divine-300 flex items-center justify-center">
              <span className="text-3xl">🙌</span>
            </div>
            <div>
              <p className="font-serif text-lg font-semibold text-slate-700">Compartilhe sua primeira vitória</p>
              <blockquote className="verse-highlight mt-3 text-sm italic text-slate-600 px-1">
                "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco."
              </blockquote>
              <p className="text-xs font-semibold text-gold-dark mt-1">— 1 Tessalonicenses 5:18</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
