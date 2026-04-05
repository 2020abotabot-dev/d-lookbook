"use client";

import { useState, useTransition } from "react";
import { TEST_MODE } from "@/lib/test-mode";
import { MOCK_TENANT, MOCK_TEAM } from "@/lib/mock/data";
import { inviteTeamMember, removeTeamMember } from "@/app/actions/branding";
import Breadcrumb from "@/components/ui/Breadcrumb";
import type { DbUser } from "@/types/database";
import type { UserRole } from "@/types/tenant";

export default function TeamPage() {
  const tenant = MOCK_TENANT;
  const [members, setMembers] = useState<DbUser[]>(MOCK_TEAM);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite() {
    if (!email.trim()) return;
    startTransition(async () => {
      setInviteMsg(null);
      const result = await inviteTeamMember(tenant.id, email, role);
      if (result.success) {
        setInviteMsg(TEST_MODE ? `Invite sent (test mode) to ${email}` : `Invite sent to ${email}`);
        setEmail("");
      } else {
        setInviteMsg(`Error: ${result.error}`);
      }
    });
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      const result = await removeTeamMember(tenant.id, userId);
      if (result.success) {
        setMembers(prev => prev.filter(m => m.id !== userId));
      }
    });
  }

  const ROLE_LABELS: Record<UserRole, string> = {
    owner:  "Owner",
    admin:  "Admin",
    editor: "Editor",
    viewer: "Viewer",
  };

  return (
    <div className="platform-page">
      <div className="platform-page__header">
        <div>
          <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Team" }]} />
          <h1 className="platform-page__title">Team</h1>
          <p className="platform-page__sub">Manage who has access to your workspace</p>
        </div>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <h2 className="settings-section__title">Members</h2>
          <div className="team-list">
            {members.map(member => (
              <div key={member.id} className="team-member">
                <div className="team-member__info">
                  <p className="team-member__name">{member.full_name || member.email}</p>
                  <p className="team-member__email">{member.email}</p>
                </div>
                <span className="team-member__role">{ROLE_LABELS[member.role]}</span>
                {member.role !== "owner" && (
                  <button
                    type="button"
                    className="team-member__remove"
                    onClick={() => handleRemove(member.id)}
                    disabled={isPending}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-section__title">Invite member</h2>
          <div className="settings-form">
            <label className="settings-label">
              Email address
              <input
                type="email"
                className="settings-input"
                placeholder="colleague@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>
            <label className="settings-label">
              Role
              <select
                className="settings-input"
                value={role}
                onChange={e => setRole(e.target.value as "admin" | "editor" | "viewer")}
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>
            {inviteMsg && (
              <p className={inviteMsg.startsWith("Error") ? "form-error" : "form-success"}>
                {inviteMsg}
              </p>
            )}
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleInvite}
              disabled={isPending || !email.trim()}
            >
              {isPending ? "Sending…" : "Send invite"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
