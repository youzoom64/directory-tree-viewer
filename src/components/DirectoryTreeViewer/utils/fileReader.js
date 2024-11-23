export const readEntryContents = async (dirReader) => {
    const entries = await new Promise((resolve) => {
      dirReader.readEntries(resolve);
    });
    
    if (entries.length) {
      const moreEntries = await readEntryContents(dirReader);
      return [...entries, ...moreEntries];
    }
    
    return entries;
  };
  
  export const readDirectory = async (entry, callbacks = {}) => {
    const { onFileCount, onFolderCount } = callbacks;
  
    try {
      if (entry.isFile) {
        onFileCount?.();
        return {
          name: entry.name,
          type: 'file',
          path: entry.fullPath
        };
      }
  
      onFolderCount?.();
      const dirReader = entry.createReader();
      const entries = await readEntryContents(dirReader);
      
      const children = await Promise.all(
        entries.map(async (childEntry) => {
          try {
            return await readDirectory(childEntry, callbacks);
          } catch (e) {
            console.error(`Error reading ${childEntry.fullPath}:`, e);
            return null;
          }
        })
      );
  
      return {
        name: entry.name,
        type: 'directory',
        path: entry.fullPath,
        children: children.filter(Boolean).sort((a, b) => {
          if (a.type === 'directory' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        })
      };
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  };