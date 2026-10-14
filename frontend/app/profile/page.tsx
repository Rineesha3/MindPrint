"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ProfileSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/ToastProvider";

export default function ProfilePage() {
  const { user, loading, updateName, changePassword, deleteAccount } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    // Skipped while deleting — handleDelete sends the user home instead.
    if (!loading && !user && !deleting) {
      router.replace("/login?next=/profile");
    }
  }, [loading, user, router, deleting]);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (loading || !user) {
    return <ProfileSkeleton />;
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    setNameError(null);
    try {
      await updateName(name);
      showToast("Name updated");
    } catch (err: any) {
      const message = err.message || "Could not save name.";
      setNameError(message);
      showToast(message, "error");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await changePassword(user!.has_password ? currentPassword : null, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      showToast(user!.has_password ? "Password updated" : "Password set");
    } catch (err: any) {
      const message = err.message || "Could not update password.";
      setPasswordError(message);
      showToast(message, "error");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete your account? This permanently removes your account and all saved history — it cannot be undone.")) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      router.push("/");
    } catch (err: any) {
      const message = err.message || "Could not delete account.";
      setDeleteError(message);
      showToast(message, "error");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-2xl font-bold text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <form onSubmit={handleSaveName} className="card rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold">Profile</h2>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-3 w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="mb-4 w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-100 p-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-500"
          />
          {nameError && <p className="mb-3 text-sm text-red-500">{nameError}</p>}
          <button
            type="submit"
            disabled={nameSaving || name.trim() === user.name}
            className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-90"
          >
            {nameSaving ? "Saving..." : "Save name"}
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="card rounded-2xl p-6">
          <h2 className="mb-1 text-lg font-semibold">
            {user.has_password ? "Change password" : "Set a password"}
          </h2>
          {!user.has_password && (
            <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
              Your account was created via social login and has no password yet — set one to
              also be able to log in with email and password.
            </p>
          )}
          {user.has_password && (
            <>
              <label className="mb-1 mt-3 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mb-3 w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </>
          )}
          <label className="mb-1 mt-3 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            New password
          </label>
          <input
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="mb-4 w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          {passwordError && <p className="mb-3 text-sm text-red-500">{passwordError}</p>}
          <button
            type="submit"
            disabled={passwordSaving || newPassword.length < 8}
            className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-90"
          >
            {passwordSaving ? "Saving..." : user.has_password ? "Update password" : "Set password"}
          </button>
        </form>
      </div>

      <div className="card rounded-2xl border border-red-500/20 p-6">
        <h2 className="mb-1 text-lg font-semibold text-red-500">Danger zone</h2>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-300">
          Permanently delete your account and all saved assessment history. This cannot be
          undone.
        </p>
        {deleteError && <p className="mb-3 text-sm text-red-500">{deleteError}</p>}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-xl border border-red-500/40 px-5 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleting ? "Deleting..." : "Delete account"}
        </button>
      </div>
    </div>
  );
}
