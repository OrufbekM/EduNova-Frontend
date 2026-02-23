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
  deleteClass,
  reorderClasses
} from '../../api/classes'
import { logout, getCurrentUser, getProfile, updateUserProfile, resetPassword } from '../../api/auth'
import { IconEdit, IconX, IconLogout, IconUser } from '../icons.jsx'
import { toast } from '../../utils/toast'

const PROTECTED_CATEGORY_NAME = 'Uncategorized'
const PROTECTED_CLASS_NAME = 'Demo class'

class ClassManagement extends Component {
  constructor(props) {
    super(props)
    const currentUser = getCurrentUser() || {}
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
        username: currentUser.username || '',
        fullName: currentUser.name || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || ''
      },
      resetPasswordModal: false,
      resetPasswordSaving: false,
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
    // Load user profile data
    const currentUser = getCurrentUser()
    if (currentUser) {
      this.setState({
        profileData: {
          username: currentUser.username || '',
          fullName: currentUser.fullName || currentUser.name || '',
          email: currentUser.email || '',
          phoneNumber: currentUser.phoneNumber || ''
        }
      })
    }
    this.loadProfile()
    // Add click outside listener for profile dropdown
    document.addEventListener('click', this.handleClickOutside)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  }

  isDemoCategory = (category = {}) => {
    const name = String(category?.name || '').trim().toLowerCase()
    return name === PROTECTED_CATEGORY_NAME.toLowerCase()
  }

  isDemoClass = (cls = {}) => {
    const name = String(cls?.name || '').trim().toLowerCase()
    return name === PROTECTED_CLASS_NAME.toLowerCase()
  }

  loadProfile = async () => {
    try {
      const result = await getProfile()
      if (!result?.success) return

      const profile = result.data?.user || result.data || {}
      this.setState({
        profileData: {
          username: profile.username || '',
          fullName: profile.fullName || profile.name || '',
          email: profile.email || '',
          phoneNumber: profile.phoneNumber || ''
        }
      })
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
          toast.remove(loadingToast)
          toast.success('Category created')
          this.setState({
            categories: [...this.state.categories, result.data],
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
    const category = this.state.categories.find(cat => String(cat.id) === String(catId))
    if (this.isDemoCategory(category)) {
      toast.error('This demo category cannot be edited.')
      return
    }
    const loadingToast = toast.loading('Updating category...')
    try {
      const result = await updateCategory(catId, newName)
      if (result.success) {
        toast.remove(loadingToast)
        toast.success('Category updated')
        this.setState({
          categories: this.state.categories.map(cat =>
            cat.id === catId ? { ...cat, ...(result.data || {}) } : cat
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
    const category = this.state.categories.find(cat => String(cat.id) === String(catId))
    if (this.isDemoCategory(category)) {
      toast.error('This demo category cannot be deleted.')
      return
    }

    const hasDemoClass = (category?.classes || []).some(this.isDemoClass)
    if (hasDemoClass) {
      toast.error('This category contains a protected demo class.')
      return
    }

    const loadingToast = toast.loading('Deleting category...')
    try {
      const result = await deleteCategory(catId)
      if (result.success) {
        toast.remove(loadingToast)
        toast.success('Category deleted')
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
        toast.success('Class created')
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
    const category = this.state.categories.find(cat => String(cat.id) === String(catId))
    const currentClass = category?.classes?.find(cls => String(cls.id) === String(clsId))
    if (this.isDemoClass(currentClass)) {
      toast.error('This demo class cannot be edited.')
      return
    }
    const loadingToast = toast.loading('Updating class...')
    try {
      const classItem = category?.classes?.find(cls => cls.id === clsId)
      const result = await updateClass(catId, clsId, newName, classItem?.description || '')
      if (result.success) {
        toast.remove(loadingToast)
        toast.success('Class updated')
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
    const category = this.state.categories.find(cat => String(cat.id) === String(catId))
    const currentClass = category?.classes?.find(cls => String(cls.id) === String(clsId))
    if (this.isDemoClass(currentClass)) {
      toast.error('This demo class cannot be deleted.')
      return
    }

    const loadingToast = toast.loading('Deleting class...')
    try {
      const result = await deleteClass(catId, clsId)
      if (result.success) {
        toast.remove(loadingToast)
        toast.success('Class deleted')
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
    if (type === 'category') {
      const category = this.state.categories.find(cat => String(cat.id) === String(catId))
      if (this.isDemoCategory(category)) {
        toast.error('This demo category cannot be deleted.')
        return
      }
      if ((category?.classes || []).some(this.isDemoClass)) {
        toast.error('This category contains a protected demo class.')
        return
      }
    }

    if (type === 'class') {
      const category = this.state.categories.find(cat => String(cat.id) === String(catId))
      const cls = category?.classes?.find(item => String(item.id) === String(clsId))
      const fallbackName = String(name || '').trim().toLowerCase()
      if (this.isDemoClass(cls) || fallbackName === PROTECTED_CLASS_NAME.toLowerCase()) {
        toast.error('This demo class cannot be deleted.')
        return
      }
    }

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

    const { categoryId: sourceCatId, index: sourceIndex } = this.dragItem.current
    
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

    // Update via API
    try {
      if (sourceCatId === targetCatId) {
        // Reorder within same category
        const adjustedIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
        await reorderClasses(targetCatId, sourceIndex, adjustedIndex)
      } else {
        // Move between categories - would need a different API endpoint
        toast.info('Class moved locally')
      }
    } catch (error) {
      console.error('Failed to reorder classes:', error)
      toast.error('Failed to reorder classes')
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
    const loadingToast = toast.loading('Logging out...')
    try {
      await logout()
      toast.remove(loadingToast)
      if (this.props.onNavigate) {
        this.props.onNavigate('/')
      }
    } catch (error) {
      toast.remove(loadingToast)
      toast.error('Failed to log out')
      console.error('Logout failed:', error)
    }
  }

  // Profile dropdown handlers
  handleProfileToggle = (e) => {
    e.stopPropagation()
    this.setState(prevState => {
      const nextOpen = !prevState.profileOpen
      if (nextOpen) {
        const hasProfileData =
          Boolean(prevState.profileData.username) ||
          Boolean(prevState.profileData.fullName) ||
          Boolean(prevState.profileData.email) ||
          Boolean(prevState.profileData.phoneNumber)
        if (!hasProfileData) {
          this.loadProfile()
        }
      }
      return { profileOpen: nextOpen }
    })
  }

  handleClickOutside = (e) => {
    // Check if click is outside profile dropdown and not on profile toggle button
    if (this.profileRef.current && !this.profileRef.current.contains(e.target)) {
      // Check if click is on profile toggle button
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
    try {
      const result = await updateUserProfile(this.state.profileData)
      if (result.success) {
        toast.success('Profile updated')
        // Update local state with the returned user data
        this.setState({
          profileData: {
            username: result.data.username || '',
            fullName: result.data.name || '',
            email: result.data.email || '',
            phoneNumber: result.data.phoneNumber || ''
          },
          profileEditMode: false
        })
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    }
  }

  handleProfileCancel = () => {
    this.setState({ profileEditMode: false })
    this.loadProfile()
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
      resetPasswordSaving: false,
      resetPasswordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    })
  }

  handleResetPasswordCancel = () => {
    if (this.state.resetPasswordSaving) return
    this.setState({ 
      resetPasswordModal: false,
      resetPasswordSaving: false,
      resetPasswordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    })
  }

  handleResetPasswordSave = async () => {
    if (this.state.resetPasswordSaving) return
    // Validate passwords
    if (this.state.resetPasswordData.newPassword !== this.state.resetPasswordData.confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }
    if (this.state.resetPasswordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    const loadingToast = toast.loading('Resetting password...')
    this.setState({ resetPasswordSaving: true })
    try {
      const result = await resetPassword(
        this.state.resetPasswordData.currentPassword,
        this.state.resetPasswordData.newPassword
      )
      if (result.success) {
        this.setState({
          resetPasswordModal: false,
          resetPasswordSaving: false,
          resetPasswordData: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
        })
        toast.remove(loadingToast)
        toast.success('Password reset successfully')
      } else {
        this.setState({ resetPasswordSaving: false })
        toast.remove(loadingToast)
        toast.error(result.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Failed to reset password:', error)
      this.setState({ resetPasswordSaving: false })
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
    const { loading, categories, showCategoryInput, newCategoryName, modalOpen, modalCategoryId, confirmModal, dragOverTarget } = this.state

    if (loading) {
      return (
        <div className="class-management">
          <div className="cm-loading">
            <div className="cm-spinner" aria-label="Loading" />
            <div className="cm-loading-text">Loading Categories</div>
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

        {/* Profile Dropdown */}
        {this.state.profileOpen && (
          <div className="cm-profile-dropdown-wrapper" ref={this.profileRef}>
            <div className="cm-profile-dropdown">
              <div className="cm-profile-header">
              <button className="cm-profile-close-btn" onClick={() => this.setState({ profileOpen: false, profileEditMode: false })}>
                <IconX size={16} />
              </button>
              <button className="cm-profile-edit-btn" onClick={this.handleProfileEdit}>
                <IconEdit size={16} />
              </button>
              <div className="cm-profile-avatar">
                <IconUser size={24} />
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
                  Change Password
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
                  <IconLogout size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Reset Password Modal */}
        {this.state.resetPasswordModal && (
          <div className="modal-overlay" onClick={this.handleResetPasswordCancel}>
            <div className="modal reset-password-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Change Password</h3>
                <button className="modal-close" onClick={this.handleResetPasswordCancel}>
                  <IconX size={18} />
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
                    disabled={this.state.resetPasswordSaving}
                  />
                </div>
                <div className="modal-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={this.state.resetPasswordData.newPassword}
                    onChange={(e) => this.handleResetPasswordFieldChange('newPassword', e.target.value)}
                    placeholder="Enter new password"
                    disabled={this.state.resetPasswordSaving}
                  />
                </div>
                <div className="modal-field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={this.state.resetPasswordData.confirmPassword}
                    onChange={(e) => this.handleResetPasswordFieldChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                    disabled={this.state.resetPasswordSaving}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel" onClick={this.handleResetPasswordCancel} disabled={this.state.resetPasswordSaving}>Cancel</button>
                <button className="modal-btn done" onClick={this.handleResetPasswordSave} disabled={this.state.resetPasswordSaving}>
                  {this.state.resetPasswordSaving ? 'Saving...' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default ClassManagement
