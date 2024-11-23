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

export const generateTreeText = (node, openPaths, level = 0, isLast = true, parentPrefix = '') => {
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

export const readDirectory = async (entry, depth = 0) => {
  const MAX_DEPTH = 20; // 深さの制限

  if (!entry || depth > MAX_DEPTH) return null;

  try {
    if (entry.isFile) {
      return {
        name: entry.name,
        type: 'file',
        path: entry.fullPath || `/${entry.name}`
      };
    }

    // 制限付きディレクトリのチェック
    if (RESTRICTED_DIRECTORIES.has(entry.name)) {
      return {
        name: entry.name,
        type: 'directory',
        path: entry.fullPath || `/${entry.name}`,
        isRestricted: true,
        children: [] // 子要素は空配列
      };
    }

    // スキップするディレクトリのチェック
    if (SKIP_DIRECTORIES.has(entry.name)) {
      return null;
    }

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
          return await readDirectory(childEntry, depth + 1);
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
      children: children.filter(Boolean)
    };
  } catch (error) {
    console.error(`Error reading directory ${entry.name}:`, error);
    return null;
  }
};

export const getInitialOpenPaths = (rootNodes) => {
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

export default {
  generateTreeText,
  readDirectory,
  getInitialOpenPaths,
  RESTRICTED_DIRECTORIES,
  SKIP_DIRECTORIES
};