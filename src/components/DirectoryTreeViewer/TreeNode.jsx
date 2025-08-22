import React from "react";
import { FileIcon } from "./icons/FileIcon";
import { FolderIcon } from "./icons/FolderIcon";
import { ChevronDown, ChevronRight } from "./icons/ChevronIcons";

export const TreeNode = ({
  node,
  level = 0,
  openPaths,
  onToggle,
  showFiles = true,
  fileFilter = "",
  selectedExtensions = new Set(),
}) => {
  if (!node) return null;
  // ファイルフィルタリング
  if (node.type === "file") {
    if (!showFiles) return null;
    if (fileFilter && !node.name.includes(fileFilter)) return null;

    // 拡張子フィルタリング（選択したものを非表示）
    if (selectedExtensions.size > 0) {
      const ext = "." + node.name.split(".").pop();
      if (selectedExtensions.has(ext)) return null;
    }
  }
  const indent = level * 16;
  const isOpen = openPaths.has(node.path);

  // ファイルの表示
  if (node.type === "file") {
    return (
      <div
        className="flex items-center py-1 hover:bg-gray-100"
        style={{ paddingLeft: `${indent}px` }}
      >
        <FileIcon />
        <span className="truncate">{node.name}</span>
      </div>
    );
  }

  // ディレクトリの表示（読み取り不可の場合も矢印を表示）
  return (
    <div>
      <div
        className={`flex items-center py-1 hover:bg-gray-100 ${
          node.isUnreadable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => !node.isUnreadable && onToggle(node)}
      >
        {/* 読み取り不可でも矢印は表示（クリックは無効） */}
        <div className={node.isUnreadable ? "opacity-50" : ""}>
          {isOpen ? <ChevronDown /> : <ChevronRight />}
        </div>
        <FolderIcon />
        <span className="truncate">
          {node.name}
          {node.isUnreadable ? " (unreadable)" : ""}
        </span>
      </div>
      {/* 読み取り不可の場合は子要素を表示しない */}
      {!node.isUnreadable && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              openPaths={openPaths}
              onToggle={onToggle}
              showFiles={showFiles}
              fileFilter={fileFilter}
              selectedExtensions={selectedExtensions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
