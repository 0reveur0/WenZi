import './WordGrid.css'

export default function WordGrid({ entries, lang, onSelect }) {
  return (
    <div className="word-grid">
      {entries.map((entry, i) => (
        <button
          key={i}
          className="word-tile"
          onClick={() => onSelect(entry.simplified)}
          title={lang === 'vi' ? entry.meaning_vi : entry.meaning_en}
        >
          <span className="tile-char">{entry.simplified}</span>
          <span className="tile-hanviet">{entry.hanviet}</span>
          <span className="tile-pinyin">{entry.pinyin}</span>
        </button>
      ))}
    </div>
  )
}
