import { fixStageFrame, portableProject } from "./portable";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "./types";
import {
  clearImageCache,
  download,
  importPhoto,
  safeName,
  uid,
} from "./images";
import { clearCompositorCaches, exportPNG } from "./compositor";
import {
  deleteProject,
  listProjects,
  saveProject,
  reloadProject,
} from "./storage";
import { parseProject, validateProjectImages } from "./validation";
import { practiceProject } from "./fixture";
import Garage from "./Garage";
import Setup from "./Setup";
import Catalogue from "./ComponentLibrary";

function BikeIcon() {
  return (
    <svg viewBox="0 0 64 40" fill="none" aria-hidden="true">
      <g
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="13" cy="27" r="10" />
        <circle cx="51" cy="27" r="10" />
        <path d="m13 27 13-21 10 21H13L42 10l9 17-10-25h7M21 6h10" />
      </g>
    </svg>
  );
}
function WelcomeBike() {
  return (
    <svg
      className="welcome-bike"
      viewBox="0 0 980 560"
      role="img"
      aria-label="Original bicycle illustration"
    >
      <defs>
        <linearGradient id="tube" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#e6d6ad" />
          <stop offset="1" stopColor="#aa9366" />
        </linearGradient>
      </defs>
      {[230, 745].map((cx) => (
        <g key={cx}>
          {Array.from({ length: 28 }, (_, i) => {
            const a = (i * Math.PI) / 14;
            return (
              <line
                key={i}
                x1={cx}
                y1="360"
                x2={cx + Math.cos(a) * 134}
                y2={360 + Math.sin(a) * 134}
                stroke="#a6afa8"
                strokeWidth="1"
              />
            );
          })}
          <circle
            cx={cx}
            cy="360"
            r="142"
            fill="none"
            stroke="#303c34"
            strokeWidth="15"
          />
          <circle
            cx={cx}
            cy="360"
            r="133"
            fill="none"
            stroke="#b6bfba"
            strokeWidth="5"
          />
          <circle cx={cx} cy="360" r="7" fill="#687b6b" />
        </g>
      ))}
      <g
        fill="none"
        stroke="url(#tube)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m230 360 148-168 65 182-213-14m148-168h277l-13 49-199 133-65-182m264 49 58 96 45 23" />
      </g>
      <g fill="none" stroke="#aab5ac" strokeWidth="10" strokeLinecap="round">
        <path d="m378 192-16-40m293 40 9-41h30m-251 223 39 29" />
        <circle cx="443" cy="374" r="32" strokeWidth="5" />
      </g>
      <path d="M320 142q37-13 90 4l1 12q-57 8-91-2z" fill="#334137" />
      <path
        d="M689 151c52-5 70 13 61 44s-23 30-36 25"
        fill="none"
        stroke="#416e8b"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="m744 158 9-11 9 17m-294 244h34"
        fill="none"
        stroke="#334137"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <text
        x="501"
        y="287"
        transform="rotate(-33 501 287)"
        fontFamily="sans-serif"
        fontWeight="600"
        fontSize="17"
        fill="#65745a"
        letterSpacing="3"
      >
        YOUR NEXT CHAPTER
      </text>
    </svg>
  );
}
export default function App() {
  const [p, setP] = useState<Project | null>(null),
    [library, setLibrary] = useState<Project[]>([]),
    [setup, setSetup] = useState(false),
    [setupPart, setSetupPart] = useState<string>(),
    [setupProtection, setSetupProtection] = useState(false),
    [catalogue, setCatalogue] = useState(false),
    [catalogueMode,setCatalogueMode] = useState<"visual"|"products">("products"),
    [showLibrary, setShowLibrary] = useState(false),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState("Opening local storage…"),
    [offline, setOffline] = useState(
      import.meta.env.DEV
        ? "Offline available in production build"
        : "Preparing offline assets…",
    ),
    [busy, setBusy] = useState(""),
    [past, setPast] = useState<Project[]>([]),
    [future, setFuture] = useState<Project[]>([]),
    [drag, setDrag] = useState(false),
    [help, setHelp] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null),
    projectInput = useRef<HTMLInputElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined),
    current = useRef(p),
    metrics = useRef<number[]>([]),
    pendingSave = useRef(false),
    exportedVersion = useRef<Project | null>(null),
    gesture = useRef({ active: false, recorded: false });
  current.current = p;
  const notify = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 7000);
  }, []);
  // Mark the same project revision dirty before rendering it. An earlier save
  // must not leave “Saved locally” visible while this revision is still pending.
  const stageProject = useCallback((next: Project) => {
    current.current = next;
    pendingSave.current = true;
    setSaving("Saving…");
    setP(next);
  }, []);
  const update = useCallback((next: Project) => {
    const prev = current.current;
    if (prev && (!gesture.current.active || !gesture.current.recorded)) {
      gesture.current.recorded = true;
      setPast((history) => [...history, prev].slice(-30));
      setFuture([]);
    }
    const updated = { ...next, updatedAt: new Date().toISOString() };
    stageProject(updated);
  }, [stageProject]);
  const undo = useCallback(() => {
    setPast((history) => {
      if (!history.length) return history;
      const last = history[history.length - 1];
      if (current.current)
        setFuture((next) => [current.current!, ...next].slice(0, 30));
      stageProject(last);
      return history.slice(0, -1);
    });
  }, [stageProject]);
  const redo = useCallback(() => {
    setFuture((history) => {
      if (!history.length) return history;
      if (current.current)
        setPast((prev) => [...prev, current.current!].slice(-30));
      stageProject(history[0]);
      return history.slice(1);
    });
  }, [stageProject]);
  useEffect(() => {
    clearCompositorCaches();
    clearImageCache();
  }, [p?.id]);
  useEffect(() => {
    const open = setup || catalogue || showLibrary || help;
    const surfaces = document.querySelectorAll<HTMLElement>(
      ".app-header,.garage,.welcome,.app-footer",
    );
    surfaces.forEach((el) => (el.inert = open));
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = Array.from(
      document.querySelectorAll<HTMLElement>('[role="dialog"]'),
    ).at(-1);
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]',
        ) || [],
      ).filter((el) => el.offsetParent !== null);
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable(),
        first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      surfaces.forEach((el) => (el.inert = false));
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [setup, catalogue, showLibrary, help]);
  useEffect(() => {
    listProjects()
      .then((saved) => {
        setLibrary(saved);
        if (pendingSave.current) return;
        setSaving("Saved locally");
        if (saved.length) {
          void fixStageFrame(saved[0]).then((restored) => {
            if (!pendingSave.current) setP(restored);
          });
          metrics.current = saved[0].metrics.edits;
        }
      })
      .catch((e) => {
        setError(String(e));
        setSaving("Storage unavailable");
      });
  }, []);
  useEffect(() => {
    if (!p || !pendingSave.current) return;
    setSaving("Saving…");
    pendingSave.current = true;
    const timer = setTimeout(() => {
      saveProject({
        ...p,
        metrics: { ...p.metrics, edits: metrics.current.slice(-200) },
      })
        .then(() => {
          if (current.current === p) {
            setSaving("Saved locally");
            setError("");
            pendingSave.current = false;
          }
          setLibrary((items) => [
            { ...p },
            ...items.filter((x) => x.id !== p.id),
          ]);
        })
        .catch((e) => {
          setSaving("Not saved");
          setError(
            `${String(e)} Keep this tab open and export a project file.`,
          );
          pendingSave.current = true;
        });
    }, 700);
    return () => clearTimeout(timer);
  }, [p]);
  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      if (pendingSave.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "Escape") {
        setCatalogue(false);
        setHelp(false);
        setShowLibrary(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [undo, redo]);
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (!("serviceWorker" in navigator) || !("caches" in window)) {
      setOffline("Offline caching unsupported in this browser");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        await navigator.serviceWorker.ready;
        setOffline("Ready offline");
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          installing?.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            )
              notify(
                "An app update is ready. It will apply after all BikeStyler tabs close. Your current work is uninterrupted.",
              );
          });
        });
      })
      .catch(() =>
        setOffline("Offline preparation failed · retry on next visit"),
      );
  }, [notify]);
  async function preserve() {
    if (current.current) {
      if (exportedVersion.current === current.current) return;
      await saveProject({
        ...current.current,
        metrics: {
          ...current.current.metrics,
          edits: metrics.current.slice(-200),
        },
      });
      pendingSave.current = false;
    }
  }
  async function openProject(project: Project) {
    try {
      await preserve();
      clearImageCache();
      setP(await fixStageFrame(await reloadProject(project.id)));
      metrics.current = project.metrics.edits;
      setPast([]);
      setFuture([]);
      setShowLibrary(false);
    } catch (e) {
      notify(
        `Cannot switch while saving failed. Export the current project first. ${String(e)}`,
      );
    }
  }
  async function upload(file: File) {
    setBusy("Opening your photograph…");
    try {
      const project = await importPhoto(file);
      await preserve();
      stageProject(project);
      metrics.current = [];
      setPast([]);
      setFuture([]);
      setSetupPart(undefined);
      setSetupProtection(false);
      setSetup(true);
      setShowLibrary(false);
    } catch (e) {
      notify(String(e));
    } finally {
      setBusy("");
    }
  }
  async function loadPortable(file: File) {
    setBusy("Checking the portable project…");
    try {
      if (file.size > 150 * 1024 * 1024)
        throw new Error("Project file exceeds 150 MB.");
      const project = parseProject(await file.text());
      await validateProjectImages(project);
      await preserve();
      stageProject(await fixStageFrame({ ...project, id: uid() }));
      metrics.current = project.metrics.edits;
      setPast([]);
      setFuture([]);
      setShowLibrary(false);
      notify("Project imported with its source, masks and custom assets.");
    } catch (e) {
      notify(String(e));
    } finally {
      setBusy("");
    }
  }
  async function exportProject() {
    if (!p) return;
    setBusy("Embedding the project’s permitted assets…");
    try {
      const portable = await portableProject({
        ...p,
        metrics: { ...p.metrics, edits: metrics.current.slice(-200) },
      });
      download(
        `${safeName(p.name)}.bike.json`,
        new Blob([JSON.stringify(portable)], { type: "application/json" }),
      );
      exportedVersion.current = p;
      notify(
        "Portable project downloaded with its source, masks, selections and used assets.",
      );
    } catch (e) {
      notify(String(e));
    } finally {
      setBusy("");
    }
  }
  async function refine(partId?: string, protection = false) {
    if (!current.current) return;
    try {
      const framed = await fixStageFrame(current.current);
      setP(framed);
      setSetupPart(partId);
      setSetupProtection(protection);
      setSetup(true);
    } catch (e) {
      notify(String(e));
    }
  }
  function beginGesture(event: React.SyntheticEvent) {
    const el = event.target;
    if (
      el instanceof HTMLInputElement &&
      ["range", "color"].includes(el.type) &&
      !gesture.current.active
    )
      gesture.current = { active: true, recorded: false };
  }
  function endGesture() {
    gesture.current = { active: false, recorded: false };
  }
  async function exportImage() {
    if (!p) return;
    setBusy("Rendering your white-background PNG…");
    try {
      download(`${safeName(p.name)}.png`, await exportPNG(p));
      notify("PNG exported on solid white, without markers or interface.");
    } catch (e) {
      notify(String(e));
    } finally {
      setBusy("");
    }
  }
  async function practice() {
    try {
      await preserve();
      setBusy("Preparing the practice bicycle…");
      await new Promise((r) => setTimeout(r, 20));
      stageProject(await fixStageFrame(practiceProject()));
      metrics.current = [];
      setPast([]);
      setFuture([]);
    } catch (e) {
      notify(String(e));
    } finally {
      setBusy("");
    }
  }
  async function photoSample() {
    try {
      const response = await fetch("/sample/sample.bike.json");
      if (!response.ok) throw Error("The local sample is unavailable.");
      await loadPortable(
        new File([await response.blob()], "Raleigh.bike.json", {
          type: "application/json",
        }),
      );
    } catch (e) {
      notify(String(e));
    }
  }
  return (
    <div
      className="app"
      onPointerDownCapture={beginGesture}
      onPointerUpCapture={endGesture}
      onPointerCancelCapture={endGesture}
      onKeyDownCapture={beginGesture}
      onKeyUpCapture={endGesture}
      onFocusCapture={beginGesture}
      onBlurCapture={(e) => {
        if (
          e.target instanceof HTMLInputElement &&
          ["range", "color"].includes(e.target.type)
        )
          endGesture();
      }}
    >
      <header className="app-header">
        <button
          className="brand"
          onClick={() => setShowLibrary(true)}
          aria-label="BikeStyler home"
        >
          <BikeIcon />
          <span>
            bike<span>styler</span>
          </span>
        </button>
        <nav className="main-nav">
          <button
            className={!catalogue && !showLibrary ? "active" : ""}
            onClick={() => {
              setCatalogue(false);
              setShowLibrary(false);
            }}
          >
            Garage
          </button>
          <button
            className={catalogue ? "active" : ""}
            onClick={() => {setCatalogueMode("products");setCatalogue(true)}}
          >
            Catalogue
          </button>
          <button
            className={showLibrary ? "active" : ""}
            onClick={() => setShowLibrary(true)}
          >
            My bicycles <small>{library.length || ""}</small>
          </button>
        </nav>
        <div className="header-actions">
          {p && (
            <>
              <span className={`save-status ${error ? "error" : ""}`}>
                <i />
                {saving}
              </span>
              <div className="history-buttons">
                <button
                  aria-label="Undo"
                  onClick={undo}
                  disabled={!past.length}
                >
                  ↶
                </button>
                <button
                  aria-label="Redo"
                  onClick={redo}
                  disabled={!future.length}
                >
                  ↷
                </button>
              </div>
              <button className="primary export-button" onClick={exportImage}>
                Export PNG <span>↗</span>
              </button>
            </>
          )}
          <button
            className="icon-button help-button"
            onClick={() => setHelp(true)}
            aria-label="Help and project options"
          >
            ?
          </button>
        </div>
      </header>
      <input
        className="hidden-input"
        ref={photoInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Upload bicycle photo"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <input
        className="hidden-input"
        ref={projectInput}
        type="file"
        accept=".json,.bike.json"
        aria-label="Import portable project"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadPortable(file);
          e.target.value = "";
        }}
      />
      {error && (
        <div className="storage-error" role="alert">
          {p && (
            <button
              onClick={() => {
                const copy = {
                  ...p,
                  id: uid(),
                  name: p.name + " · separate copy",
                };
                stageProject(copy);
                setPast([]);
                setFuture([]);
                setError("");
              }}
            >
              Save separate copy
            </button>
          )}
          <span>{error}</span>
          {p && <button onClick={exportProject}>Export project now</button>}
        </div>
      )}
      {p ? (
        <Garage
          project={p}
          onChange={update}
          onSetup={(partId, protection) => void refine(partId, protection)}
          notify={notify}
          onCatalogue={(mode="products") => {setCatalogueMode(mode);setCatalogue(true)}}
          recordLatency={(ms) => {
            metrics.current = [...metrics.current, ms].slice(-200);
          }}
        />
      ) : (
        <main className="welcome">
          <div className="welcome-copy">
            <span className="eyebrow">
              <i /> THE GARAGE IS YOURS
            </span>
            <h1>
              Same bicycle.
              <br />
              <em>Entirely you.</em>
            </h1>
            <p>
              See what a little colour, a fresh set of tyres, or the right
              finishing touch can do. Start with your own bicycle. Make it your
              own all over again.
            </p>
            <div className="welcome-actions">
              <button
                className="primary large"
                onClick={() => photoInput.current?.click()}
              >
                ＋ Upload your bicycle <span>→</span>
              </button>
              <button
                className="text-button"
                onClick={() => projectInput.current?.click()}
              >
                Open a saved project ↗
              </button>
            </div>
            <div className="local-promise">
              <span>◈</span>
              <div>
                <strong>Your photos stay with you.</strong>
                <p>No accounts. No uploads to a server. No AI.</p>
              </div>
            </div>
          </div>
          <div
            className={`welcome-visual ${drag ? "drag-active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) upload(f);
            }}
          >
            <div className="visual-heading">
              <span>01 / A NEW PERSPECTIVE</span>
              <span>DESIGNED BY YOU</span>
            </div>
            <WelcomeBike />
            <div className="hero-swatch one" />
            <div className="hero-swatch two" />
            <div className="hero-swatch three" />
            <div className="illustration-label">Original illustration</div>
            <div className="drop-photo">
              <span>↥</span>
              <p>
                Drop your side-view photo here
                <small>JPG, PNG or WebP · up to 24 MB</small>
              </p>
            </div>
            <button className="practice-button" onClick={practice}>
              Just exploring? Try the practice illustration <span>→</span>
            </button>
            <button className="practice-button" onClick={photoSample}>
              Try a prepared real photograph <span>→</span>
            </button>
          </div>
          <div className="how-it-works">
            <div>
              <span>01</span>
              <h3>Bring your bicycle.</h3>
              <p>A clear side photo is all you need.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Give it a clean start.</h3>
              <p>Remove the background and confirm its parts.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Find your next look.</h3>
              <p>Style, compare and keep your favourites.</p>
            </div>
          </div>
        </main>
      )}
      <footer className="app-footer">
        <span>
          <i />
          {offline}
        </span>
        <span>
          LOCAL BY DESIGN <b>·</b> BUILT FOR YOUR BICYCLE
        </span>
        {p ? (
          <button onClick={exportProject}>Save editable project ↓</button>
        ) : (
          <button onClick={() => setHelp(true)}>
            A few tips before you start ↗
          </button>
        )}
      </footer>
      {setup && p && (
        <Setup
          initialPart={setupPart}
          initialProtection={setupProtection}
          project={p}
          onChange={update}
          onClose={() => setSetup(false)}
          undo={undo}
          redo={redo}
          canUndo={!!past.length}
          canRedo={!!future.length}
          notify={notify}
        />
      )}
      {catalogue && (
        <Catalogue
          project={p}
          initialMode={catalogueMode}
          onChange={update}
          onClose={() => setCatalogue(false)}
          notify={notify}
        />
      )}
      {showLibrary && (
        <div className="modal-backdrop">
          <section
            className="library-modal"
            role="dialog"
            aria-modal="true"
            aria-label="My bicycles"
          >
            <header>
              <div>
                <span className="eyebrow">YOUR COLLECTION</span>
                <h2>Every bicycle has a story.</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Close bicycles"
                onClick={() => setShowLibrary(false)}
              >
                ×
              </button>
            </header>
            <div className="button-row">
              <button
                className="primary"
                onClick={() => photoInput.current?.click()}
              >
                ＋ New bicycle
              </button>
              <button onClick={() => projectInput.current?.click()}>
                Import project
              </button>
              <button onClick={practice}>Practice illustration</button>
              <button onClick={photoSample}>Prepared photo sample</button>
            </div>
            <p className="hint">
              Saved in this browser profile. Local storage is not a backup and
              does not sync across devices. Export a project file to keep a
              portable copy.
            </p>
            <div className="library-grid">
              {library.map((b) => (
                <article key={b.id}>
                  <button onClick={() => openProject(b)}>
                    <img src={b.source} alt={b.name} />
                    <h3>{b.name}</h3>
                    <p>
                      {b.designs.length} saved designs ·{" "}
                      {new Date(b.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    className="text-button"
                    onClick={async () => {
                      if (p?.id === b.id) {
                        notify(
                          "Open another bicycle before deleting the active project.",
                        );
                        return;
                      }
                      if (
                        !window.confirm(
                          `Delete “${b.name}” from this browser? Export a backup first if you need it.`,
                        )
                      )
                        return;
                      try {
                        await deleteProject(b.id);
                        setLibrary((l) => l.filter((t) => t.id !== b.id));
                      } catch (e) {
                        notify(String(e));
                      }
                    }}
                  >
                    Remove from browser
                  </button>
                </article>
              ))}
            </div>
            {!library.length && (
              <p className="empty-state">
                Your first bicycle belongs here. Upload a photo to get started.
              </p>
            )}
          </section>
        </div>
      )}
      {help && (
        <div className="modal-backdrop">
          <section
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Help and project options"
          >
            <header>
              <div>
                <span className="eyebrow">A FEW USEFUL THINGS</span>
                <h2>Make yourself at home.</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Close help"
                onClick={() => setHelp(false)}
              >
                ×
              </button>
            </header>
            <h3>Start with a good photograph</h3>
            <p>
              Include both wheels and the entire bicycle. Keep it upright, the
              camera level and square to the side. Choose even light and a plain
              contrasting background. Avoid riders, clutter, strong shadows and
              wide-angle distortion. The drivetrain side is a useful starting
              point.
            </p>
            <h3>Setup once. Style whenever.</h3>
            <p>
              Remove background colours, then use Keep and Remove for details.
              Confirm tyre rings and paint the frame mask. Protect lettering,
              cables and overlaps. Wheel suggestions are circular edges, not
              recognition. Difficult photographs need manual correction or a
              retake.
            </p>
            <h3>Private, editable, portable.</h3>
            <p>
              Photos and designs stay in this browser. Export an editable
              project as a backup or to move devices. PNG exports are always on
              white. The original upload is preserved inside your project.
            </p>
            {p && (
              <>
                <label>
                  Project name
                  <input
                    value={p.name}
                    maxLength={100}
                    onChange={(e) => update({ ...p, name: e.target.value })}
                  />
                </label>
                <div className="button-row">
                  <button onClick={exportProject}>
                    Export editable project
                  </button>
                  <button onClick={() => projectInput.current?.click()}>
                    Import project
                  </button>
                </div>
                <button
                  onClick={() => {
                    update({ ...p, styles: {}, decals: [] });
                    notify(
                      "Design reset. Source masks and saved designs are preserved. Undo is available.",
                    );
                  }}
                >
                  Reset the whole design
                </button>
                <p className="hint">
                  Setup processing: {(p.metrics.setupMs / 1000).toFixed(1)} s ·
                  Source: {p.width} × {p.height} · {metrics.current.length}{" "}
                  preview renders measured this session. Tape, saddle and hoods
                  start locked; their colours come from your photograph.
                </p>
              </>
            )}
            <p className="compatibility">
              Visual preview only. Check dimensions and compatibility before
              buying or fitting components.
            </p>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
      {busy && (
        <div className="busy-screen" role="status">
          <div>
            <span className="spinner" />
            <p>{busy}</p>
          </div>
        </div>
      )}
    </div>
  );
}
