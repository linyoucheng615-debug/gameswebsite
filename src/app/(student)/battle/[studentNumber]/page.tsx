import { redirect } from "next/navigation";

export default function BattleRedirectPage({
  params,
}: {
  params: { studentNumber: string };
}) {
  redirect(`/portal/${params.studentNumber}`);
}
