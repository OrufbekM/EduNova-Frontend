import React, { Component } from 'react'
import './Blackboard.css'

class Blackboard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      settings: {
        color: '#ffffff',
        size: 5,
        mode: 'draw',
        background: 'black'
      }
    }
    this.canvasRef = React.createRef()
    this.scrollContainerRef = React.createRef()
    this.isDrawing = false
    this.lastX = 0
    this.lastY = 0
    this.raf = null
  }

  getCanvas = () => this.canvasRef.current || null

  getCoords = (e) => {
    const canvas = this.getCanvas()
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width ? canvas.width / rect.width : 1
    const scaleY = rect.height ? canvas.height / rect.height : 1
    let x, y
    if (e.touches) {
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }
    return { x, y }
  }

  drawLine = (ctx, x1, y1, x2, y2) => {
    const { settings } = this.state
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = settings.mode === 'erase' ? 'rgba(0,0,0,1)' : settings.color
    ctx.lineWidth = settings.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (settings.mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out'
    } else {
      ctx.globalCompositeOperation = 'source-over'
    }
    ctx.stroke()
    if (settings.mode === 'erase') ctx.globalCompositeOperation = 'source-over'
  }

  handlePointerStart = (e) => {
    const coords = this.getCoords(e)
    if (!coords) return
    e.preventDefault()
    this.isDrawing = true
    this.lastX = coords.x
    this.lastY = coords.y
  }

  handlePointerMove = (e) => {
    if (!this.isDrawing) return
    e.preventDefault()
    const coords = this.getCoords(e)
    if (!coords) return
    const canvas = this.getCanvas()
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    this.drawLine(ctx, this.lastX, this.lastY, coords.x, coords.y)
    this.lastX = coords.x
    this.lastY = coords.y
  }

  handlePointerEnd = (e) => {
    if (this.isDrawing) e.preventDefault()
    this.isDrawing = false
  }

  setupCanvas = (canvas) => {
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
  }

  clearCanvas = () => {
    const canvas = this.getCanvas()
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
  }

  componentDidMount() {
    if (this.props.isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.userSelect = 'none'
      this.setInitialScrollAndCanvases()
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.isOpen && !prevProps.isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.userSelect = 'none'
      this.setInitialScrollAndCanvases()
    } else if (!this.props.isOpen && prevProps.isOpen) {
      document.body.style.overflow = ''
      document.body.style.userSelect = ''
    }
    if (this.props.isOpen && this.props.contentHeight > 0 && this.props.contentHeight !== prevProps.contentHeight) {
      setTimeout(() => this.resizeCanvases(), 80)
    }
  }

  setInitialScrollAndCanvases = () => {
    setTimeout(() => {
      if (this.scrollContainerRef.current && typeof this.props.initialScrollTop === 'number') {
        this.scrollContainerRef.current.scrollTop = this.props.initialScrollTop
      }
      this.resizeCanvases()
    }, 60)
  }

  resizeCanvases = () => {
    const el = this.canvasRef.current
    if (el) this.setupCanvas(el)
  }

  handleScroll = () => {
    if (this.scrollContainerRef.current && this.props.onScrollSync) {
      this.props.onScrollSync(this.scrollContainerRef.current.scrollTop)
    }
  }

  componentWillUnmount() {
    document.body.style.overflow = ''
    document.body.style.userSelect = ''
  }

  render() {
    const { isOpen, onClose, contentHeight = 0 } = this.props
    if (!isOpen) return null

    const { settings } = this.state
    const bgStyle = settings.background === 'black' ? { background: '#000' } : { background: 'transparent' }
    const innerHeight = Math.max(contentHeight, typeof window !== 'undefined' ? window.innerHeight : 800)

    return (
      <div
        className="blackboard-overlay blackboard-overlay-fixed"
        style={{ ...bgStyle, zIndex: 2147483647 }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          ref={this.scrollContainerRef}
          className="blackboard-scroll-container"
          onScroll={this.handleScroll}
        >
          <div className="blackboard-scroll-inner" style={{ height: innerHeight }}>
            <div className="blackboard-canvas-stack">
              <canvas
                ref={this.canvasRef}
                className="blackboard-layer-canvas"
                onMouseDown={this.handlePointerStart}
                onMouseMove={this.handlePointerMove}
                onMouseUp={this.handlePointerEnd}
                onMouseLeave={this.handlePointerEnd}
                onTouchStart={this.handlePointerStart}
                onTouchMove={this.handlePointerMove}
                onTouchEnd={this.handlePointerEnd}
                onTouchCancel={this.handlePointerEnd}
              />
            </div>
          </div>
        </div>

        <div className="blackboard-controls">
          <button
            type="button"
            className="blackboard-ctrl-btn"
            onClick={() => this.setState((s) => ({
              settings: { ...s.settings, background: s.settings.background === 'black' ? 'transparent' : 'black' }
            }))}
            title={settings.background === 'black' ? 'Transparent' : 'Black'}
          >
            {settings.background === 'black' ? 'Transparent' : 'Black'}
          </button>

          <label className="blackboard-color-wrap">
            <input
              type="color"
              value={settings.color}
              onChange={(e) => this.setState((s) => ({
                settings: { ...s.settings, color: e.target.value }
              }))}
              className="blackboard-color-picker"
            />
          </label>

          <div className="blackboard-size-wrap">
            <input
              type="range"
              min={1}
              max={50}
              value={settings.size}
              onChange={(e) => this.setState((s) => ({
                settings: { ...s.settings, size: Number(e.target.value) }
              }))}
              className="blackboard-size-slider"
            />
            <span className="blackboard-size-value">{settings.size}px</span>
          </div>

          <button
            type="button"
            className={`blackboard-ctrl-btn ${settings.mode === 'erase' ? 'active' : ''}`}
            onClick={() => this.setState((s) => ({
              settings: { ...s.settings, mode: s.settings.mode === 'draw' ? 'erase' : 'draw' }
            }))}
            title={settings.mode === 'draw' ? 'Erase' : 'Draw'}
          >
            {settings.mode === 'draw' ? 'Erase' : 'Draw'}
          </button>

          <button type="button" className="blackboard-ctrl-btn" onClick={this.clearCanvas} title="Clear">
            Clear
          </button>

          <button type="button" className="blackboard-ctrl-btn blackboard-exit" onClick={onClose} title="Exit">
            Exit
          </button>
        </div>
      </div>
    )
  }
}

export default Blackboard
