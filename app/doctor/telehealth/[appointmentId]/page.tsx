"use client";

import React, { useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/modules/auth/common/guards/AuthGuard";
import { AuthContext } from "@/context/AuthContext";
import DoctorTelehealthRoom from "@/modules/doctor/components/DoctorTelehealthRoom";

function DoctorTelehealthPageContent() {
  const params = useParams();
  const router = useRouter();
  const authContext = useContext<any>(AuthContext);
  const appointmentId = params?.appointmentId as string;

  const doctorUser = authContext?.user;

  return (
    <DoctorTelehealthRoom
      appointmentId={appointmentId}
      doctorId={doctorUser?.id || "doctor-current"}
      doctorName={doctorUser?.fullName || doctorUser?.name || "Bác sĩ"}
      doctorAvatar={doctorUser?.avatarUrl}
      onClose={() => router.push("/doctor")}
    />
  );
}

export default function DoctorTelehealthPage() {
  return (
    <AuthGuard allowedRoles={["doctor", "admin"]}>
      <DoctorTelehealthPageContent />
    </AuthGuard>
  );
}
