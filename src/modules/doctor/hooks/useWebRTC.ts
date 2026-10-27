"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getSocketBaseUrl } from "@/config/backend";

export interface ChatMessage {
  senderId: string;
  senderName: string;
  senderRole: "DOCTOR" | "PATIENT";
  text: string;
  timestamp: string;
}

export interface UseWebRTCOptions {
  serverUrl: string;
  appointmentId: string;
  userId: string;
  userName: string;
  userRole: "DOCTOR" | "PATIENT";
  userAvatar?: string;
  onCallEnded?: () => void;
}

export function useWebRTC({
  serverUrl,
  appointmentId,
  userId,
  userName,
  userRole,
  userAvatar,
  onCallEnded,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPeerInRoom, setIsPeerInRoom] = useState(false);
  const [peerInfo, setPeerInfo] = useState<any>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerAudioMuted, setPeerAudioMuted] = useState(false);
  const [peerVideoOff, setPeerVideoOff] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "waiting_peer" | "connected" | "disconnected"
  >("idle");

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const targetSocketIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const onCallEndedRef = useRef(onCallEnded);

  useEffect(() => {
    onCallEndedRef.current = onCallEnded;
  }, [onCallEnded]);

  const iceServers: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== "closed") {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(iceServers);

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && targetSocketIdRef.current && socketRef.current) {
        socketRef.current.emit("webrtc:signal", {
          appointmentId,
          targetSocketId: targetSocketIdRef.current,
          signalData: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setConnectionStatus("connected");
      } else if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setConnectionStatus("disconnected");
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [localStream, appointmentId]);

  const sendOffer = useCallback(async (targetSocketId: string) => {
    const pc = createPeerConnection();
    targetSocketIdRef.current = targetSocketId;

    try {
      if (pc.signalingState === "closed") return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("webrtc:signal", {
        appointmentId,
        targetSocketId,
        signalData: { type: "offer", sdp: offer },
      });
    } catch (err) {
      console.error("Failed to create WebRTC offer:", err);
    }
  }, [createPeerConnection, appointmentId]);

  const handleReceiveOffer = useCallback(async (senderSocketId: string, offer: RTCSessionDescriptionInit) => {
    targetSocketIdRef.current = senderSocketId;
    const pc = createPeerConnection();

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      for (const candidate of pendingCandidatesRef.current.splice(0)) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit("webrtc:signal", {
        appointmentId,
        targetSocketId: senderSocketId,
        signalData: { type: "answer", sdp: answer },
      });
    } catch (err) {
      console.error("Failed to handle WebRTC offer and send answer:", err);
    }
  }, [createPeerConnection, appointmentId]);

  const handleReceiveAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        for (const candidate of pendingCandidatesRef.current.splice(0)) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Failed to set remote description on answer:", err);
      }
    }
  }, []);

  const handleReceiveCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (pc?.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    } else {
      pendingCandidatesRef.current.push(candidate);
    }
  }, []);

  // chạy đầu tiên khi component mount, xin quyền bật cam
  useEffect(() => {
    let mounted = true;

    async function initLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (mounted) {
          setLocalStream(stream);
        }
      } catch (err) {
        console.error("Error accessing camera/microphone:", err);
      }
    }

    initLocalStream();

    return () => {
      mounted = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);


  // chạy khi mount, để đăng kí sự kiện
  useEffect(() => {
    if (!localStream) return;

    setConnectionStatus("connecting");
    const socketBase = getSocketBaseUrl(serverUrl);
    const socket = io(`${socketBase}/telehealth`, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      console.error("Socket telehealth connect error:", err.message);
    });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join:telehealth-room", {
        appointmentId,
        userId,
        name: userName,
        role: userRole,
        avatarUrl: userAvatar,
      });
    });

    socket.on("telehealth:joined-success", (data) => {
      if (data.otherPeer) {
        setIsPeerInRoom(true);
        setPeerInfo(data.otherPeer);
        targetSocketIdRef.current = data.otherPeer.socketId;

        if (userRole === "DOCTOR") {
          sendOffer(data.otherPeer.socketId);
        }
      } else {
        setConnectionStatus("waiting_peer");
      }
    });

    socket.on("telehealth:peer-joined", (data) => {
      setIsPeerInRoom(true);
      setPeerInfo(data.newPeer);
      targetSocketIdRef.current = data.newPeer.socketId;

      if (userRole === "DOCTOR") {
        sendOffer(data.newPeer.socketId);
      }
    });

    socket.on("telehealth:peer-left", () => {
      setIsPeerInRoom(false);
      setRemoteStream(null);
      setConnectionStatus("waiting_peer");
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    socket.on("webrtc:signal", (payload) => {
      const { senderSocketId, signalData } = payload;
      if (signalData.type === "offer") {
        handleReceiveOffer(senderSocketId, signalData.sdp);
      } else if (signalData.type === "answer") {
        handleReceiveAnswer(signalData.sdp);
      } else if (signalData.type === "candidate") {
        handleReceiveCandidate(signalData.candidate);
      }
    });

    socket.on("telehealth:peer-media-toggled", (data) => {
      if (typeof data.isAudioMuted === "boolean") setPeerAudioMuted(data.isAudioMuted);
      if (typeof data.isVideoOff === "boolean") setPeerVideoOff(data.isVideoOff);
    });

    socket.on("telehealth:new-chat", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("telehealth:call-ended", () => {
      setConnectionStatus("disconnected");
      onCallEndedRef.current?.();
    });

    return () => {
      socket.disconnect();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      pendingCandidatesRef.current = [];
    };
  }, [
    serverUrl,
    appointmentId,
    userId,
    userName,
    userRole,
    userAvatar,
    localStream,
    sendOffer,
    handleReceiveOffer,
    handleReceiveAnswer,
    handleReceiveCandidate,
  ]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = !audioTrack.enabled;
        audioTrack.enabled = nextState;
        setIsAudioMuted(!nextState);

        socketRef.current?.emit("telehealth:toggle-media", {
          appointmentId,
          isAudioMuted: !nextState,
        });
      }
    }
  }, [localStream, appointmentId]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !videoTrack.enabled;
        videoTrack.enabled = nextState;
        setIsVideoOff(!nextState);

        socketRef.current?.emit("telehealth:toggle-media", {
          appointmentId,
          isVideoOff: !nextState,
        });
      }
    }
  }, [localStream, appointmentId]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || !socketRef.current) return;

    socketRef.current.emit("telehealth:send-chat", {
      appointmentId,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      text: text.trim(),
    });
  }, [appointmentId, userId, userName, userRole]);

  const endCall = useCallback(
    (extraData?: { diagnosis?: string; prescriptionNotes?: string }) =>
      new Promise<boolean>((resolve) => {
        if (!socketRef.current) {
          resolve(false);
          return;
        }

        socketRef.current.emit(
          "telehealth:end-call",
          {
            appointmentId,
            endedByRole: userRole,
            endedByUserId: userId,
            ...extraData,
          },
          (response: { success?: boolean }) => resolve(response?.success === true),
        );
      }),
    [appointmentId, userRole, userId],
  );

  return {
    localStream,
    remoteStream,
    isConnected,
    isPeerInRoom,
    peerInfo,
    connectionStatus,
    isAudioMuted,
    isVideoOff,
    peerAudioMuted,
    peerVideoOff,
    messages,
    toggleAudio,
    toggleVideo,
    sendMessage,
    endCall,
  };
}
