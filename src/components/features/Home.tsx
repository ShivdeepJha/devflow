import React, { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { getFromStorage, setInStorage } from '../../utils/storage'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

interface QuickLink {
  id: string
  title: string
  url: string
  description: string
  category: string
  shortcut?: string
  createdAt: number
}

interface CategoryOrder {
  order: string[]
}

interface AdvancedSearch {
  allWords: string
  exactPhrase: string
  anyWords: string
  noneWords: string
  site: string
  fileType: string
  timeRange: string
}

export default function Home() {
  const [links, setLinks] = useState<QuickLink[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [advancedSearch, setAdvancedSearch] = useState<AdvancedSearch>({
    allWords: '',
    exactPhrase: '',
    anyWords: '',
    noneWords: '',
    site: '',
    fileType: '',
    timeRange: 'anytime'
  })
  const [newLink, setNewLink] = useState<Partial<QuickLink>>({
    title: '',
    url: '',
    description: '',
    category: '',
    shortcut: ''
  })

  useEffect(() => {
    loadLinks()
  }, [])

  useEffect(() => {
    // Add global keyboard listener
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      links.forEach(link => {
        if (link.shortcut) {
          const keys = link.shortcut.toLowerCase().split('+')
          const modifiers = {
            ctrl: keys.includes('ctrl'),
            alt: keys.includes('alt'),
            shift: keys.includes('shift')
          }

          if (
            e.key.toLowerCase() === keys[keys.length - 1] &&
            e.ctrlKey === modifiers.ctrl &&
            e.altKey === modifiers.alt &&
            e.shiftKey === modifiers.shift
          ) {
            e.preventDefault()
            window.open(link.url, '_blank')
          }
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [links])

  const loadLinks = async () => {
    try {
      const [storedLinks, storedCategoryOrder] = await Promise.all([
        getFromStorage('quickLinks') as Promise<QuickLink[]>,
        getFromStorage('categoryOrder') as Promise<CategoryOrder>
      ])

      if (storedLinks) {
        setLinks(storedLinks)
        // Extract unique categories from links
        const uniqueCategories = Array.from(new Set(storedLinks.map((link: QuickLink) => link.category)))

        if (storedCategoryOrder?.order) {
          // Use stored order, adding any new categories at the end
          const newOrder = [
            ...storedCategoryOrder.order.filter(cat => uniqueCategories.includes(cat)),
            ...uniqueCategories.filter(cat => !storedCategoryOrder.order.includes(cat))
          ]
          setCategories(newOrder)
        } else {
          setCategories(uniqueCategories)
        }
      }
    } catch (error) {
      console.error('Error loading links:', error)
    }
  }

  const updateCategories = (links: QuickLink[]) => {
    const uniqueCategories = Array.from(new Set(links.map(link => link.category)))
    // Preserve existing order and add new categories at the end
    const newOrder = [
      ...categories.filter(cat => uniqueCategories.includes(cat)),
      ...uniqueCategories.filter(cat => !categories.includes(cat))
    ]
    setCategories(newOrder)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingLink) {
      const updatedLinks = links.map(link =>
        link.id === editingLink.id
          ? { ...link, ...newLink }
          : link
      )
      await setInStorage('quickLinks', updatedLinks)
      setLinks(updatedLinks)
      updateCategories(updatedLinks)
    } else {
      const link: QuickLink = {
        ...newLink as QuickLink,
        id: Date.now().toString(),
        createdAt: Date.now()
      }
      const updatedLinks = [...links, link]
      await setInStorage('quickLinks', updatedLinks)
      setLinks(updatedLinks)
      updateCategories(updatedLinks)
    }

    setShowForm(false)
    setEditingLink(null)
    setNewLink({
      title: '',
      url: '',
      description: '',
      category: '',
      shortcut: ''
    })
  }

  const handleDeleteLink = async (id: string) => {
    const updatedLinks = links.filter(link => link.id !== id)
    await setInStorage('quickLinks', updatedLinks)
    setLinks(updatedLinks)
    updateCategories(updatedLinks)
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const newCategories = Array.from(categories)
    const [removed] = newCategories.splice(result.source.index, 1)
    newCategories.splice(result.destination.index, 0, removed)

    setCategories(newCategories)
    // Save the new category order
    await setInStorage('categoryOrder', { order: newCategories })
  }

  const handleAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault()
    let searchQuery = 'https://www.google.com/search?q='
    const params = []

    if (advancedSearch.allWords) {
      params.push(advancedSearch.allWords.split(' ').join('+'))
    }

    if (advancedSearch.exactPhrase) {
      params.push(`"${advancedSearch.exactPhrase}"`)
    }

    if (advancedSearch.anyWords) {
      params.push(`(${advancedSearch.anyWords.split(' ').join(' OR ')})`)
    }

    if (advancedSearch.noneWords) {
      params.push(advancedSearch.noneWords.split(' ').map(word => `-${word}`).join(' '))
    }

    if (advancedSearch.site) {
      params.push(`site:${advancedSearch.site}`)
    }

    if (advancedSearch.fileType) {
      params.push(`filetype:${advancedSearch.fileType}`)
    }

    if (advancedSearch.timeRange !== 'anytime') {
      params.push(`&tbs=qdr:${advancedSearch.timeRange}`)
    }

    searchQuery += encodeURIComponent(params.join(' '))
    window.open(searchQuery, '_blank')
  }

  return (
    <div className="p-6">
      {/* Advanced Search */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            {showAdvancedSearch ? 'Hide Advanced Search' : 'Show Advanced Search'}
          </button>
        </div>

        {showAdvancedSearch && (
          <form onSubmit={handleAdvancedSearch} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  All these words
                </label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  value={advancedSearch.allWords}
                  onChange={(e) => setAdvancedSearch({ ...advancedSearch, allWords: e.target.value })}
                  placeholder="Type important words"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  This exact phrase
                </label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  value={advancedSearch.exactPhrase}
                  onChange={(e) => setAdvancedSearch({ ...advancedSearch, exactPhrase: e.target.value })}
                  placeholder="Put exact words"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Any of these words
                </label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  value={advancedSearch.anyWords}
                  onChange={(e) => setAdvancedSearch({ ...advancedSearch, anyWords: e.target.value })}
                  placeholder="word1 OR word2"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  None of these words
                </label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  value={advancedSearch.noneWords}
                  onChange={(e) => setAdvancedSearch({ ...advancedSearch, noneWords: e.target.value })}
                  placeholder="-word1 -word2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Site or domain
                </label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  value={advancedSearch.site}
                  onChange={(e) => setAdvancedSearch({ ...advancedSearch, site: e.target.value })}
                  placeholder="example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File type
                </label>
                <select
                  className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  value={advancedSearch.fileType}
                  onChange={(e) => setAdvancedSearch({ ...advancedSearch, fileType: e.target.value })}
                >
                  <option value="">Any format</option>
                  <option value="pdf">PDF</option>
                  <option value="doc">DOC</option>
                  <option value="js">JavaScript</option>
                  <option value="ts">TypeScript</option>
                  <option value="jsx">React/JSX</option>
                  <option value="tsx">TSX</option>
                  <option value="css">CSS</option>
                  <option value="html">HTML</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time range
                </label>
                <select
                  className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  value={advancedSearch.timeRange}
                  onChange={(e) => setAdvancedSearch({ ...advancedSearch, timeRange: e.target.value })}
                >
                  <option value="anytime">Any time</option>
                  <option value="h">Past hour</option>
                  <option value="d">Past 24 hours</option>
                  <option value="w">Past week</option>
                  <option value="m">Past month</option>
                  <option value="y">Past year</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 text-sm rounded-lg transition-colors"
            >
              Advanced Search
            </button>
          </form>
        )}
      </div>

      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <PlusIcon className="h-5 w-5" />
          Add Link
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {editingLink ? 'Edit Link' : 'Add New Link'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  required
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newLink.description}
                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={newLink.category}
                  onChange={(e) => setNewLink({ ...newLink, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keyboard Shortcut
                </label>
                <input
                  type="text"
                  placeholder="e.g., Ctrl+Alt+D"
                  value={newLink.shortcut}
                  onChange={(e) => setNewLink({ ...newLink, shortcut: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Format: Ctrl/Alt/Shift + Letter (e.g., Ctrl+Alt+D)
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingLink(null)
                    setNewLink({
                      title: '',
                      url: '',
                      description: '',
                      category: '',
                      shortcut: ''
                    })
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {editingLink ? 'Save Changes' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {categories.map((category, index) => (
                <Draggable key={category} draggableId={category} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                    >
                      <h3
                        {...provided.dragHandleProps}
                        className="text-lg font-semibold mb-3 text-gray-900 dark:text-white cursor-move"
                      >
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {links
                          .filter(link => link.category === category)
                          .filter(link =>
                            link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            link.description.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map(link => (
                            <div
                              key={link.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded group"
                            >
                              <div className="flex-1 min-w-0">
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium block truncate"
                                >
                                  {link.title}
                                </a>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {link.description}
                                </p>
                                {link.shortcut && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Shortcut: {link.shortcut}
                                  </p>
                                )}
                              </div>
                              <div className="flex self-start items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingLink(link)
                                    setNewLink(link)
                                    setShowForm(true)
                                  }}
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLink(link.id)}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
