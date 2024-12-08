import React, { useState, useEffect, useContext } from 'react'
import { PlusIcon, TrashIcon, ClipboardIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { getFromStorage, setInStorage } from '../../utils/storage'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { docco, atomOneDark, tomorrowNightBlue } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { ThemeContext } from '../../App'

interface CodeSnippet {
  id: string
  title: string
  code: string
  language: string
  description: string
  tags: string[]
  createdAt: number
}

export default function CodeSnippets() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null)
  const [newSnippet, setNewSnippet] = useState<Partial<CodeSnippet>>({
    title: '',
    code: '',
    language: 'javascript',
    description: '',
    tags: []
  })

  useEffect(() => {
    loadSnippets()
  }, [])

  const loadSnippets = async () => {
    const storedSnippets = await getFromStorage('snippets')
    if (storedSnippets) {
      setSnippets(storedSnippets)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingSnippet) {
      const updatedSnippets = snippets.map(snippet =>
        snippet.id === editingSnippet.id
          ? { ...snippet, ...newSnippet }
          : snippet
      )
      await setInStorage('snippets', updatedSnippets)
      setSnippets(updatedSnippets)
    } else {
      const snippet: CodeSnippet = {
        ...newSnippet as CodeSnippet,
        id: Date.now().toString(),
        tags: newSnippet.tags || [],
        createdAt: Date.now()
      }
      const updatedSnippets = [...snippets, snippet]
      await setInStorage('snippets', updatedSnippets)
      setSnippets(updatedSnippets)
    }

    setShowForm(false)
    setEditingSnippet(null)
    setNewSnippet({
      title: '',
      code: '',
      language: 'javascript',
      description: '',
      tags: []
    })
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const handleDeleteSnippet = async (id: string) => {
    const updatedSnippets = snippets.filter(snippet => snippet.id !== id)
    await setInStorage('snippets', updatedSnippets)
    setSnippets(updatedSnippets)
  }

  const handleEditSnippet = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet)
    setNewSnippet({
      title: snippet.title,
      code: snippet.code,
      language: snippet.language,
      description: snippet.description,
      tags: snippet.tags
    })
    setShowForm(true)
  }
  const { theme } = useContext(ThemeContext);

  return (
    <div className="p-6">
      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <button
          onClick={() => {
            setEditingSnippet(null)
            setNewSnippet({
              title: '',
              code: '',
              language: 'javascript',
              description: '',
              tags: []
            })
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <PlusIcon className="h-5 w-5" />
          Add Snippet
        </button>
      </div>

      {/* Snippet Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {editingSnippet ? 'Edit Snippet' : 'Add New Snippet'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newSnippet.title}
                  onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code
                </label>
                <textarea
                  required
                  value={newSnippet.code}
                  onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language
                </label>
                <select
                  value={newSnippet.language}
                  onChange={(e) => setNewSnippet({ ...newSnippet, language: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="jsx">React/JSX</option>
                  <option value="tsx">TSX</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="scss">SCSS</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newSnippet.description}
                  onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newSnippet.tags?.join(', ')}
                  onChange={(e) => setNewSnippet({
                    ...newSnippet,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  placeholder="react, hooks, state"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingSnippet(null)
                    setNewSnippet({
                      title: '',
                      code: '',
                      language: 'javascript',
                      description: '',
                      tags: []
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
                  {editingSnippet ? 'Save Changes' : 'Add Snippet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snippets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {snippets
          .filter(snippet =>
            snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map(snippet => (
            <div
              key={snippet.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {snippet.title}
                  </h3>
                  {snippet.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {snippet.description}
                    </p>
                  )}
                  {snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {snippet.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSnippet(snippet)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    title="Edit snippet"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleCopyCode(snippet.code)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    title="Copy code"
                  >
                    <ClipboardIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSnippet(snippet.id)}
                    className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete snippet"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <SyntaxHighlighter
                  language={snippet.language}
                  style={ theme === 'dark' ? atomOneDark : docco }
                  customStyle={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    margin: 0,
                  }}
                >
                  {snippet.code}
                </SyntaxHighlighter>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
