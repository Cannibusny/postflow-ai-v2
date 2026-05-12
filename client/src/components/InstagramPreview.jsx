import React from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

export default function InstagramPreview({ emoji, imageUrl, caption, title }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 text-sm font-semibold flex items-center gap-3 border-b border-gray-800">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
          CN
        </div>
        <span>cannibus_ny</span>
      </div>

      {/* Image area */}
      <div className="aspect-square bg-gray-800 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`text-8xl ${imageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
        >
          {emoji || '📸'}
        </div>
      </div>

      {/* Action bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Heart className="w-6 h-6 cursor-pointer hover:text-red-400 transition-colors" />
          <MessageCircle className="w-6 h-6 cursor-pointer hover:text-blue-400 transition-colors" />
          <Send className="w-6 h-6 cursor-pointer hover:text-purple-400 transition-colors" />
        </div>
        <Bookmark className="w-6 h-6 cursor-pointer hover:text-yellow-400 transition-colors" />
      </div>

      {/* Caption */}
      <div className="px-4 pb-4">
        <p className="text-sm">
          <span className="font-semibold mr-1">cannibus_ny</span>
          <span className="text-gray-300 whitespace-pre-line">{caption}</span>
        </p>
      </div>
    </div>
  );
}
