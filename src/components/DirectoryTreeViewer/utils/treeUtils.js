// 制限付きディレクトリの定義
const RESTRICTED_DIRECTORIES = new Set([
  'lib64'
]);

// エラーが起きやすいディレクトリの定義
const SKIP_DIRECTORIES = new Set([
  '.git',
  '__pycache__',
  '.idea',
  '.vscode'
]);

const generateTreeText = (node, openPaths, level = 0, isLast = true, parentPrefix = '') => {
  if (!node) return '';

  let text = '';
  
  // インデントと階層マーカーの生成
  if (level === 0) {
    text = `${node.name}\n`;
  } else {
    const marker = isLast ? '└── ' : '├── ';
    text = `${parentPrefix}${marker}${node.name}${node.isRestricted ? ' (restricted)' : ''}\n`;
  }

  // 制限付きディレクトリは子要素を処理しない
  if (node.isRestricted) {
    return text;
  }

  // 子要素の処理
  if (node.children && openPaths.has(node.path)) {
    const childPrefix = parentPrefix + (isLast ? '    ' : '│   ');
    const sortedChildren = [...node.children].sort((a, b) => {
      // フォルダを先に表示
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });

    sortedChildren.forEach((child, index) => {
      text += generateTreeText(
        child,
        openPaths,
        level + 1,
        index === sortedChildren.length - 1,
        childPrefix
      );
    });
  }

  return text;
};

const readDirectory = async (entry, callbacks = {}) => {
  const { onFileCount, onFolderCount } = callbacks;

  try {
    if (entry.isFile) {
      // ファイルをカウント
      onFileCount?.();
      return {
        name: entry.name,
        type: 'file',
        path: entry.fullPath || `/${entry.name}`
      };
    }

    if (RESTRICTED_DIRECTORIES.has(entry.name)) {
      // フォルダをカウント
      onFolderCount?.();
      return {
        name: entry.name,
        type: 'directory',
        path: entry.fullPath || `/${entry.name}`,
        isRestricted: true,
        children: []
      };
    }

    if (SKIP_DIRECTORIES.has(entry.name)) {
      return null;
    }

    // フォルダをカウント
    onFolderCount?.();

    const reader = entry.createReader();
    const entries = await new Promise((resolve, reject) => {
      const results = [];
      function readEntries() {
        reader.readEntries(
          (entries) => {
            if (entries.length === 0) {
              resolve(results);
            } else {
              results.push(...entries);
              readEntries();
            }
          },
          (error) => reject(error)
        );
      }
      readEntries();
    });

    const children = await Promise.all(
      entries.map(async (childEntry) => {
        try {
          return await readDirectory(childEntry, { onFileCount, onFolderCount });
        } catch (error) {
          console.error(`Error reading ${childEntry.name}:`, error);
          return null;
        }
      })
    );

    return {
      name: entry.name,
      type: 'directory',
      path: entry.fullPath || `/${entry.name}`,
      children: children.filter(Boolean).sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      })
    };

  } catch (error) {
    console.error('Directory read error:', error);
    return null;
  }
};

const getInitialOpenPaths = (rootNodes) => {
  const initialOpenPaths = new Set();
  const addNodePath = (node) => {
    if (!node) return;
    initialOpenPaths.add(node.path);
    
    // 制限付きディレクトリは子要素を処理しない
    if (node.isRestricted) return;

    if (node.children) {
      node.children.forEach(child => {
        if (child.type === 'directory') {
          initialOpenPaths.add(child.path);
        }
      });
    }
  };

  rootNodes.forEach(addNodePath);
  return initialOpenPaths;
};

export {
  generateTreeText,
  readDirectory,
  getInitialOpenPaths,
  RESTRICTED_DIRECTORIES,
  SKIP_DIRECTORIES
};