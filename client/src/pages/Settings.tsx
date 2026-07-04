import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Save, X, Info, Move, Check } from "lucide-react";
import { statusesApi } from "../services/api";
import type { Status } from "../types";
import { useStatuses } from "../context/StatusContext";
import toast from "react-hot-toast";
import StatusBadge from "../components/StatusBadge";

const COLOR_OPTIONS = [
  {
    name: "Indigo",
    value: "indigo",
    dot: "bg-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/30",
  },
  {
    name: "Blue",
    value: "blue",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/30",
  },
  {
    name: "Purple",
    value: "purple",
    dot: "bg-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900/30",
  },
  {
    name: "Amber",
    value: "amber",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/30",
  },
  {
    name: "Emerald",
    value: "emerald",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30",
  },
  {
    name: "Rose",
    value: "rose",
    dot: "bg-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/30",
  },
  {
    name: "Teal",
    value: "teal",
    dot: "bg-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-900/30",
  },
  {
    name: "Orange",
    value: "orange",
    dot: "bg-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-900/30",
  },
  {
    name: "Pink",
    value: "pink",
    dot: "bg-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300 border-pink-100 dark:border-pink-900/30",
  },
  {
    name: "Gray",
    value: "gray",
    dot: "bg-gray-500",
    bg: "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-250 dark:border-zinc-700",
  },
];

