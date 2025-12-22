// src/hooks/useVoiceRecorder.js
import { useState, useRef, useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { toast } from 'react-toastify';

const useVoiceRecorder = () => {
  // Speech Recognition Hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // ← NEW
  const [finalTranscript, setFinalTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const currentTranscriptRef = useRef('');
  const pausedTimeRef = useRef(0); // ← NEW: Track paused time

  // Update transcript ref whenever transcript changes
  useEffect(() => {
    if (isRecording && !isPaused && transcript) {
      currentTranscriptRef.current = transcript;
    }
  }, [transcript, isRecording, isPaused]);

  // Recording duration timer (only when not paused)
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]); // ← Added isPaused dependency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start Recording
  const startRecording = useCallback(async () => {
    console.log('🎤 useVoiceRecorder: startRecording called');

    if (!browserSupportsSpeechRecognition) {
      toast.error('Speech recognition not supported in your browser');
      return { success: false, error: 'Speech recognition not supported' };
    }

    try {
      // Reset states
      resetTranscript();
      setFinalTranscript('');
      setRecordingDuration(0);
      setAudioBlob(null);
      setIsPaused(false);
      currentTranscriptRef.current = '';
      audioChunksRef.current = [];
      pausedTimeRef.current = 0;

      // Request microphone access
      console.log('📍 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      console.log('✅ Microphone access granted');
      streamRef.current = stream;

      // Determine supported MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      let selectedMimeType = 'audio/webm';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          console.log('✅ Selected MIME type:', type);
          break;
        }
      }

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      console.log('🔴 MediaRecorder initialized');

      // Event: Data available
      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Audio chunk received:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Event: Recording stopped
      mediaRecorder.onstop = () => {
        console.log('⏹️ MediaRecorder stopped');
        console.log('📦 Total audio chunks:', audioChunksRef.current.length);

        if (audioChunksRef.current.length === 0) {
          console.error('❌ No audio data captured');
          toast.error('No audio was recorded');
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        console.log('🎵 Audio blob created:', blob.size, 'bytes');

        // Get the stored transcript
        const userData = mediaRecorder.userData || {};
        const transcriptToSave = userData.transcript || currentTranscriptRef.current || '';

        console.log('📝 Final transcript:', transcriptToSave);

        setAudioBlob(blob);
        setFinalTranscript(transcriptToSave);

        // Stop all media tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => {
            track.stop();
            console.log('🛑 Media track stopped');
          });
          streamRef.current = null;
        }
      };

      // Event: Error
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
        toast.error('Recording error: ' + event.error.message);
      };

      // Start recording (collect data every second)
      mediaRecorder.start(1000);
      console.log('▶️ MediaRecorder started');

      // Start speech recognition
      await SpeechRecognition.startListening({
        continuous: true,
        language: 'en-US',
      });

      setIsRecording(true);
      toast.success('🎤 Recording started...');

      return { success: true };
    } catch (error) {
      console.error('❌ Error starting recording:', error);

      let errorMessage = 'Failed to start recording';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.';
      } else {
        errorMessage = 'Failed to start recording: ' + error.message;
      }

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [browserSupportsSpeechRecognition, resetTranscript]);

  // Pause Recording - NEW FUNCTION
  const pauseRecording = useCallback(() => {
    console.log('⏸️ useVoiceRecorder: pauseRecording called');

    if (!isRecording || isPaused) {
      console.warn('⚠️ Cannot pause - not recording or already paused');
      return;
    }

    // Pause MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      console.log('⏸️ MediaRecorder paused');
    }

    // Stop speech recognition (pause it)
    SpeechRecognition.stopListening();
    console.log('⏸️ Speech recognition paused');

    setIsPaused(true);
    pausedTimeRef.current = Date.now();
    toast.info('⏸️ Recording paused');
  }, [isRecording, isPaused]);

  // Resume Recording - NEW FUNCTION
  const resumeRecording = useCallback(async () => {
    console.log('▶️ useVoiceRecorder: resumeRecording called');

    if (!isRecording || !isPaused) {
      console.warn('⚠️ Cannot resume - not paused');
      return;
    }

    // Resume MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      console.log('▶️ MediaRecorder resumed');
    }

    // Resume speech recognition
    await SpeechRecognition.startListening({
      continuous: true,
      language: 'en-US',
    });
    console.log('▶️ Speech recognition resumed');

    setIsPaused(false);
    toast.success('▶️ Recording resumed');
  }, [isRecording, isPaused]);

  // Stop Recording
  const stopRecording = useCallback(() => {
    console.log('⏹️ useVoiceRecorder: stopRecording called');

    // Capture transcript before stopping
    const capturedTranscript = transcript || currentTranscriptRef.current || '';
    console.log('📝 Captured transcript:', capturedTranscript);

    // Stop speech recognition
    SpeechRecognition.stopListening();
    console.log('🛑 Speech recognition stopped');

    // Stop MediaRecorder
    if (mediaRecorderRef.current) {
      const state = mediaRecorderRef.current.state;
      console.log('📊 MediaRecorder state:', state);

      if (state === 'recording' || state === 'paused') {
        // Store transcript for onstop handler
        mediaRecorderRef.current.userData = {
          transcript: capturedTranscript,
        };

        mediaRecorderRef.current.stop();
        console.log('⏹️ MediaRecorder stop() called');
      } else {
        console.warn('⚠️ MediaRecorder not in recording/paused state:', state);

        // Cleanup anyway
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Set transcript manually if MediaRecorder didn't stop properly
        setFinalTranscript(capturedTranscript);
      }
    } else {
      console.error('❌ mediaRecorderRef.current is null');
      setFinalTranscript(capturedTranscript);
    }

    setIsRecording(false);
    setIsPaused(false);
    toast.success('⏹️ Recording stopped');

    return {
      transcript: capturedTranscript,
      duration: recordingDuration,
    };
  }, [transcript, recordingDuration]);

  // Reset/Clear recording
  const resetRecording = useCallback(() => {
    console.log('🔄 Resetting recording...');

    resetTranscript();
    setFinalTranscript('');
    setRecordingDuration(0);
    setAudioBlob(null);
    setIsRecording(false);
    setIsPaused(false);
    currentTranscriptRef.current = '';
    audioChunksRef.current = [];
    pausedTimeRef.current = 0;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
  }, [resetTranscript]);

  // Format duration helper
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get word count
  const getWordCount = useCallback((text) => {
    return text.trim() ? text.split(/\s+/).filter((w) => w.trim()).length : 0;
  }, []);

  return {
    // States
    isRecording,
    isPaused, // ← NEW
    transcript: isRecording ? transcript : finalTranscript,
    liveTranscript: transcript,
    finalTranscript,
    recordingDuration,
    audioBlob,
    listening,
    browserSupportsSpeechRecognition,

    // Actions
    startRecording,
    pauseRecording, // ← NEW
    resumeRecording, // ← NEW
    stopRecording,
    resetRecording,

    // Helpers
    formatDuration,
    getWordCount,
  };
};

export default useVoiceRecorder;
