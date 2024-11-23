import { FileIcon } from './icons/FileIcon';
import { FolderIcon } from './icons/FolderIcon';
import { ChevronDown, ChevronRight } from './icons/ChevronIcons';

export const TreeNode = ({ node, level = 0, openPaths, onToggle }) => {
  if (!node) return null;

  const indent = level * 16;
  const isOpen = openPaths.has(node.path);

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
      {isOpen && node.children && (
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