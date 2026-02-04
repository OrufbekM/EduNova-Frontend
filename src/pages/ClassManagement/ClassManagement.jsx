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
import { logout, getProfile, updateUserProfile, resetPassword } from '../../api/auth'
import { Pencil, X, LogOut, User } from 'lucide-react'
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
      dragOverTarget: null,
      profileOpen: false,
      profileEditMode: false,
      profileData: {
        username: '',
        fullName: '',
        email: '',
        phoneNumber: ''
      },
      resetPasswordModal: false,
      resetPasswordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }
    this.dragItem = React.createRef()
    this.profileRef = React.createRef()
  }

  componentDidMount() {
    this.fetchCategories()
    this.loadProfile()
    document.addEventListener('click', this.handleClickOutside)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  }

  loadProfile = async () => {
    try {
      const result = await getProfile()
      if (result.success) {
        const profile = result.data?.user || result.data || {}
        this.setState({
          profileData: {
            username: profile.username || '',
            fullName: profile.name || profile.fullName || '',
            email: profile.email || '',
            phoneNumber: profile.phoneNumber || ''
          }
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
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
      const loadingToast = toast.loading('Creating category...')
      try {
        const result = await createCategory(this.state.newCategoryName.trim())
        if (result.success) {
          const newCategory = {
            ...result.data,
            classes: result.data?.classes || []
          }
          toast.remove(loadingToast)
          toast.success('Category created successfully')
          this.setState({
            categories: [...this.state.categories, newCategory],
            newCategoryName: '',
            showCategoryInput: false
          })
        } else {
          toast.remove(loadingToast)
          toast.error('Failed to create category')
        }
      } catch (error) {
        console.error('Failed to create category:', error)
        toast.remove(loadingToast)
        toast.error('Failed to create category')
      }
    }
  }

  editCategory = async (catId, newName) => {
    const loadingToast = toast.loading('Updating category...')
    try {
      const result = await updateCategory(catId, newName)
      if (result.success) {
        toast.remove(loadingToast)
        toast.success('Category updated successfully')
        this.setState({
          categories: this.state.categories.map(cat =>
            cat.id === catId ? { ...cat, ...result.data, classes: cat.classes } : cat
          )
        })
      } else {
        toast.remove(loadingToast)
        toast.error('Failed to update category')
      }
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.remove(loadingToast)
      toast.error('Failed to update category')
    }
  }

  handleDeleteCategory = async (catId) => {
    const loadingToast = toast.loading('Deleting category...')
    try {
      const result = await deleteCategory(catId)
      if (result.success) {
        toast.remove(loadingToast)
        toast.success('Category deleted successfully')
        this.setState({
          categories: this.state.categories.filter(cat => cat.id !== catId)
        })
      } else {
        toast.remove(loadingToast)
        toast.error('Failed to delete category')
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.remove(loadingToast)
      toast.error('Failed to delete category')
    }
  }

  // Class actions
  addClass = async (catId, name, description) => {
    const loadingToast = toast.loading('Creating class...')
    try {
      const result = await createClass(catId, name, description)
      if (result.success) {
        toast.remove(loadingToast)
        toast.success('Class created successfully')
        this.setState({
          categories: this.state.categories.map(cat =>
            cat.id === catId
              ? { ...cat, classes: [...cat.classes, result.data] }
              : cat
          )
        })
      } else {
        toast.remove(loadingToast)
        toast.error('Failed to create class')
      }
    } catch (error) {
      console.error('Failed to create class:', error)
      toast.remove(loadingToast)
      toast.error('Failed to create class')
    }
  }

  editClass = async (catId, clsId, newName) => {
    const loadingToast = toast.loading('Updating class...')
    try {
      const currentCategory = this.state.categories.find(cat => cat.id === catId)
      const currentClass = currentCategory?.classes?.find(cls => cls.id === clsId)
      const result = await updateClass(catId, clsId, newName, currentClass?.description || '')
      if (result.success) {
        toast.remove(loadingToast)
        toast.success('Class updated successfully')
        this.setState({
          categories: this.state.categories.map(cat =>
            cat.id === catId
              ? { ...cat, classes: cat.classes.map(cls => cls.id === clsId ? result.data : cls) }
              : cat
          )
        })
      } else {
        toast.remove(loadingToast)
        toast.error('Failed to update class')
      }
    } catch (error) {
      console.error('Failed to update class:', error)
      toast.remove(loadingToast)
      toast.error('Failed to update class')
    }
  }

  handleDeleteClass = async (catId, clsId) => {
    const loadingToast = toast.loading('Deleting class...')
    try {
      const result = await deleteClass(catId, clsId)
      if (result.success) {
        toast.remove(loadingToast)
        toast.success('Class deleted successfully')
        this.setState({
          categories: this.state.categories.map(cat =>
            cat.id === catId
              ? { ...cat, classes: cat.classes.filter(cls => cls.id !== clsId) }
              : cat
          )
        })
      } else {
        toast.remove(loadingToast)
        toast.error('Failed to delete class')
      }
    } catch (error) {
      console.error('Failed to delete class:', error)
      toast.remove(loadingToast)
      toast.error('Failed to delete class')
    }
  }

  // Confirm delete
  requestDelete = (type, catId, clsId, name) => {
    this.setState({
      confirmModal: {
        type,
        catId,
        clsId,
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

    if (this.dragItem.current.classId === targetClassId) {
      this.setState({ dragOverTarget: null })
      return
    }

    e.dataTransfer.dropEffect = 'move'

    if (targetClassId === null) {
      this.setState({ dragOverTarget: { categoryId: targetCatId, classId: null, index: targetIndex } })
    } else {
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
    const sourceLocation = this.state.categories.find(cat => cat.id === sourceCatId)
    const movedClass = sourceLocation?.classes?.[sourceIndex]

    if (sourceCatId === targetCatId && sourceIndex === targetIndex) {
      this.dragItem.current = null
      return
    }

    this.setState(prevState => {
      const newCategories = JSON.parse(JSON.stringify(prevState.categories))
      const sourceCat = newCategories.find(c => c.id === sourceCatId)
      const targetCat = newCategories.find(c => c.id === targetCatId)

      if (!sourceCat || !targetCat) return { categories: prevState.categories }

      const [movedItem] = sourceCat.classes.splice(sourceIndex, 1)

      let insertIndex = targetIndex
      if (sourceCatId === targetCatId && sourceIndex < targetIndex) {
        insertIndex = targetIndex - 1
      }

      insertIndex = Math.max(0, Math.min(insertIndex, targetCat.classes.length))
      targetCat.classes.splice(insertIndex, 0, movedItem)

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
      console.error('Failed to move class:', error)
      toast.error('Failed to move class')
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

  handleLogout = async () => {
    try {
      await logout()
    } finally {
      if (this.props.onNavigate) {
        this.props.onNavigate('/login')
      }
    }
  }

  // Profile dropdown handlers
  handleProfileToggle = (e) => {
    e.stopPropagation()
    this.setState(prevState => ({ profileOpen: !prevState.profileOpen }))
  }

  handleClickOutside = (e) => {
    if (this.profileRef.current && !this.profileRef.current.contains(e.target)) {
      const profileToggle = e.target.closest('.cm-profile-toggle')
      if (!profileToggle) {
        this.setState({ profileOpen: false, profileEditMode: false })
      }
    }
  }

  handleProfileEdit = () => {
    this.setState({ profileEditMode: true })
  }

  handleProfileSave = async () => {
    const loadingToast = toast.loading('Updating profile...')
    try {
      const result = await updateUserProfile(this.state.profileData)
      if (result.success) {
        toast.remove(loadingToast)
        this.setState({
          profileData: {
            username: result.data.username || '',
            fullName: result.data.fullName || result.data.name || '',
            email: result.data.email || '',
            phoneNumber: result.data.phoneNumber || ''
          },
          profileEditMode: false
        })
        toast.success('Profile updated successfully')
      } else {
        toast.remove(loadingToast)
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.remove(loadingToast)
      toast.error('Failed to update profile')
    }
  }

  handleProfileCancel = () => {
    this.setState({ profileEditMode: false })
  }

  handleProfileFieldChange = (field, value) => {
    this.setState(prevState => ({
      profileData: {
        ...prevState.profileData,
        [field]: value
      }
    }))
  }

  handleResetPasswordClick = () => {
    this.setState({
      resetPasswordModal: true,
      resetPasswordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    })
  }

  handleResetPasswordCancel = () => {
    this.setState({
      resetPasswordModal: false,
      resetPasswordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    })
  }

  handleResetPasswordSave = async () => {
    if (this.state.resetPasswordData.newPassword !== this.state.resetPasswordData.confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }
    if (this.state.resetPasswordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    const loadingToast = toast.loading('Updating password...')
    try {
      const result = await resetPassword(
        this.state.resetPasswordData.currentPassword,
        this.state.resetPasswordData.newPassword,
        this.state.resetPasswordData.confirmPassword
      )
      if (result.success) {
        toast.remove(loadingToast)
        toast.success('Password reset successfully')
        this.handleResetPasswordCancel()
      } else {
        toast.remove(loadingToast)
        toast.error(result.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Failed to reset password:', error)
      toast.remove(loadingToast)
      toast.error('Failed to reset password')
    }
  }

  handleResetPasswordFieldChange = (field, value) => {
    this.setState(prevState => ({
      resetPasswordData: {
        ...prevState.resetPasswordData,
        [field]: value
      }
    }))
  }

  render() {
    const {
      loading,
      categories,
      showCategoryInput,
      newCategoryName,
      modalOpen,
      modalCategoryId,
      confirmModal,
      dragOverTarget
    } = this.state

    if (loading) {
      return (
        <div className="class-management">
          <div className="cm-loading">
            <div className="cm-spinner" aria-label="Loading" />
            <div className="cm-loading-text">Loading categories...</div>
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
          profileOpen={this.state.profileOpen}
          onProfileToggle={this.handleProfileToggle}
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

        {this.state.profileOpen && (
          <div className="cm-profile-dropdown-wrapper" ref={this.profileRef}>
            <div className="cm-profile-dropdown">
              <div className="cm-profile-header">
                <button className="cm-profile-close-btn" onClick={() => this.setState({ profileOpen: false, profileEditMode: false })}>
                  <X size={16} />
                </button>
                <button className="cm-profile-edit-btn" onClick={this.handleProfileEdit}>
                  <Pencil size={16} />
                </button>
                <div className="cm-profile-avatar">
                  <User size={24} />
                </div>
              </div>
              <div className="cm-profile-content">
                <div className="cm-profile-field">
                  <label>Username</label>
                  {this.state.profileEditMode ? (
                    <input
                      type="text"
                      value={this.state.profileData.username}
                      onChange={(e) => this.handleProfileFieldChange('username', e.target.value)}
                    />
                  ) : (
                    <div className="cm-profile-value">{this.state.profileData.username || '-'}</div>
                  )}
                </div>
                <div className="cm-profile-field">
                  <label>Full Name</label>
                  {this.state.profileEditMode ? (
                    <input
                      type="text"
                      value={this.state.profileData.fullName}
                      onChange={(e) => this.handleProfileFieldChange('fullName', e.target.value)}
                    />
                  ) : (
                    <div className="cm-profile-value">{this.state.profileData.fullName || '-'}</div>
                  )}
                </div>
                <div className="cm-profile-field">
                  <label>@email</label>
                  {this.state.profileEditMode ? (
                    <input
                      type="email"
                      value={this.state.profileData.email}
                      onChange={(e) => this.handleProfileFieldChange('email', e.target.value)}
                    />
                  ) : (
                    <div className="cm-profile-value">{this.state.profileData.email || '-'}</div>
                  )}
                </div>
                <div className="cm-profile-field">
                  <label>Phone Number</label>
                  {this.state.profileEditMode ? (
                    <input
                      type="tel"
                      value={this.state.profileData.phoneNumber}
                      onChange={(e) => this.handleProfileFieldChange('phoneNumber', e.target.value)}
                    />
                  ) : (
                    <div className="cm-profile-value">{this.state.profileData.phoneNumber || '-'}</div>
                  )}
                </div>
                <div className="cm-profile-field">
                  <div className="cm-profile-value cm-profile-reset" onClick={this.handleResetPasswordClick}>
                    Reset Password
                  </div>
                </div>
                {this.state.profileEditMode && (
                  <div className="cm-profile-actions">
                    <button className="cm-profile-btn cancel" onClick={this.handleProfileCancel}>Cancel</button>
                    <button className="cm-profile-btn save" onClick={this.handleProfileSave}>Save</button>
                  </div>
                )}
                <div className="cm-profile-footer">
                  <button className="cm-profile-logout-btn" onClick={this.handleLogout}>
                  <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {this.state.resetPasswordModal && (
          <div className="modal-overlay" onClick={this.handleResetPasswordCancel}>
            <div className="modal reset-password-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Reset Password</h3>
                <button className="modal-close" onClick={this.handleResetPasswordCancel}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-field">
                  <label>Username</label>
                  <input
                    type="text"
                    value={this.state.profileData.username}
                    disabled
                  />
                </div>
                <div className="modal-field">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={this.state.resetPasswordData.currentPassword}
                    onChange={(e) => this.handleResetPasswordFieldChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="modal-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={this.state.resetPasswordData.newPassword}
                    onChange={(e) => this.handleResetPasswordFieldChange('newPassword', e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="modal-field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={this.state.resetPasswordData.confirmPassword}
                    onChange={(e) => this.handleResetPasswordFieldChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel" onClick={this.handleResetPasswordCancel}>Cancel</button>
                <button className="modal-btn done" onClick={this.handleResetPasswordSave}>Done</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default ClassManagement
