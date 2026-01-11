import { useState, useRef, useEffect, useCallback } from 'react';
import { encodeWAV } from './../../utils/audio'

const SAMPLE_RATE = 16000;
const VAD_THRESHOLD = 0.025;
const SILENCE_DURATION = 1000;

type WsStatus = 'Connected' | 'Disconnected' | 'Error';

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<WsStatus>('Disconnected');
  
  // Refs
  const websocket = useRef<WebSocket | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const processor = useRef<ScriptProcessorNode | null>(null);
  const inputSource = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const silenceStartRef = useRef<number | null>(null);

  // 오디오 데이터 전송 함수
  const sendAudioData = useCallback(() => {
    if (audioBufferRef.current.length === 0) return;

    const totalLength = audioBufferRef.current.reduce((acc, buf) => acc + buf.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of audioBufferRef.current) {
      result.set(buf, offset);
      offset += buf.length;
    }

    const wavBuffer = encodeWAV(result, SAMPLE_RATE);

    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      websocket.current.send(wavBuffer);
    }
  }, []);

  // 오디오 처리 콜백
  const processAudio = useCallback((e: AudioProcessingEvent) => {
    const inputData = e.inputBuffer.getChannelData(0);
    
    let sum = 0;
    for (let i = 0; i < inputData.length; i++) {
      sum += inputData[i] * inputData[i];
    }
    const rms = Math.sqrt(sum / inputData.length);

    if (rms > VAD_THRESHOLD) {
      if (!isSpeakingRef.current) isSpeakingRef.current = true;
      silenceStartRef.current = null;
      audioBufferRef.current.push(new Float32Array(inputData));
    } else {
      if (isSpeakingRef.current) {
        audioBufferRef.current.push(new Float32Array(inputData));
        if (silenceStartRef.current === null) silenceStartRef.current = Date.now();

        if (Date.now() - silenceStartRef.current > SILENCE_DURATION) {
          sendAudioData();
          isSpeakingRef.current = false;
          silenceStartRef.current = null;
          audioBufferRef.current = [];
        }
      }
    }
  }, [sendAudioData]);

  // 녹음 중지 및 리소스 정리
  const stop = useCallback(() => {
    if (processor.current) {
      processor.current.disconnect();
      processor.current = null;
    }
    if (inputSource.current) {
      inputSource.current.disconnect();
      inputSource.current = null;
    }
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
    
    // 남은 데이터 전송
    if (isSpeakingRef.current) sendAudioData();
    
    // 웹소켓 종료
    if (websocket.current) {
      websocket.current.close();
      websocket.current = null;
    }

    audioBufferRef.current = [];
    isSpeakingRef.current = false;
    setIsRecording(false);
    setWsStatus('Disconnected');
  }, [sendAudioData]);

  // 녹음 시작
  const start = useCallback(async () => {
    try {
      // 웹소켓 연결
      websocket.current = new WebSocket("ws://127.0.0.1:8000/api/v1/ws");
      
      websocket.current.onopen = () => setWsStatus('Connected');
      websocket.current.onclose = () => setWsStatus('Disconnected');
      websocket.current.onerror = (err) => {
        console.error("WebSocket Error:", err);
        setWsStatus('Error');
      };

      // 마이크 연결
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext.current = new AudioContextClass({ sampleRate: SAMPLE_RATE });
      
      inputSource.current = audioContext.current.createMediaStreamSource(stream);
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);
      processor.current.onaudioprocess = processAudio;

      inputSource.current.connect(processor.current);
      processor.current.connect(audioContext.current.destination);

      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      stop(); // 에러 시 정리
    }
  }, [processAudio, stop]);

  // 컴포넌트 언마운트 시 강제 종료
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { start, stop, isRecording, wsStatus };
};