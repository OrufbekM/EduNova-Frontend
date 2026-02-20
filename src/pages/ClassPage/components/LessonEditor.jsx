import React, { Component } from 'react'
import { IconPlus, IconSettings, IconTrash, IconGrip, IconCheck, IconX, IconStar, IconArrowRight, IconResize, IconAttachment, IconFile, IconListDisc, IconTable, IconType, IconAiChat } from '../../icons.jsx'
import { getLessonContent, updateLessonContent, updateItemStyle, generateLessonContent } from '../../../api/lessons'
import { toast } from '../../../utils/toast'
import './LessonEditor.css'
import cpModalStyles from '../ClassPage.module.css'

const ITEM_CATEGORIES = [
  {
    label: 'Text Blocks',
    items: [
      'Paragraph', 'Title', 'Heading', 'Subheading', 'Explanation', 'Definition',
      'Example', 'KeyPoint', 'Quote', 'Note', 'Warning', 'Tip'
    ]
  },
  {
    label: 'Lists & Structure',
    items: ['List', 'Table']
  },
  {
    label: 'Media',
    items: ['MediaAttachment']
  },
  {
    label: 'Learning & Assessment',
    items: ['Exercise', 'Question', 'Quiz']
  }
]

// Flat list of all item types (for picker list and search)
const ALL_ITEMS = ITEM_CATEGORIES.reduce((acc, cat) => acc.concat(cat.items), [])

// Icon per item type for picker cards
const ITEM_ICONS = {
  Title: IconType,
  Heading: IconType,
  Subheading: IconType,
  Paragraph: IconFile,
  Explanation: IconFile,
  Definition: IconFile,
  Example: IconFile,
  KeyPoint: IconStar,
  Quote: IconFile,
  Note: IconFile,
  Warning: IconFile,
  Tip: IconFile,
  List: IconListDisc,
  Table: IconTable,
  MediaAttachment: IconAttachment,
  Exercise: IconStar,
  Question: IconFile,
  Quiz: IconStar
}

// Media type detection: extensions and MIME for images, video, audio
const MEDIA_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'avif']
const MEDIA_VIDEO_EXT = ['mp4', 'webm', 'ogg', 'mov', 'm4v']
const MEDIA_AUDIO_EXT = ['mp3', 'wav', 'ogg', 'aac', 'm4a']
const MEDIA_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/avif']
const MEDIA_VIDEO_MIME = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v']
const MEDIA_AUDIO_MIME = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/mp4']
const MAX_MEDIA_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB


