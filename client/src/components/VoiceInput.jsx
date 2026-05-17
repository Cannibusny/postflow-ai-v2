import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Sparkles, X } from 'lucide-react';
import { api } from '../utils/api';

export default function VoiceInput({ platforms, onResult }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [polishing, setPolishing] = useState(false);
  const [polished, setPolished] = useState(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const startRecording = useCallback(() => {
    setError('');
    setPolished(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + ' ';
        } else {
          interim = t;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(`Microphone error: ${event.error}`);
      }
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    setTranscript('');
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecording(false);
  }, []);

  async function handlePolish() {
    if (!transcript.trim()) return;
    setPolishing(true);
    setError('');
    try {
      const data = await api.voiceToPost({ transcript: transcript.trim(), platforms });
      setPolished(data);
    } catch (err) {
      setError(err.message || 'Failed to polish transcript');
    }
    setPolishing(false);
  }

  function handleUse() {
    if (polished) {
      onResult(polished.polished);
      setTranscript('');
      setPolished(null);
    }
  }

  function handleDismiss() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecording(false);
    setTranscript('');
    setPolished(null);
    setError('');
  }

  if (!transcript && !polished && !recording) {
    return (
      <button
        onClick={startRecording}
        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-rose-600/20 to-orange-600/20 hover:from-rose-600/30 hover:to-orange-600/30 border border-rose-500/30 rounded-lg text-xs font-medium text-rose-300 transition-all"
        title="Voice to Post"
      >
        <Mic className="w-3.5 h-3.5" />
        Voice Input
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-rose-500/5 to-orange-500/5 border border-rose-500/20 rounded-xl p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${recording ? 'bg-red-500 animate-pulse' : 'bg-rose-500/20'}`}>
            {recording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-rose-400" />}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-200">
              {recording ? 'Listening...' : 'Voice Input'}
            </span>
            {polished && (
              <span className="ml-2 text-xs text-gray-500">({polished.model} mode)</span>
            )}
          </div>
        </div>
        <button onClick={handleDismiss} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {recording && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400">Recording — speak your post idea</span>
          </div>
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Stop Recording
          </button>
        </div>
      )}

      {transcript && (
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Transcript</label>
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 max-h-24 overflow-y-auto">
            {transcript}
          </div>
        </div>
      )}

      {polished && (
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Polished Post</label>
          <div className="bg-gray-800/60 border border-rose-500/30 rounded-lg p-3 text-sm text-gray-200">
            {polished.polished}
          </div>
          {polished.hashtag_suggestions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {polished.hashtag_suggestions.map((tag) => (
                <span key={tag} className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 mb-3">{error}</p>
      )}

      <div className="flex gap-2">
        {!recording && transcript && !polished && (
          <button
            onClick={handlePolish}
            disabled={polishing}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-all"
          >
            {polishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {polishing ? 'Polishing...' : 'Generate Post'}
          </button>
        )}
        {polished && (
          <button
            onClick={handleUse}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 rounded-lg text-sm font-medium text-white transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Use This Caption
          </button>
        )}
        {!recording && transcript && (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-300 transition-colors"
          >
            Re-record
          </button>
        )}
      </div>
    </div>
  );
}
