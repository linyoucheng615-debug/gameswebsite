"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StudentRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const studentNumber = params?.studentNumber as string;

  useEffect(() => {
    if (studentNumber) {
      router.replace(`/portal/${studentNumber}`);
    }
  }, [studentNumber, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold text-sm">
      正在跳轉至親師生透明看板...
    </div>
  );
}
