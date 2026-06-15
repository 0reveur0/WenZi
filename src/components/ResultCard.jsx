import './ResultCard.css'

export default function ResultCard({ entry, lang }) {
  const meaningLabel = lang === 'vi' ? 'Nghĩa' : 'Meaning'
  const pinyinLabel = 'Pinyin'
  const hanvietLabel = 'Hán Việt'
  const traditionalLabel = lang === 'vi' ? 'Phồn thể' : 'Traditional'

  return (
    <div className="result-card">
      <div className="card-left">
        <span className="char-simplified">{entry.simplified}</span>
        {entry.simplified !== entry.traditional && (
          <span className="char-traditional">{entry.traditional}</span>
        )}
      </div>
      <div className="card-right">
        <div className="card-row">
          <span className="label">{pinyinLabel}</span>
          <span className="value pinyin">{entry.pinyin}</span>
        </div>
        <div className="card-row">
          <span className="label">{hanvietLabel}</span>
          <span className="value hanviet">{entry.hanviet}</span>
        </div>
        {entry.simplified !== entry.traditional && (
          <div className="card-row">
            <span className="label">{traditionalLabel}</span>
            <span className="value">{entry.traditional}</span>
          </div>
        )}
        <div className="card-row">
          <span className="label">{meaningLabel}</span>
          <span className="value meaning">
            {lang === 'vi' ? entry.meaning_vi : entry.meaning_en}
          </span>
        </div>
      </div>
    </div>
  )
}
