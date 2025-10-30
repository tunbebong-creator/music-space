import React from "react";
import { customAPI } from "@/api/customClient";
import { Core } from "@/api/integrations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Music2, Wand2, Play, Pause, Download, Heart, Share2, Loader2, Volume2, Sliders, X } from "lucide-react";

export default function AIMusicGenerator({ user }) {
  const [prompt, setPrompt] = React.useState("");
  const [selectedGenre, setSelectedGenre] = React.useState("chill");
  const [selectedMood, setSelectedMood] = React.useState("relaxed");
  const [tempo, setTempo] = React.useState("medium");
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [currentPlaying, setCurrentPlaying] = React.useState(null);
  const queryClient = useQueryClient();

  const { data: generatedMusic } = useQuery({
    queryKey: ['generated-music', user?.id],
    queryFn: () => customAPI.entities.GeneratedMusic.find({ user_id: user.id }),
    initialData: [],
    enabled: !!user,
  });

  const generateMusicMutation = useMutation({
    mutationFn: async (data) => {
      const aiPrompt = `Bạn là AI chuyên tạo âm nhạc. Dựa trên yêu cầu sau, hãy tạo một mô tả chi tiết về bài nhạc:
      
Yêu cầu: ${data.prompt}
Thể loại: ${data.genre}
Tâm trạng: ${data.mood}
Nhịp độ: ${data.tempo}

Hãy trả về thông tin về bài nhạc theo format JSON với các trường:
- title: Tên bài nhạc (tiếng Việt, sáng tạo)
- description: Mô tả chi tiết về bài nhạc
- suggested_instruments: Các nhạc cụ được dùng
- vibe: Cảm giác của bài nhạc
- lyrics_snippet: Vài câu lời mẫu (nếu là bài có lời)`;

      const response = await Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            suggested_instruments: { type: "array", items: { type: "string" } },
            vibe: { type: "string" },
            lyrics_snippet: { type: "string" }
          }
        }
      });

      const coverArt = await Core.GenerateImage({
        prompt: `Abstract music visualization for ${response.title}, ${data.genre} genre, ${data.mood} mood, artistic, vibrant colors, modern design`
      });

      const musicRecord = await customAPI.entities.GeneratedMusic.create({
        user_id: user.id,
        title: response.title,
        prompt: data.prompt,
        genre: data.genre,
        mood: data.mood,
        tempo: data.tempo,
        ai_description: response.description,
        lyrics: response.lyrics_snippet || "",
        cover_art: coverArt.url,
        duration_seconds: 180
      });

      return { ...musicRecord, aiData: response };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['generated-music']);
      setPrompt("");
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    generateMusicMutation.mutate({
      prompt: prompt.trim(),
      genre: selectedGenre,
      mood: selectedMood,
      tempo: tempo
    });
  };

  const likeMusicMutation = useMutation({
    mutationFn: (music) => customAPI.entities.GeneratedMusic.update(music.id, { liked: !music.liked }),
    onSuccess: () => {
      queryClient.invalidateQueries(['generated-music']);
    },
  });

  const genres = [
    { id: "chill", name: "Chill", emoji: "🌊" },
    { id: "acoustic", name: "Acoustic", emoji: "🎸" },
    { id: "electronic", name: "Electronic", emoji: "🎹" },
    { id: "jazz", name: "Jazz", emoji: "🎷" },
    { id: "classical", name: "Classical", emoji: "🎻" },
    { id: "ambient", name: "Ambient", emoji: "🌌" }
  ];

  const moods = [
    { id: "relaxed", name: "Thư giãn", emoji: "😌" },
    { id: "happy", name: "Vui vẻ", emoji: "😊" },
    { id: "energetic", name: "Năng động", emoji: "🔥" },
    { id: "melancholic", name: "U sầu", emoji: "🌧️" },
    { id: "romantic", name: "Lãng mạn", emoji: "💕" },
    { id: "focused", name: "Tập trung", emoji: "🎯" }
  ];

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="elegant-card p-8 rounded-3xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Tạo nhạc bằng AI</h3>
            <p className="text-sm text-gray-600">Mô tả bài nhạc bạn muốn nghe</p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Một bản nhạc chill lo-fi để học tập, có âm thanh mưa rơi và tiếng piano nhẹ nhàng..."
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#1E88E5] min-h-[120px] resize-none"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thể loại</label>
              <div className="grid grid-cols-3 gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
                      selectedGenre === genre.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{genre.emoji}</span>
                    <span className="text-xs">{genre.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tâm trạng</label>
              <div className="grid grid-cols-3 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
                      selectedMood === mood.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs">{mood.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generateMusicMutation.isPending || !prompt.trim()}
            className="w-full btn-primary py-4 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {generateMusicMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tạo nhạc...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Tạo nhạc với AI
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Generated Music List */}
      {generatedMusic.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold text-gray-800">Nhạc của bạn</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {generatedMusic.map((music, index) => (
              <motion.div
                key={music.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="elegant-card rounded-2xl overflow-hidden group"
              >
                <div className="relative h-48">
                  {music.cover_art ? (
                    <img
                      src={music.cover_art}
                      alt={music.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <Music2 className="w-16 h-16 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-gray-800" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="font-bold text-gray-800 mb-2">{music.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {music.ai_description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span className="px-2 py-1 rounded-full bg-gray-100">{music.genre}</span>
                    <span className="px-2 py-1 rounded-full bg-gray-100">{music.mood}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => likeMusicMutation.mutate(music)}
                      className={`p-2 rounded-full transition-colors ${
                        music.liked
                          ? 'bg-red-50 text-red-500'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${music.liked ? 'fill-current' : ''}`} />
                    </button>

                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100">
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}