class LessonEditor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pages: [this.createFirstPage()],
      lessonLoading: false,
      openPageSettingsId: null,
      itemPicker: null,
      itemSearch: '',
      activeItemId: null,
      focusItemId: null,
      confirmModal: null,
      dragOverItemId: null,
      aiChatOpen: false,
      aiContext: null,
      isDragging: false,
      quizSelections: {}, // itemId -> selected option text (view mode)
      aiPrompt: '',
      aiLoading: false,
      aiError: null
    }
    this.dragItem = null
    this.textInputTimeout = null
    this.saveTimeout = null
    this.contentEditableRefs = {}
    this.listItemInputRefs = {}
    this.addItemInputRef = null
    this.lessonEditorRef = React.createRef()
    this.lastEnterTime = 0
    this.DOUBLE_ENTER_MS = 400
    this.lastSaveErrorAt = 0
  }

  componentDidMount() {
    if (this.props.lessonId && this.props.classId) {
      this.loadLessonContent()
    }
    document.addEventListener('keydown', this.handleEditorKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleEditorKeyDown)
    if (this.focusAddItemInputTimeout) clearTimeout(this.focusAddItemInputTimeout)
    if (this.focusItemTimeout) clearTimeout(this.focusItemTimeout)
    // Save when unmounting in edit mode (e.g. toggling to view mode via key remount)
    if (this.props.editMode && this.props.lessonId && this.props.classId) {
      const apiContent = this.convertInternalToApi(this.state.pages)
      updateLessonContent(this.props.classId, this.props.lessonId, apiContent).catch(() => {})
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const exitingEditMode = prevProps.editMode && !this.props.editMode
    if (exitingEditMode || prevProps.editMode !== this.props.editMode) {
    }
    if (prevProps.lessonId !== this.props.lessonId || prevProps.classId !== this.props.classId) {
      if (this.props.lessonId && this.props.classId) {
        this.loadLessonContent()
      } else {
        this.resetLesson()
      }
    }
    if (this.props.blackboardOpen && !prevProps.blackboardOpen) {
      this.setState({ itemPicker: null, activeItemId: null })
    }
    if (prevProps.editMode && !this.props.editMode) {
      this.setState({ activeItemId: null, itemPicker: null })
      // Save when exiting edit mode
      if (this.props.lessonId && this.props.classId) {
        this.saveLessonContent()
      }
    }
    // Focus add-item input when picker opens (e.g. after clicking plus or "+ Column")
    if (this.state.itemPicker && !prevState.itemPicker) {
      this.focusAddItemInputTimeout = setTimeout(() => {
        if (this.addItemInputRef) {
          this.addItemInputRef.focus()
          this.addItemInputRef.select()
        }
        this.focusAddItemInputTimeout = null
      }, 0)
    }

    // After adding an item, focus its content so user can type instantly
    if (this.state.focusItemId) {
      const itemId = this.state.focusItemId
      this.focusItemTimeout = setTimeout(() => {
        const el = this.contentEditableRefs[itemId]
        if (el) {
          el.focus()
          el.textContent = el.textContent || ''
          const range = document.createRange()
          range.selectNodeContents(el)
          range.collapse(false)
          const sel = window.getSelection()
          sel.removeAllRanges()
          sel.addRange(range)
        }
        this.setState({ focusItemId: null })
        this.focusItemTimeout = null
      }, 0)
    }

    // When exiting edit mode, skip contentEditable sync to avoid DOM/React mismatch (removeChild)
    if (exitingEditMode) {
      this.contentEditableRefs = {}
      return
    }
    
    // Update contentEditable elements when state changes, but only if not focused
    const refKeys = Object.keys(this.contentEditableRefs)
    if (refKeys.length && exitingEditMode) {
      const refStatus = refKeys.map(itemId => {
        const el = this.contentEditableRefs[itemId]
        return { itemId, isConnected: el ? el.isConnected : false, hasParent: el ? !!el.parentNode : false }
      })
    }
    Object.keys(this.contentEditableRefs).forEach(itemId => {
      const el = this.contentEditableRefs[itemId]
      if (!el) return
      
      // Find the item in current state
      const location = this.findItemLocation(this.state.pages, itemId)
      if (!location) return
      const items = this.getContainerItemsByLocation(this.state.pages, location)
      const item = items[location.index]
      
      // Only update if element is not focused (user is not typing)
      if (document.activeElement !== el) {
        const currentText = el.textContent || ''
        const newText = item.content || ''
        if (currentText !== newText) {
          if (exitingEditMode) {
          }
          el.textContent = newText
        }
      }
    })
  }

  resetLesson = () => {
    this.setState({
      pages: [this.createFirstPage()],
      openPageSettingsId: null,
      itemPicker: null,
      itemSearch: '',
      activeItemId: null,
      confirmModal: null,
      dragOverItemId: null,
      aiChatOpen: false,
      aiContext: null,
      aiPrompt: '',
      aiLoading: false,
      aiError: null
    })
  }

  getErrorMessage = (error, fallback) => {
    if (error?.message) return error.message
    if (error?.error) return error.error
    return fallback
  }

  notifySaveError = (message) => {
    const now = Date.now()
    if (now - this.lastSaveErrorAt < 3000) return
    this.lastSaveErrorAt = now
    toast.error(message)
  }

  generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  createPage = () => ({
    id: this.generateId('page'),
    height: 96,
    items: []
  })

  createFirstPage = () => ({
    ...this.createPage(),
    items: [this.createItem('Title')]
  })

  createItem = (type, rowId = null) => {
    // Check if this is a Text Block, Lists & Structure, or Learning & Assessment item
    const textBlocks = ['Title', 'Heading', 'Subheading', 'Paragraph', 'Explanation', 'Definition',
      'Example', 'KeyPoint', 'Quote', 'Note', 'Warning', 'Tip', 'Exercise']
    const listsStructure = ['List', 'Table']
    const learningAssessment = ['Question', 'Quiz']
    
    const isStyledItem = textBlocks.includes(type) || listsStructure.includes(type) || learningAssessment.includes(type)
    
    const base = {
      id: this.generateId('item'),
      type,
      rowId: rowId || this.generateId('row'),
      height: null, // Height in pixels for resizable items
      style: isStyledItem ? {
        fontSize: '16px',
        textColor: null,
        backgroundColor: '#151515',
        borderColor: null
      } : {
        fontSize: '',
        textColor: '',
        backgroundColor: '',
        borderColor: ''
      }
    }

    if (type === 'Table') {
      return {
        ...base,
        description: '',
        table: {
          rows: 2,
          cols: 2,
          cells: Array.from({ length: 2 }, () => Array.from({ length: 2 }, () => ''))
        }
      }
    }

    if (type === 'Question') {
      return { ...base, question: '', answer: '', showAnswer: false }
    }

    if (type === 'Answer') {
      return { ...base, content: '', revealed: false }
    }

    if (type === 'Quiz') {
      return { ...base, question: '', options: [], correctAnswer: '', draftOption: '' }
    }

    if (type === 'List') {
      return { ...base, description: '', items: [''], listType: 'disc' }
    }

    if (type === 'MediaAttachment') {
      return {
        id: base.id,
        type: 'MediaAttachment',
        rowId: base.rowId,
        height: null,
        style: null,
        text: { file: null, url: '' }
      }
    }

    return { ...base, content: '' }
  }

  // Convert API format (flat content with index/columnIndex) to internal format (pages with rowId)
  convertApiToInternal = (apiContent) => {
    if (!apiContent || !Array.isArray(apiContent) || apiContent.length === 0) {
      return [this.createFirstPage()]
    }

    const pages = [this.createPage()]
    let currentPage = pages[0]
    const rowMap = {} // Maps index to rowId for items in the same row

    // First pass: identify rows (items with same index but different columnIndex)
    apiContent.forEach((apiItem) => {
      if (apiItem.columnIndex !== null && apiItem.columnIndex !== undefined) {
        if (!rowMap[apiItem.index]) {
          rowMap[apiItem.index] = this.generateId('row')
        }
      }
    })

    apiContent.forEach((apiItem) => {
      // Generate rowId for items in the same row
      let rowId = null
      if (apiItem.columnIndex !== null && apiItem.columnIndex !== undefined) {
        // Items in a row share the same index
        rowId = rowMap[apiItem.index]
      } else {
        // Non-row items get their own rowId
        rowId = this.generateId('row')
      }

      // Convert API item to internal format
      // Check if this is a Text Block, Lists & Structure, or Learning & Assessment item
      const textBlocks = ['Title', 'Heading', 'Subheading', 'Paragraph', 'Explanation', 'Definition',
        'Example', 'KeyPoint', 'Quote', 'Note', 'Warning', 'Tip', 'Exercise']
      const listsStructure = ['List', 'Table']
      const learningAssessment = ['Question', 'Quiz']
      const isStyledItem = textBlocks.includes(apiItem.type) || listsStructure.includes(apiItem.type) || learningAssessment.includes(apiItem.type)
      
      const internalItem = {
        id: this.generateId('item'),
        type: apiItem.type,
        rowId,
        height: apiItem.height || null,
        style: isStyledItem ? {
          fontSize: apiItem.style?.fontSize || '16px',
          textColor: apiItem.style?.color !== undefined ? apiItem.style.color : null,
          backgroundColor: apiItem.style?.backgroundColor || '#151515',
          borderColor: apiItem.style?.borderColor !== undefined ? apiItem.style.borderColor : null
        } : {
          fontSize: apiItem.style?.fontSize || '',
          textColor: apiItem.style?.textColor || '',
          backgroundColor: apiItem.style?.backgroundColor || '',
          borderColor: apiItem.style?.borderColor || ''
        }
      }

      // Handle different item types
      if (apiItem.type === 'Table' && apiItem.text?.columns && apiItem.text?.rows) {
        internalItem.description = apiItem.text.description ?? apiItem['table description'] ?? ''
        internalItem.table = {
          rows: apiItem.text.rows.length,
          cols: apiItem.text.columns.length,
          cells: apiItem.text.rows.map(row => [...row])
        }
        internalItem.content = JSON.stringify(apiItem.text)
      } else if (apiItem.type === 'Dictionary' && apiItem.words && typeof apiItem.words === 'object') {
        const rows = Object.entries(apiItem.words).map(([word, meaning]) => [word, meaning])
        internalItem.type = 'Table'
        internalItem.description = apiItem.text?.description ?? apiItem['table description'] ?? ''
        internalItem.table = {
          rows: Math.max(rows.length, 1),
          cols: 2,
          cells: rows.length ? rows : [['', '']]
        }
        internalItem.content = JSON.stringify({ columns: ['Word', 'Meaning'], rows })
      } else if (apiItem.type === 'Question') {
        internalItem.question = apiItem.question || ''
        internalItem.answer = apiItem.answer || ''
        internalItem.showAnswer = false
      } else if (apiItem.type === 'Quiz' && apiItem.text) {
        internalItem.question = apiItem.text.question || ''
        internalItem.options = apiItem.text.options || []
        internalItem.correctAnswer = apiItem.text.correctAnswer || ''
        internalItem.draftOption = ''
      } else if (apiItem.type === 'List' && Array.isArray(apiItem.text)) {
        internalItem.description = apiItem['list description'] || ''
        internalItem.items = [...apiItem.text]
        internalItem.listType = apiItem.listType || 'disc'
      } else if (apiItem.type === 'OrderedList' && Array.isArray(apiItem.text)) {
        // Legacy: convert old OrderedList to List with listType 123
        internalItem.type = 'List'
        internalItem.description = apiItem['list description'] || ''
        internalItem.items = [...apiItem.text]
        internalItem.listType = apiItem.listType || '123'
      } else if (apiItem.type === 'MediaAttachment') {
        internalItem.style = null
        internalItem.text = {
          file: null,
          url: apiItem.text?.url ?? ''
        }
      } else {
        internalItem.content = apiItem.text || apiItem.content || ''
      }

      currentPage.items.push(internalItem)
    })

    return pages
  }

  // Convert internal format (pages with rowId) to API format (flat content with index/columnIndex)
  convertInternalToApi = (pages) => {
    const apiContent = []
    let globalIndex = 1

    pages.forEach((page) => {
      // Group items by rowId
      const rowGroups = {}
      page.items.forEach((item) => {
        if (!rowGroups[item.rowId]) {
          rowGroups[item.rowId] = []
        }
        rowGroups[item.rowId].push(item)
      })

      // Process items, handling rows
      Object.keys(rowGroups).forEach((rowId) => {
        const rowItems = rowGroups[rowId]
        const isRow = rowItems.length > 1

        rowItems.forEach((item, colIndex) => {
          // Check if this is a Text Block, Lists & Structure, or Learning & Assessment item
          const textBlocks = ['Title', 'Heading', 'Subheading', 'Paragraph', 'Explanation', 'Definition',
            'Example', 'KeyPoint', 'Quote', 'Note', 'Warning', 'Tip', 'Exercise']
          const listsStructure = ['List', 'Table']
          const learningAssessment = ['Question', 'Quiz']
          const isStyledItem = textBlocks.includes(item.type) || listsStructure.includes(item.type) || learningAssessment.includes(item.type)
          
          const apiItem = {
            type: item.type,
            index: globalIndex,
            columnIndex: isRow ? colIndex + 1 : null,
            style: isStyledItem ? {
              fontSize: item.style?.fontSize || '16px',
              color: item.style?.textColor !== null && item.style?.textColor !== '' ? item.style.textColor : null,
              backgroundColor: item.style?.backgroundColor || '#151515',
              borderColor: item.style?.borderColor !== null && item.style?.borderColor !== '' ? item.style.borderColor : null
            } : {
              fontSize: item.style?.fontSize || '',
              textColor: item.style?.textColor || '',
              backgroundColor: item.style?.backgroundColor || '',
              borderColor: item.style?.borderColor || ''
            }
          }

          // Convert item content based on type
          if (item.type === 'Table' && item.table) {
            apiItem.text = {
              description: item.description ?? '',
              columns: Array.from({ length: item.table.cols }, (_, i) => `Column ${i + 1}`),
              rows: item.table.cells
            }
          } else if (item.type === 'Question') {
            apiItem.question = item.question || ''
            apiItem.answer = item.answer || ''
          } else if (item.type === 'Quiz') {
            apiItem.text = {
              question: item.question || '',
              options: item.options || [],
              correctAnswer: item.correctAnswer ?? (item.options?.[0] || '')
            }
          } else if (item.type === 'List') {
            apiItem.type = 'List'
            apiItem.listType = item.listType || 'disc'
            apiItem['list description'] = item.description || null
            apiItem.text = item.items || []
          } else if (item.type === 'MediaAttachment') {
            apiItem.style = null
            apiItem.text = {
              file: null,
              url: item.text?.url ?? ''
            }
          } else {
            apiItem.text = item.content || ''
          }

          apiContent.push(apiItem)
        })

        // Only increment global index once per row
        globalIndex++
      })
    })

    return apiContent
  }

  // Load lesson content from API
  loadLessonContent = async () => {
    if (!this.props.classId || !this.props.lessonId) return
    this.setState({ lessonLoading: true })

    try {
      const result = await getLessonContent(this.props.classId, this.props.lessonId)
      if (result.success && result.data) {
        const pages = this.convertApiToInternal(result.data.content || [])
        this.setState({ pages })
      } else {
        toast.error('Failed to load lesson content')
      }
    } catch (error) {
      console.error('Failed to load lesson content:', error)
      toast.error(this.getErrorMessage(error, 'Failed to load lesson content'))
    } finally {
      this.setState({ lessonLoading: false })
    }
  }

  // Save lesson content to API
  saveLessonContent = async () => {
    if (!this.props.classId || !this.props.lessonId) return

    try {
      const apiContent = this.convertInternalToApi(this.state.pages)
      const result = await updateLessonContent(this.props.classId, this.props.lessonId, apiContent)
      if (!result?.success) {
        this.notifySaveError('Failed to save lesson content')
      }
    } catch (error) {
      console.error('Failed to save lesson content:', error)
      this.notifySaveError(this.getErrorMessage(error, 'Failed to save lesson content'))
    }
  }

  // Debounced save function
  debouncedSave = () => {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(() => {
      if (this.props.classId && this.props.lessonId && this.props.editMode) {
        this.saveLessonContent()
      }
    }, 1000) // Save 1 second after last change
  }

  clonePages = (pages) => JSON.parse(JSON.stringify(pages))

  findItemLocation = (pages, itemId) => {
    for (let p = 0; p < pages.length; p += 1) {
      const page = pages[p]
      const directIndex = page.items.findIndex(item => item.id === itemId)
      if (directIndex !== -1) {
        return {
          pageId: page.id,
          containerType: 'page',
          index: directIndex,
          columnItemId: null,
          columnId: null
        }
      }
    }
    return null
  }

  getContainerItemsByContext = (pages, context) => {
    const page = pages.find(p => p.id === context.pageId)
    if (!page) return null
    return page.items
  }

  getContainerItemsByLocation = (pages, location) => {
    return this.getContainerItemsByContext(pages, {
      pageId: location.pageId,
      columnItemId: location.columnItemId,
      columnId: location.columnId
    })
  }

  isSameContainer = (a, b) => (
    a.pageId === b.pageId &&
    a.containerType === b.containerType &&
    a.columnItemId === b.columnItemId &&
    a.columnId === b.columnId
  )

  handleAddPageAt = (insertIndex) => {
    this.setState(prevState => {
      const pages = [...prevState.pages]
      const newPage = this.createPage()
      pages.splice(insertIndex, 0, newPage)
      this.debouncedSave()
      return { pages }
    })
  }

  handlePageHeightChange = (pageId, delta) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const page = pages.find(p => p.id === pageId)
      if (!page) return null
      page.height = Math.max(96, page.height + delta)
      this.debouncedSave()
      return { pages, openPageSettingsId: null }
    })
  }

  handleMovePage = (pageId, position) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const index = pages.findIndex(p => p.id === pageId)
      if (index === -1) return null
      const [page] = pages.splice(index, 1)
      if (position === 'top') pages.unshift(page)
      if (position === 'bottom') pages.push(page)
      this.debouncedSave()
      return { pages, openPageSettingsId: null }
    })
  }

  handleRequestDeletePage = (pageId) => {
    this.setState({
      confirmModal: {
        type: 'delete-page',
        pageId,
        title: 'Delete Page',
        message: 'Are you sure you want to delete this page?'
      },
      openPageSettingsId: null
    })
  }

  handleDeletePage = (pageId) => {
    this.setState(prevState => {
      const pages = prevState.pages.filter((page, index) => page.id !== pageId || index === 0)
      this.debouncedSave()
      return {
        pages,
        confirmModal: null,
        openPageSettingsId: null
      }
    })
  }

  getFilteredItems = () => {
    const query = (this.state.itemSearch || '').trim().toLowerCase()
    if (!query) return ALL_ITEMS
    return ALL_ITEMS.filter(item => item.toLowerCase().includes(query))
  }

  handleOpenItemPicker = (context, index, sourceItemId = null) => {
    this.setState({
      itemPicker: { ...context, index, sourceItemId: sourceItemId || undefined },
      itemSearch: ''
    })
  }

  handleEditorKeyDown = (e) => {
    if (!this.props.editMode || this.state.confirmModal) return
    const root = this.lessonEditorRef.current
    if (!root || !root.contains(e.target)) return
    if (e.target.closest('.le-add-item-input') || e.target.closest('.le-item-picker-dropdown') || e.target.closest('.le-item-picker-outer')) return

    const { pages, activeItemId } = this.state

    if (e.key === 'Enter') {
      if (e.altKey) {
        e.preventDefault()
        if (activeItemId) {
          const location = this.findItemLocation(pages, activeItemId)
          if (location) {
            const items = this.getContainerItemsByLocation(pages, location)
            const item = items[location.index]
            const rowId = item.rowId
            const rowItems = items.filter(i => i.rowId === rowId)
            if (rowItems.length > 0) {
              const lastInRow = rowItems[rowItems.length - 1]
              this.handleAddColumnItem(lastInRow.id, rowId)
            }
          }
        }
        return
      }
      if (e.ctrlKey) {
        e.preventDefault()
        if (activeItemId) {
          const location = this.findItemLocation(pages, activeItemId)
          if (location) {
            const pageIndex = pages.findIndex(p => p.id === location.pageId)
            if (pageIndex !== -1) this.handleAddPageAt(pageIndex + 1)
          }
        } else {
          this.handleAddPageAt(0)
        }
        return
      }
      const now = Date.now()
      if (now - this.lastEnterTime < this.DOUBLE_ENTER_MS) {
        e.preventDefault()
        this.lastEnterTime = 0
        if (activeItemId) {
          const location = this.findItemLocation(pages, activeItemId)
          if (location) {
            const context = { pageId: location.pageId, columnItemId: null, columnId: null }
            this.handleOpenItemPicker(context, location.index + 1)
          }
        } else {
          const firstPage = pages[0]
          if (firstPage) this.handleOpenItemPicker({ pageId: firstPage.id, columnItemId: null, columnId: null }, 0)
        }
        return
      }
      this.lastEnterTime = now
    }
  }

  handleAddItem = (type) => {
    const { itemPicker } = this.state
    if (!itemPicker) return

    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const containerItems = this.getContainerItemsByContext(pages, itemPicker)
      if (!containerItems) return null

      // If adding to a row (rowId specified), use that rowId, otherwise create new row
      const rowId = itemPicker.rowId || null
      const newItem = this.createItem(type, rowId)
      
      // If adding to a row, insert after the last item in that row
      if (rowId && itemPicker.index === -1) {
        let insertIndex = containerItems.length
        for (let i = containerItems.length - 1; i >= 0; i--) {
          if (containerItems[i].rowId === rowId) {
            insertIndex = i + 1
            break
          }
        }
        containerItems.splice(insertIndex, 0, newItem)
      } else {
        const insertIndex = Math.min(Math.max(itemPicker.index, 0), containerItems.length)
        containerItems.splice(insertIndex, 0, newItem)
      }

      this.debouncedSave()

      return {
        pages,
        itemPicker: null,
        itemSearch: '',
        activeItemId: newItem.id,
        focusItemId: newItem.id
      }
    })
  }

  handleAddColumnItem = (itemId, rowId) => {
    const pages = this.state.pages
    let pageId = null
    for (let p = 0; p < pages.length; p++) {
      if (pages[p].items.some(i => i.id === itemId)) {
        pageId = pages[p].id
        break
      }
    }
    
    this.setState({
      itemPicker: {
        pageId: pageId,
        index: -1, // Special index for row addition
        rowId: rowId,
        itemId: itemId // Track which item's button was clicked
      },
      itemSearch: ''
    })
  }

  handleRequestDeleteItem = (itemId) => {
    this.setState({
      confirmModal: {
        type: 'delete-item',
        itemId,
        title: 'Delete Item',
        message: 'Are you sure you want to delete this item?'
      }
    })
  }

  handleDeleteItem = (itemId) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      items.splice(location.index, 1)
      this.debouncedSave()
      return { pages, confirmModal: null }
    })
  }

  handleItemActivation = (itemId) => {
    if (!this.props.editMode) return
    this.setState({ activeItemId: itemId })
  }

  handleItemStyleChange = (itemId, field, value) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      items[location.index].style[field] = value
      this.debouncedSave()
      return { pages }
    })
  }

  handleItemTextChange = (itemId, value, field = 'content') => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      items[location.index][field] = value
      this.debouncedSave()
      return { pages }
    })
  }

  handleQuizOptionChange = (itemId, value) => {
    this.handleItemTextChange(itemId, value, 'draftOption')
  }

  handleQuizOptionEdit = (itemId, index, value) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      if (!item.options || !item.options[index]) return null
      const oldText = item.options[index]
      item.options[index] = value
      if (item.correctAnswer === oldText) {
        item.correctAnswer = value
      }
      this.debouncedSave()
      return { pages }
    })
  }

  handleQuizSetCorrectAnswer = (itemId, optionIndex) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      if (!item.options || item.options[optionIndex] === undefined) return null
      item.correctAnswer = item.options[optionIndex]
      this.debouncedSave()
      return { pages }
    })
  }

  handleAddQuizOption = (itemId) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      if (!item.options) item.options = []
      item.options.push('')
      this.debouncedSave()
      return { pages }
    })
  }

  handleQuizSelectOption = (itemId, optionText) => {
    this.setState(prevState => ({
      quizSelections: { ...prevState.quizSelections, [itemId]: optionText }
    }))
  }

  handleCancelQuizOption = (itemId) => {
    this.handleItemTextChange(itemId, '', 'draftOption')
  }

  handleTableCellChange = (itemId, rowIndex, colIndex, value) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      items[location.index].table.cells[rowIndex][colIndex] = value
      return { pages }
    })
  }

  handleTableAddRow = (itemId) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const table = items[location.index].table
      table.rows += 1
      table.cells.push(Array.from({ length: table.cols }, () => ''))
      return { pages }
    })
  }

  handleTableAddColumn = (itemId) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const table = items[location.index].table
      table.cols += 1
      table.cells.forEach(row => row.push(''))
      return { pages }
    })
  }

  handleToggleAnswer = (itemId, field) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      items[location.index][field] = !items[location.index][field]
      return { pages }
    })
  }

  // Sanitize URL: block javascript: and other dangerous protocols
  sanitizeMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return ''
    const trimmed = url.trim().toLowerCase()
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') && trimmed.includes('javascript')) return ''
    if (trimmed.startsWith('vbscript:') || trimmed.startsWith('file:')) return ''
    return url.trim()
  }

  // Detect media type from URL (extension or data URL MIME)
  getMediaTypeFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null
    const s = url.trim()
    if (s.startsWith('data:')) {
      const mimeMatch = s.match(/^data:([^;,]+)/)
      const mime = (mimeMatch ? mimeMatch[1] : '').toLowerCase()
      if (mime.startsWith('image/')) return 'image'
      if (mime.startsWith('video/')) return 'video'
      if (mime.startsWith('audio/')) return 'audio'
      return null
    }
    const path = s.split('?')[0]
    const ext = (path.split('.').pop() || '').toLowerCase()
    if (MEDIA_IMAGE_EXT.includes(ext)) return 'image'
    if (MEDIA_VIDEO_EXT.includes(ext)) return 'video'
    if (MEDIA_AUDIO_EXT.includes(ext)) return 'audio'
    return null
  }

  // Detect media type from File (MIME)
  getMediaTypeFromFile = (file) => {
    if (!file || !file.type) return null
    const mime = (file.type || '').toLowerCase()
    if (MEDIA_IMAGE_MIME.some(m => mime.startsWith(m.split('/')[0]) || mime === m)) return 'image'
    if (MEDIA_VIDEO_MIME.some(m => mime.startsWith('video/'))) return 'video'
    if (MEDIA_AUDIO_MIME.some(m => mime.startsWith('audio/'))) return 'audio'
    const ext = (file.name || '').split('.').pop().toLowerCase()
    if (MEDIA_IMAGE_EXT.includes(ext)) return 'image'
    if (MEDIA_VIDEO_EXT.includes(ext)) return 'video'
    if (MEDIA_AUDIO_EXT.includes(ext)) return 'audio'
    return null
  }

  handleMediaAttachmentUrl = (itemId, url) => {
    const sanitized = this.sanitizeMediaUrl(url)
    this.handleItemMediaAttachmentChange(itemId, { url: sanitized, file: null })
  }

  handleMediaAttachmentFile = (itemId, file) => {
    if (!file) return
    if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
      return // Optional: show message "File too large"
    }
    const type = this.getMediaTypeFromFile(file)
    if (!type) return // Unsupported format
    const reader = new FileReader()
    reader.onload = () => {
      this.handleItemMediaAttachmentChange(itemId, { url: reader.result, file: null })
    }
    reader.readAsDataURL(file)
  }

  handleItemMediaAttachmentChange = (itemId, payload) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      if (item.type !== 'MediaAttachment' || !item.text) return null
      item.text = { file: null, url: payload.url ?? item.text.url }
      this.debouncedSave()
      return { pages }
    })
  }

  // Render <img>, <video controls>, or <audio controls> by media type
  renderMediaElement = (url, mediaType) => {
    if (mediaType === 'image') {
      return <img src={url} alt="" className="le-media-img" />
    }
    if (mediaType === 'video') {
      return <video src={url} controls className="le-media-video" />
    }
    if (mediaType === 'audio') {
      return <audio src={url} controls className="le-media-audio" />
    }
    return null
  }

  handleListTypeChange = (itemId, listType) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      if (item.type !== 'List') return null
      item.listType = listType
      this.debouncedSave()
      return { pages }
    })
  }

  handleListItemChange = (itemId, index, value) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      if (!item.items) item.items = ['']
      item.items[index] = value
      return { pages }
    })
  }

  handleAddListItem = (itemId) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      if (!item.items) item.items = ['']
      item.items.push('')
      return { pages }
    }, () => {
      // Focus the newly added input
      const pages = this.state.pages
      const location = this.findItemLocation(pages, itemId)
      if (!location) return
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      const newIndex = (item.items || []).length - 1
      const inputRef = this.listItemInputRefs?.[`${itemId}-${newIndex}`]
      if (inputRef) {
        setTimeout(() => inputRef.focus(), 0)
      }
    })
  }

  handleListEnterKey = (itemId, currentIndex) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      if (!item.items) item.items = ['']
      
      // If we're at the last item, add a new one after it
      if (currentIndex === item.items.length - 1) {
        item.items.push('')
      }
      // Otherwise, just move to next (don't create new)
      
      return { pages }
    }, () => {
      // Focus the next input
      const pages = this.state.pages
      const location = this.findItemLocation(pages, itemId)
      if (!location) return
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      const nextIndex = Math.min(currentIndex + 1, (item.items || []).length - 1)
      const inputRef = this.listItemInputRefs?.[`${itemId}-${nextIndex}`]
      if (inputRef) {
        setTimeout(() => inputRef.focus(), 0)
      }
    })
  }

  handleDragStart = (e, itemId) => {
    if (!this.props.editMode) return
    this.dragItem = { itemId }
    this.setState({ isDragging: true })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', itemId)
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-le-item="${itemId}"]`)
      if (el) el.classList.add('dragging')
    })
  }

  handleDragEnd = () => {
    document.querySelectorAll('.le-item.dragging').forEach(el => el.classList.remove('dragging'))
    this.setState({ dragOverItemId: null, isDragging: false })
    this.dragItem = null
  }

  handleDragOverItem = (e, itemId) => {
    if (!this.props.editMode) return
    e.preventDefault()
    e.stopPropagation()
    this.setState({ dragOverItemId: itemId })
  }

  handleDropOnItem = (e, targetItemId) => {
    if (!this.props.editMode) return
    e.preventDefault()
    e.stopPropagation()
    if (!this.dragItem) return

    const dragItemId = this.dragItem.itemId
    this.dragItem = null

    this.setState(prevState => {
      try {
        const pages = this.clonePages(prevState.pages)
        const sourceLoc = this.findItemLocation(pages, dragItemId)
        const targetLoc = this.findItemLocation(pages, targetItemId)
        if (!sourceLoc || !targetLoc) return { isDragging: false }

        const sourceItems = this.getContainerItemsByLocation(pages, sourceLoc)
        const [moved] = sourceItems.splice(sourceLoc.index, 1)

        // When dropping on an item, always assign new rowId (place outside any row)
        moved.rowId = this.generateId('row')

        // Keep target index stable when reordering within the same container.
        let insertIndex = targetLoc.index
        if (this.isSameContainer(sourceLoc, targetLoc) && sourceLoc.index < targetLoc.index) {
          insertIndex = targetLoc.index - 1
        }

        const targetItems = this.getContainerItemsByLocation(pages, targetLoc)
        targetItems.splice(insertIndex, 0, moved)

        this.debouncedSave()
        return { pages, dragOverItemId: null, isDragging: false }
      } catch (error) {
        console.error('Error in handleDropOnItem:', error)
        toast.error('Failed to move item')
        return { isDragging: false }
      }
    })
  }

  handleDropOnAddItem = (e, context, index) => {
    if (!this.props.editMode) return
    e.preventDefault()
    e.stopPropagation()
    if (!this.dragItem) return

    const dragItemId = this.dragItem.itemId
    this.dragItem = null

    this.setState(prevState => {
      try {
        const pages = this.clonePages(prevState.pages)
        const sourceLoc = this.findItemLocation(pages, dragItemId)
        if (!sourceLoc) return { isDragging: false }
        const sourceItems = this.getContainerItemsByLocation(pages, sourceLoc)
        const [moved] = sourceItems.splice(sourceLoc.index, 1)

        const targetItems = this.getContainerItemsByContext(pages, context)
        if (!targetItems) return { isDragging: false }

        // If dropping on regular "Add Item" button (not in a row), assign new rowId
        moved.rowId = this.generateId('row')

        let insertIndex = index
        const targetLoc = {
          pageId: context.pageId,
          containerType: context.columnItemId ? 'column' : 'page',
          columnItemId: context.columnItemId || null,
          columnId: context.columnId || null,
          index
        }

        if (this.isSameContainer(sourceLoc, targetLoc) && sourceLoc.index < index) {
          insertIndex = index - 1
        }

        targetItems.splice(Math.max(0, Math.min(insertIndex, targetItems.length)), 0, moved)
        this.debouncedSave()
        return { pages, dragOverItemId: null, isDragging: false }
      } catch (error) {
        console.error('Error in handleDropOnAddItem:', error)
        toast.error('Failed to move item')
        return { isDragging: false }
      }
    })
  }

  handleDropOnColumnButton = (e, rowId) => {
    if (!this.props.editMode) return
    e.preventDefault()
    e.stopPropagation()
    if (!this.dragItem) return

    const dragItemId = this.dragItem.itemId
    this.dragItem = null

    this.setState(prevState => {
      try {
        const pages = this.clonePages(prevState.pages)
        const sourceLoc = this.findItemLocation(pages, dragItemId)
        if (!sourceLoc) return { isDragging: false }

        // Find the page containing this row
        let targetPage = null
        let targetItems = null
        for (let p = 0; p < pages.length; p++) {
          const page = pages[p]
          const itemInRow = page.items.find(item => item.rowId === rowId)
          if (itemInRow) {
            targetPage = page
            targetItems = page.items
            break
          }
        }

        if (!targetItems) return { isDragging: false }

        const sourceItems = this.getContainerItemsByLocation(pages, sourceLoc)
        const [moved] = sourceItems.splice(sourceLoc.index, 1)

        // Assign the row's rowId to the moved item
        moved.rowId = rowId

        // Insert at the end of items with this rowId
        let insertIndex = targetItems.length
        for (let i = targetItems.length - 1; i >= 0; i--) {
          if (targetItems[i].rowId === rowId) {
            insertIndex = i + 1
            break
          }
        }

        targetItems.splice(insertIndex, 0, moved)
        this.debouncedSave()
        return { pages, dragOverItemId: null, isDragging: false }
      } catch (error) {
        console.error('Error in handleDropOnColumnButton:', error)
        toast.error('Failed to move item')
        return { isDragging: false }
      }
    })
  }

  handleDragOverColumnButton = (e) => {
    if (!this.props.editMode) return
    e.preventDefault()
    e.stopPropagation()
  }

  handleDropOnPage = (e, pageId) => {
    if (!this.props.editMode) return
    e.preventDefault()
    e.stopPropagation()
    if (!this.dragItem) return

    const dragItemId = this.dragItem.itemId
    this.dragItem = null

    this.setState(prevState => {
      try {
        const pages = this.clonePages(prevState.pages)
        const sourceLoc = this.findItemLocation(pages, dragItemId)
        if (!sourceLoc) return { isDragging: false }

        const sourceItems = this.getContainerItemsByLocation(pages, sourceLoc)
        const [moved] = sourceItems.splice(sourceLoc.index, 1)

        // When dropping on page (outside a row), assign new rowId
        moved.rowId = this.generateId('row')

        const targetItems = this.getContainerItemsByContext(pages, {
          pageId,
          columnItemId: null,
          columnId: null
        })
        if (!targetItems) return { isDragging: false }
        targetItems.push(moved)

        this.debouncedSave()
        return { pages, dragOverItemId: null, isDragging: false }
      } catch (error) {
        console.error('Error in handleDropOnPage:', error)
        toast.error('Failed to move item')
        return { isDragging: false }
      }
    })
  }

  handleSendToAI = (itemId) => {
    const { pages } = this.state
    const location = this.findItemLocation(pages, itemId)
    if (!location) return
    const items = this.getContainerItemsByLocation(pages, location)
    const item = items[location.index]

    const content = item.content || item.question || ''
    this.setState({
      aiChatOpen: true,
      aiContext: {
        id: item.id,
        index: location.index,
        type: item.type,
        content
      }
    })
  }

  buildAiPrompt = () => {
    const { aiPrompt, aiContext } = this.state
    const basePrompt = aiPrompt.trim()
    if (!aiContext) return basePrompt
    const contextLines = [
      'Context:',
      `Type: ${aiContext.type}`,
      `Content: ${aiContext.content || ''}`
    ]
    return `${basePrompt}\n\n${contextLines.join('\n')}`.trim()
  }

  handleGenerateLesson = async () => {
    if (!this.props.lessonId || !this.props.classId) return
    const prompt = this.buildAiPrompt()
    if (!prompt) return

    this.setState({ aiLoading: true, aiError: null })
    try {
      const result = await generateLessonContent(this.props.lessonId, prompt)
      const payload = result?.data?.data || result?.data || {}
      const content = payload.content || []
      const pages = this.convertApiToInternal(content)
      this.setState({ pages, aiLoading: false })
    } catch (error) {
      this.setState({ aiLoading: false, aiError: this.getErrorMessage(error, 'AI request failed.') })
    }
  }

  getItemStyle = (item) => {
    const style = {}
    if (item.style?.fontSize) {
      // Handle both "16px" format and number format
      style.fontSize = typeof item.style.fontSize === 'string' && item.style.fontSize.includes('px') 
        ? item.style.fontSize 
        : `${item.style.fontSize}px`
    }
    if (item.style?.textColor !== null && item.style?.textColor !== '') {
      style.color = item.style.textColor
    }
    if (item.style?.backgroundColor !== null && item.style?.backgroundColor !== '') {
      style.backgroundColor = item.style.backgroundColor
    }
    if (item.style?.borderColor !== null && item.style?.borderColor !== '') {
      style.borderColor = item.style.borderColor
    }
    return style
  }

  renderColorPicker = (item, field) => {
    // For null values, use a default color for the picker display
    // backgroundColor defaults to #151515, others default to #000000
    const defaultValue = field === 'backgroundColor' ? '#151515' : '#000000'
    const value = item.style?.[field] !== null && item.style?.[field] !== '' 
      ? item.style[field] 
      : defaultValue
    
    return (
      <div className="le-color-picker-wrapper">
        <input
          type="color"
          className="le-color-picker"
          value={value}
          onChange={(e) => {
            e.stopPropagation()
            const newValue = e.target.value
            // If setting to default and field allows null, set to null
            // Otherwise, set the actual value
            if (field === 'textColor' || field === 'borderColor') {
              // Allow null for textColor and borderColor
              this.handleItemStyleChange(item.id, field, newValue === defaultValue ? null : newValue)
            } else {
              // backgroundColor always has a value (defaults to #151515)
              this.handleItemStyleChange(item.id, field, newValue)
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )
  }

  renderMediaAttachmentToolbar = (item) => (
    <div className="le-item-toolbar le-media-toolbar" onClick={(e) => e.stopPropagation()}>
      <div className="le-media-toolbar-row">
        <label className="le-toolbar-file-label">
          <input
            type="file"
            accept="image/*,video/*,audio/*,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif,.mp4,.webm,.ogg,.mov,.m4v,.mp3,.wav,.aac,.m4a"
            className="le-toolbar-file-input"
            onChange={(e) => {
              const file = e.target.files && e.target.files[0]
              if (file) this.handleMediaAttachmentFile(item.id, file)
              e.target.value = ''
            }}
          />
          <span className="le-toolbar-file-btn" title="Upload file">
            <IconAttachment size={18} />
          </span>
        </label>
        <input
          type="text"
          className="glass-input le-media-link-input"
          placeholder="Link of the media"
          value={item.text?.url || ''}
          onChange={(e) => this.handleMediaAttachmentUrl(item.id, e.target.value)}
        />
      </div>
      <button
        className="glass-button le-toolbar-btn"
        onClick={(e) => {
          e.stopPropagation()
          this.setState({ activeItemId: null })
        }}
      >
        Done
      </button>
    </div>
  )

  renderItemToolbar = (item) => {
    if (item.type === 'MediaAttachment') {
      return this.renderMediaAttachmentToolbar(item)
    }
    return (
    <div className="le-item-toolbar" onClick={(e) => e.stopPropagation()}>
      <div className="le-toolbar-group">
        <label className="le-toolbar-label">Size</label>
          <input
            type="number"
            min="12"
            max="48"
            value={item.style?.fontSize ? (typeof item.style.fontSize === 'string' ? parseInt(item.style.fontSize) : item.style.fontSize) : 16}
            onChange={(e) => {
              const numValue = parseInt(e.target.value) || 16
              this.handleItemStyleChange(item.id, 'fontSize', `${numValue}px`)
            }}
            className="glass-input le-toolbar-input"
          />
      </div>
      <div className="le-toolbar-group">
        <label className="le-toolbar-label">Text</label>
        {this.renderColorPicker(item, 'textColor')}
      </div>
      <div className="le-toolbar-group">
        <label className="le-toolbar-label">Bg</label>
        {this.renderColorPicker(item, 'backgroundColor')}
      </div>
      <div className="le-toolbar-group">
        <label className="le-toolbar-label">Border</label>
        {this.renderColorPicker(item, 'borderColor')}
      </div>
      <button
        className="glass-button le-toolbar-btn ai"
        onClick={(e) => {
          e.stopPropagation()
          this.handleSendToAI(item.id)
        }}
        title="Send to AI"
      >
        <IconAiChat size={10} />
      </button>
      <button
        className="glass-button le-toolbar-btn"
        onClick={(e) => {
          e.stopPropagation()
          // Save any pending content before closing toolbar
          const activeElement = document.querySelector(`[data-le-item="${item.id}"] .le-text-item.editable`)
          if (activeElement && document.activeElement === activeElement) {
            const newContent = activeElement.innerText || ''
            if (newContent !== item.content) {
              this.handleItemTextChange(item.id, newContent)
            }
            // Blur the element to trigger onBlur and ensure content is saved
            activeElement.blur()
          }
          // Clear any pending timeout
          if (this.textInputTimeout) {
            clearTimeout(this.textInputTimeout)
            this.textInputTimeout = null
          }
          // Force rerender by updating state
          this.setState({ activeItemId: null })
          
          // Force update contentEditable after state update
          setTimeout(() => {
            const el = this.contentEditableRefs[item.id]
            if (el && document.activeElement !== el) {
              const location = this.findItemLocation(this.state.pages, item.id)
              if (location) {
                const items = this.getContainerItemsByLocation(this.state.pages, location)
                const updatedItem = items[location.index]
                if (updatedItem && el.textContent !== updatedItem.content) {
                  el.textContent = updatedItem.content || ''
                }
              }
            }
          }, 0)
        }}
      >
        Done
      </button>
    </div>
    )
  }

  handleItemResize = (itemId, startY, startHeight) => {
    const handleMouseMove = (e) => {
      const deltaY = e.clientY - startY
      const newHeight = Math.max(20, startHeight + deltaY) // Minimum 20px height
      
      this.setState(prevState => {
        const pages = this.clonePages(prevState.pages)
        const location = this.findItemLocation(pages, itemId)
        if (!location) return null
        const items = this.getContainerItemsByLocation(pages, location)
        items[location.index].height = newHeight
        return { pages }
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      this.debouncedSave()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  handleInputResize = (itemId, inputKey, startY, startHeight, inputElement) => {
    const handleMouseMove = (e) => {
      const deltaY = e.clientY - startY
      const newHeight = Math.max(20, startHeight + deltaY) // Minimum 20px height
      
      // Update the input element directly
      if (inputElement) {
        inputElement.style.height = `${newHeight}px`
        inputElement.style.minHeight = `${newHeight}px`
      }
      
      // Store height in item state
      this.setState(prevState => {
        const pages = this.clonePages(prevState.pages)
        const location = this.findItemLocation(pages, itemId)
        if (!location) return null
        const items = this.getContainerItemsByLocation(pages, location)
        if (!items[location.index].inputHeights) {
          items[location.index].inputHeights = {}
        }
        items[location.index].inputHeights[inputKey] = newHeight
        return { pages }
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      this.debouncedSave()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  renderTextItem = (item, editMode, className, placeholder) => {
    const style = {}
    if (item.style?.fontSize) {
      // Handle both "16px" format and number format
      style.fontSize = typeof item.style.fontSize === 'string' && item.style.fontSize.includes('px') 
        ? item.style.fontSize 
        : `${item.style.fontSize}px`
    }
    if (item.style?.textColor !== null && item.style?.textColor !== '') {
      style.color = item.style.textColor
    }
    if (item.style?.backgroundColor !== null && item.style?.backgroundColor !== '') {
      style.backgroundColor = item.style.backgroundColor
    }
    if (item.style?.borderColor !== null && item.style?.borderColor !== '') {
      style.borderColor = item.style.borderColor
    }
    if (item.height) style.minHeight = `${item.height}px`
    
    // Store ref and set initial content
    const textItemRef = (el) => {
      if (el) {
        this.contentEditableRefs[item.id] = el
        // Set initial content only if element is not focused
        if (document.activeElement !== el) {
          el.textContent = item.content || ''
        }
      } else {
        delete this.contentEditableRefs[item.id]
      }
    }
    
    return (
      <div
        key={item.id}
        className={`le-text-item ${className} ${editMode ? 'editable resizable' : ''}`}
        style={style}
        contentEditable={editMode}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        ref={textItemRef}
        onInput={(e) => {
          const newContent = e.currentTarget.innerText
          // Update state immediately but don't let React control the content
          if (newContent !== item.content) {
            this.handleItemTextChange(item.id, newContent)
          }
        }}
        onBlur={(e) => {
          const newContent = e.currentTarget.innerText
          if (newContent !== item.content) {
            this.handleItemTextChange(item.id, newContent)
          }
        }}
      >
        {editMode && (
          <button
            className="le-text-resize-handle"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const element = e.currentTarget.parentElement
              const currentHeight = item.height || element.offsetHeight
              this.handleItemResize(item.id, e.clientY, currentHeight)
            }}
          >
            <IconResize size={14} />
          </button>
        )}
      </div>
    )
  }

  renderItemContent = (item, editMode) => {
    // Helper to get content styles (textColor and fontSize for content elements)
    const getContentStyle = () => {
      const style = {}
      if (item.style?.textColor !== null && item.style?.textColor !== '') {
        style.color = item.style.textColor
      }
      if (item.style?.fontSize) {
        // Handle both "16px" format and number format
        style.fontSize = typeof item.style.fontSize === 'string' && item.style.fontSize.includes('px') 
          ? item.style.fontSize 
          : `${item.style.fontSize}px`
      }
      return style
    }

    if (item.type === 'MediaAttachment') {
      const url = item.text?.url || ''
      const mediaType = url ? this.getMediaTypeFromUrl(url) : null
      if (editMode) {
        return (
          <div className="le-media-attachment-editor">
            <div className="le-media-toolbar-row">
              <label className="le-toolbar-file-label">
                <input
                  type="file"
                  accept="image/*,video/*,audio/*,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif,.mp4,.webm,.ogg,.mov,.m4v,.mp3,.wav,.aac,.m4a"
                  className="le-toolbar-file-input"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0]
                    if (file) this.handleMediaAttachmentFile(item.id, file)
                    e.target.value = ''
                  }}
                />
                <span className="le-toolbar-file-btn" title="Upload file">
                  <IconAttachment size={18} />
                </span>
              </label>
              <input
                type="text"
                className="glass-input le-media-link-input"
                placeholder="Link of the media"
                value={url}
                onChange={(e) => this.handleMediaAttachmentUrl(item.id, e.target.value)}
              />
            </div>
            {url && mediaType && (
              <div className="le-media-preview">
                {this.renderMediaElement(url, mediaType)}
              </div>
            )}
            {url && !mediaType && (
              <div className="le-media-unsupported">
                File isn&apos;t supported. <a href={url} target="_blank" rel="noopener noreferrer" className="le-media-download">Download Attachment</a>
              </div>
            )}
          </div>
        )
      }
      // View mode: render media or fallback
      if (!url) {
        return <div className="le-media-placeholder">No media</div>
      }
      if (mediaType) {
        return (
          <div className="le-media-view">
            {this.renderMediaElement(url, mediaType)}
          </div>
        )
      }
      return (
        <div className="le-media-unsupported">
          File isn&apos;t supported. <a href={url} target="_blank" rel="noopener noreferrer" className="le-media-download">Download Attachment</a>
        </div>
      )
    }

    if (['Title', 'Heading', 'Subheading', 'Paragraph', 'Explanation', 'Definition', 'Example',
      'KeyPoint', 'Quote', 'Note', 'Warning', 'Tip', 'Exercise'].includes(item.type)) {
      const classMap = {
        Title: 'le-item-title',
        Heading: 'le-item-heading',
        Subheading: 'le-item-subheading',
        Paragraph: 'le-item-paragraph',
        Explanation: 'le-item-explanation',
        Definition: 'le-item-definition',
        Example: 'le-item-example',
        KeyPoint: 'le-item-keypoint',
        Quote: 'le-item-quote',
        Note: 'le-item-note',
        Warning: 'le-item-warning',
        Tip: 'le-item-tip',
        Exercise: 'le-item-exercise'
      }
      return this.renderTextItem(item, editMode, classMap[item.type], item.type)
    }

    if (item.type === 'List') {
      const contentStyle = getContentStyle()
      const containerStyle = {}
      if (item.height) containerStyle.minHeight = `${item.height}px`
      const listType = item.listType || 'disc'

      const listContent = editMode ? (
        <div className="le-list-editor">
          {/* Row 1: Type dropdown (Disc, 123, ABC) + List description */}
          <div className="le-list-row-first">
            <select
              className="glass-input le-list-type-dropdown"
              value={listType}
              onChange={(e) => this.handleListTypeChange(item.id, e.target.value)}
              style={contentStyle}
            >
              <option value="disc"> • Disc</option>
              <option value="123">123</option>
              <option value="ABC">ABC</option>
            </select>
            <div className="le-resizable-input-wrapper le-list-description-wrap">
              <input
                type="text"
                className="glass-input le-list-description le-resizable-input"
                placeholder="List description"
                value={item.description || ''}
                onChange={(e) => this.handleItemTextChange(item.id, e.target.value, 'description')}
                style={{
                  ...contentStyle,
                  height: item.inputHeights?.description ? `${item.inputHeights.description}px` : 'auto',
                  minHeight: item.inputHeights?.description ? `${item.inputHeights.description}px` : 'auto'
                }}
              />
              <button
                className="le-input-resize-handle"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const inputEl = e.currentTarget.previousElementSibling
                  const currentHeight = item.inputHeights?.description || inputEl.offsetHeight
                  this.handleInputResize(item.id, 'description', e.clientY, currentHeight, inputEl)
                }}
              >
                <IconResize size={12} />
              </button>
            </div>
          </div>
          {/* Row 2+: Item rows */}
          <div className="le-list-items">
            {(item.items || ['']).map((listItem, index) => (
              <div key={`${item.id}-item-${index}`} className="le-list-item-row">
                <div className="le-resizable-input-wrapper">
                  <input
                    type="text"
                    className="glass-input le-list-item-input le-resizable-input"
                    placeholder={`Item ${index + 1}`}
                    value={listItem}
                    onChange={(e) => this.handleListItemChange(item.id, index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        this.handleListEnterKey(item.id, index)
                      }
                    }}
                    ref={(el) => {
                      if (el) {
                        this.listItemInputRefs = this.listItemInputRefs || {}
                        this.listItemInputRefs[`${item.id}-${index}`] = el
                      }
                    }}
                    style={{
                      ...contentStyle,
                      height: item.inputHeights?.[`item-${index}`] ? `${item.inputHeights[`item-${index}`]}px` : 'auto',
                      minHeight: item.inputHeights?.[`item-${index}`] ? `${item.inputHeights[`item-${index}`]}px` : 'auto'
                    }}
                  />
                  <button
                    className="le-input-resize-handle"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const inputEl = e.currentTarget.previousElementSibling
                      const currentHeight = item.inputHeights?.[`item-${index}`] || inputEl.offsetHeight
                      this.handleInputResize(item.id, `item-${index}`, e.clientY, currentHeight, inputEl)
                    }}
                  >
                    <IconResize size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Row: + Add item */}
          <button
            className="le-list-add-btn"
            onClick={() => this.handleAddListItem(item.id)}
          >
            + Add item
          </button>
        </div>
      ) : (
        (() => {
          const listItems = (item.items || []).filter(i => i.trim())
          const isOrdered = listType === '123' || listType === 'ABC'
          const listStyleType = listType === '123' ? 'decimal' : listType === 'ABC' ? 'lower-alpha' : 'disc'
          return (
            <div className="le-list-view" style={contentStyle}>
              {item.description && (
                <div className="le-list-description-view" style={contentStyle}>{item.description}</div>
              )}
              {listItems.length > 0 && (
                isOrdered ? (
                  <ol className="le-list le-list-ordered" style={{ ...contentStyle, listStyleType }}>
                    {listItems.map((listItem, index) => (
                      <li key={`${item.id}-line-${index}`} style={contentStyle}>{listItem}</li>
                    ))}
                  </ol>
                ) : (
                  <ul className="le-list" style={{ ...contentStyle, listStyleType: 'disc' }}>
                    {listItems.map((listItem, index) => (
                      <li key={`${item.id}-line-${index}`} style={contentStyle}>{listItem}</li>
                    ))}
                  </ul>
                )
              )}
            </div>
          )
        })()
      )

      return (
        <div className="le-list-container" style={containerStyle}>
          {listContent}
        </div>
      )
    }

    if (item.type === 'Table') {
      const contentStyle = getContentStyle()
      const { rows, cols, cells } = item.table
      return (
        <div className="le-table-wrapper">
          {/* First row: Table description */}
          {editMode ? (
            <div className="le-table-row-first">
              <input
                type="text"
                className="glass-input le-table-description"
                placeholder="Table description"
                value={item.description || ''}
                onChange={(e) => this.handleItemTextChange(item.id, e.target.value, 'description')}
                style={contentStyle}
              />
            </div>
          ) : (
            item.description && (
              <div className="le-table-description-view" style={contentStyle}>{item.description}</div>
            )
          )}
          {/* Second row: + Column and + Row buttons */}
          {editMode && (
            <div className="le-table-actions">
              <button type="button" className="glass-button small" onClick={() => this.handleTableAddColumn(item.id)}>+ Column</button>
              <button type="button" className="glass-button small" onClick={() => this.handleTableAddRow(item.id)}>+ Row</button>
            </div>
          )}
          <table className="le-table" style={contentStyle}>
            <thead>
              <tr>
                {Array.from({ length: cols }).map((_, c) => (
                  <th key={`${item.id}-head-${c}`} className="le-table-head-cell" style={contentStyle}>
                    {editMode ? (
                      <textarea
                        className="glass-input le-table-cell"
                        value={cells[0][c]}
                        onChange={(e) => this.handleTableCellChange(item.id, 0, c, e.target.value)}
                        rows={2}
                        style={contentStyle}
                      />
                    ) : (
                      <span className="le-table-cell-view" style={contentStyle}>{cells[0][c]}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows > 1 && Array.from({ length: rows - 1 }).map((_, r) => (
                <tr key={`${item.id}-row-${r + 1}`} style={contentStyle}>
                  {Array.from({ length: cols }).map((__, c) => (
                    <td key={`${item.id}-cell-${r + 1}-${c}`} style={contentStyle}>
                      {editMode ? (
                        <textarea
                          className="glass-input le-table-cell"
                          value={cells[r + 1][c]}
                          onChange={(e) => this.handleTableCellChange(item.id, r + 1, c, e.target.value)}
                          rows={2}
                          style={contentStyle}
                        />
                      ) : (
                        <span className="le-table-cell-view" style={contentStyle}>{cells[r + 1][c]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (item.type === 'Divider') {
      return <div className="le-divider" />
    }

    if (item.type === 'Question') {
      const contentStyle = getContentStyle()
      const containerStyle = {}
      if (item.height) containerStyle.minHeight = `${item.height}px`
      
      return (
        <div className={`le-question-container ${editMode ? 'resizable' : ''}`} style={containerStyle}>
          <div className="le-question">
            {editMode ? (
              <div className="le-resizable-input-wrapper">
                <textarea
                  className="glass-input le-question-input le-resizable-input"
                  placeholder="Type your question..."
                  value={item.question}
                  onChange={(e) => this.handleItemTextChange(item.id, e.target.value, 'question')}
                  style={{
                    ...contentStyle,
                    height: item.inputHeights?.question ? `${item.inputHeights.question}px` : 'auto',
                    minHeight: item.inputHeights?.question ? `${item.inputHeights.question}px` : 'auto'
                  }}
                />
                <button
                  className="le-input-resize-handle"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const inputEl = e.currentTarget.previousElementSibling
                    const currentHeight = item.inputHeights?.question || inputEl.offsetHeight
                    this.handleInputResize(item.id, 'question', e.clientY, currentHeight, inputEl)
                  }}
                >
                  <IconResize size={12} />
                </button>
              </div>
            ) : (
              <div className="le-question-text" style={contentStyle}>{item.question || 'Question'}</div>
            )}
            <button
              className="glass-button small"
              onClick={() => this.handleToggleAnswer(item.id, 'showAnswer')}
            >
              Show Answer
            </button>
            {item.showAnswer && (
              editMode ? (
                <div className="le-resizable-input-wrapper">
                  <textarea
                    className="glass-input le-answer-input le-resizable-input"
                    placeholder="Type the answer..."
                    value={item.answer}
                    onChange={(e) => this.handleItemTextChange(item.id, e.target.value, 'answer')}
                    style={{
                      ...contentStyle,
                      height: item.inputHeights?.answer ? `${item.inputHeights.answer}px` : 'auto',
                      minHeight: item.inputHeights?.answer ? `${item.inputHeights.answer}px` : 'auto'
                    }}
                  />
                  <button
                    className="le-input-resize-handle"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const inputEl = e.currentTarget.previousElementSibling
                      const currentHeight = item.inputHeights?.answer || inputEl.offsetHeight
                      this.handleInputResize(item.id, 'answer', e.clientY, currentHeight, inputEl)
                    }}
                  >
                    <IconResize size={12} />
                  </button>
                </div>
              ) : (
                <div className="le-answer-text" style={contentStyle}>{item.answer || 'Answer'}</div>
              )
            )}
          </div>
        </div>
      )
    }

    if (item.type === 'Answer') {
      return (
        <div className="le-answer-only">
          <button
            className="glass-button small"
            onClick={() => this.handleToggleAnswer(item.id, 'revealed')}
          >
            Show Answer
          </button>
          {(item.revealed || editMode) && (
            editMode ? (
              <textarea
                className="glass-input le-answer-input"
                placeholder="Type the answer..."
                value={item.content}
                onChange={(e) => this.handleItemTextChange(item.id, e.target.value)}
              />
            ) : (
              <div className="le-answer-text">{item.content || 'Answer'}</div>
            )
          )}
        </div>
      )
    }

    if (item.type === 'Quiz') {
      const contentStyle = getContentStyle()
      const containerStyle = {}
      if (item.height) containerStyle.minHeight = `${item.height}px`
      const options = item.options || []
      const correctAnswer = item.correctAnswer ?? ''
      const selectedAnswer = this.state.quizSelections[item.id]
      const hasAnswered = selectedAnswer !== undefined && selectedAnswer !== null

      return (
        <div className="le-quiz-container" style={containerStyle}>
          <div className="le-quiz">
            {/* Row 1: Question (like list description, no type) */}
            {editMode ? (
              <div className="le-quiz-row-first">
                <div className="le-resizable-input-wrapper le-quiz-question-wrap">
                  <input
                    type="text"
                    className="glass-input le-quiz-question le-resizable-input"
                    placeholder="Quiz question..."
                    value={item.question || ''}
                    onChange={(e) => this.handleItemTextChange(item.id, e.target.value, 'question')}
                    style={{
                      ...contentStyle,
                      height: item.inputHeights?.question ? `${item.inputHeights.question}px` : 'auto',
                      minHeight: item.inputHeights?.question ? `${item.inputHeights.question}px` : 'auto'
                    }}
                  />
                  <button
                    className="le-input-resize-handle"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const inputEl = e.currentTarget.previousElementSibling
                      const currentHeight = item.inputHeights?.question || inputEl.offsetHeight
                      this.handleInputResize(item.id, 'question', e.clientY, currentHeight, inputEl)
                    }}
                  >
                    <IconResize size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="le-quiz-question-text" style={contentStyle}>{item.question || 'Quiz question'}</div>
            )}
            {/* Option rows: radio (correct) + input (editable) in edit; clickable in view */}
            {editMode && (
              <p className="le-quiz-hint">Select the correct answer</p>
            )}
            <div className="le-quiz-options">
              {editMode ? (
                options.map((option, index) => (
                  <div key={`${item.id}-opt-${index}`} className="le-quiz-option-row">
                    <label className="le-quiz-correct-check" title="Mark as correct answer">
                      <input
                        type="radio"
                        name={`quiz-correct-${item.id}`}
                        checked={correctAnswer === option}
                        onChange={() => this.handleQuizSetCorrectAnswer(item.id, index)}
                      />
                    </label>
                    <div className="le-resizable-input-wrapper">
                      <input
                        type="text"
                        className="glass-input le-quiz-option-input le-resizable-input"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => this.handleQuizOptionEdit(item.id, index, e.target.value)}
                        style={{
                          ...contentStyle,
                          height: item.inputHeights?.[`opt-${index}`] ? `${item.inputHeights[`opt-${index}`]}px` : 'auto',
                          minHeight: item.inputHeights?.[`opt-${index}`] ? `${item.inputHeights[`opt-${index}`]}px` : 'auto'
                        }}
                      />
                      <button
                        className="le-input-resize-handle"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const inputEl = e.currentTarget.previousElementSibling
                          const currentHeight = item.inputHeights?.[`opt-${index}`] || inputEl.offsetHeight
                          this.handleInputResize(item.id, `opt-${index}`, e.clientY, currentHeight, inputEl)
                        }}
                      >
                        <IconResize size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                options.map((option, index) => {
                  const isCorrect = option === correctAnswer
                  const isSelected = selectedAnswer === option
                  const showCorrect = hasAnswered && isCorrect
                  const showWrong = hasAnswered && isSelected && !isCorrect
                  const optionClass = [
                    'le-quiz-option',
                    showCorrect ? 'le-quiz-option-correct' : '',
                    showWrong ? 'le-quiz-option-wrong' : ''
                  ].filter(Boolean).join(' ')
                  const optionLetter = String.fromCharCode(65 + index)
                  return (
                    <div
                      key={`${item.id}-opt-${index}`}
                      className={optionClass}
                      style={contentStyle}
                      role="button"
                      tabIndex={0}
                      onClick={() => this.handleQuizSelectOption(item.id, option)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') this.handleQuizSelectOption(item.id, option) }}
                    >
                      <span className="le-quiz-option-letter">{optionLetter}.</span>
                      <span className="le-quiz-option-text">{option || `Option ${index + 1}`}</span>
                    </div>
                  )
                })
              )}
            </div>
            {editMode && (
              <button
                className="le-quiz-add-btn"
                onClick={() => this.handleAddQuizOption(item.id)}
              >
                + Add option
              </button>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  renderItem = (item, index, context) => {
    const { editMode } = this.props
    const isActive = this.state.activeItemId === item.id
    const isDragOver = this.state.dragOverItemId === item.id
    // Get item styles from toolbar (MediaAttachment has style: null)
    const itemStyle = {}
    if (item.style) {
      if (item.style.fontSize) {
        itemStyle.fontSize = typeof item.style.fontSize === 'string' && item.style.fontSize.includes('px')
          ? item.style.fontSize
          : `${item.style.fontSize}px`
      }
      if (item.style.textColor != null && item.style.textColor !== '') {
        itemStyle.color = item.style.textColor
      }
      if (item.style.backgroundColor != null && item.style.backgroundColor !== '') {
        itemStyle.backgroundColor = item.style.backgroundColor
      }
      if (item.style.borderColor != null && item.style.borderColor !== '') {
        itemStyle.border = `1px solid ${item.style.borderColor}`
      }
    }

    const itemKey = `${item.id}-${editMode}`
    return (
      <div
        key={itemKey}
        className={`le-item ${editMode ? 'edit-mode' : 'view-mode'} ${isActive ? 'active' : ''} ${isDragOver ? 'drag-over' : ''} ${item.style?.borderColor ? 'has-border-color' : ''}`}
        style={itemStyle}
        data-le-item={item.id}
        onClick={(e) => {
          if (e.target.closest('.le-item-controls') || e.target.closest('.le-item-plus')) return
          this.handleItemActivation(item.id)
        }}
        onDoubleClick={() => editMode && this.handleOpenItemPicker(context, index)}
        onDragOver={(e) => this.handleDragOverItem(e, item.id)}
        onDrop={(e) => this.handleDropOnItem(e, item.id)}
      >
        {editMode && (
          <button
            className="le-item-drag-handle"
            draggable
            onDragStart={(e) => this.handleDragStart(e, item.id)}
            onDragEnd={this.handleDragEnd}
          >
            <IconGrip size={14} />
          </button>
        )}

        {isActive && editMode && item.type !== 'MediaAttachment' && this.renderItemToolbar(item)}

        {editMode && (
          <div className="le-item-plus-wrapper">
            {this.state.itemPicker && this.state.itemPicker.sourceItemId === item.id ? (
              <>
                <div className="le-add-item-input-wrap at-item">
                  {this.renderAddItemInput(
                    true,
                    () => {
                      const pages = this.state.pages
                      const containerItems = this.getContainerItemsByContext(pages, context)
                      const itemIndex = containerItems ? containerItems.findIndex(i => i.id === item.id) : index
                      this.handleOpenItemPicker(context, itemIndex, item.id)
                    }
                  )}
                </div>
                <div className="le-item-picker-wrapper">
                  {this.renderItemPicker(true)}
                </div>
              </>
            ) : (
              <button
                className="le-item-plus"
                onClick={(e) => {
                  e.stopPropagation()
                  const pages = this.state.pages
                  const containerItems = this.getContainerItemsByContext(pages, context)
                  const itemIndex = containerItems ? containerItems.findIndex(i => i.id === item.id) : index
                  this.handleOpenItemPicker(context, itemIndex, item.id)
                }}
              >
                <IconPlus size={14} />
              </button>
            )}
          </div>
        )}

        {editMode && (
          <div className="le-item-controls">
            <button className="le-item-delete" onClick={() => this.handleRequestDeleteItem(item.id)}>
              <IconTrash size={14} />
            </button>
          </div>
        )}

        <div className="le-item-body">
          {this.renderItemContent({ ...item, pageId: context.pageId }, editMode)}
        </div>
      </div>
    )
  }

  renderItems = (items, context) => {
    // Group items by rowId
    const rowGroups = {}
    items.forEach((item, index) => {
      const rowId = item.rowId || `single-${item.id}`
      if (!rowGroups[rowId]) {
        rowGroups[rowId] = []
      }
      rowGroups[rowId].push({ item, originalIndex: index })
    })

    // Render rows
    return Object.keys(rowGroups).map((rowId, rowIndex) => {
      const rowItems = rowGroups[rowId]
      const isMultiItemRow = rowItems.length > 1
      
      const isPickerOpenForRow = this.state.itemPicker && 
        this.state.itemPicker.rowId === rowId && 
        this.state.itemPicker.index === -1

      return (
        <div 
          key={rowId} 
          className={`le-item-row ${isMultiItemRow ? 'multi-item' : ''}`}
        >
          {rowItems.map(({ item, originalIndex }) => (
            <div key={`${item.id}-${this.props.editMode}`} className="le-item-cell">
              {this.renderItem(item, originalIndex, context)}
            </div>
          ))}
          {this.props.editMode && (
            isPickerOpenForRow ? (
              <div className="le-item-column-add-wrap">
                <div className="le-add-item-input-wrap at-column">
                  {this.renderAddItemInput(
                    true,
                    () => this.handleAddColumnItem(rowItems[rowItems.length - 1].item.id, rowId)
                  )}
                </div>
                <div className="le-item-picker-row-wrapper">
                  {this.renderItemPicker(true)}
                </div>
              </div>
            ) : (
              <button
                className={`le-item-column-btn ${this.state.isDragging ? 'drop-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  this.handleAddColumnItem(rowItems[rowItems.length - 1].item.id, rowId)
                }}
                onDragOver={this.handleDragOverColumnButton}
                onDrop={(e) => this.handleDropOnColumnButton(e, rowId)}
                type="button"
              >
                <IconPlus size={14} />
                <span>{this.state.isDragging ? 'Drop in row' : 'Column'}</span>
              </button>
            )
          )}
        </div>
      )
    })
  }

  handleAddItemInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const first = this.getFilteredItems()[0]
      if (first) this.handleAddItem(first)
    }
  }

  renderAddItemInput = (isActive, onFocus, placeholder = 'Add Item') => (
    <input
      ref={isActive ? (el) => { this.addItemInputRef = el } : undefined}
      type="text"
      className="glass-input le-add-item-input"
      placeholder={placeholder}
      value={isActive ? this.state.itemSearch : ''}
      onChange={(e) => this.setState({ itemSearch: e.target.value })}
      onFocus={onFocus}
      onKeyDown={this.handleAddItemInputKeyDown}
      onClick={(e) => e.stopPropagation()}
    />
  )

  renderAddItemButton = (context, index, compact = false) => {
    const { itemPicker } = this.state
    const isPickerOpen = itemPicker &&
      itemPicker.pageId === context.pageId &&
      itemPicker.index === index &&
      !itemPicker.sourceItemId

    return !this.props.editMode ? null : (
      <div className="le-add-item-wrapper">
        <div
          className={`le-add-item-input-wrap ${compact ? 'compact' : ''} ${isPickerOpen ? 'active' : ''}`}
          onDragOver={(e) => this.props.editMode && e.preventDefault()}
          onDrop={(e) => this.handleDropOnAddItem(e, context, index)}
        >
          {this.renderAddItemInput(isPickerOpen, () => this.handleOpenItemPicker(context, index))}
        </div>
        {isPickerOpen && this.renderItemPicker(true)}
      </div>
    )
  }

  renderPageSettings = (pageId, pageIndex) => {
    const isOpen = this.state.openPageSettingsId === pageId
    if (!isOpen) return null

    return (
      <div className="le-page-settings-menu" onClick={(e) => e.stopPropagation()}>
        <button
          className={`le-settings-item ${pageIndex === 0 ? 'disabled' : ''}`}
          onClick={() => pageIndex !== 0 && this.handleRequestDeletePage(pageId)}
          disabled={pageIndex === 0}
        >
          Delete page
        </button>
        <button className="le-settings-item" onClick={() => this.handlePageHeightChange(pageId, 100)}>Extend page +100vh</button>
        <button className="le-settings-item" onClick={() => this.handlePageHeightChange(pageId, -100)}>Shorten page -100vh</button>
        <button className="le-settings-item" onClick={() => this.handleMovePage(pageId, 'top')}>Move to top</button>
        <button className="le-settings-item" onClick={() => this.handleMovePage(pageId, 'bottom')}>Move to bottom</button>
      </div>
    )
  }

  renderItemPicker = (hideSearchInput = false) => {
    const { itemPicker } = this.state
    if (!itemPicker) return null

    const filteredItems = this.getFilteredItems()
    const isRowAddition = itemPicker.index === -1 && itemPicker.rowId
    const closeBtn = (
      <button
        type="button"
        className="le-icon-btn le-item-picker-close-outside"
        onClick={() => this.setState({ itemPicker: null, itemSearch: '' })}
      >
        <IconX size={16} />
      </button>
    )

    const dropdownContent = (
      <div className="le-item-picker-body le-item-picker-body-flat">
        <div className="le-item-grid">
          {filteredItems.map((item, idx) => {
            const IconComponent = ITEM_ICONS[item] || IconFile
            return (
              <button
                key={item}
                type="button"
                className={`le-item-card ${idx === 0 ? 'le-item-card-first' : ''}`}
                onClick={() => this.handleAddItem(item)}
              >
                <span className="le-item-card-icon">
                  <IconComponent size={18} />
                </span>
                <span className="le-item-card-label">{item}</span>
              </button>
            )
          })}
        </div>
      </div>
    )

    if (hideSearchInput) {
      return (
        <div className="le-item-picker-outer" onClick={(e) => e.stopPropagation()}>
          {closeBtn}
          <div className={`le-item-picker-dropdown ${isRowAddition ? 'centered' : ''}`}>
            {dropdownContent}
          </div>
        </div>
      )
    }

    return (
      <div 
        className={`le-item-picker-dropdown ${isRowAddition ? 'centered' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="le-item-picker-header">
          <input
            type="text"
            className="glass-input le-item-search"
            placeholder="Search item types..."
            value={this.state.itemSearch}
            onChange={(e) => this.setState({ itemSearch: e.target.value })}
            autoFocus
          />
          <button className="le-icon-btn" onClick={() => this.setState({ itemPicker: null, itemSearch: '' })}>
            <IconX size={16} />
          </button>
        </div>
        {dropdownContent}
      </div>
    )
  }

  renderConfirmModal = () => {
    const { confirmModal } = this.state
    if (!confirmModal) return null

    return (
      <div className={cpModalStyles.cpModalOverlay} onClick={() => this.setState({ confirmModal: null })}>
        <div className={cpModalStyles.cpModal} onClick={(e) => e.stopPropagation()}>
          <div className={cpModalStyles.cpModalHeader}>
            <h2 className={cpModalStyles.cpModalTitle}>{confirmModal.title}</h2>
            <button className={cpModalStyles.cpModalClose} onClick={() => this.setState({ confirmModal: null })}>
              <IconX size={18} />
            </button>
          </div>
          <div className={cpModalStyles.cpModalBody}>
            <p className={cpModalStyles.cpModalMessage}>{confirmModal.message}</p>
          </div>
          <div className={cpModalStyles.cpModalFooter}>
            <button className={`${cpModalStyles.cpModalBtn} ${cpModalStyles.cpModalBtnCancel}`} onClick={() => this.setState({ confirmModal: null })}>Cancel</button>
            <button
              className={`${cpModalStyles.cpModalBtn} ${cpModalStyles.cpModalBtnDelete}`}
              onClick={() => {
                if (confirmModal.type === 'delete-page') this.handleDeletePage(confirmModal.pageId)
                if (confirmModal.type === 'delete-item') this.handleDeleteItem(confirmModal.itemId)
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  renderAiChat = () => {
    const { aiChatOpen, aiContext, aiPrompt, aiLoading, aiError } = this.state
    if (!aiChatOpen) {
      return (
        <button className="le-ai-toggle" onClick={() => this.setState({ aiChatOpen: true })} title="AI Chat">
          <IconAiChat size={16} />
        </button>
      )
    }

    return (
      <div className="le-ai-chat">
        <div className="le-ai-header">
          <span>AI Chat</span>
          <button className="le-icon-btn" onClick={() => this.setState({ aiChatOpen: false })}>
            <IconX size={14} />
          </button>
        </div>
        <div className="le-ai-messages">
          {aiContext ? (
            <>
              <div className="le-ai-context">
                <div><strong>ID:</strong> {aiContext.id}</div>
                <div><strong>Index:</strong> {aiContext.index}</div>
                <div><strong>Type:</strong> {aiContext.type}</div>
                <div><strong>Content:</strong> {aiContext.content || '—'}</div>
              </div>
              <div className="le-ai-hint">Context sent. Ask the AI to enhance or rewrite.</div>
            </>
          ) : (
            <div className="le-ai-hint">Select an item and click AI to send context.</div>
          )}
          {aiError && (
            <div className="le-ai-hint">{aiError}</div>
          )}
        </div>
        <div className="le-ai-input-area">
          <input
            type="text"
            className="glass-input le-ai-input"
            placeholder="Describe the full lesson you want..."
            value={aiPrompt}
            onChange={(e) => this.setState({ aiPrompt: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                this.handleGenerateLesson()
              }
            }}
            disabled={aiLoading}
          />
          <button
            className="le-ai-send-btn"
            onClick={this.handleGenerateLesson}
            disabled={aiLoading || !aiPrompt.trim()}
            type="button"
          >
            <IconArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  render() {
    const { pages, lessonLoading } = this.state
    const { editMode } = this.props

    if (lessonLoading) {
      return (
        <div className="le-loading">
          <div className="le-loading-spinner" aria-label="Loading" />
          <div className="le-loading-text">Loading Lesson</div>
        </div>
      )
    }

    return (
      <div
        ref={this.lessonEditorRef}
        className="lesson-editor"
        onClick={() => this.setState({ openPageSettingsId: null, itemPicker: null })}
      >
        {pages.map((page, pageIndex) => (
          <div key={page.id} className="lesson-page-wrapper">
            <div
              className="lesson-page"
              onDragOver={(e) => editMode && e.preventDefault()}
              onDrop={(e) => this.handleDropOnPage(e, page.id)}
            >
              {editMode && (
                <button
                  className="le-page-settings-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    this.setState({
                      openPageSettingsId: this.state.openPageSettingsId === page.id ? null : page.id
                    })
                  }}
                >
                  <IconSettings size={16} />
                </button>
              )}
              {this.renderPageSettings(page.id, pageIndex)}

              <div className="lesson-page-items">
                {this.renderItems(page.items, { pageId: page.id, columnItemId: null, columnId: null })}
                {this.renderAddItemButton({ pageId: page.id, columnItemId: null, columnId: null }, page.items.length)}
              </div>
            </div>

            {editMode && (
              <button
                className="le-add-page-btn"
                onClick={() => this.handleAddPageAt(pageIndex + 1)}
                type="button"
              >
                <IconPlus size={16} />
                <span>Add New Page</span>
              </button>
            )}
          </div>
        ))}

        {this.renderConfirmModal()}
        {this.renderAiChat()}
      </div>
    )
  }
}

export default LessonEditor
