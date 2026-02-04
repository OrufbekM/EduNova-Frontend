import React, { Component } from 'react'
import { Sun, Moon } from 'lucide-react'

/* =========================
   THEME COLORS
   ========================= */

const darkThemeColors = {
  '--color-black': '#151515',
  '--color-fullblack': '#000000',
  '--color-white': '#F7F7F7',
  '--color-fullwhite': '#ffffff',
  '--color-gray': '#464545',
  '--color-lightgray': '#CFCFCF',
  '--color-neon': '#26CCC2',
  '--color-neon2': '#56DFCF',
  '--color-red': '#a11222',
}

const lightThemeColors = {
  '--color-black': '#F7F7F7',
  '--color-fullblack': '#FFFFFF',
  '--color-white': '#151515',
  '--color-fullwhite': '#000000',
  '--color-gray': '#464545',
  '--color-lightgray': '#000000',
  '--color-neon': '#26CCC2',
  '--color-neon2': '#56DFCF',
  '--color-red': '#a11222',
}

/* =========================
   STYLES
   ========================= */

const styles = {
  toggleContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2.8px',
    background: 'color-mix(in srgb, var(--color-white) 8%, transparent)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '35px',
    padding: '3.5px',
    cursor: 'pointer',
    border: '1.05px solid color-mix(in srgb, var(--color-white) 15%, transparent)',
    position: 'relative',
    boxSizing: 'border-box',
    boxShadow: '0 5.6px 22.4px color-mix(in srgb, var(--color-fullblack) 20%, transparent)',
    overflow: 'hidden',
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-white) 10%, transparent) 0%, transparent 100%)',
    borderRadius: '35px 35px 0 0',
    pointerEvents: 'none',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '23.8px',
    height: '23.8px',
    borderRadius: '50%',
    zIndex: 1,
    transition: 'all 0.3s ease',
  },
  activeIcon: {
    background: 'color-mix(in srgb, var(--color-white) 10%, transparent)',
    boxShadow: '0 1.4px 5.6px color-mix(in srgb, var(--color-fullblack) 15%, transparent)',
  },
}

/* =========================
   COMPONENT
   ========================= */

class ThemeToggle extends Component {
  constructor(props) {
    super(props)
    const savedTheme = localStorage.getItem('edu-nova-theme') || 'dark'
    this.state = { theme: savedTheme }
  }

  applyTheme = (themeName) => {
    const root = document.documentElement
    const colors = themeName === 'dark' ? darkThemeColors : lightThemeColors
    Object.keys(colors).forEach((key) => {
      root.style.setProperty(key, colors[key])
    })
    // Set data attribute for CSS theme detection
    root.setAttribute('data-theme', themeName)
  }

  componentDidMount() {
    this.applyTheme(this.state.theme)
  }

  toggleTheme = () => {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light'
    this.setState({ theme: newTheme }, () => {
      this.applyTheme(newTheme)
      localStorage.setItem('edu-nova-theme', newTheme)
    })
  }

  render() {
    const { theme } = this.state
    const isLight = theme === 'light'

    if (typeof this.props.children === 'function') {
      return this.props.children({ theme: this.state.theme, toggleTheme: this.toggleTheme })
    }

    return (
      <div
        style={styles.toggleContainer}
        onClick={this.toggleTheme}
        role="button"
        aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') this.toggleTheme() }}
      >
        <div style={styles.glossOverlay} />
        <div style={{ ...styles.iconWrapper, ...(isLight ? styles.activeIcon : {}) }}>
          <Sun size={14} color={isLight ? 'var(--color-neon)' : 'var(--color-lightgray)'} />
        </div>
        <div style={{ ...styles.iconWrapper, ...(!isLight ? styles.activeIcon : {}) }}>
          <Moon size={14} color={!isLight ? 'var(--color-white)' : 'var(--color-lightgray)'} />
        </div>
      </div>
    )
  }
}

export default ThemeToggle
export { darkThemeColors, lightThemeColors }
