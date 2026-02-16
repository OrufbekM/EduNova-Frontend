import React, { Component } from 'react'
import Sidebar from './components/Sidebar'
import ConfirmModal from './components/ConfirmModal'
import LessonEditor from './components/LessonEditor'
import Blackboard from './components/Blackboard'
import styles from './ClassPage.module.css'
import { toast } from '../../utils/toast'
import { getLessons, createLesson, updateLesson, deleteLesson } from '../../api/lessons'
import { getFolders, createFolder, updateFolder, deleteFolder, reorderFolder } from '../../api/folders'

class ClassPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      sidebarOpen: true,
      items: [],
      loading: true,
      confirmModal: null,
      dragOverId: null,
      dragOverPosition: null,
      selectedLessonId: props.selectedLessonId || null,
      editMode: false,
      blackboardOpen: false,
      blackboardContentHeight: 0,
      blackboardInitialScrollTop: 0
    }
    this.dragItem = React.createRef()
    this.contentScrollRef = React.createRef()
    this.lessonWrapRef = React.createRef()
  }

  componentDidMount() {
    if (this.props.classId) {
      this.fetchLessons()
    } else {
      // Default demo data if no classId
      this.setState({
        items: [
          {
            id: 'folder-1',
            type: 'folder',
            name: 'Introduction',
            lessons: [
              { id: 'lesson-1', type: 'lesson', name: 'Welcome to the Course' },
              { id: 'lesson-2', type: 'lesson', name: 'Course Overview' },
            ]
          },
          { id: 'lesson-3', type: 'lesson', name: 'Getting Started' },
          {
            id: 'folder-2',
            type: 'folder',
            name: 'Core Concepts',
            lessons: [
              { id: 'lesson-4', type: 'lesson', name: 'Basic Principles' },
            ]
          },
          { id: 'lesson-5', type: 'lesson', name: 'Summary & Review' },
        ],
        loading: false,
        selectedLessonId: 'lesson-1' // Auto-open first lesson
      })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.classId !== this.props.classId) {
      this.fetchLessons()
    }
    if (prevProps.selectedLessonId !== this.props.selectedLessonId) {
      this.setState({ selectedLessonId: this.props.selectedLessonId })
    }
    if (this.state.blackboardOpen && !prevState.blackboardOpen) {
      setTimeout(() => {
        if (this.lessonWrapRef.current && this.contentScrollRef.current) {
          const h = this.lessonWrapRef.current.scrollHeight || this.lessonWrapRef.current.offsetHeight
          const scrollTop = this.contentScrollRef.current.scrollTop || 0
          this.setState({ blackboardContentHeight: Math.max(h, window.innerHeight), blackboardInitialScrollTop: scrollTop })
        }
      }, 50)
    }
  }

  getErrorMessage = (error, fallback) => {
    if (error?.message) return error.message
    if (error?.error) return error.error
    return fallback
  }

  fetchLessons = async () => {
    if (!this.props.classId) return
    
    this.setState({ loading: true })
    try {
      const [lessonsResult, foldersResult] = await Promise.all([
        getLessons(this.props.classId),
        getFolders(this.props.classId)
      ])

      if (lessonsResult.success && foldersResult.success) {
        const folders = (foldersResult.data || []).map(folder => ({
          ...folder,
          type: 'folder',
          lessons: []
        }))

        const folderMap = new Map(folders.map(folder => [String(folder.id), folder]))
        const rootLessons = []

        ;(lessonsResult.data || []).forEach((lesson) => {
          const lessonItem = {
            id: lesson.id,
            type: 'lesson',
            name: lesson.name,
            folderId: lesson.folderId || null
          }

          if (lesson.folderId && folderMap.has(String(lesson.folderId))) {
            folderMap.get(String(lesson.folderId)).lessons.push(lessonItem)
          } else {
            rootLessons.push(lessonItem)
          }
        })

        folders.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || a.id - b.id)
        folders.forEach(folder => {
          folder.lessons.sort((a, b) => String(a.id).localeCompare(String(b.id)))
        })
        rootLessons.sort((a, b) => String(a.id).localeCompare(String(b.id)))

        const items = [...folders, ...rootLessons]
        const firstLessonId = items.length > 0 && items[0].type === 'lesson' ? items[0].id : null

        this.setState({
          items,
          loading: false,
          selectedLessonId: firstLessonId || this.state.selectedLessonId
        })
      } else {
        this.setState({ loading: false })
        toast.error('Failed to load lessons')
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error)
      this.setState({ loading: false })
      toast.error(this.getErrorMessage(error, 'Failed to load lessons'))
    }
  }

  // Add lesson (root level)
  addLesson = async (name) => {
    if (this.props.classId) {
      const loadingToast = toast.loading('Creating lesson...')
      try {
        const result = await createLesson(this.props.classId, name)
        if (result.success) {
          toast.remove(loadingToast)
          toast.success('Lesson created')
          this.setState({
            items: [...this.state.items, { id: result.data.id, type: 'lesson', name: result.data.name }]
          })
        } else {
          toast.remove(loadingToast)
          toast.error('Failed to create lesson')
        }
      } catch (error) {
        console.error('Failed to create lesson:', error)
        toast.remove(loadingToast)
        toast.error(this.getErrorMessage(error, 'Failed to create lesson'))
      }
    } else {
      // Local state update for demo
      this.setState({
        items: [...this.state.items, { id: `lesson-${Date.now()}`, type: 'lesson', name }]
      })
      toast.success('Lesson created')
    }
  }

  // Add folder
  addFolder = async (name) => {
    if (this.props.classId) {
      const loadingToast = toast.loading('Creating folder...')
      try {
        const result = await createFolder(this.props.classId, name)
        if (result.success) {
          toast.remove(loadingToast)
          toast.success('Folder created')
          this.setState({
            items: [
              ...this.state.items,
              { id: result.data.id, type: 'folder', name: result.data.name, lessons: [], orderIndex: result.data.orderIndex ?? 0 }
            ]
          })
        } else {
          toast.remove(loadingToast)
          toast.error('Failed to create folder')
        }
      } catch (error) {
        console.error('Failed to create folder:', error)
        toast.remove(loadingToast)
        toast.error(this.getErrorMessage(error, 'Failed to create folder'))
      }
      return
    }

    this.setState({
      items: [...this.state.items, { id: `folder-${Date.now()}`, type: 'folder', name, lessons: [] }]
    })
    toast.success('Folder created')
  }

  // Edit folder
  editFolder = async (id, newName) => {
    if (this.props.classId) {
      const loadingToast = toast.loading('Updating folder...')
      try {
        const result = await updateFolder(id, newName)
        if (!result.success) {
          toast.remove(loadingToast)
          toast.error('Failed to update folder')
          return
        }
        toast.remove(loadingToast)
        toast.success('Folder updated')
      } catch (error) {
        console.error('Failed to update folder:', error)
        toast.remove(loadingToast)
        toast.error(this.getErrorMessage(error, 'Failed to update folder'))
        return
      }
    }

    this.setState({
      items: this.state.items.map(item =>
        item.id === id ? { ...item, name: newName } : item
      )
    })
    if (!this.props.classId) {
      toast.success('Folder updated')
    }
  }

  // Edit lesson (both root and inside folders)
  editLesson = async (id, newName) => {
    if (this.props.classId) {
      const loadingToast = toast.loading('Updating lesson...')
      try {
        const result = await updateLesson(this.props.classId, id, newName)
        if (result.success) {
          toast.remove(loadingToast)
          toast.success('Lesson updated')
          this.setState({
            items: this.state.items.map(item => {
              if (item.id === id) return { ...item, name: newName }
              if (item.type === 'folder') {
                return {
                  ...item,
                  lessons: item.lessons.map(lesson =>
                    lesson.id === id ? { ...lesson, name: newName } : lesson
                  )
                }
              }
              return item
            })
          })
        } else {
          toast.remove(loadingToast)
          toast.error('Failed to update lesson')
        }
      } catch (error) {
        console.error('Failed to update lesson:', error)
        toast.remove(loadingToast)
        toast.error(this.getErrorMessage(error, 'Failed to update lesson'))
      }
    } else {
      // Local state update
      this.setState({
        items: this.state.items.map(item => {
          if (item.id === id) return { ...item, name: newName }
          if (item.type === 'folder') {
            return {
              ...item,
              lessons: item.lessons.map(lesson =>
                lesson.id === id ? { ...lesson, name: newName } : lesson
              )
            }
          }
          return item
        })
      })
      toast.success('Lesson updated')
    }
  }

  // Request delete
  requestDelete = (id, name, type) => {
    this.setState({
      confirmModal: {
        id, type,
        title: `Delete ${type === 'folder' ? 'Folder' : 'Lesson'}`,
        message: `Are you sure you want to delete "${name}"?${type === 'folder' ? ' All lessons inside will also be deleted.' : ''}`
      }
    })
  }

  // Confirm delete
  handleConfirmDelete = async () => {
    const { id, type } = this.state.confirmModal
    
    if (type === 'folder') {
      if (this.props.classId) {
        const loadingToast = toast.loading('Deleting folder...')
        try {
          const result = await deleteFolder(id)
          if (!result.success) {
            toast.remove(loadingToast)
            toast.error('Failed to delete folder')
            return
          }
          toast.remove(loadingToast)
          toast.success('Folder deleted')
        } catch (error) {
          console.error('Failed to delete folder:', error)
          toast.remove(loadingToast)
          toast.error(this.getErrorMessage(error, 'Failed to delete folder'))
          return
        }
      }

      this.setState({
        items: this.state.items.filter(item => item.id !== id),
        confirmModal: null
      })
      if (!this.props.classId) {
        toast.success('Folder deleted')
      }
    } else {
      if (this.props.classId) {
        const loadingToast = toast.loading('Deleting lesson...')
        try {
          const result = await deleteLesson(this.props.classId, id)
          if (result.success) {
            toast.remove(loadingToast)
            toast.success('Lesson deleted')
            this.setState({
              items: this.state.items.map(item => {
                if (item.id === id) return null
                if (item.type === 'folder') {
                  return { ...item, lessons: item.lessons.filter(l => l.id !== id) }
                }
                return item
              }).filter(Boolean),
              confirmModal: null
            })
          } else {
            toast.remove(loadingToast)
            toast.error('Failed to delete lesson')
          }
        } catch (error) {
          console.error('Failed to delete lesson:', error)
          toast.remove(loadingToast)
          toast.error(this.getErrorMessage(error, 'Failed to delete lesson'))
        }
      } else {
        this.setState({
          items: this.state.items.map(item => {
            if (item.id === id) return null
            if (item.type === 'folder') {
              return { ...item, lessons: item.lessons.filter(l => l.id !== id) }
            }
            return item
          }).filter(Boolean),
          confirmModal: null
        })
        toast.success('Lesson deleted')
      }
    }
  }

  // Helper to find item location
  findItemLocation = (id) => {
    const rootIndex = this.state.items.findIndex(i => i.id === id)
    if (rootIndex !== -1) {
      return { location: 'root', index: rootIndex, item: this.state.items[rootIndex] }
    }
    for (let i = 0; i < this.state.items.length; i++) {
      if (this.state.items[i].type === 'folder') {
        const lessonIndex = this.state.items[i].lessons.findIndex(l => l.id === id)
        if (lessonIndex !== -1) {
          return { location: 'folder', folderId: this.state.items[i].id, folderIndex: i, index: lessonIndex, item: this.state.items[i].lessons[lessonIndex] }
        }
      }
    }
    return null
  }

  // Drag Start
  handleDragStart = (e, id, type) => {
    this.dragItem.current = { id, type }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)

    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-id="${id}"]`)
      if (el) el.classList.add('dragging')
    })
  }

  // Drag End
  handleDragEnd = () => {
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'))
    this.setState({ dragOverId: null, dragOverPosition: null })
    this.dragItem.current = null
  }

  // Drag Over
  handleDragOver = (e, targetId, targetType) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!this.dragItem.current) {
      this.setState({ dragOverId: null, dragOverPosition: null })
      return
    }
    
    // Dropping on empty space (sidebar-content)
    if (targetId === null && targetType === 'root') {
      e.dataTransfer.dropEffect = 'move'
      this.setState({ dragOverId: 'sidebar-content', dragOverPosition: 'below' })
      return
    }
    
    if (this.dragItem.current.id === targetId) {
      this.setState({ dragOverId: null, dragOverPosition: null })
      return
    }

    e.dataTransfer.dropEffect = 'move'
    
    // Determine if dropping above or below based on mouse position
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseY = e.clientY
    const itemCenterY = rect.top + rect.height / 2
    const position = mouseY < itemCenterY ? 'above' : 'below'
    
    this.setState({ dragOverId: targetId, dragOverPosition: position })
    
    // Update visual indicators
    const targetEl = document.querySelector(`[data-id="${targetId}"]`)
    if (targetEl) {
      targetEl.classList.remove('drag-over-above', 'drag-over-below')
      targetEl.classList.add(`drag-over-${position}`)
    }
  }

  // Drag Leave
  handleDragLeave = (e) => {
    e.preventDefault()
    const relatedTarget = e.relatedTarget
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      this.setState({ dragOverId: null, dragOverPosition: null })
    }
  }

  // Drop
  handleDrop = async (e, targetId, targetType) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Clean up visual indicators
    document.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
      el.classList.remove('drag-over-above', 'drag-over-below')
    })
    
    this.setState({ dragOverId: null })
    
    // Check if dropping on folder-children container (empty space in folder)
    const isFolderChildren = e.target.classList.contains('folder-children') || e.currentTarget.classList.contains('folder-children')
    const dropPosition = isFolderChildren ? 'below' : (this.state.dragOverPosition || 'below')

    if (!this.dragItem.current) {
      this.setState({ dragOverPosition: null })
      return
    }
    
    // Dropping on empty sidebar-content -> add to root level at bottom
    if (targetId === null && targetType === 'root') {
      const { id: dragId, type: dragType } = this.dragItem.current
      const dragLoc = this.findItemLocation(dragId)
      let reorderedItems = null
      
      if (!dragLoc) {
        this.setState({ dragOverPosition: null })
        return
      }
      
      this.setState(prevState => {
        const newItems = JSON.parse(JSON.stringify(prevState.items))
        
        // Remove from original location
        if (dragLoc.location === 'root') {
          newItems.splice(dragLoc.index, 1)
        } else {
          const folder = newItems.find(i => i.id === dragLoc.folderId)
          if (folder) {
            folder.lessons.splice(dragLoc.index, 1)
          }
        }
        
        // Add to root level at bottom
        newItems.push({ ...dragLoc.item })
        reorderedItems = newItems
        
        return { items: newItems, dragOverPosition: null }
      })
      
      this.dragItem.current = null

      if (this.props.classId && dragType === 'lesson' && dragLoc?.item && dragLoc.location === 'folder') {
        try {
          await updateLesson(this.props.classId, dragLoc.item.id || dragId, dragLoc.item.name, null, null, null, '')
          toast.success('Lesson moved')
        } catch (error) {
          console.error('Failed to move lesson:', error)
          toast.error(this.getErrorMessage(error, 'Failed to move lesson'))
        }
      }

      if (this.props.classId && dragType === 'folder' && Array.isArray(reorderedItems)) {
        const foldersOnly = reorderedItems.filter(item => item.type === 'folder')
        try {
          await Promise.all(
            foldersOnly.map((folder, index) => reorderFolder(folder.id, index))
          )
          toast.success('Folders reordered')
        } catch (error) {
          console.error('Failed to reorder folders:', error)
          toast.error(this.getErrorMessage(error, 'Failed to reorder folders'))
        }
      }

      return
    }
    
    if (this.dragItem.current.id === targetId) {
      this.setState({ dragOverPosition: null })
      return
    }

    const { id: dragId, type: dragType } = this.dragItem.current
    const dragLoc = this.findItemLocation(dragId)

    if (!dragLoc) {
      this.setState({ dragOverPosition: null })
      return
    }

    let nextItems = null
    let shouldUpdateFolderOrder = false
    let newLessonFolderId = null
    let draggedLesson = null

    this.setState(prevState => {
      const newItems = JSON.parse(JSON.stringify(prevState.items))

      // Find target location BEFORE removing dragged item
      const targetLoc = this.findItemLocationInItems(newItems, targetId)
      draggedLesson = dragLoc?.item || null

      // Lesson dropped onto folder
      if (dragType === 'lesson' && targetType === 'folder') {
        // If dropping on TOP of folder -> place ABOVE folder (outside)
        if (dropPosition === 'above') {
          // Remove dragged item from original location
          if (dragLoc.location === 'root') {
            newItems.splice(dragLoc.index, 1)
          } else {
            const folder = newItems.find(i => i.id === dragLoc.folderId)
            if (folder) {
              folder.lessons.splice(dragLoc.index, 1)
            }
          }
          
          // Find folder index and insert lesson above it
          const folderIndex = newItems.findIndex(i => i.id === targetId)
          if (folderIndex !== -1) {
            // Adjust index if dragging within same array
            let insertIndex = folderIndex
            if (dragLoc.location === 'root' && dragLoc.index < folderIndex) {
              insertIndex = folderIndex - 1
            } else if (dragLoc.location === 'root' && dragLoc.index < insertIndex) {
              insertIndex--
            }
            newItems.splice(insertIndex, 0, { ...dragLoc.item })
          }
          newLessonFolderId = null
        } else {
          // Dropping on BOTTOM of folder -> add to end of folder (inside)
          // Remove dragged item from original location
          if (dragLoc.location === 'root') {
            newItems.splice(dragLoc.index, 1)
          } else {
            const folder = newItems.find(i => i.id === dragLoc.folderId)
            if (folder) {
              folder.lessons.splice(dragLoc.index, 1)
            }
          }
          
          const targetFolder = newItems.find(i => i.id === targetId)
          if (targetFolder) {
            targetFolder.lessons.push({ ...dragLoc.item, type: 'lesson' })
          }
          newLessonFolderId = targetId
        }
      }
      // Reorder at root level (folders or lessons)
      else if (targetLoc && targetLoc.location === 'root') {
        // Calculate insert index before removal
        let insertIndex = dropPosition === 'above' ? targetLoc.index : targetLoc.index + 1
        
        // Remove dragged item from original location
        if (dragLoc.location === 'root') {
          newItems.splice(dragLoc.index, 1)
          // Adjust insert index if dragging within same array
          if (dragLoc.index < targetLoc.index) {
            // Item was removed before target, so target index decreased by 1
            insertIndex = dropPosition === 'above' ? targetLoc.index - 1 : targetLoc.index
          } else if (dragLoc.index < insertIndex) {
            // Item was removed before insert position
            insertIndex--
          }
        } else {
          // Remove from folder
          const folder = newItems.find(i => i.id === dragLoc.folderId)
          if (folder) {
            folder.lessons.splice(dragLoc.index, 1)
          }
        }
        
        // Insert at calculated position
        newItems.splice(insertIndex, 0, { ...dragLoc.item })
        if (dragType === 'folder') shouldUpdateFolderOrder = true
        if (dragType === 'lesson') newLessonFolderId = null
      }
      // Lesson dropped on lesson inside folder -> insert above or below target
      else if (targetLoc && targetLoc.location === 'folder' && dragType === 'lesson') {
        const targetFolder = newItems.find(i => i.id === targetLoc.folderId)
        if (targetFolder) {
          // Calculate insert index before removal
          let insertIndex = dropPosition === 'above' ? targetLoc.index : targetLoc.index + 1
          
          // Remove dragged item from original location
          if (dragLoc.location === 'folder' && dragLoc.folderId === targetLoc.folderId) {
            // Moving within same folder
            targetFolder.lessons.splice(dragLoc.index, 1)
            // Adjust insert index if source was before target
            if (dragLoc.index < targetLoc.index) {
              insertIndex = dropPosition === 'above' ? targetLoc.index - 1 : targetLoc.index
            } else if (dragLoc.index < insertIndex) {
              insertIndex--
            }
          } else {
            // Remove from different location
            if (dragLoc.location === 'root') {
              newItems.splice(dragLoc.index, 1)
            } else {
              const sourceFolder = newItems.find(i => i.id === dragLoc.folderId)
              if (sourceFolder) {
                sourceFolder.lessons.splice(dragLoc.index, 1)
              }
            }
          }
          
          // Insert at calculated position
          targetFolder.lessons.splice(insertIndex, 0, { ...dragLoc.item, type: 'lesson' })
          newLessonFolderId = targetLoc.folderId
        }
      }

      nextItems = newItems
      return { items: newItems, dragOverPosition: null }
    })

    this.dragItem.current = null

    if (this.props.classId && dragType === 'lesson' && draggedLesson) {
      const targetFolderId = newLessonFolderId ?? null
      const currentFolderId = dragLoc.location === 'folder' ? dragLoc.folderId : null
      if (String(targetFolderId || '') !== String(currentFolderId || '')) {
        try {
          await updateLesson(this.props.classId, draggedLesson.id || dragId, draggedLesson.name, null, null, null, targetFolderId || '')
          toast.success('Lesson moved')
        } catch (error) {
          console.error('Failed to move lesson:', error)
          toast.error(this.getErrorMessage(error, 'Failed to move lesson'))
        }
      }
    }

    if (this.props.classId && shouldUpdateFolderOrder && Array.isArray(nextItems)) {
      const foldersOnly = nextItems.filter(item => item.type === 'folder')
      try {
        await Promise.all(
          foldersOnly.map((folder, index) => reorderFolder(folder.id, index))
        )
        toast.success('Folders reordered')
      } catch (error) {
        console.error('Failed to reorder folders:', error)
        toast.error(this.getErrorMessage(error, 'Failed to reorder folders'))
      }
    }
  }

  // Helper to find item in modified items array
  findItemLocationInItems = (itemsArray, id) => {
    const rootIndex = itemsArray.findIndex(i => i.id === id)
    if (rootIndex !== -1) {
      return { location: 'root', index: rootIndex, item: itemsArray[rootIndex] }
    }
    for (let i = 0; i < itemsArray.length; i++) {
      if (itemsArray[i].type === 'folder') {
        const lessonIndex = itemsArray[i].lessons.findIndex(l => l.id === id)
        if (lessonIndex !== -1) {
          return { location: 'folder', folderId: itemsArray[i].id, folderIndex: i, index: lessonIndex, item: itemsArray[i].lessons[lessonIndex] }
        }
      }
    }
    return null
  }

  handleLessonDoubleClick = (lessonId) => {
    this.setState({ selectedLessonId: lessonId })
    if (this.props.onLessonDoubleClick) {
      this.props.onLessonDoubleClick(lessonId)
    }
  }

  render() {
    const { sidebarOpen, items, confirmModal, dragOverId, selectedLessonId, loading, editMode, blackboardOpen } = this.state

    if (loading) {
      return (
        <div className={styles.classPage}>
          <div className={styles.cpLoading}>
            <div className={styles.cpSpinner} aria-label="Loading" />
            <div className={styles.cpLoadingText}>Loading Lessons</div>
          </div>
        </div>
      )
    }

    // Find selected lesson
    const selectedLesson = selectedLessonId ? (() => {
      // Check root level
      const rootLesson = items.find(item => item.id === selectedLessonId && item.type === 'lesson')
      if (rootLesson) return rootLesson
      
      // Check inside folders
      for (const item of items) {
        if (item.type === 'folder' && item.lessons) {
          const folderLesson = item.lessons.find(l => l.id === selectedLessonId)
          if (folderLesson) return folderLesson
        }
      }
      return null
    })() : null

    return (
      <div className={styles.classPage}>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => this.setState({ sidebarOpen: !sidebarOpen })}
          items={items}
          onAddLesson={this.addLesson}
          onAddFolder={this.addFolder}
          onEditFolder={this.editFolder}
          onEditLesson={this.editLesson}
          onRequestDelete={this.requestDelete}
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
          onDragOver={this.handleDragOver}
          onDragLeave={this.handleDragLeave}
          onDrop={this.handleDrop}
          dragOverId={dragOverId}
          onLessonDoubleClick={this.handleLessonDoubleClick}
          selectedLessonId={selectedLessonId}
          onNavigate={this.props.onNavigate}
          editMode={editMode}
          onToggleEditMode={() => {
            // When entering edit mode, close the sidebar
            this.setState((prev) => ({
              editMode: !prev.editMode,
              ...(!prev.editMode ? { sidebarOpen: false } : {})
            }))
          }}
        />

        <div className={styles.classPageContainer}>
          <div ref={this.contentScrollRef} className={styles.classPageContent}>
            <div ref={this.lessonWrapRef} className={styles.lessonAndBlackboardWrap}>
              {selectedLesson ? (
                <LessonEditor
                  classId={this.props.classId}
                  lessonId={selectedLesson.id}
                  editMode={editMode}
                  blackboardOpen={blackboardOpen}
                />
              ) : (
                <div className={styles.classPagePlaceholder}>
                  <h2>Select a lesson to view</h2>
                  <p>Choose a lesson from the sidebar to start learning</p>
                </div>
              )}
            </div>
          </div>
          {selectedLesson && !blackboardOpen && (
            <button
              type="button"
              className={styles.blackboardOpenBtn}
              onClick={() => this.setState({ blackboardOpen: true, sidebarOpen: false })}
              title="Blackboard"
              aria-label="Open blackboard"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 14h6M9 18h6" />
              </svg>
            </button>
          )}
          {blackboardOpen && selectedLesson && (
            <Blackboard
              isOpen
              contentHeight={this.state.blackboardContentHeight}
              initialScrollTop={this.state.blackboardInitialScrollTop}
              onScrollSync={(scrollTop) => {
                if (this.contentScrollRef.current) this.contentScrollRef.current.scrollTop = scrollTop
              }}
              onClose={() => this.setState({ blackboardOpen: false })}
            />
          )}
        </div>

        {confirmModal && (
          <ConfirmModal
            title={confirmModal.title}
            message={confirmModal.message}
            onCancel={() => this.setState({ confirmModal: null })}
            onConfirm={this.handleConfirmDelete}
          />
        )}
      </div>
    )
  }
}

export default ClassPage
