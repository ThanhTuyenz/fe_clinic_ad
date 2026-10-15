"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Send,
  User,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Pill,
  Stethoscope,
  Building2,
  Calendar,
  Loader2,
  Info,
} from "lucide-react";
import { useWebRTC } from "../hooks/useWebRTC";

interface DoctorTelehealthRoomProps {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar?: string;
  serverUrl?: string;
  onClose?: () => void;
}

export default function DoctorTelehealthRoom({
  appointmentId,
  doctorId,
  doctorName,
  doctorAvatar,
  serverUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  onClose,
}: DoctorTelehealthRoomProps) {
  const [activeTab, setActiveTab] = useState<"clinical" | "chat">("clinical");
  const [inputChat, setInputChat] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const [appointmentInfo, setAppointmentInfo] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const {
    localStream,
    remoteStream,
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
  } = useWebRTC({
    serverUrl,
    appointmentId,
    userId: doctorId,
    userName: doctorName,
    userRole: "DOCTOR",
    userAvatar: doctorAvatar,
    onCallEnded: () => {
      if (onClose) onClose();
    },
  });

  // Tải thông tin phòng hẹn từ API backend
  useEffect(() => {
    async function fetchRoomDetails() {
      try {
        const res = await fetch(`${serverUrl}/telehealth/room/${appointmentId}`, { credentials: "include" });
        const json = await res.json();
        if (json.success) {
          const roomData = json.data?.data || json.data;
          setAppointmentInfo(roomData);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin phòng tư vấn:", err);
      }
    }
    fetchRoomDetails();
  }, [serverUrl, appointmentId]);

  // Gắn stream vào thẻ video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Tự cuộn tin nhắn xuống đáy
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;
    sendMessage(inputChat);
    setInputChat("");
  };

  const handleFinishConsultation = async () => {
    if (!confirm("Bác sĩ có chắc chắn muốn kết thúc ca tư vấn trực tuyến này?")) return;
    setIsFinishing(true);
    try {
      const callEnded = await endCall();
      if (!callEnded) {
        throw new Error("Không thể lưu và thông báo kết thúc phòng tư vấn.");
      }
      onClose?.();
    } catch (err) {
      console.error("Lỗi kết thúc ca khám:", err);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* 1. Header chuẩn VitaCare Clinic */}
      <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 relative flex items-center justify-center">
              <Image
                src="/imgs/logo/logo2.png"
                alt="VitaCare Clinic Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-emerald-800 font-black text-sm tracking-tight block leading-tight">
                VitaCare Clinic
              </span>
              <span className="text-[11px] text-slate-500 font-medium block leading-none">
                Hệ thống khám chữa bệnh trực tuyến
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block mx-1" />

          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
              Phòng khám từ xa
            </span>
            <span className="bg-slate-100 text-slate-600 border border-slate-200 rounded px-2 py-0.5 text-[11px] font-mono font-semibold">
              Mã: {appointmentInfo?.bookingCode || appointmentId.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Trạng thái kết nối & Nút hoàn tất */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded text-xs border font-medium transition-colors ${isPeerInRoom
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
          >
            {isPeerInRoom ? (
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-700" />
            )}
            <span className="hidden sm:inline">Trạng thái:</span>
            <strong className="font-semibold">
              {isPeerInRoom ? "Đang kết nối bệnh nhân" : "Đang chờ bệnh nhân..."}
            </strong>
          </div>

          <button
            onClick={handleFinishConsultation}
            disabled={isFinishing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isFinishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PhoneOff className="w-3.5 h-3.5" />
            )}
            <span>Hoàn tất ca khám</span>
          </button>
        </div>
      </header>

      {/* 2. Không gian làm việc chính (Grid 2 cột) */}
      <div className="flex-1 flex flex-col lg:flex-row p-3 gap-3 overflow-hidden">
        {/* CỘT TRÁI: Màn hình quan sát bệnh nhân & Thanh công cụ (60%) */}
        <section className="flex-1 flex flex-col bg-white border border-slate-200/90 rounded shadow-xs p-3 overflow-hidden">
          {/* Header phụ của Monitor */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-emerald-700" />
              <h2 className="font-bold text-slate-800">Màn hình tư vấn trực tuyến</h2>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">
                Bệnh nhân: <strong className="text-emerald-800">{appointmentInfo?.patient?.name || "Bệnh nhân"}</strong>
              </span>
            </div>
            {peerAudioMuted && (
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                <MicOff className="w-3 h-3" /> Bệnh nhân đã tắt mic
              </span>
            )}
          </div>

          {/* Khung hình Video Bệnh nhân (Monitor) */}
          <div className="flex-1 bg-slate-900 rounded border border-slate-800 relative overflow-hidden flex items-center justify-center min-h-[280px]">
            {remoteStream && !peerVideoOff ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-inner">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {appointmentInfo?.patient?.name || "Bệnh nhân"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {isPeerInRoom
                      ? "Bệnh nhân đang tạm tắt camera. Âm thanh vẫn được truyền tải bình thường."
                      : "Phòng khám đã sẵn sàng. Hệ thống đang chờ bệnh nhân bấm tham gia..."}
                  </p>
                </div>
              </div>
            )}

            {/* Badge thông tin bệnh nhân góc trên */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded text-xs text-white border border-slate-700/80 flex items-center gap-1.5 shadow-sm">
              <User className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-semibold">
                {appointmentInfo?.patient?.name || "Bệnh nhân"}
              </span>
            </div>

            {/* Khung Video Bác sĩ (Picture-in-Picture) */}
            <div className="absolute bottom-3 right-3 w-40 sm:w-48 aspect-4/3 bg-slate-950 rounded border-2 border-white/80 overflow-hidden shadow-xl">
              {localStream && !isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-900">
                  <VideoOff className="w-5 h-5 text-slate-500" />
                  <span className="text-[10px]">Camera của bạn đang tắt</span>
                </div>
              )}
              <div className="absolute bottom-1 left-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                BS. {doctorName} (Bạn)
              </div>
            </div>
          </div>

          {/* Thanh công cụ điều khiển thiết bị (Device Toolbar chuẩn VitaCare) */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Nút Micro */}
              <button
                onClick={toggleAudio}
                className={`px-3 py-2 rounded text-xs font-semibold flex items-center gap-2 border cursor-pointer transition-colors shadow-2xs ${isAudioMuted
                  ? "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
                  : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                {isAudioMuted ? <MicOff className="w-4 h-4 text-rose-700" /> : <Mic className="w-4 h-4 text-emerald-700" />}
                <span>{isAudioMuted ? "Bật Micro" : "Tắt Micro"}</span>
              </button>

              {/* Nút Camera */}
              <button
                onClick={toggleVideo}
                className={`px-3 py-2 rounded text-xs font-semibold flex items-center gap-2 border cursor-pointer transition-colors shadow-2xs ${isVideoOff
                  ? "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
                  : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4 text-rose-700" /> : <VideoIcon className="w-4 h-4 text-emerald-700" />}
                <span>{isVideoOff ? "Bật Camera" : "Tắt Camera"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab(activeTab === "chat" ? "clinical" : "chat")}
                className={`px-3 py-2 rounded text-xs font-semibold flex items-center gap-2 border cursor-pointer transition-colors shadow-2xs ${activeTab === "chat"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Trò chuyện</span>
                {messages.length > 0 && activeTab !== "chat" && (
                  <span className="w-4 h-4 bg-emerald-700 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {messages.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* CỘT PHẢI: Thông tin bệnh nhân & Tin nhắn trực tuyến (40%) */}
        <aside className="w-full lg:w-[440px] xl:w-[480px] bg-white border border-slate-200/90 rounded shadow-xs flex flex-col shrink-0 overflow-hidden">
          {/* Tab Navigation chuẩn VitaCare */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 shrink-0">
            <button
              onClick={() => setActiveTab("clinical")}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border-b-2 transition-colors ${activeTab === "clinical"
                ? "border-emerald-700 text-emerald-800 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Hồ sơ ca khám</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border-b-2 transition-colors ${activeTab === "chat"
                ? "border-emerald-700 text-emerald-800 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>Tin nhắn ({messages.length})</span>
            </button>
          </div>

          {/* TAB 1: Hồ sơ bệnh nhân & Thông tin buổi khám */}
          {activeTab === "clinical" ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-800 text-xs">
              {/* Thẻ thông tin hành chính bệnh nhân */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    Thông tin bệnh nhân
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Đã xác thực
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-700 text-xs pt-0.5">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Họ và tên:</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {appointmentInfo?.patient?.name || "Đang tải..."}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Giới tính:</span>
                    <span>{appointmentInfo?.patient?.gender === "MALE" ? "Nam" : "Nữ"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Số điện thoại:</span>
                    <span className="font-mono">{appointmentInfo?.patient?.phoneNumber || "---"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mã hồ sơ:</span>
                    <span className="font-mono">{appointmentInfo?.patient?.id ? appointmentInfo.patient.id.slice(0, 8) : "---"}</span>
                  </div>
                </div>
              </div>

              {/* Thẻ thông tin dịch vụ & lịch hẹn */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-2.5">
                <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Chi tiết cuộc hẹn
                </span>
                <div className="grid grid-cols-2 gap-3 text-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dịch vụ:</span>
                    <span className="text-emerald-700 font-semibold">{appointmentInfo?.serviceName || "Tư vấn từ xa"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mã đặt khám:</span>
                    <span className="font-mono font-bold text-slate-800">{appointmentInfo?.bookingCode || "---"}</span>
                  </div>
                  {appointmentInfo?.branch && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">Cơ sở phòng khám:</span>
                      <span className="text-slate-700">{appointmentInfo.branch.name} - {appointmentInfo.branch.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Thẻ triệu chứng ban đầu đã đăng ký */}
              {appointmentInfo?.symptomsDescription && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-2">
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    Lý do khám & Triệu chứng ban đầu
                  </span>
                  <div className="bg-white p-3 rounded border border-slate-200 text-slate-800 text-xs leading-relaxed">
                    {appointmentInfo.symptomsDescription}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: Tin nhắn trực tuyến */
            <div className="flex-1 flex flex-col h-full bg-slate-50">
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                    Chưa có tin nhắn nào trong phiên tư vấn này.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.senderRole === "DOCTOR";
                    return (
                      <div
                        key={index}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5">
                          {isMe ? "Bác sĩ (Bạn)" : msg.senderName}
                        </span>
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded text-xs shadow-2xs leading-relaxed ${isMe
                            ? "bg-emerald-700 text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                            }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Khung nhập tin nhắn */}
              <form onSubmit={handleSendChatMessage} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={inputChat}
                  onChange={(e) => setInputChat(e.target.value)}
                  placeholder="Nhập tin nhắn hướng dẫn bệnh nhân..."
                  className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700"
                />
                <button
                  type="submit"
                  disabled={!inputChat.trim()}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
