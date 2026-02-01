import React, { Component } from 'react'
import Header from './components/Header'
import Category from './components/Category'
import AddClassModal from './components/AddClassModal'
import ConfirmModal from './components/ConfirmModal'
import './ClassManagement.css'
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  createClass,
  updateClass,
  deleteClass
} from '../../api/classes'
import { logout } from '../../api/auth'
import { toast } from '../../utils/toast'

class ClassManagement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      categories: [],
      loading: true,
      showCategoryInput: false,
      newCategoryName: '',
      modalOpen: false,
      modalCategoryId: null,
      confirmModal: null,
      dragOverTarget: null
    }
    this.dragItem = React.createRef()
  }

  componentDidMount() {
    this.fetchCategories()
  }

  fetchCategories = async () => {
    this.setState({ loading: true })
    try {
      const result = await getCategories()
      if (result.success) {
        this.setState({ categories: result.data })
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to load categories')
    } finally {
      this.setState({ loading: false })
    }
  }

  // Category actions
  addCategory = async () => {
    if (this.state.newCategoryName.trim()) {
      try {
        const result = await createCategory(this.state.newCategoryName.trim())
        if (result.success) {
          const newCategory = {
            ...result.data,
            classes: result.data?.classes || []
          }
          toast.success('Category created successfully')
          this.setState({
            categories: [...this.state.categories, newCategory],
            newCategoryName: '',
            showCategoryInput: false
          })
        }
      } catch (error) {
        console.error('Failed to create category:', error)
        toast.error('Failed to create category')
      }
    }
  }

  editCategory = async (catId, newName) => {
    try {
      const result = await updateCategory(catId, newName)
      if (result.success) {
        toast.success('Category updated successfully')
        this.setState({
          categories: this.state.categories.map(cat =>
            cat.id === catId ? { ...cat, ...result.data, classes: cat.classes } : cat
          )
        })
      }
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.error('Failed to update category')
    }
  }

  handleDeleteCategory = async (catId) => {
    try {
      const result = await deleteCategory(catId)
      if (result.success) {
        toast.success('Category deleted successfully')
        this.setState({
          categories: this.state.categories.filter(cat => cat.id !== catId)
        })
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error('Failed to delete category')
    }
  }

  // Class actions
  addClass = async (catId, name, description) => {
    try {
      const result = await createClass(catId, name, description)
      if (result.success) {
        toast.success('Class created successfully')
        this.setState({
          categories: this.state.categories.map(cat =>
            cat.id === catId
              ? { ...cat, classes: [...cat.classes, result.data] }
              : cat
          )
        })
      }
    } catch (error) {
      console.error('Failed to create class:', error)
      toast.error('Failed to create class')
    }
  }

  editClass = async (catId, clsId, newName) => {
    try {
      const currentCategory = this.state.categories.find(cat => cat.id === catId)
      const currentClass = currentCategory?.classes?.find(cls => cls.id === clsId)
      const result = await updateClass(catId, clsId, newName, currentClass?.description || '')
      if (result.success) {
        toast.success('Class updated successfully')
        this.setState({
          categories: this.state.categories.map(cat =>
            cat.id === catId
              ? { ...cat, classes: cat.classes.map(cls => cls.id === clsId ? result.data : cls) }
              : cat
          )
        })
      }
    } catch (error) {
      console.error('Failed to update class:', error)
      toast.error('Failed to update class')
    }
  }

  handleDeleteClass = async (catId, clsId) => {
    try {
      const result = await deleteClass(catId, clsId)
      if (result.success) {
        toast.success('Class deleted successfully')
        this.setState({
          categories: this.state.categories.map(cat =>
            cat.id === catId
              ? { ...cat, classes: cat.classes.filter(cls => cls.id !== clsId) }
              : cat
          )
        })
      }
    } catch (error) {
      console.error('Failed to delete class:', error)
      toast.error('Failed to delete class')
    }
  }

  // Confirm delete
  requestDelete = (type, catId, clsId, name) => {
    this.setState({
      confirmModal: {
        type, catId, clsId,
        title: type === 'category' ? 'Delete Category' : 'Delete Class',
        message: `Are you sure you want to delete "${name}"?${type === 'category' ? ' All classes inside will also be deleted.' : ''}`
      }
    })
  }

  handleConfirmDelete = () => {
    if (this.state.confirmModal.type === 'category') {
      this.handleDeleteCategory(this.state.confirmModal.catId)
    } else {
      this.handleDeleteClass(this.state.confirmModal.catId, this.state.confirmModal.clsId)
    }
    this.setState({ confirmModal: null })
  }

  // Helper: find class location
  findClassLocation = (classId) => {
    for (let i = 0; i < this.state.categories.length; i++) {
      const classIndex = this.state.categories[i].classes.findIndex(c => c.id === classId)
      if (classIndex !== -1) {
        return { 
          categoryId: this.state.categories[i].id, 
          categoryIndex: i, 
          classIndex, 
          classItem: this.state.categories[i].classes[classIndex] 
        }
      }
    }
    return null
  }

  // Drag Start
  handleDragStart = (e, categoryId, classId, index) => {
    this.dragItem.current = { categoryId, classId, index }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', classId)

    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-id="${classId}"]`)
      if (el) el.classList.add('dragging')
    })
  }

  // Drag End
  handleDragEnd = () => {
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'))
    this.setState({ dragOverTarget: null })
    this.dragItem.current = null
  }

  // Drag Over
  handleDragOver = (e, targetCatId, targetClassId, targetIndex) => {
    e.preventDefault()
    e.stopPropagation()

    if (!this.dragItem.current) {
      this.setState({ dragOverTarget: null })
      return
    }

    // Don't highlight the dragged item itself
    if (this.dragItem.current.classId === targetClassId) {
      this.setState({ dragOverTarget: null })
      return
    }

    e.dataTransfer.dropEffect = 'move'
    
    // If hovering over a category (empty or body), set category as target
    if (targetClassId === null) {
      this.setState({ dragOverTarget: { categoryId: targetCatId, classId: null, index: targetIndex } })
    } else {
      // Hovering over a specific class card
      this.setState({ dragOverTarget: { categoryId: targetCatId, classId: targetClassId, index: targetIndex } })
    }
  }

  // Drag Leave
  handleDragLeave = (e) => {
    e.preventDefault()
    const relatedTarget = e.relatedTarget
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      this.setState({ dragOverTarget: null })
    }
  }

  // Drop
  handleDrop = async (e, targetCatId, targetIndex) => {
    e.preventDefault()
    e.stopPropagation()
    this.setState({ dragOverTarget: null })

    if (!this.dragItem.current) return

    const { categoryId: sourceCatId, classId, index: sourceIndex } = this.dragItem.current
    const sourceLocation = this.findClassLocation(classId)
    const movedClass = sourceLocation ? sourceLocation.classItem : null
    
    // Don't do anything if dropping on itself in same position
    if (sourceCatId === targetCatId && sourceIndex === targetIndex) {
      this.dragItem.current = null
      return
    }

    // Optimistic update
    this.setState(prevState => {
      const newCategories = JSON.parse(JSON.stringify(prevState.categories))
      const sourceCat = newCategories.find(c => c.id === sourceCatId)
      const targetCat = newCategories.find(c => c.id === targetCatId)

      if (!sourceCat || !targetCat) return { categories: prevState.categories }

      // Remove from source
      const [movedClass] = sourceCat.classes.splice(sourceIndex, 1)

      // Calculate insert index - insert BEFORE the target item
      let insertIndex = targetIndex
      
      // If moving within same category and source is before target, adjust index
      if (sourceCatId === targetCatId && sourceIndex < targetIndex) {
        insertIndex = targetIndex - 1
      }

      // Clamp to valid range
      insertIndex = Math.max(0, Math.min(insertIndex, targetCat.classes.length))

      // Insert at target
      targetCat.classes.splice(insertIndex, 0, movedClass)

      return { categories: newCategories }
    })

    try {
      if (sourceCatId !== targetCatId && movedClass) {
        const result = await updateClass(targetCatId, classId, movedClass.name, movedClass.description || '')
        if (result.success) {
          toast.success('Class moved successfully')
        }
      }
    } catch (error) {
      console.error('Failed to reorder classes:', error)
      toast.error('Failed to move class')
      // Could revert optimistic update here
    }

    this.dragItem.current = null
  }

  handleCategoryKeyDown = (e) => {
    if (e.key === 'Enter') this.addCategory()
    if (e.key === 'Escape') {
      this.setState({ showCategoryInput: false, newCategoryName: '' })
    }
  }

  handleClassDoubleClick = (classId) => {
    if (this.props.onClassDoubleClick) {
      this.props.onClassDoubleClick(classId)
    }
  }

  handleLogout = () => {
    logout()
    if (this.props.onNavigate) {
      this.props.onNavigate('/login')
    }
  }

  render() {
    const { loading, categories, showCategoryInput, newCategoryName, modalOpen, modalCategoryId, confirmModal, dragOverTarget } = this.state

    if (loading) {
      return (
        <div className="class-management">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-white)' }}>
            Loading categories...
          </div>
        </div>
      )
    }

    return (
      <div className="class-management">
        <Header
          showInput={showCategoryInput}
          inputValue={newCategoryName}
          onInputChange={(e) => this.setState({ newCategoryName: e.target.value })}
          onInputKeyDown={this.handleCategoryKeyDown}
          onCancel={() => this.setState({ showCategoryInput: false, newCategoryName: '' })}
          onAddClick={() => showCategoryInput ? this.addCategory() : this.setState({ showCategoryInput: true })}
          onLogout={this.handleLogout}
        />

        <div className="cm-container">
          {categories.map((category) => (
            <Category
              key={category.id}
              category={category}
              onAddClass={(catId) => this.setState({ modalCategoryId: catId, modalOpen: true })}
              onEditCategory={this.editCategory}
              onEditClass={this.editClass}
              onRequestDelete={this.requestDelete}
              onDragStart={this.handleDragStart}
              onDragEnd={this.handleDragEnd}
              onDragOver={this.handleDragOver}
              onDragLeave={this.handleDragLeave}
              onDrop={this.handleDrop}
              dragOverTarget={dragOverTarget}
              onClassDoubleClick={this.handleClassDoubleClick}
            />
          ))}
        </div>

        {modalOpen && (
          <AddClassModal
            categories={categories}
            defaultCategoryId={modalCategoryId}
            onClose={() => this.setState({ modalOpen: false })}
            onAdd={this.addClass}
          />
        )}

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

export default ClassManagement
