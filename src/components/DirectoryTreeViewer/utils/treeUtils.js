export const generateTreeText = (node, openPaths, level = 0, isLast = true, parentPrefix = '') => {
  if (!node) return '';

  let text = '';
  
  // インデントと階層マーカーの生成
  if (level === 0) {
    text = `${node.name}\n`;
  } else {
    const marker = isLast ? '└── ' : '├── ';
    text = `${parentPrefix}${marker}${node.name}\n`;
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

export const readDirectory = async (entry) => {
  if (!entry) return null;

  try {
    if (entry.isFile) {
      return {
        name: entry.name,
        type: 'file',
        path: entry.fullPath || `/${entry.name}`
      };
    }

    const reader = entry.createReader();
    const entries = await new Promise((resolve) => {
      const results = [];
      function readEntries() {
        reader.readEntries((entries) => {
          if (entries.length === 0) {
            resolve(results);
          } else {
            results.push(...entries);
            readEntries();
          }
        });
      }
      readEntries();
    });

    const children = await Promise.all(
      entries.map(async (childEntry) => await readDirectory(childEntry))
    );

    return {
      name: entry.name,
      type: 'directory',
      path: entry.fullPath || `/${entry.name}`,
      children: children.filter(Boolean)
    };
  } catch (error) {
    console.error('Error reading:', error);
    return null;
  }
};

export const getInitialOpenPaths = (rootNodes) => {
  const initialOpenPaths = new Set();
  const addNodePath = (node) => {
    if (!node) return;
    initialOpenPaths.add(node.path);
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
  getInitialOpenPaths
};