import './Header.css'

export default function Header({ lang, setLang, subtitle }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo-area">
          <img src="/favicon.png" alt="WenZi logo" className="logo" />
          <div className="title-group">
            <h1 className="title">WenZi <span className="title-han">文字</span></h1>
            <p className="subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="lang-toggle">
          <button
            className={`lang-btn ${lang === 'vi' ? 'active' : ''}`}
            onClick={() => setLang('vi')}
          >
            Tiếng Việt
          </button>
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >
            English
          </button>
        </div>
      </div>
    </header>
  )
}
