export const readDirectory = async (entry, parentPath = '') => {
  try {
    if (entry.isFile) {
      return {
        name: entry.name,
        type: 'file',
        path: entry.fullPath || `${parentPath}/${entry.name}`
      };
    }

    // ディレクトリ読み取りを試行
    const reader = entry.createReader();
    let entries = [];
    
    try {
      entries = await new Promise((resolve, reject) => {
        const results = [];
        function readEntries() {
          reader.readEntries((entries) => {
            if (entries.length === 0) {
              resolve(results);
            } else {
              results.push(...entries);
              readEntries();
            }
          }, reject);
        }
        readEntries();
      });
    } catch (error) {
      // 読み取りエラーの場合でも、現在の階層構造を維持
      return {
        name: entry.name,
        type: 'directory',
        path: entry.fullPath || `${parentPath}/${entry.name}`,
        isUnreadable: true,
        children: []
      };
    }

    // 子要素の処理（親のパスを渡す）
    const children = await Promise.all(
      entries.map(async (childEntry) => {
        try {
          return await readDirectory(
            childEntry, 
            entry.fullPath || `${parentPath}/${entry.name}`
          );
        } catch (error) {
          if (childEntry.isDirectory) {
            // ディレクトリのエラーの場合、unreadableとして返す
            return {
              name: childEntry.name,
              type: 'directory',
              path: childEntry.fullPath || `${entry.fullPath}/${childEntry.name}`,
              isUnreadable: true,
              children: []
            };
          }
          return null;
        }
      })
    );

    return {
      name: entry.name,
      type: 'directory',
      path: entry.fullPath || `${parentPath}/${entry.name}`,
      children: children.filter(Boolean).sort((a, b) => {
        // ディレクトリを先に、ファイルを後に
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      })
    };

  } catch (error) {
    console.error('Directory read error:', error);
    // エラー時も階層構造を維持
    return {
      name: entry.name,
      type: 'directory',
      path: entry.fullPath || `${parentPath}/${entry.name}`,
      isUnreadable: true,
      children: []
    };
  }
};