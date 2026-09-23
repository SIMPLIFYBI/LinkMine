"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import EditTabs from "../../edit/EditTabs";
import EditConsultantForm from "../../edit/EditConsultantForm";
import AbnSection from "../../edit/AbnSection.client.jsx";
import ConsultantServicesManager from "@/app/components/ConsultantServicesManager";

function formatUpdatedAt(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normaliseResourceTab(value) {
  if (value === "edit" || value === "create") return value;
  return "library";
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-sky-300/45 bg-sky-500/20 text-sky-100"
          : "border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function WorkspaceEditor({
  consultant,
  resources = [],
  initialResourceId = "",
  initialResourceTab = "library",
}) {
  const [creatorOpen, setCreatorOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);
  const initialSelectedResourceId = resources.some((resource) => resource.id === initialResourceId)
    ? initialResourceId
    : (resources[0]?.id || "");
  const [resourceTab, setResourceTab] = useState(normaliseResourceTab(initialResourceTab));
  const [selectedResourceId, setSelectedResourceId] = useState(initialSelectedResourceId);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === selectedResourceId) || null,
    [resources, selectedResourceId]
  );

  const isCreatorCapable = ["creator", "both"].includes(
    String(consultant.profile_type || "consultant")
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="mb-4">
        <Link
          href={`/consultants/${consultant.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-sky-200 hover:underline"
        >
          <span aria-hidden className="text-lg leading-none">←</span>
          <span>Back to profile</span>
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-white">Creator workspace</h1>
      <p className="mb-5 text-sm text-slate-300">
        First version: edit your creator profile and manage resource editing flows in one place.
      </p>

      <EditTabs consultantId={consultant.id} active="workspace" />

      <section className="rounded-2xl border border-white/10 bg-white/[0.04]">
        <button
          type="button"
          onClick={() => setCreatorOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
          aria-expanded={creatorOpen}
        >
          <span className="text-base font-semibold text-white">Creator editor</span>
          <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
            {creatorOpen ? "Collapse" : "Expand"}
          </span>
        </button>

        {creatorOpen ? (
          <div className="border-t border-white/10 px-5 pb-5 pt-4">
            <EditConsultantForm consultant={consultant} />

            <AbnSection
              consultantId={consultant.id}
              initial={{
                abn: consultant.abn || "",
                acn: consultant.acn || "",
                abn_verified: consultant.abn_verified || false,
                abn_entity_name: consultant.abn_entity_name || "",
                abn_entity_type: consultant.abn_entity_type || "",
                abn_status: consultant.abn_status || "",
                abn_gst_registered_from: consultant.abn_gst_registered_from || null,
                abn_last_checked: consultant.abn_last_checked || null,
              }}
            />

            {["consultant", "both"].includes(String(consultant.profile_type || "consultant")) ? (
              <section className="mt-10 space-y-3">
                <h2 className="text-lg font-semibold text-slate-100">Services offered</h2>
                <p className="text-sm text-slate-400">
                  Add or remove services offered by this consultancy.
                </p>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <ConsultantServicesManager consultantId={consultant.id} canEdit={true} />
                </div>
              </section>
            ) : (
              <section className="mt-10 rounded-2xl border border-sky-300/20 bg-sky-500/10 p-4 text-sm text-sky-100">
                This profile is currently in creator mode, so services are hidden.
              </section>
            )}
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04]">
        <button
          type="button"
          onClick={() => setResourcesOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
          aria-expanded={resourcesOpen}
        >
          <span className="text-base font-semibold text-white">Resource workspace</span>
          <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
            {resourcesOpen ? "Collapse" : "Expand"}
          </span>
        </button>

        {resourcesOpen ? (
          <div className="border-t border-white/10 px-5 pb-5 pt-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <TabButton active={resourceTab === "library"} onClick={() => setResourceTab("library")}>My Resources</TabButton>
              <TabButton active={resourceTab === "edit"} onClick={() => setResourceTab("edit")}>Edit selected</TabButton>
              <TabButton active={resourceTab === "create"} onClick={() => setResourceTab("create")}>Create new</TabButton>
            </div>

            {!isCreatorCapable ? (
              <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                This profile is set to consultant mode. You can still manage resources here, or switch profile type to creator or both.
              </p>
            ) : null}

            {resourceTab === "library" ? (
              resources.length === 0 ? (
                <p className="text-sm text-slate-300">No resources found for this profile yet.</p>
              ) : (
                <ul className="space-y-3">
                  {resources.map((resource) => {
                    const isSelected = resource.id === selectedResourceId;
                    return (
                      <li
                        key={resource.id}
                        className={[
                          "rounded-xl border px-4 py-3",
                          isSelected
                            ? "border-sky-300/35 bg-sky-500/10"
                            : "border-white/10 bg-white/[0.03]",
                        ].join(" ")}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedResourceId(resource.id)}
                              className="text-left text-sm font-semibold text-white hover:text-sky-200"
                            >
                              {resource.title}
                            </button>
                            {resource.summary ? (
                              <p className="mt-1 line-clamp-2 text-sm text-slate-300">{resource.summary}</p>
                            ) : null}
                            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                              {resource.status} • {resource.resource_type} • {resource.resource_format} • updated {formatUpdatedAt(resource.updated_at)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/vault/${resource.id}`}
                              className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/[0.1]"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedResourceId(resource.id);
                                setResourceTab("edit");
                              }}
                              className="rounded-full border border-sky-300/35 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/20"
                            >
                              Open editor
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : null}

            {resourceTab === "edit" ? (
              selectedResource ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Selected resource</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{selectedResource.title}</h3>
                  {selectedResource.summary ? (
                    <p className="mt-2 text-sm text-slate-300">{selectedResource.summary}</p>
                  ) : null}
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                    {selectedResource.status} • {selectedResource.resource_type} • {selectedResource.resource_format}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/consultants/${consultant.id}/workspace/edit?resourceId=${selectedResource.id}&resourceTab=edit`}
                      className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25"
                    >
                      Keep editing in workspace
                    </Link>
                    <button
                      type="button"
                      onClick={() => setResourceTab("library")}
                      className="rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]"
                    >
                      Choose a different resource
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-300">Select a resource in My Resources first.</p>
              )
            ) : null}

            {resourceTab === "create" ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-lg font-semibold text-white">Create a new vault resource</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Use your existing create flow. When saved, return here to continue profile and resource management.
                </p>
                <div className="mt-4">
                  <Link
                    href="/vault/submit"
                    className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25"
                  >
                    Open create resource
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
