"use client";

import Link from "next/link";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
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
      <ConfirmActionButton
        action={toggleAction}
        triggerLabel={isActive ? "تعطيل" : "تفعيل"}
        confirmLabel={isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
        title={isActive ? "تعطيل عضو الفريق" : "تفعيل عضو الفريق"}
        description={
          isActive
            ? "لن يستطيع هذا العضو دخول لوحة الإدارة بعد التعطيل."
            : "سيستطيع هذا العضو دخول لوحة الإدارة مرة أخرى."
        }
        variant={isActive ? "danger" : "gold"}
        size="sm"
        disabled={isActive && disableDisabled}
      />
      <form action={resetAction}>
        <Button type="submit" size="sm" variant="secondary">
          إرسال إعادة تعيين
        </Button>
      </form>
      {!isOwner && !isSelf ? (
        <ConfirmActionButton
          action={deleteAction}
          triggerLabel="حذف"
          confirmLabel="تعطيل الحساب"
          title="حذف عضو تجريبي"
          description="سيتم تعطيل الحساب بدلا من حذفه للحفاظ على سجل النشاط."
          variant="danger"
          size="sm"
        />
      ) : null}
    </div>
  );
}
