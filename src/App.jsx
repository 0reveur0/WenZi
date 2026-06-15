import { useState } from 'react'
import Header from './components/Header.jsx'
import SearchBar from './components/SearchBar.jsx'
import ResultCard from './components/ResultCard.jsx'
import WordGrid from './components/WordGrid.jsx'
import { dictionary } from './data/dictionary.js'
import './App.css'

function App() {
  const [lang, setLang] = useState('vi')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)

  const t = {
    vi: {
      subtitle: 'Từ điển Hán Việt',
      placeholder: 'Nhập chữ Hán, pinyin hoặc nghĩa...',
      noResult: 'Không tìm thấy kết quả cho',
      explore: 'Khám phá từ vựng',
      searching: 'Đang tìm kiếm...',
    },
    en: {
      subtitle: 'Sino-Vietnamese Dictionary',
      placeholder: 'Enter Chinese character, pinyin or meaning...',
      noResult: 'No results found for',
      explore: 'Explore vocabulary',
      searching: 'Searching...',
    },
  }[lang]

  function handleSearch(q) {
    const trimmed = q.trim().toLowerCase()
    setQuery(trimmed)
    setSearched(true)
    if (!trimmed) {
      setResults([])
      setSearched(false)
      return
    }
    const found = dictionary.filter(entry =>
      entry.simplified.includes(trimmed) ||
      entry.traditional.includes(trimmed) ||
      entry.pinyin.toLowerCase().includes(trimmed) ||
      entry.hanviet.toLowerCase().includes(trimmed) ||
      entry.meaning_vi.toLowerCase().includes(trimmed) ||
      entry.meaning_en.toLowerCase().includes(trimmed)
    )
    setResults(found)
  }

  return (
    <div className="app">
      <Header lang={lang} setLang={setLang} subtitle={t.subtitle} />
      <main className="main">
        <SearchBar
          placeholder={t.placeholder}
          onSearch={handleSearch}
          lang={lang}
        />
        {searched ? (
          results.length > 0 ? (
            <div className="results">
              {results.map((entry, i) => (
                <ResultCard key={i} entry={entry} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="no-result">
              <span className="no-result-icon">🔍</span>
              <p>{t.noResult} <strong>"{query}"</strong></p>
            </div>
          )
        ) : (
          <section className="explore">
            <h2 className="explore-title">{t.explore}</h2>
            <WordGrid entries={dictionary.slice(0, 24)} lang={lang} onSelect={word => handleSearch(word)} />
          </section>
        )}
      </main>
      <footer className="footer">
        <p>WenZi © 2026 · MIT License</p>
      </footer>
    </div>
  )
}

export default App
