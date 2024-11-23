import React from 'react';
import { FileIcon } from './icons/FileIcon';
import { FolderIcon } from './icons/FolderIcon';
import { ChevronDown, ChevronRight } from './icons/ChevronIcons';

export const TreeNode = ({ node, level = 0, openPaths, onToggle }) => {
  if (!node) return null;

  const indent = level * 16;
  const isOpen = openPaths.has(node.path);

  // ファイルの表示
  if (node.type === 'file') {
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

  // 読み取り不可のディレクトリは親の子要素として表示
  if (node.isUnreadable) {
    return (
      <div
        className="flex items-center py-1 cursor-default hover:bg-gray-100 opacity-50"
        style={{ paddingLeft: `${indent}px` }}
      >
        <FolderIcon />
        <span className="truncate">{node.name} (unreadable)</span>
      </div>
    );
  }

  // 通常のディレクトリ表示
  return (
    <div>
      <div
        className="flex items-center py-1 cursor-pointer hover:bg-gray-100"
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => onToggle(node)}
      >
        {isOpen ? <ChevronDown /> : <ChevronRight />}
        <FolderIcon />
        <span className="truncate">{node.name}</span>
      </div>
      {isOpen && node.children && node.children.length > 0 && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode 
              key={`${child.path}-${index}`} 
              node={child} 
              level={level + 1}
              openPaths={openPaths}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};