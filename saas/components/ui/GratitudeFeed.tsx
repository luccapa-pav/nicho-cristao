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

  const initials = post.author.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const isRecent = post.createdAt.includes("hora") || post.createdAt.includes("minuto") || post.createdAt === "agora";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`p-4 rounded-2xl border bg-white flex flex-col gap-3 ${
        isRecent ? "border-gold/30 shadow-[0_0_12px_rgba(212,175,55,0.08)]" : "border-divine-100"
      }`}
    >
      {/* Author row */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-divine-100 flex items-center justify-center text-gold-dark text-xs font-bold shrink-0 overflow-hidden">
          {post.avatarUrl
            ? <Image src={post.avatarUrl} alt={post.author} width={32} height={32} className="w-full h-full object-cover" />
            : initials
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700 leading-none">{post.author}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{post.createdAt}</p>
        </div>
        <Trophy className="w-3.5 h-3.5 text-gold/40 shrink-0" />
      </div>

      {/* Content */}
      <p className="text-sm text-slate-600 leading-relaxed">{post.content}</p>

      {/* Reactions */}
      <div className="flex gap-2 relative">
        {(["AMEN", "GLORY"] as const).map((type) => (
          <motion.button
            key={type}
            onClick={() => react(type)}
            whileTap={{ scale: 0.88 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              localReaction === type
                ? "bg-divine-100 border-gold/60 text-gold-dark"
                : "bg-white border-divine-200 text-slate-500 hover:border-gold/40 hover:text-gold-dark"
            }`}
          >
            {type === "AMEN"
              ? <Heart className="w-3.5 h-3.5" />
              : <Star className="w-3.5 h-3.5" />
            }
            <span>{type === "AMEN" ? "Amém" : "Glória"}</span>
            <span className={`font-bold tabular-nums ${localReaction === type ? "text-gold-dark" : "text-slate-400"}`}>
              {counts[type]}
            </span>
          </motion.button>
        ))}

        <AnimatePresence>
          {burst && (
            <motion.div
              className="absolute left-0 top-0 w-8 h-8 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(212,175,55,0.6) 0%, transparent 70%)" }}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.5 }}
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
    if (autoOpenForm) { setShowForm(true); onFormOpened?.(); }
  }, [autoOpenForm, onFormOpened]);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onPost(content.trim());
    setContent("");
    setShowForm(false);
  };

  return (
    <div className="divine-card p-5 flex flex-col gap-4 h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0">
            <Trophy className="w-3.5 h-3.5 text-gold-dark" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-dark leading-none">
              Feed de Gratidão
            </p>
            <p className="text-[0.7rem] text-slate-500 mt-0.5 leading-none">
              Compartilhe suas vitórias
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-divine-50 border border-divine-200 text-gold-dark text-xs font-semibold hover:bg-divine-100 transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Compartilhar"}
        </button>
      </div>

      <div className="divine-divider" />

      {/* ── Form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handlePost}
            className="flex flex-col gap-2.5 overflow-hidden"
          >
            <p className="text-xs font-medium text-slate-600">🏆 Qual vitória você quer compartilhar?</p>
            <div className="relative">
              <textarea
                placeholder="Ex: Deus respondeu minha oração por cura!"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 600))}
                rows={3}
                maxLength={600}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-divine-200 bg-divine-50/40 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold resize-none"
              />
              <span className={`absolute bottom-2 right-2.5 text-[10px] ${content.length > 550 ? "text-amber-400" : "text-slate-300"}`}>
                {content.length}/600
              </span>
            </div>
            <button type="submit" disabled={!content.trim()} className="btn-divine py-2.5 text-sm disabled:opacity-40">
              Publicar vitória ✨
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Posts ── */}
      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto custom-scroll pr-0.5 max-h-[26rem]">
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
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-divine-50 border-2 border-dashed border-divine-200 flex items-center justify-center">
              <span className="text-2xl">🙌</span>
            </div>
            <div>
              <p className="font-serif text-base font-semibold text-slate-700">Compartilhe sua primeira vitória</p>
              <p className="text-xs italic text-slate-500 mt-2 leading-relaxed max-w-[220px] mx-auto">
                "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco."
              </p>
              <p className="text-[10px] font-semibold text-gold-dark mt-1">— 1 Tessalonicenses 5:18</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
