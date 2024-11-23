import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { DropZone } from './ui/DropZone';
import { TreeNode } from './TreeNode';
import { readDirectory } from './utils/fileReader';
import treeUtils from './utils/treeUtils';

const { generateTreeText, getInitialOpenPaths } = treeUtils;

const DirectoryTreeViewer = () => {
  const [structure, setStructure] = useState(null);
  const [openPaths, setOpenPaths] = useState(new Set());
  const [textView, setTextView] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ files: 0, folders: 0 });

  const toggleFolder = useCallback((node) => {
    if (node.type !== 'directory') return;

    setOpenPaths((prev) => {
      const next = new Set(prev);
      if (next.has(node.path)) {
        next.delete(node.path);
      } else {
        next.add(node.path);
        const parentPath = node.path.split('/').slice(0, -1).join('/');
        if (parentPath) next.add(parentPath);
      }
      return next;
    });
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);
    setLoading(true);
    setStats({ files: 0, folders: 0 });
    setStructure(null);
    setTextView('');
    setOpenPaths(new Set());

    try {
      const items = Array.from(e.dataTransfer.items);
      const entries = items
        .map((item) => item.webkitGetAsEntry())
        .filter((entry) => entry != null);

      if (entries.length === 0) {
        throw new Error('No valid entries found');
      }

      const results = await Promise.all(
        entries.map((entry) =>
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
        throw new Error('Failed to read directory structure');
      }

      const initialOpenPaths = getInitialOpenPaths(validResults);
      setStructure(validResults);
      setOpenPaths(initialOpenPaths);
    } catch (error) {
      console.error('Drop error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (structure && structure[0]) {
      const text = generateTreeText(structure[0], openPaths);
      setTextView(text);
    }
  }, [structure, openPaths]);

  return (
    <div className="flex gap-4 p-4 h-[calc(100vh-64px)]">
      <Card className="w-1/2 h-full">
        <CardContent className="p-4 h-full">
          <DropZone
            loading={loading}
            error={error}
            dragOver={dragOver}
            stats={stats}
            onDragOver={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          />
          <div className="overflow-auto h-[calc(100%-160px)]">
            {structure &&
              structure.map((node, index) => (
                <TreeNode
                  key={`${node.path}-${index}`}
                  node={node}
                  openPaths={openPaths}
                  onToggle={toggleFolder}
                />
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="w-1/2 h-full">
        <CardContent className="p-4 h-full">
          <pre className="font-mono text-sm whitespace-pre overflow-auto h-full">
            {textView}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectoryTreeViewer;
