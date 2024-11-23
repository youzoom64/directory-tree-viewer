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

  // ディレクトリの表示（読み取り不可の場合も矢印を表示）
  return (
    <div>
      <div
        className={`flex items-center py-1 hover:bg-gray-100 ${
          node.isUnreadable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => !node.isUnreadable && onToggle(node)}
      >
        {/* 読み取り不可でも矢印は表示（クリックは無効） */}
        <div className={node.isUnreadable ? 'opacity-50' : ''}>
          {isOpen ? <ChevronDown /> : <ChevronRight />}
        </div>
        <FolderIcon />
        <span className="truncate">
          {node.name}
          {node.isUnreadable ? ' (unreadable)' : ''}
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;