import { useState } from 'react'
import './SearchBar.css'

export default function SearchBar({ placeholder, onSearch }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onSearch(value)
  }

  function handleChange(e) {
    setValue(e.target.value)
    if (e.target.value === '') {
      onSearch('')
    }
  }

  return (
    <form className="searchbar" onSubmit={handleSubmit}>
      <div className="searchbar-inner">
        <span className="search-icon">🔎</span>
        <input
          className="search-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          autoFocus
          autoComplete="off"
          spellCheck="false"
        />
        {value && (
          <button
            type="button"
            className="clear-btn"
            onClick={() => { setValue(''); onSearch('') }}
          >
            ✕
          </button>
        )}
        <button type="submit" className="search-btn">
          {placeholder.startsWith('Nhập') ? 'Tìm' : 'Search'}
        </button>
      </div>
    </form>
  )
}
