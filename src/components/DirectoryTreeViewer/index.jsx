import React, { useState, useCallback } from "react";
import { Card, CardContent } from "./ui/Card";
import { DropZone } from "./ui/DropZone";
import { TreeNode } from "./TreeNode";
import {
  readDirectory,
  generateTreeText,
  getInitialOpenPaths,
} from "./utils/treeUtils"; // 追加

const DirectoryTreeViewer = () => {
  const [structure, setStructure] = useState(null);
  const [openPaths, setOpenPaths] = useState(new Set());
  const [textView, setTextView] = useState(""); // この行が必要
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ files: 0, folders: 0 });
  const [showFiles, setShowFiles] = useState(true);
  const [fileFilter, setFileFilter] = useState("");
  const [selectedExtensions, setSelectedExtensions] = useState(new Set());
  const [availableExtensions, setAvailableExtensions] = useState(new Set());

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);
    setLoading(true);
    setStats({ files: 0, folders: 0 });

    try {
      const items = Array.from(e.dataTransfer.items);
      const entries = items
        .map((item) => item.webkitGetAsEntry())
        .filter((entry) => entry != null);

      if (entries.length === 0) {
        throw new Error("No valid entries found");
      }

      const results = await Promise.all(
        entries.map(async (entry) =>
          readDirectory(entry, {
            onFileCount: () =>
              setStats((prev) => ({ ...prev, files: prev.files + 1 })),
            onFolderCount: () =>
              setStats((prev) => ({ ...prev, folders: prev.folders + 1 })),
          })
        )
      );

      const validResults = results.filter(Boolean);
      if (validResults.length === 0) {
        throw new Error("Failed to read directory structure");
      }

      // 拡張子を収集
      const extensions = collectExtensions(validResults[0]);
      setAvailableExtensions(extensions);
      setSelectedExtensions(new Set()); // 初期は何も選択しない

      // 初期状態ではルートと直下の子ディレクトリを開く
      const initialOpenPaths = getInitialOpenPaths(validResults);

      setStructure(validResults);
      setOpenPaths(initialOpenPaths);
      setTextView(
        generateTreeText(validResults[0], initialOpenPaths, {
          showFiles,
          fileFilter,
          selectedExtensions,
        })
      );
    } catch (error) {
      console.error("Drop error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  const collapseAll = useCallback(() => {
    if (!structure) return;
    const rootPaths = new Set(structure.map((node) => node.path));
    setOpenPaths(rootPaths);
  }, [structure]);

  const toggleShowFiles = useCallback(() => {
    setShowFiles((prev) => !prev);
  }, []);

  const collectExtensions = useCallback((node) => {
    const extensions = new Set();
    const traverse = (n) => {
      if (n.type === "file") {
        const ext = n.name.split(".").pop();
        if (ext && ext !== n.name) extensions.add("." + ext);
      }
      if (n.children) {
        n.children.forEach(traverse);
      }
    };
    if (node) traverse(node);
    return extensions;
  }, []);

  const toggleExtension = useCallback((ext) => {
    setSelectedExtensions((prev) => {
      const next = new Set(prev);
      if (next.has(ext)) {
        next.delete(ext);
      } else {
        next.add(ext);
      }
      return next;
    });
  }, []);

  const toggleFolder = useCallback((node) => {
    if (!node || node.type !== "directory" || node.isUnreadable) return;

    setOpenPaths((prev) => {
      const next = new Set(prev);
      if (next.has(node.path)) {
        next.delete(node.path);
      } else {
        next.add(node.path);
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (structure && structure[0]) {
      setTextView(
        generateTreeText(structure[0], openPaths, {
          showFiles,
          fileFilter,
          selectedExtensions,
        })
      );
    }
  }, [structure, openPaths, showFiles, fileFilter, selectedExtensions]);

  return (
    <div className="flex gap-4 p-4 h-screen">
      <Card className="w-1/2">
        <CardContent className="p-4">
          <DropZone
            loading={loading}
            error={error}
            dragOver={dragOver}
            stats={stats}
            onDragOver={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={collapseAll}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              disabled={!structure}
            >
              全て閉じる
            </button>
            <button
              onClick={toggleShowFiles}
              className={`px-3 py-1 rounded text-sm text-white ${
                showFiles
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {showFiles ? "ファイル非表示" : "ファイル表示"}
            </button>
            <input
              type="text"
              placeholder="ファイル名フィルター"
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {Array.from(availableExtensions)
              .sort()
              .map((ext) => (
                <button
                  key={ext}
                  onClick={() => toggleExtension(ext)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedExtensions.has(ext)
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {ext}
                </button>
              ))}
          </div>
          <div
            className="overflow-auto"
            style={{ height: "calc(100vh - 180px)" }}
          >
            {structure &&
              structure.map((node, index) => (
                <TreeNode
                  key={`${node.path}-${index}`}
                  node={node}
                  openPaths={openPaths}
                  onToggle={toggleFolder}
                  showFiles={showFiles}
                  fileFilter={fileFilter}
                  selectedExtensions={selectedExtensions}
                />
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="w-1/2">
        <CardContent className="p-4">
          <pre
            className="font-mono text-sm whitespace-pre overflow-auto"
            style={{ height: "calc(100vh - 140px)" }}
          >
            {textView}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectoryTreeViewer;
