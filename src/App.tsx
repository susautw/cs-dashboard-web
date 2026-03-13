import { useEffect, useState } from "react";
import { FileExplorer } from "./components/FileExplorer";
import { StatsBar } from "./components/StatsBar";
import { VulnerabilityTable } from "./components/VulnerabilityTable";
import type { FileNode, FileReport, ScanReport, Vulnerability } from "./types";
import "./index.css";

interface SelectedFile {
  path: string;
  handle: FileSystemFileHandle;
}

async function readDirectoryTree(
  directoryHandle: FileSystemDirectoryHandle,
  currentPath = "",
): Promise<{ tree: FileNode[]; files: Map<string, FileSystemFileHandle> }> {
  const nodes: FileNode[] = [];
  const files = new Map<string, FileSystemFileHandle>();

  for await (const entry of directoryHandle.values()) {
    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

    if (entry.kind === "directory") {
      const nested = await readDirectoryTree(entry as FileSystemDirectoryHandle, entryPath);
      if (nested.tree.length > 0) {
        nodes.push({
          name: entry.name,
          path: entryPath,
          is_dir: true,
          children: nested.tree,
        });
        for (const [path, handle] of nested.files) {
          files.set(path, handle);
        }
      }
      continue;
    }

    if (entry.name.toLowerCase().endsWith(".json")) {
      nodes.push({
        name: entry.name,
        path: entryPath,
        is_dir: false,
        children: [],
      });
      files.set(entryPath, entry as FileSystemFileHandle);
    }
  }

  nodes.sort((left, right) => {
    if (left.is_dir !== right.is_dir) {
      return left.is_dir ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });

  return { tree: nodes, files };
}

function getDirectoryLabel(handle: FileSystemDirectoryHandle | null) {
  return handle ? handle.name : "";
}

function App() {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [fileHandles, setFileHandles] = useState<Map<string, FileSystemFileHandle>>(new Map());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [fileReports, setFileReports] = useState<FileReport[]>([]);
  const [allVulnerabilities, setAllVulnerabilities] = useState<Vulnerability[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function loadSelectedReports(files: SelectedFile[]) {
      setIsLoadingReports(true);

      try {
        const reports = await Promise.all(
          files.map(async ({ path, handle }) => {
            const file = await handle.getFile();
            const raw = await file.text();
            const report: ScanReport = JSON.parse(raw);

            return {
              fileName: handle.name,
              filePath: path,
              report,
            } satisfies FileReport;
          }),
        );

        if (cancelled) {
          return;
        }

        setFileReports(reports);
        setAllVulnerabilities(reports.flatMap((item) => item.report.vulnerabilities));
        setErrorMessage("");
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load selected reports:", error);
          setFileReports([]);
          setAllVulnerabilities([]);
          setErrorMessage("Some selected files could not be read or parsed as scanning reports.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingReports(false);
        }
      }
    }

    const files = [...selectedFiles]
      .map((path) => {
        const handle = fileHandles.get(path);
        return handle ? { path, handle } : null;
      })
      .filter((entry): entry is SelectedFile => entry !== null);

    if (files.length === 0) {
      setFileReports([]);
      setAllVulnerabilities([]);
      setIsLoadingReports(false);
      return () => {
        cancelled = true;
      };
    }

    void loadSelectedReports(files);

    return () => {
      cancelled = true;
    };
  }, [fileHandles, selectedFiles]);

  const handleOpenFolder = async () => {
    if (!window.showDirectoryPicker) {
      setErrorMessage("This browser does not support the File System Access API. Use Chrome or Edge.");
      return;
    }

    setIsLoadingTree(true);
    setErrorMessage("");

    try {
      const selected = await window.showDirectoryPicker({
        mode: "read",
      });
      const { tree: nextTree, files } = await readDirectoryTree(selected);

      setDirectoryHandle(selected);
      setTree(nextTree);
      setFileHandles(files);
      setSelectedFiles(new Set());
      setFileReports([]);
      setAllVulnerabilities([]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("Failed to open folder:", error);
      setErrorMessage("Unable to open that directory.");
    } finally {
      setIsLoadingTree(false);
    }
  };

  const handleToggleFile = (path: string) => {
    setSelectedFiles((previous) => {
      const next = new Set(previous);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">File Explorer</span>
          <button className="open-folder-btn" onClick={handleOpenFolder} disabled={isLoadingTree}>
            {isLoadingTree ? "Loading..." : "Open Folder"}
          </button>
          {directoryHandle && <div className="sidebar-path">{getDirectoryLabel(directoryHandle)}</div>}
          {errorMessage && <div className="sidebar-error">{errorMessage}</div>}
        </div>
        <FileExplorer
          tree={tree}
          selectedFiles={selectedFiles}
          onToggleFile={handleToggleFile}
          isLoading={isLoadingTree}
        />
      </aside>

      <main className="main-content">
        <StatsBar vulnerabilities={allVulnerabilities} />
        <div className="dashboard-content">
          <VulnerabilityTable
            fileReports={fileReports}
            basePath={getDirectoryLabel(directoryHandle)}
            isLoading={isLoadingReports}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
