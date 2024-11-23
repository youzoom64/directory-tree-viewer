export const DropZone = ({ loading, error, dragOver, stats, onDragOver, onDragLeave, onDrop }) => (
  <div
    className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center transition-colors ${
      dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
    }`}
    onDragOver={(e) => {
      e.preventDefault();
      onDragOver();
    }}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
  >
    {loading ? (
      <div>
        <p className="text-blue-500">読み込み中...</p>
        <p className="text-sm text-gray-500">
          ファイル: {stats.files}個, フォルダ: {stats.folders}個
        </p>
      </div>
    ) : error ? (
      <p className="text-red-500">{error}</p>
    ) : dragOver ? (
      <p className="text-blue-500">ドロップしてディレクトリを読み込む</p>
    ) : (
      <p className="text-gray-500">ディレクトリをドラッグ&ドロップしてください</p>
    )}
  </div>
);