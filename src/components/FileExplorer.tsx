import { useState } from "react";
import type { FileNode } from "../types";

interface FileExplorerProps {
  tree: FileNode[];
  selectedFiles: Set<string>;
  onToggleFile: (path: string) => void;
  isLoading?: boolean;
}

export function FileExplorer({
  tree,
  selectedFiles,
  onToggleFile,
  isLoading = false,
}: FileExplorerProps) {
  if (isLoading) {
    return <div className="sidebar-message">Scanning directory...</div>;
  }

  return (
    <div className="sidebar-tree">
      {tree.length === 0 ? (
        <div className="sidebar-message">No JSON files found</div>
      ) : (
        tree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            selectedFiles={selectedFiles}
            onToggleFile={onToggleFile}
          />
        ))
      )}
    </div>
  );
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  selectedFiles: Set<string>;
  onToggleFile: (path: string) => void;
}

function TreeNode({ node, depth, selectedFiles, onToggleFile }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);

  if (node.is_dir) {
    return (
      <div className="tree-node">
        <div
          className="tree-node-row"
          onClick={() => setExpanded((current) => !current)}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className={`tree-toggle ${expanded ? "expanded" : ""}`}>▶</span>
          <span className="tree-icon">📁</span>
          <span className="tree-label dir">{node.name}</span>
        </div>
        {expanded && (
          <div className="tree-children">
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFiles={selectedFiles}
                onToggleFile={onToggleFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isChecked = selectedFiles.has(node.path);

  return (
    <div className="tree-node">
      <label className="tree-node-row" style={{ paddingLeft: `${34 + depth * 16}px` }}>
        <input
          type="checkbox"
          className="tree-checkbox"
          checked={isChecked}
          onChange={() => onToggleFile(node.path)}
        />
        <span className="tree-icon">📄</span>
        <span className="tree-label">{node.name}</span>
      </label>
    </div>
  );
}
