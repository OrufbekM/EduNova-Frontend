import React, { Component } from 'react'
import { Plus, Settings, Trash2, GripVertical, Check, X, Star, ArrowRight, MoveVertical } from 'lucide-react'
import { getLessonContent, updateLessonContent, updateItemStyle, createLessonMedia, updateLessonMedia } from '../../../api/lessons'
import apiClient from '../../../services/api-Client'
import './LessonEditor.css'

const ITEM_CATEGORIES = [
  {
    label: 'Text Blocks',
    items: [
      'Title', 'Heading', 'Subheading', 'Paragraph', 'Explanation', 'Definition',
      'Example', 'KeyPoint', 'Quote', 'Note', 'Warning', 'Tip', 'Empty Space'
    ]
  },
  {
    label: 'Lists & Structure',
    items: ['List', 'OrderedList', 'Table']
  },
  {
    label: 'Learning & Assessment',
    items: ['Exercise', 'Question', 'Quiz']
  },
  {
    label: 'Media Items',
    items: ['Image', 'Audio', 'Video', 'Embed / Attachment']
  }
]


class LessonEditor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pages: [this.createPage()],
      openPageSettingsId: null,
      itemPicker: null,
      itemSearch: '',
      activeItemId: null,
      confirmModal: null,
      dragOverItemId: null,
      aiChatOpen: false,
      aiContext: null,
      isDragging: false,
    }
    this.dragItem = null
    this.textInputTimeout = null
    this.saveTimeout = null
    this.contentEditableRefs = {}
    this.listItemInputRefs = {}
  }

  componentDidMount() {
    if (this.props.lessonId && this.props.classId) {
      this.loadLessonContent()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.lessonId !== this.props.lessonId || prevProps.classId !== this.props.classId) {
      if (this.props.lessonId && this.props.classId) {
        this.loadLessonContent()
      } else {
        this.resetLesson()
      }
    }
    if (prevProps.editMode && !this.props.editMode) {
      this.setState({ activeItemId: null, itemPicker: null })
      // Save when exiting edit mode
      if (this.props.lessonId && this.props.classId) {
        this.saveLessonContent()
      }
    }
    
    // Update contentEditable elements when state changes, but only if not focused
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
          el.textContent = newText
        }
      }
    })
  }

  resetLesson = () => {
    this.setState({
      pages: [this.createPage()],
      openPageSettingsId: null,
      itemPicker: null,
      itemSearch: '',
      activeItemId: null,
      confirmModal: null,
      dragOverItemId: null,
      aiChatOpen: false,
      aiContext: null,
    })
  }

  generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  createPage = () => ({
    id: this.generateId('page'),
    height: 96,
    items: []
  })

  createItem = (type, rowId = null) => {
    // Check if this is a Text Block, Lists & Structure, or Learning & Assessment item
    const textBlocks = ['Title', 'Heading', 'Subheading', 'Paragraph', 'Explanation', 'Definition',
      'Example', 'KeyPoint', 'Quote', 'Note', 'Warning', 'Tip', 'Empty Space', 'Exercise']
    const listsStructure = ['List', 'OrderedList', 'Table']
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
        backgroundColor: null,
        borderColor: null
      } : {
        fontSize: '',
        textColor: '',
        backgroundColor: '',
        borderColor: ''
      }
    }

    if (type === 'Empty Space') {
      return { ...base, height: 50 } // Default height for empty space
    }

    if (type === 'Table') {
      return {
        ...base,
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
      return { ...base, question: '', options: [], draftOption: '' }
    }

    if (type === 'List' || type === 'OrderedList') {
      return { ...base, description: '', items: [''] }
    }

    if (['Image', 'Audio', 'Video', 'Embed / Attachment'].includes(type)) {
      return { ...base, fileName: '', link: '', file: null, mediaId: null, previewUrl: null }
    }

    return { ...base, content: '' }
  }

  // Convert API format (flat content with index/columnIndex) to internal format (pages with rowId)
  convertApiToInternal = (apiContent) => {
    if (!apiContent || !Array.isArray(apiContent)) {
      return [this.createPage()]
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
        'Example', 'KeyPoint', 'Quote', 'Note', 'Warning', 'Tip', 'Empty Space', 'Exercise']
      const listsStructure = ['List', 'OrderedList', 'Table']
      const learningAssessment = ['Question', 'Quiz']
      const isStyledItem = textBlocks.includes(apiItem.type) || listsStructure.includes(apiItem.type) || learningAssessment.includes(apiItem.type)
      
      const normalizeBackground = (value) => {
        if (!value) return null
        const normalized = String(value).toLowerCase()
        if (normalized === '#151515' || normalized === '#f7f7f7') return null
        return value
      }

      const internalItem = {
        id: this.generateId('item'),
        type: apiItem.type,
        rowId,
        height: apiItem.height || null,
        style: isStyledItem ? {
          fontSize: apiItem.style?.fontSize || '16px',
          textColor: apiItem.style?.color !== undefined ? apiItem.style.color : null,
          backgroundColor: normalizeBackground(apiItem.style?.backgroundColor),
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
        internalItem.table = {
          rows: apiItem.text.rows.length,
          cols: apiItem.text.columns.length,
          cells: apiItem.text.rows.map(row => [...row])
        }
        internalItem.content = JSON.stringify(apiItem.text)
      } else if (apiItem.type === 'Question') {
        internalItem.question = apiItem.question || ''
        internalItem.answer = apiItem.answer || ''
        internalItem.showAnswer = false
      } else if (apiItem.type === 'Quiz' && apiItem.text) {
        internalItem.question = apiItem.text.question || ''
        internalItem.options = apiItem.text.options || []
        internalItem.draftOption = ''
      } else if ((apiItem.type === 'List' || apiItem.type === 'OrderedList') && Array.isArray(apiItem.text)) {
        internalItem.description = apiItem['list description'] || ''
        internalItem.items = [...apiItem.text]
      } else if (['Image', 'Audio', 'Video', 'Embed / Attachment'].includes(apiItem.type) && apiItem.text) {
        if (apiItem.type === 'Image') {
          internalItem.fileName = apiItem.text.src || ''
          internalItem.link = apiItem.text.caption || ''
          internalItem.mediaId = apiItem.text.mediaId || null
        } else if (apiItem.type === 'Embed / Attachment') {
          internalItem.fileName = ''
          internalItem.link = apiItem.text.url || ''
          internalItem.mediaId = apiItem.text.mediaId || null
        } else {
          internalItem.fileName = ''
          internalItem.link = apiItem.text.src || ''
          internalItem.mediaId = apiItem.text.mediaId || null
        }
      } else if (apiItem.type === 'Empty Space') {
        // Empty Space doesn't have content
        internalItem.height = apiItem.height || 50
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
            'Example', 'KeyPoint', 'Quote', 'Note', 'Warning', 'Tip', 'Empty Space', 'Exercise']
          const listsStructure = ['List', 'OrderedList', 'Table']
          const learningAssessment = ['Question', 'Quiz']
          const isStyledItem = textBlocks.includes(item.type) || listsStructure.includes(item.type) || learningAssessment.includes(item.type)
          
          const apiItem = {
            type: item.type,
            index: globalIndex,
            columnIndex: isRow ? colIndex + 1 : null,
            style: isStyledItem ? {
              fontSize: item.style?.fontSize || '16px',
              color: item.style?.textColor !== null && item.style?.textColor !== '' ? item.style.textColor : null,
              backgroundColor: item.style?.backgroundColor ?? null,
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
              correctAnswer: item.options?.[0] || ''
            }
          } else if (item.type === 'List' || item.type === 'OrderedList') {
            apiItem['list description'] = item.description || null
            apiItem.text = item.items || []
          } else if (item.type === 'Image') {
            apiItem.text = {
              src: item.fileName || '',
              caption: item.link || '',
              mediaId: item.mediaId || null
            }
          } else if (item.type === 'Embed / Attachment') {
            apiItem.text = {
              url: item.link || '',
              mediaId: item.mediaId || null
            }
          } else if (['Audio', 'Video'].includes(item.type)) {
            apiItem.text = {
              src: item.link || '',
              mediaId: item.mediaId || null
            }
          } else if (item.type === 'Empty Space') {
            // Empty Space doesn't need text content
            apiItem.text = null
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

    try {
      const result = await getLessonContent(this.props.classId, this.props.lessonId)
      if (result.success && result.data) {
        const pages = this.convertApiToInternal(result.data.content || [])
        this.setState({ pages })
      }
    } catch (error) {
      console.error('Failed to load lesson content:', error)
    }
  }

  // Save lesson content to API
  saveLessonContent = async () => {
    if (!this.props.classId || !this.props.lessonId) return

    try {
      const fileMap = new Map()
      this.state.pages.forEach(page => {
        page.items.forEach(item => {
          if (item.file || item.previewUrl) {
            fileMap.set(item.id, { file: item.file, previewUrl: item.previewUrl })
          }
        })
      })

      const pages = this.clonePages(this.state.pages)
      pages.forEach(page => {
        page.items.forEach(item => {
          const saved = fileMap.get(item.id)
          if (saved) {
            item.file = saved.file || null
            item.previewUrl = saved.previewUrl || null
          }
        })
      })

      await this.syncMediaItems(pages)
      const apiContent = this.convertInternalToApi(pages)
      await updateLessonContent(this.props.classId, this.props.lessonId, apiContent)
      this.setState({ pages })
    } catch (error) {
      console.error('Failed to save lesson content:', error)
    }
  }

  syncMediaItems = async (pages) => {
    const lessonId = this.props.lessonId

    const getMediaType = (itemType) => {
      if (itemType === 'Image') return 'image'
      if (itemType === 'Video') return 'video'
      if (itemType === 'Audio') return 'audio'
      return 'link'
    }

    const items = []
    pages.forEach(page => {
      page.items.forEach(item => {
        if (['Image', 'Audio', 'Video', 'Embed / Attachment'].includes(item.type)) {
          items.push(item)
        }
      })
    })

    for (const item of items) {
      const type = getMediaType(item.type)
      if (item.file) {
        const result = item.mediaId
          ? await updateLessonMedia(lessonId, item.mediaId, { file: item.file, type })
          : await createLessonMedia(lessonId, { file: item.file, type })

        const payload = result?.data
        const media = Array.isArray(payload) ? payload[0] : payload
        if (media?.url) {
          item.link = media.url
        }
        if (media?.id) {
          item.mediaId = media.id
        }
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl)
        }
        item.previewUrl = null
        item.file = null
        if (media?.originalName) {
          item.fileName = media.originalName
        }
      } else if (item.link && !item.mediaId) {
        const result = await createLessonMedia(lessonId, { url: item.link, type })
        const payload = result?.data
        const media = Array.isArray(payload) ? payload[0] : payload
        if (media?.id) {
          item.mediaId = media.id
        }
      }
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

  handleOpenItemPicker = (context, index) => {
    this.setState({
      itemPicker: { ...context, index },
      itemSearch: ''
    })
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
        itemSearch: ''
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

  handleItemFileChange = (itemId, file) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
      item.previewUrl = file ? URL.createObjectURL(file) : null
      item.file = file || null
      item.fileName = file ? file.name : ''
      return { pages }
    })
  }

  handleQuizOptionChange = (itemId, value) => {
    this.handleItemTextChange(itemId, value, 'draftOption')
  }

  handleAddQuizOption = (itemId) => {
    this.setState(prevState => {
      const pages = this.clonePages(prevState.pages)
      const location = this.findItemLocation(pages, itemId)
      if (!location) return null
      const items = this.getContainerItemsByLocation(pages, location)
      const item = items[location.index]
      if (!item.draftOption.trim()) return null
      item.options.push(item.draftOption.trim())
      item.draftOption = ''
      return { pages }
    })
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

  handleMediaFileChange = (itemId, file) => {
    this.handleItemFileChange(itemId, file)
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

    const content = item.content || item.question || item.link || ''
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
    // backgroundColor defaults to theme base, others default to #000000
    const themeName = document.documentElement.getAttribute('data-theme') || 'dark'
    const defaultValue = field === 'backgroundColor'
      ? (themeName === 'light' ? '#F7F7F7' : '#151515')
      : '#000000'
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
            // Allow null for textColor, backgroundColor, and borderColor
            this.handleItemStyleChange(item.id, field, newValue === defaultValue ? null : newValue)
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )
  }

  renderItemToolbar = (item) => (
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
      >
        <Star size={14} />
        <span>AI</span>
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
        className={`le-text-item ${className} ${editMode ? 'resizable' : ''}`}
        style={style}
      >
        <div
          className={`le-text-content ${editMode ? 'editable' : ''}`}
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
        />
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
            <MoveVertical size={14} />
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

    if (item.type === 'Empty Space') {
      const style = {}
      if (item.height) style.height = `${item.height}px`
      if (item.style?.backgroundColor !== null && item.style?.backgroundColor !== '') {
        style.backgroundColor = item.style.backgroundColor
      }
      if (item.style?.borderColor !== null && item.style?.borderColor !== '') {
        style.borderColor = item.style.borderColor
      }
      
      return (
        <div className="le-empty-space" style={style}>
          {editMode && (
            <button
              className="le-text-resize-handle"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const currentHeight = item.height || 50
                this.handleItemResize(item.id, e.clientY, currentHeight)
              }}
            >
              <MoveVertical size={14} />
            </button>
          )}
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

    if (item.type === 'List' || item.type === 'OrderedList') {
      const contentStyle = getContentStyle()
      const containerStyle = {}
      if (item.height) containerStyle.minHeight = `${item.height}px`
      
      const listContent = editMode ? (
        <div className="le-list-editor">
          <div className="le-resizable-input-wrapper">
            <input
              type="text"
              className={`le-list-description le-resizable-input ${item.type === 'OrderedList' ? 'le-resize-disabled' : ''}`}
              placeholder="List description (optional)"
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
              <MoveVertical size={12} />
            </button>
          </div>
          <div className="le-list-items">
            {(item.items || ['']).map((listItem, index) => (
              <div key={`${item.id}-item-${index}`} className="le-list-item-row">
                <div className="le-resizable-input-wrapper">
                  <input
                    type="text"
                    className={`le-list-item-input le-resizable-input ${item.type === 'OrderedList' ? 'le-resize-disabled' : ''}`}
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
                    <MoveVertical size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            className="le-list-add-btn"
            onClick={() => this.handleAddListItem(item.id)}
          >
            + Add Item
          </button>
        </div>
      ) : (
        (() => {
          const ListTag = item.type === 'OrderedList' ? 'ol' : 'ul'
          const listItems = (item.items || []).filter(item => item.trim())
          return (
            <div className="le-list-view" style={contentStyle}>
              {item.description && (
                <div className="le-list-description-view" style={contentStyle}>{item.description}</div>
              )}
              {listItems.length > 0 && (
                <ListTag className="le-list" style={contentStyle}>
                  {listItems.map((listItem, index) => (
                    <li key={`${item.id}-line-${index}`} style={contentStyle}>{listItem}</li>
                  ))}
                </ListTag>
              )}
            </div>
          )
        })()
      )

      return (
        <div className={`le-list-container ${editMode ? 'resizable' : ''}`} style={containerStyle}>
          {listContent}
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
              <MoveVertical size={14} />
            </button>
          )}
        </div>
      )
    }

    if (item.type === 'Table') {
      const contentStyle = getContentStyle()
      const { rows, cols, cells } = item.table
      return (
        <div className="le-table" style={contentStyle}>
          {editMode && (
            <div className="le-table-actions">
              <button className="glass-button small" onClick={() => this.handleTableAddRow(item.id)}>+ Row</button>
              <button className="glass-button small" onClick={() => this.handleTableAddColumn(item.id)}>+ Column</button>
            </div>
          )}
          <table style={contentStyle}>
            <tbody>
              {Array.from({ length: rows }).map((_, r) => (
                <tr key={`${item.id}-row-${r}`} style={contentStyle}>
                  {Array.from({ length: cols }).map((__, c) => (
                    <td key={`${item.id}-cell-${r}-${c}`} style={contentStyle}>
                      {editMode ? (
                        <input
                          className="glass-input le-table-cell"
                          value={cells[r][c]}
                          onChange={(e) => this.handleTableCellChange(item.id, r, c, e.target.value)}
                          style={contentStyle}
                        />
                      ) : (
                        <span style={contentStyle}>{cells[r][c]}</span>
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
                  <MoveVertical size={12} />
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
                    <MoveVertical size={12} />
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
      
      return (
        <div className={`le-quiz-container ${editMode ? 'resizable' : ''}`} style={containerStyle}>
          <div className="le-quiz">
            {editMode ? (
              <div className="le-resizable-input-wrapper">
                <input
                  className="glass-input le-quiz-question le-resizable-input"
                  placeholder="Quiz question..."
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
                  <MoveVertical size={12} />
                </button>
              </div>
            ) : (
              <div className="le-quiz-question-text" style={contentStyle}>{item.question || 'Quiz question'}</div>
            )}
            <div className="le-quiz-options">
              {item.options.map((option, index) => (
                <div key={`${item.id}-opt-${index}`} className="le-quiz-option" style={contentStyle}>{option}</div>
              ))}
            </div>
            {editMode && (
              <div className="le-quiz-add">
                <div className="le-resizable-input-wrapper">
                  <input
                    className="glass-input le-quiz-option-input le-resizable-input"
                    placeholder="Add option"
                    value={item.draftOption}
                    onChange={(e) => this.handleQuizOptionChange(item.id, e.target.value)}
                    style={{
                      ...contentStyle,
                      height: item.inputHeights?.['draftOption'] ? `${item.inputHeights['draftOption']}px` : 'auto',
                      minHeight: item.inputHeights?.['draftOption'] ? `${item.inputHeights['draftOption']}px` : 'auto'
                    }}
                  />
                  <button
                    className="le-input-resize-handle"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const inputEl = e.currentTarget.previousElementSibling
                      const currentHeight = item.inputHeights?.['draftOption'] || inputEl.offsetHeight
                      this.handleInputResize(item.id, 'draftOption', e.clientY, currentHeight, inputEl)
                    }}
                  >
                    <MoveVertical size={12} />
                  </button>
                </div>
                <button className="le-icon-btn" onClick={() => this.handleCancelQuizOption(item.id)}>
                  <X size={14} />
                </button>
                <button className="le-icon-btn confirm" onClick={() => this.handleAddQuizOption(item.id)}>
                  <Check size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (['Image', 'Audio', 'Video', 'Embed / Attachment'].includes(item.type)) {
      return (
        <div className="le-media">
          {editMode && (
            <div className="le-media-inputs">
              <input
                type="file"
                className="glass-input"
                onChange={(e) => this.handleMediaFileChange(item.id, e.target.files[0])}
              />
              <input
                type="text"
                className="glass-input"
                placeholder="Paste media link"
                value={item.link}
                onChange={(e) => this.handleItemTextChange(item.id, e.target.value, 'link')}
              />
            </div>
          )}
          {(() => {
            const rawSrc = item.previewUrl || item.link || item.fileName || ''
            const baseUrl = apiClient?.defaults?.baseURL || ''
            const baseOrigin = baseUrl.replace(/\/api\/?$/, '')
            let resolvedSrc = rawSrc
            if (rawSrc && !rawSrc.startsWith('http') && !rawSrc.startsWith('blob:') && !rawSrc.startsWith('data:')) {
              if (rawSrc.startsWith('/')) {
                resolvedSrc = baseOrigin ? `${baseOrigin}${rawSrc}` : rawSrc
              } else {
                resolvedSrc = baseOrigin ? `${baseOrigin}/${rawSrc}` : `/${rawSrc}`
              }
            }
            return (
              <div className="le-media-preview">
                {item.type === 'Image' && resolvedSrc && (
                  <img src={resolvedSrc} alt={item.fileName || 'Lesson media'} className="le-media-image" />
                )}
                {item.type === 'Video' && resolvedSrc && (
                  <video src={resolvedSrc} className="le-media-video" controls />
                )}
                {item.type === 'Audio' && resolvedSrc && (
                  <audio src={resolvedSrc} controls />
                )}
                {item.type === 'Embed / Attachment' && resolvedSrc && (
                  <a href={resolvedSrc} target="_blank" rel="noreferrer">Open attachment</a>
                )}
                {!resolvedSrc && (
                  <div>{`${item.type} placeholder`}</div>
                )}
              </div>
            )
          })()}
        </div>
      )
    }

    return null
  }

  renderItem = (item, index, context) => {
    const { editMode } = this.props
    const isActive = this.state.activeItemId === item.id
    const isDragOver = this.state.dragOverItemId === item.id
    const isEmptySpace = item.type === 'Empty Space'

    // Get item styles from toolbar
    const itemStyle = {}
    if (item.style?.fontSize) {
      // Handle both "16px" format and number format
      itemStyle.fontSize = typeof item.style.fontSize === 'string' && item.style.fontSize.includes('px') 
        ? item.style.fontSize 
        : `${item.style.fontSize}px`
    }
    if (item.style?.textColor !== null && item.style?.textColor !== '') {
      itemStyle.color = item.style.textColor
    }
    if (item.style?.backgroundColor !== null && item.style?.backgroundColor !== '') {
      itemStyle.backgroundColor = item.style.backgroundColor
    }
    if (item.style?.borderColor !== null && item.style?.borderColor !== '') {
      itemStyle.border = `1px solid ${item.style.borderColor}`
    }

    return (
      <div
        key={item.id}
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
            <GripVertical size={14} />
          </button>
        )}

        {isActive && editMode && !isEmptySpace && this.renderItemToolbar(item)}

        {editMode && (
          <div className="le-item-plus-wrapper">
            <button
              className="le-item-plus"
              onClick={(e) => {
                e.stopPropagation()
                // Find the item's actual index in the container
                const pages = this.state.pages
                const containerItems = this.getContainerItemsByContext(pages, context)
                const itemIndex = containerItems ? containerItems.findIndex(i => i.id === item.id) : index
                // Open picker and add item at this item's index (before this item)
                // Store the item ID so we know which item's plus button was clicked
                this.setState({
                  itemPicker: { ...context, index: itemIndex, sourceItemId: item.id },
                  itemSearch: ''
                })
              }}
            >
              <Plus size={14} />
            </button>
            {this.state.itemPicker && 
             this.state.itemPicker.sourceItemId === item.id && (
              <div className="le-item-picker-wrapper">
                {this.renderItemPicker()}
              </div>
            )}
          </div>
        )}

        {editMode && (
          <div className="le-item-controls">
            <button className="le-item-delete" onClick={() => this.handleRequestDeleteItem(item.id)}>
              <Trash2 size={14} />
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
            <div key={item.id} className="le-item-cell">
              {this.renderItem(item, originalIndex, context)}
            </div>
          ))}
          {this.props.editMode && (
            <button
              className={`le-item-column-btn ${this.state.isDragging ? 'drop-active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                const { itemPicker } = this.state
                const isPickerOpen = itemPicker && itemPicker.rowId === rowId && itemPicker.index === -1
                if (isPickerOpen) {
                  this.setState({ itemPicker: null })
                } else {
                  this.handleAddColumnItem(rowItems[rowItems.length - 1].item.id, rowId)
                }
              }}
              onDragOver={this.handleDragOverColumnButton}
              onDrop={(e) => this.handleDropOnColumnButton(e, rowId)}
              type="button"
            >
              <Plus size={14} />
              <span>{this.state.isDragging ? 'Drop in row' : 'Column'}</span>
            </button>
          )}
          {isPickerOpenForRow && (
            <div className="le-item-picker-row-wrapper">
              {this.renderItemPicker()}
            </div>
          )}
        </div>
      )
    })
  }

  renderAddItemButton = (context, index, compact = false) => {
    const { itemPicker } = this.state
    const isPickerOpen = itemPicker && 
      itemPicker.pageId === context.pageId && 
      itemPicker.index === index
    
    return !this.props.editMode ? null : (
      <div className="le-add-item-wrapper">
        <button
          className={`le-add-item-button ${compact ? 'compact' : ''} ${isPickerOpen ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            if (isPickerOpen) {
              this.setState({ itemPicker: null })
            } else {
              this.handleOpenItemPicker(context, index)
            }
          }}
          onDragOver={(e) => this.props.editMode && e.preventDefault()}
          onDrop={(e) => this.handleDropOnAddItem(e, context, index)}
          type="button"
        >
          <Plus size={16} />
          <span>Add Item</span>
        </button>
        {isPickerOpen && this.renderItemPicker()}
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

  renderItemPicker = () => {
    const { itemPicker, itemSearch } = this.state
    if (!itemPicker) return null

    const query = itemSearch.trim().toLowerCase()
    const filteredCategories = ITEM_CATEGORIES.map(category => ({
      ...category,
      items: category.items
        .filter(item => item.toLowerCase().includes(query))
    })).filter(category => category.items.length > 0)

    // If it's a row addition, center the picker
    const isRowAddition = itemPicker.index === -1 && itemPicker.rowId

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
            value={itemSearch}
            onChange={(e) => this.setState({ itemSearch: e.target.value })}
            autoFocus
          />
          <button className="le-icon-btn" onClick={() => this.setState({ itemPicker: null })}>
            <X size={16} />
          </button>
        </div>
        <div className="le-item-picker-body">
          {filteredCategories.map(category => (
            <div key={category.label} className="le-item-category">
              <h4>{category.label}</h4>
              <div className="le-item-grid">
                {category.items.map(item => (
                  <button
                    key={item}
                    className="le-item-card"
                    onClick={() => this.handleAddItem(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  renderConfirmModal = () => {
    const { confirmModal } = this.state
    if (!confirmModal) return null

    return (
      <div className="cp-modal-overlay" onClick={() => this.setState({ confirmModal: null })}>
        <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cp-modal-header">
            <h2 className="cp-modal-title">{confirmModal.title}</h2>
            <button className="cp-modal-close" onClick={() => this.setState({ confirmModal: null })}>
              <X size={18} />
            </button>
          </div>
          <div className="cp-modal-body">
            <p className="cp-modal-message">{confirmModal.message}</p>
          </div>
          <div className="cp-modal-footer">
            <button className="cp-modal-btn cancel" onClick={() => this.setState({ confirmModal: null })}>Cancel</button>
            <button
              className="cp-modal-btn delete"
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
    const { aiChatOpen, aiContext } = this.state
    if (!aiChatOpen) {
      return (
        <button className="le-ai-toggle" onClick={() => this.setState({ aiChatOpen: true })}>
          <Star size={14} />
          <span>AI</span>
        </button>
      )
    }

    return (
      <div className="le-ai-chat">
        <div className="le-ai-header">
          <span>AI Chat</span>
          <button className="le-icon-btn" onClick={() => this.setState({ aiChatOpen: false })}>
            <X size={14} />
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
        </div>
        <div className="le-ai-input-area">
          <input type="text" className="glass-input le-ai-input" placeholder="Type a message..." />
          <button className="le-ai-send-btn">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  render() {
    const { pages } = this.state
    const { editMode } = this.props

    return (
      <div className="lesson-editor" onClick={() => this.setState({ openPageSettingsId: null, itemPicker: null })}>
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
                  <Settings size={16} />
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
                <Plus size={16} />
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
