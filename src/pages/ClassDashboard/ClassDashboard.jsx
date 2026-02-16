import React, { useState, useEffect } from 'react'
import ClassCategory from '../../components/ClassCategory'
import ConfirmationPopup from '../../components/ConfirmationPopup'
import AddClassModal from '../../components/AddClassModal'
import EditCategoryModal from '../../components/EditCategoryModal'
import EditClassModal from '../../components/EditClassModal'
import { useClassCategory } from '../../hooks/useClassCategory'
import { useClass } from '../../hooks/useClass'
import { toast } from '../../utils/toast'
import { isAuthenticated, deleteToken } from '../../services/token'
import { useNavigate } from 'react-router-dom'
import styles from './ClassDashboard.module.css'

/**
 * ClassDashboard Component
 * Main dashboard for managing categories and classes
 * Features:
 * - Add/Edit/Delete categories
 * - Add/Edit/Delete classes
 * - Drag and drop classes between categories
 * - Navigation to individual class pages
 */
const ClassDashboard = (props) => {
  const navigate = useNavigate()
  const { getCategories, createCategory, updateCategory, deleteCategory, loading: categoryLoading } = useClassCategory()
  const { getClasses, createClass, updateClass, deleteClass, loading: classLoading } = useClass()
  
  // Component state
  const [categories, setCategories] = useState([]) // Array of categories with their classes
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false) // Show/hide add category input
  const [categoryInputValue, setCategoryInputValue] = useState('') // Value of category input field
  const [showAddClassModal, setShowAddClassModal] = useState(false) // Show/hide add class modal
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false) // Show/hide edit category modal
  const [showEditClassModal, setShowEditClassModal] = useState(false) // Show/hide edit class modal
  const [showConfirmPopup, setShowConfirmPopup] = useState(false) // Show/hide confirmation popup
  const [confirmMessage, setConfirmMessage] = useState('') // Message for confirmation popup
  const [confirmCallback, setConfirmCallback] = useState(null) // Callback function for confirmation
  const [draggedClass, setDraggedClass] = useState(null) // Currently dragged class
  const [editingCategory, setEditingCategory] = useState(null) // Category being edited
  const [editingClass, setEditingClass] = useState(null) // Class being edited
  const [editingClassCategoryId, setEditingClassCategoryId] = useState(null) // Category ID of class being edited

  // Load data from backend when component mounts
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast.error('Please login to access the dashboard')
      navigate('/?auth=login')
      return
    }
    
    fetchCategories()
  }, [navigate])

  /**
   * Handle authentication errors
   */
  const handleAuthError = (err) => {
    if (err.message && (
      err.message.includes('Access denied') || 
      err.message.includes('No token provided') ||
      err.message.includes('Token expired') ||
      err.message.includes('Please login again')
    )) {
      // Clear the expired token
      deleteToken()
      
      // Show appropriate message
      if (err.message.includes('Token expired')) {
        toast.error('Session expired. Please login again.')
      } else {
        toast.error('Authentication required. Please login.')
      }
      
      // Redirect to login
      navigate('/?auth=login')
      return true
    }
    return false
  }

  /**
   * Fetch categories from API
   */
  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...')
      const categoriesResponse = await getCategories()
      console.log('Categories response:', categoriesResponse)
      
      console.log('Fetching classes...')
      const classesResponse = await getClasses()
      console.log('Classes response:', classesResponse)
      
      // Extract categories and classes from responses
      const categoriesData = Array.isArray(categoriesResponse)
        ? categoriesResponse
        : (categoriesResponse?.data || [])
      const classesData = Array.isArray(classesResponse)
        ? classesResponse
        : (classesResponse?.data || [])
      
      console.log('Categories data:', categoriesData)
      console.log('Classes data:', classesData)
      
      // Merge classes into categories
      const mergedCategories = Array.isArray(categoriesData) ? categoriesData.map(category => ({
        ...category,
        classes: Array.isArray(classesData) 
          ? classesData.filter(cls => cls.categoryId === category.id)
          : []
      })) : []
      
      console.log('Merged categories:', mergedCategories)
      setCategories(mergedCategories)
    } catch (err) {
      console.error('Error fetching categories:', err)
      
      // Handle authentication errors
      if (handleAuthError(err)) {
        return
      }
      
      // If API fails for other reasons, set default data
      setCategories([
        {
          id: 1,
          name: 'Uncategorized',
          classes: [
            {
              id: 1,
              name: 'Demo class',
              description: 'Description of the class'
            }
          ]
        }
      ])
      toast.error('Failed to load data from server, using default data')
    }
  }

  /**
   * Show confirmation popup
   */
  const showConfirmation = (message, callback) => {
    setShowConfirmPopup(true)
    setConfirmMessage(message)
    setConfirmCallback(() => callback)
  }

  /**
   * Hide confirmation popup
   */
  const hideConfirmation = () => {
    setShowConfirmPopup(false)
    setConfirmMessage('')
    setConfirmCallback(null)
  }

  /**
   * Handle confirmation
   */
  const handleConfirm = () => {
    if (confirmCallback) {
      confirmCallback()
    }
    hideConfirmation()
  }

  /**
   * Show add category input
   */
  const handleShowAddCategory = () => {
    setShowAddCategoryInput(true)
    setCategoryInputValue('')
  }

  /**
   * Cancel add category
   */
  const handleCancelAddCategory = () => {
    setShowAddCategoryInput(false)
    setCategoryInputValue('')
  }

  /**
   * Add new category
   */
  const handleAddCategory = async () => {
    const categoryName = categoryInputValue.trim()
    
    if (!categoryName) {
      return
    }

    const loadingToast = toast.loading('Creating category...')
    try {
      // Call API to create category
      await createCategory(categoryName)
      
      // Refresh categories from API
      await fetchCategories()
      
      // Reset form
      setShowAddCategoryInput(false)
      setCategoryInputValue('')
      
      toast.remove(loadingToast)
      // Show success message
      toast.success('Category created successfully')
    } catch (err) {
      console.error('Error creating category:', err)
      toast.remove(loadingToast)
      
      // Handle authentication errors
      if (handleAuthError(err)) {
        return
      }
      
      // Show error message to user
      toast.error('Failed to create category: ' + (err.message || 'Unknown error'))
    }
  }

  /**
   * Handle category input change
   */
  const handleCategoryInputChange = (e) => {
    setCategoryInputValue(e.target.value)
  }

  /**
   * Handle category input key press (Enter to add)
   */
  const handleCategoryInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddCategory()
    }
  }

  /**
   * Show edit category modal
   */
  const handleEditCategory = (category) => {
    // Prevent editing "Uncategorized" category
    if (category.name === 'Uncategorized') {
      return
    }
    
    setEditingCategory(category)
    setShowEditCategoryModal(true)
  }

  /**
   * Save edited category
   */
  const handleSaveEditCategory = async (newName) => {
    if (newName && newName.trim() && editingCategory) {
      const loadingToast = toast.loading('Updating category...')
      try {
        // Call API to update category
        await updateCategory(editingCategory.id, newName.trim())
        
        // Refresh categories from API
        await fetchCategories()
        
        // Reset modal
        setShowEditCategoryModal(false)
        setEditingCategory(null)
        
        toast.remove(loadingToast)
        // Show success message
        toast.success('Category updated successfully')
      } catch (err) {
        console.error('Error updating category:', err)
        toast.remove(loadingToast)
        
        // Handle authentication errors
        if (handleAuthError(err)) {
          return
        }
        
        toast.error('Failed to update category: ' + (err.message || 'Unknown error'))
      }
    }
  }

  /**
   * Cancel edit category
   */
  const handleCancelEditCategory = () => {
    setShowEditCategoryModal(false)
    setEditingCategory(null)
  }

  /**
   * Delete category
   */
  const handleDeleteCategory = (category) => {
    // Prevent deleting "Uncategorized" category
    if (category.name === 'Uncategorized') {
      return
    }
    
    showConfirmation(
      `Are you sure you want to delete the category "${category.name}"? All classes in this category will also be deleted.`,
      async () => {
        const loadingToast = toast.loading('Deleting category...')
        try {
          // Call API to delete category
          await deleteCategory(category.id)
          
          // Refresh categories from API
          await fetchCategories()
          
          toast.remove(loadingToast)
          // Show success message
          toast.success('Category deleted successfully')
        } catch (err) {
          console.error('Error deleting category:', err)
          toast.remove(loadingToast)
          
          // Handle authentication errors
          if (handleAuthError(err)) {
            return
          }
          
          toast.error('Failed to delete category: ' + (err.message || 'Unknown error'))
        }
      }
    )
  }

  /**
   * Show add class modal
   */
  const handleShowAddClassModal = () => {
    setShowAddClassModal(true)
  }

  /**
   * Hide add class modal
   */
  const handleHideAddClassModal = () => {
    setShowAddClassModal(false)
  }

  /**
   * Add new class to selected category
   */
  const handleAddClass = async (classData) => {
    const loadingToast = toast.loading('Creating class...')
    try {
      // Call API to create class
      await createClass(classData.name, classData.categoryId, classData.description)
      
      // Refresh categories from API to get updated data
      await fetchCategories()
      
      // Reset modal
      setShowAddClassModal(false)
      
      toast.remove(loadingToast)
      // Show success message
      toast.success('Class created successfully')
    } catch (err) {
      console.error('Error creating class:', err)
      toast.remove(loadingToast)
      
      // Handle authentication errors
      if (handleAuthError(err)) {
        return
      }
      
      toast.error('Failed to create class: ' + (err.message || 'Unknown error'))
    }
  }

  /**
   * Show edit class modal
   */
  const handleEditClass = (classData) => {
    // Prevent editing "Demo class"
    if (classData.name === 'Demo class') {
      return
    }
    
    // Find which category this class belongs to
    let categoryId = null
    if (Array.isArray(categories)) {
      for (const cat of categories) {
        if (Array.isArray(cat.classes) && cat.classes.some(cls => cls.id === classData.id)) {
          categoryId = cat.id
          break
        }
      }
    }

    setEditingClass(classData)
    setEditingClassCategoryId(categoryId)
    setShowEditClassModal(true)
  }

  /**
   * Save edited class
   */
  const handleSaveEditClass = async (classData) => {
    if (classData.name && classData.name.trim() && editingClass) {
      const loadingToast = toast.loading('Updating class...')
      try {
        // Call API to update class
        await updateClass(editingClass.id, classData.name.trim(), classData.categoryId || editingClassCategoryId, classData.description)
        
        // Refresh categories from API to get updated data
        await fetchCategories()
        
        // Reset modal
        setShowEditClassModal(false)
        setEditingClass(null)
        setEditingClassCategoryId(null)
        
        toast.remove(loadingToast)
        // Show success message
        toast.success('Class updated successfully')
      } catch (err) {
        console.error('Error updating class:', err)
        toast.remove(loadingToast)
        
        // Handle authentication errors
        if (handleAuthError(err)) {
          return
        }
        
        toast.error('Failed to update class: ' + (err.message || 'Unknown error'))
      }
    }
  }

  /**
   * Cancel edit class
   */
  const handleCancelEditClass = () => {
    setShowEditClassModal(false)
    setEditingClass(null)
    setEditingClassCategoryId(null)
  }

  /**
   * Delete class
   */
  const handleDeleteClass = (classData) => {
    // Prevent deleting "Demo class"
    if (classData.name === 'Demo class') {
      return
    }
    
    showConfirmation(
      `Are you sure you want to delete the class "${classData.name}"?`,
      async () => {
        const loadingToast = toast.loading('Deleting class...')
        try {
          // Call API to delete class
          await deleteClass(classData.id)
          
          // Refresh categories from API to get updated data
          await fetchCategories()
          
          toast.remove(loadingToast)
          // Show success message
          toast.success('Class deleted successfully')
        } catch (err) {
          console.error('Error deleting class:', err)
          toast.remove(loadingToast)
          
          // Handle authentication errors
          if (handleAuthError(err)) {
            return
          }
          
          toast.error('Failed to delete class: ' + (err.message || 'Unknown error'))
        }
      }
    )
  }

  /**
   * Start moving a class (drag start)
   */
  const handleMoveClassStart = (classData) => {
    setDraggedClass(classData)
    
    // Clear dragged class when drag ends (handles both drop and cancel)
    const handleDragEnd = () => {
      // Small delay to ensure drop handler runs first
      setTimeout(() => {
        setDraggedClass(null)
      }, 100)
    }
    
    // Listen for drag end on document
    document.addEventListener('dragend', handleDragEnd, { once: true })
  }

  /**
   * Drop class into category
   */
  const handleDropClass = async (categoryId, classData) => {
    if (!classData || classData.categoryId === categoryId) {
      setDraggedClass(null)
      return
    }

    // Remove class from its current category
    let updatedCategories = categories.map(cat => ({
      ...cat,
      classes: cat.classes.filter(cls => cls.id !== classData.id)
    }))

    // Add class to target category
    updatedCategories = updatedCategories.map(cat =>
      cat.id === categoryId
        ? { ...cat, classes: [...cat.classes, { ...classData, categoryId }] }
        : cat
    )

    setCategories(updatedCategories)
    setDraggedClass(null)

    try {
      await updateClass(classData.id, classData.name, categoryId, classData.description || '')
      toast.success('Class moved successfully')
    } catch (err) {
      console.error('Error moving class:', err)
      if (handleAuthError(err)) {
        return
      }
      toast.error('Failed to move class: ' + (err.message || 'Unknown error'))
      await fetchCategories()
    }
  }

  const isInitialLoading = (categoryLoading || classLoading) && (!Array.isArray(categories) || categories.length === 0)
  const loadingLabel = categoryLoading ? 'Loading Categories' : 'Loading Lessons'

  if (isInitialLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} aria-label="Loading" />
          <div className={styles.loadingText}>{loadingLabel}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      {/* Header Section */}
      <header className={styles.header}>

        <div className={styles.producttitle}>
          <div className={styles.productlogo}></div> EduBoard  <h1 className={styles.title}> Class Dashboard</h1>
        </div>

          
          <div className={styles.headerActions}>
            {/* Add Category Input (shown when adding) */}
            {showAddCategoryInput && (
              <div className={styles.addCategoryInputContainer}>
                
                <input
                  type="text"
                  className={styles.categoryInput}
                  value={categoryInputValue}
                  onChange={handleCategoryInputChange}
                  onKeyPress={handleCategoryInputKeyPress}
                  placeholder="Category name"
                  autoFocus
                />
                <button 
                  className={styles.cancelBtn}
                  onClick={handleCancelAddCategory}
                >
                  Cancel
                </button>
              </div>
            )}
            
            {/* Add Category Button */}
            <button 
              className={styles.addCategoryBtn}
              onClick={showAddCategoryInput ? handleAddCategory : handleShowAddCategory}
              disabled={categoryLoading}
            >
              {categoryLoading ? 'Adding...' : (showAddCategoryInput ? 'Add Category' : 'Add Category')}
            </button>
          </div>
      </header>

      {/* Category Container (Middle Section) */}
      <div className={styles.categoryContainer}>
        {Array.isArray(categories) && categories.map((category) => (
          <ClassCategory
            key={category.id}
            category={category}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onEditClass={handleEditClass}
            onDeleteClass={handleDeleteClass}
            onMoveClass={handleMoveClassStart}
            draggedClass={draggedClass}
            onDropClass={handleDropClass}
          />
        ))}
      </div>

      {/* Add Class Button (Bottom Section - Absolute Positioned) */}
      <button 
        className={styles.addClassBtn}
        onClick={handleShowAddClassModal}
      >
        Add Class
      </button>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <AddClassModal
          categories={Array.isArray(categories) ? categories : []}
          onSave={handleAddClass}
          onCancel={handleHideAddClassModal}
        />
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onSave={handleSaveEditCategory}
          onCancel={handleCancelEditCategory}
        />
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && editingClass && (
        <EditClassModal
          classData={editingClass}
          categories={Array.isArray(categories) ? categories : []}
          currentCategoryId={editingClassCategoryId}
          onSave={handleSaveEditClass}
          onCancel={handleCancelEditClass}
        />
      )}

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <ConfirmationPopup
          message={confirmMessage}
          onConfirm={handleConfirm}
          onCancel={hideConfirmation}
        />
      )}
    </div>
  )
}

export default ClassDashboard