export default function Settings() {
  const { statuses, refetchStatuses } = useStatuses();
  const [localStatuses, setLocalStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(false);

  // Drag State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);

  // Form States
  const [statusName, setStatusName] = useState("");
  const [statusColor, setStatusColor] = useState("indigo");

  // Delete Confirmation Modal States
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");

  useEffect(() => {
    setLocalStatuses(statuses);
  }, [statuses]);

  const handleOpenAddModal = () => {
    setEditingStatus(null);
    setStatusName("");
    setStatusColor("indigo");
    setModalOpen(true);
  };

  const handleOpenEditModal = (status: Status) => {
    setEditingStatus(status);
    setStatusName(status.name);
    setStatusColor(status.color);
    setModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusName.trim()) {
      toast.error("Status name is compulsory!");
      return;
    }

    try {
      if (editingStatus) {
        // Edit Status
        await statusesApi.update(editingStatus._id, {
          name: statusName.trim(),
          color: statusColor,
        });
        toast.success("Status updated successfully!");
      } else {
        // Add Status
        const maxOrder =
          localStatuses.length > 0
            ? Math.max(...localStatuses.map((s) => s.order))
            : 0;
        await statusesApi.create({
          name: statusName.trim(),
          color: statusColor,
          order: maxOrder + 10,
          type: "standard", // default standard
        });
        toast.success("Status created successfully!");
      }
      setModalOpen(false);
      await refetchStatuses();
    } catch (err: any) {
      toast.error(err.message || "Failed to save status");
    }
  };

  const handleDeleteStatus = (id: string, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
  };

  const confirmDeleteStatus = async () => {
    if (!deleteTargetId) return;
    try {
      await statusesApi.delete(deleteTargetId);
      toast.success("Status stage deleted successfully!");
      setDeleteTargetId(null);
      await refetchStatuses();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete status");
    }
  };

  // Drag and drop sorting handlers
  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const updated = [...localStatuses];
    const [draggedItem] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, draggedItem);

    // Optimistically update UI
    setLocalStatuses(updated);
    setDraggedIdx(null);

    try {
      setLoading(true);
      // Save new orders to database sequentially
      await Promise.all(
        updated.map((s, idx) =>
          statusesApi.update(s._id, { order: (idx + 1) * 10 }),
        ),
      );
      await refetchStatuses();
      toast.success("Pipeline order updated!");
    } catch (err) {
      toast.error("Failed to update stage sequence");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="p-4 sm:p-8 w-full max-w-none space-y-6 bg-[#f0f2f5] dark:bg-zinc-950 min-h-screen">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-zinc-100 tracking-tight">
              Master Control Settings
            </h1>
            <p className="text-sm text-gray-400 font-semibold mt-1">
              Configure CRM pipeline stages and visually organize your workflow
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-150 shadow-md shadow-indigo-100 dark:shadow-none active:scale-95 shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
            Add Status Stage
          </button>
        </div>

        {/* Full Width Dynamic Stage Manager */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Info Tip */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/10 text-xs sm:text-sm leading-relaxed text-indigo-750 dark:text-indigo-400">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold">Tips:</span> Drag and drop rows
              using the drag handler icon{" "}
              <Move className="w-4 h-4 inline mx-0.5 text-indigo-500" /> to
              easily reorder your sales pipeline. System default stages like{" "}
              <span className="font-semibold text-indigo-800 dark:text-indigo-300">
                Won
              </span>{" "}
              and{" "}
              <span className="font-semibold text-indigo-800 dark:text-indigo-300">
                Lost
              </span>{" "}
              cannot be deleted but can be renamed.
            </div>
          </div>

          {/* Status Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin mb-3.5" />
              <p className="text-sm font-bold text-gray-400">
                Saving Pipeline Sequence...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-150 dark:border-zinc-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-950 border-b border-gray-150 dark:border-zinc-800 text-xs font-bold text-gray-450 uppercase tracking-wider">
                    <th className="px-6 py-4 text-center w-20">Sequence</th>
                    <th className="px-6 py-4">Stage Name</th>
                    <th className="px-6 py-4">Badge Preview</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                  {localStatuses.map((status, index) => (
                    <tr
                      key={status._id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      className={`hover:bg-gray-50/70 dark:hover:bg-zinc-850/20 transition cursor-move ${
                        draggedIdx === index ? "opacity-40 bg-indigo-50/10" : ""
                      }`}
                    >
                      {/* Drag Handle & Order */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-gray-400">
                          <Move className="w-4.5 h-4.5 hover:text-indigo-600 transition" />
                          <span className="text-xs font-bold">{index + 1}</span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4 text-[14.5px] font-semibold text-slate-700 dark:text-zinc-200">
                        {status.name}
                      </td>

                      {/* Badge Preview */}
                      <td className="px-6 py-4">
                        <StatusBadge status={status.name} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(status)}
                            className="p-2 rounded-xl text-gray-450 hover:text-indigo-650 hover:bg-indigo-50/50 dark:hover:bg-zinc-800 transition"
                            title="Edit Stage Parameters"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteStatus(status._id, status.name)
                            }
                            className="p-2 rounded-xl text-gray-450 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-zinc-800 transition"
                            title="Delete Stage"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Status Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-850">
              <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100">
                {editingStatus
                  ? "Modify Stage Name & Style"
                  : "Register New Pipeline Stage"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStatus} className="p-6 space-y-5">
              {/* Status Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-450 uppercase tracking-widest block">
                  Stage Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Demonstration Done"
                  value={statusName}
                  onChange={(e) => setStatusName(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-foreground transition-all"
                />
              </div>

              {/* Status Color Badge selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-450 uppercase tracking-widest block">
                  Visual Badge Style Color
                </label>

                {/* Circular Swatches Picker */}
                <div className="flex flex-wrap gap-2.5 py-1">
                  {COLOR_OPTIONS.map((opt) => {
                    const isSelected = statusColor === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatusColor(opt.value)}
                        title={opt.name}
                        className={`w-9 h-9 rounded-full ${opt.dot} transition-all duration-150 flex items-center justify-center text-white shrink-0 relative hover:scale-110 active:scale-95 shadow-sm ${
                          isSelected
                            ? "ring-4 ring-offset-2 ring-primary/40 dark:ring-offset-zinc-900 scale-105"
                            : ""
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-4.5 h-4.5 text-white stroke-[3px]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-5 border-t border-gray-100 dark:border-zinc-850 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-100 dark:shadow-none"
                >
                  <Save className="w-4.5 h-4.5" />
                  Save Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteTargetId(null)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 mx-4 p-6 overflow-hidden">
            <h3 className="text-base font-bold text-gray-800 dark:text-zinc-150 mb-1">
              Delete Pipeline Stage?
            </h3>
            <p className="text-sm text-gray-400 dark:text-zinc-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete the stage{" "}
              <span className="font-extrabold text-gray-700 dark:text-zinc-200">
                "{deleteTargetName}"
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-300 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStatus}
                className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-100 dark:shadow-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
