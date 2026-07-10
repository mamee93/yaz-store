"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import {
  deleteTestTeamMemberAction,
  sendTeamMemberPasswordResetAction,
  toggleTeamMemberStatusAction
} from "@/features/team/actions";

type TeamMemberActionsProps = {
  memberId: string;
  isActive: boolean;
  isSelf: boolean;
  isOwner: boolean;
  showProfile?: boolean;
};

export function TeamMemberActions({
  memberId,
  isActive,
  isSelf,
  isOwner,
  showProfile = true
}: TeamMemberActionsProps) {
  const toggleAction = toggleTeamMemberStatusAction.bind(null, memberId, !isActive);
  const resetAction = sendTeamMemberPasswordResetAction.bind(null, memberId);
  const deleteAction = deleteTestTeamMemberAction.bind(null, memberId);
  const disableDisabled = isSelf || isOwner;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showProfile ? (
        <Link
          href={`/admin/team/${memberId}`}
          className="inline-flex h-9 items-center justify-center rounded-md border border-oud-brown/20 bg-oud-pearl px-3 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/45"
        >
          عرض الملف
        </Link>
      ) : null}
      <form
        action={toggleAction}
        onSubmit={(event) => {
          const message = isActive
            ? "هل أنت متأكد من تعطيل هذا العضو؟ لن يستطيع دخول لوحة الإدارة."
            : "هل تريد تفعيل هذا العضو مرة أخرى؟";

          if (!window.confirm(message)) {
            event.preventDefault();
          }
        }}
      >
        <Button
          type="submit"
          size="sm"
          variant={isActive ? "danger" : "gold"}
          disabled={isActive && disableDisabled}
        >
          {isActive ? "تعطيل" : "تفعيل"}
        </Button>
      </form>
      <form action={resetAction}>
        <Button type="submit" size="sm" variant="secondary">
          إرسال إعادة تعيين
        </Button>
      </form>
      {!isOwner && !isSelf ? (
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm("سيتم تعطيل الحساب بدلا من حذفه للحفاظ على سجل النشاط. متابعة؟")) {
              event.preventDefault();
            }
          }}
        >
          <Button type="submit" size="sm" variant="ghost">
            حذف تجريبي
          </Button>
        </form>
      ) : null}
    </div>
  );
}
