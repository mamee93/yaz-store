"use client";

import { Button } from "@/components/ui";
import { toggleTeamMemberStatusAction } from "@/features/team/actions";

type TeamMemberActionsProps = {
  memberId: string;
  isActive: boolean;
  isSelf: boolean;
};

export function TeamMemberActions({ memberId, isActive, isSelf }: TeamMemberActionsProps) {
  const action = toggleTeamMemberStatusAction.bind(null, memberId, !isActive);

  return (
    <form
      action={action}
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
        disabled={isSelf && isActive}
      >
        {isActive ? "تعطيل" : "تفعيل"}
      </Button>
    </form>
  );
}
