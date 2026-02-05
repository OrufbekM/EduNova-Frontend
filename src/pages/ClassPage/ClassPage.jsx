import React, { Component } from 'react'
import Sidebar from './components/Sidebar'
import ConfirmModal from './components/ConfirmModal'
import LessonEditor from './components/LessonEditor'
import './ClassPage.css'
import { getLessons, createLesson, updateLesson, deleteLesson } from '../../api/lessons'
import { getFolders, createFolder, updateFolder, deleteFolder, reorderFolder } from '../../api/folders'
import { toast } from '../../utils/toast'

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
      editMode: false
    }
    this.dragItem = React.createRef()
  }

  getStoredSelectedLessonId = () => {
    if (!this.props.classId) return null
    try {
      return localStorage.getItem(`classpage:selectedLesson:${this.props.classId}`)
    } catch (error) {
      return null
    }
  }

  storeSelectedLessonId = (lessonId) => {
    if (!this.props.classId) return
    try {
      if (lessonId) {
        localStorage.setItem(`classpage:selectedLesson:${this.props.classId}`, String(lessonId))
      } else {
        localStorage.removeItem(`classpage:selectedLesson:${this.props.classId}`)
      }
    } catch (error) {
      // Ignore storage failures (private mode, quota, etc.)
    }
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

  componentDidUpdate(prevProps) {
    if (prevProps.classId !== this.props.classId) {
      this.fetchLessons()
    }
    if (prevProps.selectedLessonId !== this.props.selectedLessonId) {
      this.setState({ selectedLessonId: this.props.selectedLessonId })
      this.storeSelectedLessonId(this.props.selectedLessonId)
    }
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
        
        // Prefer last selected lesson (if still exists), otherwise first lesson
        const storedSelectedId = this.getStoredSelectedLessonId()
        const storedItem = storedSelectedId
          ? items.find(item => String(item.id) === String(storedSelectedId))
          : null
        const firstLessonId = items.length > 0 && items[0].type === 'lesson' ? items[0].id : null
        const nextSelectedId = storedItem ? storedItem.id : firstLessonId

        this.setState({
          items,
          loading: false,
          selectedLessonId: nextSelectedId || this.state.selectedLessonId
        })
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error)
      this.setState({ loading: false })
    }
  }

  // Add lesson (root level)
  addLesson = async (name) => {
    if (this.props.classId) {
      const loadingToast = toast.loading('Creating lesson...')
      try {
        const result = await createLesson(this.props.classId, name)
        if (result.success) {
          this.setState({
            items: [...this.state.items, { id: result.data.id, type: 'lesson', name: result.data.name }]
          })
          toast.remove(loadingToast)
          toast.success('Lesson created successfully')
        } else {
          toast.remove(loadingToast)
          toast.error('Failed to create lesson: ' + (result?.message || 'Unknown error'))
        }
      } catch (error) {
        console.error('Failed to create lesson:', error)
        toast.remove(loadingToast)
        toast.error('Failed to create lesson: ' + (error.message || 'Unknown error'))
      }
    } else {
      // Local state update for demo
      this.setState({
        items: [...this.state.items, { id: `lesson-${Date.now()}`, type: 'lesson', name }]
      })
    }
  }

  // Add folder
  addFolder = async (name) => {
    if (this.props.classId) {
      const loadingToast = toast.loading('Creating folder...')
      try {
        const result = await createFolder(this.props.classId, name)
        if (result.success) {
          this.setState({
            items: [
              ...this.state.items,
              { id: result.data.id, type: 'folder', name: result.data.name, lessons: [], orderIndex: result.data.orderIndex ?? 0 }
            ]
          })
          toast.remove(loadingToast)
          toast.success('Folder created successfully')
        } else {
          toast.remove(loadingToast)
          toast.error('Failed to create folder')
        }
      } catch (error) {
        console.error('Failed to create folder:', error)
        toast.remove(loadingToast)
        toast.error('Failed to create folder')
      }
    } else {
      this.setState({
        items: [...this.state.items, { id: `folder-${Date.now()}`, type: 'folder', name, lessons: [] }]
      })
    }
  }

  // Edit folder
  editFolder = async (id, newName) => {
    if (this.props.classId) {
      const loadingToast = toast.loading('Updating folder...')
      try {
        const result = await updateFolder(id, newName)
        if (result.success) {
          this.setState({
            items: this.state.items.map(item =>
              item.id === id ? { ...item, name: newName } : item
            )
          })
          toast.remove(loadingToast)
          toast.success('Folder updated successfully')
        } else {
          toast.remove(loadingToast)
          toast.error('Failed to update folder')
        }
      } catch (error) {
        console.error('Failed to update folder:', error)
        toast.remove(loadingToast)
        toast.error('Failed to update folder')
      }
    } else {
      this.setState({
        items: this.state.items.map(item =>
          item.id === id ? { ...item, name: newName } : item
        )
      })
    }
  }

  // Edit lesson (both root and inside folders)
  editLesson = async (id, newName) => {
    if (this.props.classId) {
      const loadingToast = toast.loading('Updating lesson...')
      try {
        const result = await updateLesson(this.props.classId, id, newName)
        if (result.success) {
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
          toast.remove(loadingToast)
          toast.success('Lesson updated successfully')
        } else {
          toast.remove(loadingToast)
          toast.error('Failed to update lesson: ' + (result?.message || 'Unknown error'))
        }
      } catch (error) {
        console.error('Failed to update lesson:', error)
        toast.remove(loadingToast)
        toast.error('Failed to update lesson: ' + (error.message || 'Unknown error'))
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
          if (result.success) {
            this.setState({
              items: this.state.items.filter(item => item.id !== id),
              confirmModal: null
            })
            toast.remove(loadingToast)
            toast.success('Folder deleted successfully')
          } else {
            toast.remove(loadingToast)
            toast.error('Failed to delete folder')
          }
        } catch (error) {
          console.error('Failed to delete folder:', error)
          toast.remove(loadingToast)
          toast.error('Failed to delete folder')
        }
      } else {
        this.setState({
          items: this.state.items.filter(item => item.id !== id),
          confirmModal: null
        })
      }
    } else {
      if (this.props.classId) {
        const loadingToast = toast.loading('Deleting lesson...')
        try {
          const result = await deleteLesson(this.props.classId, id)
          if (result.success) {
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
            toast.remove(loadingToast)
            toast.success('Lesson deleted successfully')
          } else {
            toast.remove(loadingToast)
            toast.error('Failed to delete lesson: ' + (result?.message || 'Unknown error'))
          }
        } catch (error) {
          console.error('Failed to delete lesson:', error)
          toast.remove(loadingToast)
          toast.error('Failed to delete lesson: ' + (error.message || 'Unknown error'))
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

    document.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
      el.classList.remove('drag-over-above', 'drag-over-below')
    })

    this.setState({ dragOverId: null })

    const isFolderChildren = e.target.classList.contains('folder-children') || e.currentTarget.classList.contains('folder-children')
    const dropPosition = isFolderChildren ? 'below' : (this.state.dragOverPosition || 'below')

    if (!this.dragItem.current) {
      this.setState({ dragOverPosition: null })
      return
    }

    const { id: dragId, type: dragType } = this.dragItem.current
    const dragLoc = this.findItemLocation(dragId)

    if (!dragLoc) {
      this.setState({ dragOverPosition: null })
      return
    }

    if (this.dragItem.current.id === targetId) {
      this.setState({ dragOverPosition: null })
      return
    }

    let items = JSON.parse(JSON.stringify(this.state.items))
    let shouldUpdateFolderOrder = false
    let newLessonFolderId = null

    const removeDragged = () => {
      if (dragLoc.location === 'root') {
        items.splice(dragLoc.index, 1)
      } else {
        const folder = items.find(i => i.id === dragLoc.folderId)
        if (folder) {
          folder.lessons.splice(dragLoc.index, 1)
        }
      }
    }

    if (targetId === null && targetType === 'root') {
      removeDragged()
      items.push({ ...dragLoc.item })
      newLessonFolderId = null
    } else {
      const targetLoc = this.findItemLocationInItems(items, targetId)

      if (dragType === 'lesson' && targetType === 'folder') {
        if (dropPosition === 'above') {
          removeDragged()
          const folderIndex = items.findIndex(i => i.id === targetId)
          if (folderIndex !== -1) {
            let insertIndex = folderIndex
            if (dragLoc.location === 'root' && dragLoc.index < folderIndex) {
              insertIndex = folderIndex - 1
            } else if (dragLoc.location === 'root' && dragLoc.index < insertIndex) {
              insertIndex--
            }
            items.splice(insertIndex, 0, { ...dragLoc.item })
          }
          newLessonFolderId = null
        } else {
          removeDragged()
          const targetFolder = items.find(i => i.id === targetId)
          if (targetFolder) {
            targetFolder.lessons.push({ ...dragLoc.item, type: 'lesson' })
          }
          newLessonFolderId = targetId
        }
      } else if (targetLoc && targetLoc.location === 'root') {
        let insertIndex = dropPosition === 'above' ? targetLoc.index : targetLoc.index + 1
        if (dragLoc.location === 'root') {
          items.splice(dragLoc.index, 1)
          if (dragLoc.index < targetLoc.index) {
            insertIndex = dropPosition === 'above' ? targetLoc.index - 1 : targetLoc.index
          } else if (dragLoc.index < insertIndex) {
            insertIndex--
          }
        } else {
          const folder = items.find(i => i.id === dragLoc.folderId)
          if (folder) {
            folder.lessons.splice(dragLoc.index, 1)
          }
        }
        items.splice(insertIndex, 0, { ...dragLoc.item })
        if (dragType === 'folder') shouldUpdateFolderOrder = true
        if (dragType === 'lesson') newLessonFolderId = null
      } else if (targetLoc && targetLoc.location === 'folder' && dragType === 'lesson') {
        const targetFolder = items.find(i => i.id === targetLoc.folderId)
        if (targetFolder) {
          let insertIndex = dropPosition === 'above' ? targetLoc.index : targetLoc.index + 1
          if (dragLoc.location === 'folder' && dragLoc.folderId === targetLoc.folderId) {
            targetFolder.lessons.splice(dragLoc.index, 1)
            if (dragLoc.index < targetLoc.index) {
              insertIndex = dropPosition === 'above' ? targetLoc.index - 1 : targetLoc.index
            } else if (dragLoc.index < insertIndex) {
              insertIndex--
            }
          } else {
            removeDragged()
          }
          targetFolder.lessons.splice(insertIndex, 0, { ...dragLoc.item, type: 'lesson' })
          newLessonFolderId = targetLoc.folderId
        }
      }
    }

    this.setState({ items, dragOverPosition: null })
    this.dragItem.current = null

    if (this.props.classId && dragType === 'lesson' && dragLoc?.item) {
      const targetFolderId = newLessonFolderId ?? null
      const currentFolderId = dragLoc.location === 'folder' ? dragLoc.folderId : null
      if (String(targetFolderId || '') !== String(currentFolderId || '')) {
        try {
          await updateLesson(this.props.classId, dragLoc.item.id || dragId, dragLoc.item.name, null, null, null, targetFolderId || '')
        } catch (error) {
          console.error('Failed to move lesson:', error)
        }
      }
    }

    if (this.props.classId && shouldUpdateFolderOrder && Array.isArray(items)) {
      const foldersOnly = items.filter(item => item.type === 'folder')
      try {
        await Promise.all(
          foldersOnly.map((folder, index) => reorderFolder(folder.id, index))
        )
      } catch (error) {
        console.error('Failed to reorder folders:', error)
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
    this.storeSelectedLessonId(lessonId)
    if (this.props.onLessonDoubleClick) {
      this.props.onLessonDoubleClick(lessonId)
    }
  }

  render() {
    const { sidebarOpen, items, confirmModal, dragOverId, selectedLessonId, loading, editMode } = this.state

    if (loading) {
      const loadingLabel = this.props.loadingLabel || 'Loading Lessons'
      return (
        <div className="class-page">
          <div className="cp-loading">
            <div className="cp-spinner" aria-label="Loading" />
            <div className="cp-loading-text">{loadingLabel}</div>
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
      <div className="class-page">
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
          onToggleEditMode={() => this.setState({ editMode: !editMode })}
        />

        <div className="class-page-container">
          <div className="class-page-content">
            {selectedLesson ? (
              <LessonEditor
                classId={this.props.classId}
                lessonId={selectedLesson.id}
                editMode={editMode}
              />
            ) : (
              <div className="class-page-placeholder">
                <h2>Select a lesson to view</h2>
                <p>Choose a lesson from the sidebar to start learning</p>
              </div>
            )}
          </div>
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
